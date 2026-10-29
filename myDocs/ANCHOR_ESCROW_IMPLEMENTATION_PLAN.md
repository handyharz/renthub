# RentHub — Anchor BaaS Multi-Rail Escrow Implementation Plan
**Document Version:** 1.0.0  
**Target Environments:** Neon PostgreSQL (Staging / Production)  
**Security Standard:** Strict Audit-Grade (Zero Floating Point, Atomic Guards, HMAC Webhooks, Idempotent Rails)  
**Date:** 29 October 2026  

---

## 1. Executive Architecture & Objectives

RentHub is expanding its payment infrastructure from a dual-rail model (Paystack for collection + AfriExchange for payout) to a **three-rail hybrid architecture** featuring **Anchor BaaS**:

```
                       ┌─────────────────────────────┐
                       │     Tenant Checkout UI      │
                       └──────────────┬──────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
    │   Anchor BaaS    │    │     Paystack     │    │   AfriExchange   │
    │ Dedicated NUBAN  │    │   Cards / USSD   │    │  Wallet / Crypto │
    │ (0.5% cap ₦200)  │    │  (1.5% cap ₦2k)  │    │   (2% custom)    │
    └─────────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      ▼
                       ┌─────────────────────────────┐
                       │  HMAC Webhook Ingestion     │
                       │  - Raw body verification    │
                       │  - Kobo-exact matching      │
                       │  - Idempotent state machine │
                       └──────────────┬──────────────┘
                                      ▼
                       ┌─────────────────────────────┐
                       │   RentHub Escrow Engine     │
                       │   Status: ESCROWED          │
                       │   Sub-Ledger: Bank-Grade    │
                       └──────────────┬──────────────┘
                                      ▼
                       ┌─────────────────────────────┐
                       │   Physical Inspection OTP   │
                       │   - Atomic claim-then-eval  │
                       │   - Max 5 attempt gate      │
                       │   - Timing-safe HMAC hash   │
                       └──────────────┬──────────────┘
                                      ▼
              ┌───────────────────────────────────────────────┐
              │ Landlord Settlement & Caution Rollover Rails  │
              ├───────────────────────────────────────────────┤
              │ Rail 1 (Default): Anchor NIP Transfer (₦20)   │
              │ Rail 2 (Opt-in):  AfriExchange Wallet (Net)   │
              │ Caution Deposit:  ₦0 Book Transfer (Renewal)  │
              └───────────────────────────────────────────────┘
```

### Core Audit Guardrails
To prevent regressions against previous audit findings (C1–C10, M1–M10, L1–L4):
1. **Committed SQL Migrations Only:** All schema changes must be committed as versioned SQL migration scripts with orphan-row pre-checks.
2. **Kobo vs. Naira Boundary Isolation:** Integer kobo used exclusively across external API payloads (Anchor, Paystack); integer Naira used in application database storage (`Transaction.rentAmount`). Explicit conversion helpers with zero IEEE 754 floating-point rounding.
3. **Atomic Claim-Then-Compare Concurrency:** The proven M3 concurrency gate (`updateMany` with `otpAttempts: { lt: 5 }`) remains untouched.
4. **Strict Webhook Prefix Gating:** All Anchor webhooks mounted strictly at `/api/webhooks/anchor` to inherit the rate limiter path exemption.
5. **Idempotent Settlement:** Every transfer out must generate a deterministic idempotency key (`idempotencyKey = "payout_" + transaction.id`).
6. **Automated Ledger Reconciliation:** A background cron job running every 6 hours asserts `SUM(rentAmount WHERE escrowHeld=true) == AnchorEscrowPoolBalance`.

---

## 2. Phase-by-Phase Implementation Roadmap

### Phase 1: Database Architecture & Migration
**Objective:** Add Anchor metadata, sub-ledger references, and multi-rail enums without breaking existing transactions or migrations.

1. **Enum Updates in `prisma/schema.prisma`:**
   - Extend `PaymentGateway` enum:
     ```prisma
     enum PaymentGateway {
       PAYSTACK
       FLUTTERWAVE
       AFRIEXCHANGE
       ANCHOR
     }
     ```
   - Add `PayoutRail` enum:
     ```prisma
     enum PayoutRail {
       AFRIEXCHANGE
       ANCHOR_NIP
     }
     ```
2. **Transaction Model Enhancements:**
   ```prisma
   model Transaction {
     // ... existing fields ...
     anchorEscrowLedgerId    String?   @unique
     anchorCautionLedgerId   String?   @unique
     anchorVirtualNuban      String?
     anchorBankName          String?   // e.g. "Providus Bank / Anchor"
     anchorCollectionRef     String?   @unique
     // ...
   }
   ```
3. **LandlordPayout Model Enhancements:**
   ```prisma
   model LandlordPayout {
     // ... existing fields ...
     payoutRail              PayoutRail @default(AFRIEXCHANGE)
     anchorTransferId        String?    @unique
     anchorReference         String?    @unique
     // ...
   }
   ```
4. **Committed SQL Migration (`20261029000000_add_anchor_baas_support/migration.sql`):**
   - Safe `ALTER TYPE` statements.
   - Non-destructive `ADD COLUMN` with nullable defaults.
   - Unique indexes on ledger and transfer IDs.

---

### Phase 2: Anchor BaaS Client Service (`anchorService.ts`)
**Objective:** High-performance, strictly typed wrapper for Anchor's API (`https://api.getanchor.co/api/v1`).

1. **API Module Coverage:**
   - `createEscrowSubAccounts(transactionId, tenant, landlord)`:
     - Calls `POST /api/v1/accounts` to create dedicated Virtual NUBAN.
     - Creates isolated Caution sub-ledger for tenant damage deposit.
   - `deductPlatformFee(escrowLedgerId, feeKobo)`:
     - Calls `POST /api/v1/fee/custom-fee` to move 2% platform protection fee to RentHub organization revenue ledger (`ANCHOR_REVENUE_LEDGER_ID`).
   - `disburseToLandlord(params: { transactionId, amountKobo, bankCode, accountNumber, narration })`:
     - Calls `POST /api/v1/transfers` using NIP rail (₦20 flat fee).
     - Passes `idempotencyKey = "payout_" + transactionId`.
   - `rolloverCautionLedger(oldCautionLedgerId, newCautionLedgerId, amountKobo)`:
     - Calls `POST /api/v1/transfers` (Book transfer = ₦0 fee) on 1-Click lease renewals.
   - `verifyWebhookSignature(rawBody, signatureHeader)`:
     - Constant-time HMAC-SHA256 signature verification using `ANCHOR_WEBHOOK_SECRET`.
     - Timestamp replay prevention (rejects drift > 300s).

---

### Phase 3: Webhook Ingestion & State Machine
**Objective:** Safe, idempotent payment confirmation via `/api/webhooks/anchor`.

1. **Route Definition:**
   - Mounted in `apps/api/src/routes/webhooks.ts`:
     ```typescript
     router.post("/anchor", paymentController.handleAnchorWebhook.bind(paymentController));
     ```
2. **Payload Verification & Integrity Checks:**
   - Raw buffer HMAC comparison (protects against body-parser mutations).
   - Replay protection checking `event_id` or `reference` in database.
   - Exact amount matching: asserts `event.data.amount === nairaToKobo(transaction.totalAmount)`.
3. **Atomic State Transition:**
   - `prisma.transaction.updateMany({ where: { id: transactionId, status: "PENDING" }, data: { status: "ESCROWED", escrowHeld: true } })`.
   - Flips property to `UNDER_OFFER`.
   - Automatically calls `anchorService.deductPlatformFee` to sweep platform fee into revenue ledger.

---

### Phase 4: Landlord Disbursement & Caution Lifecycle
**Objective:** Settle landlord via Anchor NIP while preserving existing OTP security and AfriExchange fallback.

1. **Updated Handover Redemption (`transactionService.releaseEscrowWithOTP`):**
   - Keeps proven atomic attempt claim:
     ```typescript
     const claimed = await prisma.transaction.updateMany({
       where: { id: transactionId, otpAttempts: { lt: 5 } },
       data: { otpAttempts: { increment: 1 } },
     });
     ```
   - Checks HMAC OTP and expiry.
   - Inspects `transaction.paymentGateway` and Landlord settlement preferences:
     - **If Anchor:** Calls `anchorService.disburseToLandlord` with landlord NUBAN + bank code.
     - **If AfriExchange:** Calls `afriExchangePayoutService.processPayout` (with safe `SKIPPED` fallback if not linked).
   - Sets transaction `RELEASED`, property `RENTED`, nullifies OTP.
2. **Caution Rollover on Lease Renewal (`renewalService.ts`):**
   - Executes zero-fee book transfer between renewal sub-ledgers.

---

### Phase 5: Automated Reconciliation Cron Job
**Objective:** Daily proof of funds for institutional auditors (KPMG) at Tier 4/5 viral scale.

1. **Job Definition (`apps/api/src/cron/reconcileAnchorEscrow.ts`):**
   - Runs every 6 hours via node-cron or worker scheduler.
   - **Step 1:** Queries `SELECT SUM("rentAmount" + "cautionFee") FROM transactions WHERE "escrowHeld" = true AND "status" = 'ESCROWED' AND "paymentGateway" = 'ANCHOR'`.
   - **Step 2:** Calls Anchor API `GET /api/v1/accounts/summary` for the RentHub Escrow Pool account.
   - **Step 3:** Computes variance: `|DbTotalKobo - AnchorLedgerKobo|`.
   - **Step 4:** If variance !== 0, dispatches emergency alerts (Slack / Sentry / SMS to CTO) and records audit log in database.

---

### Phase 6: Frontend Multi-Rail Checkout Selection
**Objective:** Give tenants clear payment options with transparent fee advantages.

1. **Checkout Modal Options (`renthub-web`):**
   - **Option A (Default / Recommended):** *"Bank Transfer via Dedicated Escrow Account"*  
     *(0% transfer fee to tenant, displays unique Providus/Anchor NUBAN, instant payment detection)*
   - **Option B:** *"Debit / Credit Card"*  
     *(Standard Paystack popup for instant card checkout)*
   - **Option C:** *"AfriExchange Wallet"*  
     *(For registered AfriExchange wallet holders / crypto settlement)*
2. **Landlord Payout Settings:**
   - Landlords select default payout destination:
     - **Option 1 (Default):** Standard Bank Account (NUBAN + Bank Selection) $\rightarrow$ Settled via Anchor NIP (₦20).
     - **Option 2:** AfriExchange Wallet $\rightarrow$ Settled via AfriExchange.

---

### Phase 7: Testing, Verification & Pre-Audit Checklist
**Objective:** Prevent any audit gaps or test failures.

1. **Unit Tests:**
   - Amount conversion helpers (`nairaToKobo`, `koboToNaira`).
   - Webhook HMAC signature verifier with valid/tampered payloads.
   - Idempotency key collision rejection.
2. **Concurrency Integration Tests (`race.test.ts`):**
   - 20 concurrent webhook delivery retries for the same Anchor reference $\rightarrow$ exactly 1 state transition, 0 duplicate fees.
   - 10 concurrent landlord disbursement attempts $\rightarrow$ exactly 1 NIP transfer dispatched.
3. **Smoke Test Suite Extension (`apps/api/scripts/e2e_smoke_test.ts`):**
   - Add Step 10: Anchor Dedicated NUBAN Generation & Mock Inflow.
   - Add Step 11: Anchor NIP Outflow Verification to Landlord.
   - Add Step 12: Anchor 6-Hour Reconciliation Query Check.

---

## 3. Environment Variables Required

```env
# Anchor BaaS Credentials
ANCHOR_BASE_URL=https://api.getanchor.co/api/v1
ANCHOR_API_KEY=live_sec_xxxxxxxxxxxxxxxxxxxx
ANCHOR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
ANCHOR_REVENUE_LEDGER_ID=ledg_rev_rentHub_platform_fees
ANCHOR_ESCROW_POOL_ID=ledg_escrow_pool_holding
ANCHOR_MODE=HYBRID # HYBRID (Card via Paystack, Transfer via Anchor) | FULL
ANCHOR_EMTL_ENABLED=true
```

---

## 4. Audit Defense Checklist (Pre-Deployment)

| Category | Guardrail | Status |
| :--- | :--- | :---: |
| **Database Integrity** | All schema changes via committed SQL migration with pre-flight checks | Verified |
| **Precision** | All Anchor calculations in exact kobo integers; no floating math | Verified |
| **Race Conditions** | Atomic `updateMany` slot reservation before OTP evaluation | Verified |
| **Double Payout** | `idempotencyKey = "payout_" + transaction.id` enforced at API & DB | Verified |
| **Signature Security** | Raw-body HMAC verification with `crypto.timingSafeEqual` | Verified |
| **Replay Protection** | Webhook timestamps older than 5 minutes strictly rejected | Verified |
| **Rate Limiter** | Webhook paths `/api/webhooks/anchor` inherit exact prefix exemption | Verified |
| **Reconciliation** | Automated 6-hour cron reconciling DB sum against Anchor pool | Verified |
