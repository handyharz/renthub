# Anchor BaaS Escrow: End-to-End Testing & Lifecycle Guide

**Platform:** RentHub (NexGen Tech Innovations Ltd)  
**Provider:** Anchor Software Ltd (BaaS Partner — Providus Bank Rail)  
**Environment:** Sandbox (`https://api.sandbox.getanchor.co/api/v1`)  
**Scope:** Complete lifecycle from Tenant Application Approval → Dedicated Virtual NUBAN Generation → Deposit Simulation → Webhook Reconciliation → 6-Digit Handover OTP → Landlord Payout & Revenue Sweep.

---

## Architecture Overview

```mermaid
sequenceDiagram
    autonumber
    actor Tenant
    participant Web as RentHub Web
    participant API as RentHub API
    participant Anchor as Anchor BaaS
    actor Landlord

    Note over Tenant,Landlord: Phase 1: Application Approval & Escrow Checkout
    Landlord->>Web: Approves Tenant Rental Application
    Tenant->>Web: Clicks "Pay Into Escrow" (Selects Anchor BaaS)
    Web->>API: POST /api/payments/anchor/initialize
    API->>Anchor: POST /api/v1/virtual-nubans (Linked to FBO Pool)
    Anchor-->>API: 201 Created (Providus Virtual NUBAN: 2332851782)
    API-->>Web: Returns Virtual NUBAN Details
    Web-->>Tenant: Displays Dedicated Providus Transfer Card (Account, Bank, Amount)

    Note over Tenant,Anchor: Phase 2: Funding Escrow Vault
    alt Production Mode
        Tenant->>Anchor: Real NIP Transfer via Mobile Banking
    else Sandbox Simulation
        Tenant->>Anchor: Simulate Transfer via Anchor Dashboard / API
    end
    Anchor->>API: POST /api/webhooks/anchor (HMAC-SHA1 Verified)
    API->>API: Mark Transaction ESCROWED, Hold Funds in FBO
    API-->>Web: Status flips to "Funds Secured in Escrow Vault"

    Note over Tenant,Landlord: Phase 3: Physical Inspection & Handover OTP
    Tenant->>Landlord: Meets at property for physical inspection
    Tenant->>Web: Clicks "Generate Handover OTP"
    Web->>API: POST /api/transactions/:id/handover-otp
    API-->>Tenant: Sends 6-digit OTP via Email (Resend) & SMS
    Tenant->>Landlord: Hands over 6-digit OTP in exchange for physical keys

    Note over Landlord,Anchor: Phase 4: Escrow Release & Automated Split Payout
    Landlord->>Web: Enters 6-digit OTP & clicks "Verify & Claim Payout"
    Web->>API: POST /api/transactions/:id/release-otp
    API->>API: Atomically validates OTP, marks RELEASED, Property RENTED
    par Split Disbursement
        API->>Anchor: Sweeps 2% Platform Fee to Revenue Ledger (₦0 Book Transfer)
        API->>Anchor: Disburses 98% Net Rent to Landlord Bank via Outbound NIP
    end
    API-->>Web: Landlord receives payout confirmation
```

---

## Account Topology & Roles

| Account ID | Anchor Type | RentHub System Role | Fee / Cost |
| :--- | :--- | :--- | :--- |
| **`17943034048583-anc_acc`** | `FBO` | **Escrow Holding Vault (`ANCHOR_ESCROW_POOL_ID`)**: Segregated trust account. Holds rent and caution deposits until key handover. | Free |
| **`17943034048272-anc_acc`** | `REVENUE` | **Platform Earnings (`ANCHOR_REVENUE_LEDGER_ID`)**: RentHub's 2% commission fee is swept here upon OTP validation. | ₦0 Internal Sweep |
| **`17943034047460-anc_acc`** | `SETTLEMENT` | **NIP Clearing Account**: Anchor's automated clearing rail for outbound bank disbursements to landlords. | ₦50 / Payout |
| **`17943034048081-anc_acc`** | `MASTER` | **Corporate Treasury**: Parent organization account. | Free |

---

## Step-by-Step Testing & Follow-Up Walkthrough

### Step 1: Initiate Payment from RentHub Platform

1. Log into RentHub as a **Tenant** (`https://renthub-seven.vercel.app` or local `localhost:3000`).
2. Navigate to **Dashboard → Applications** tab.
3. Find an **APPROVED** application and click **"Pay Into Escrow"**.
4. In the modal, select:
   * **Bank Transfer (Dedicated Escrow — Anchor BaaS)** *(Recommended · 0% Fee)*
5. Click **"Proceed with Anchor BaaS"**.

#### What Happens Under the Hood:
* RentHub API calls Anchor API: `POST /api/v1/virtual-nubans`.
* Anchor provisions an instant Providus Bank virtual account (e.g. `2332851782`) tied directly to your FBO pool.
* RentHub displays the persistent **Dedicated Providus Escrow Account Card**:
  * **Bank:** `PROVIDUS BANK`
  * **Account Number:** `2332851782` (with 1-click copy)
  * **Account Name:** `RentHub: [Tenant Name]`
  * **Exact Amount:** `₦[Total Rent + Caution + 2% Fee]` (with 1-click copy)
  * **Status Banner:** *"Awaiting Inbound Transfer — Reconciles automatically upon receipt"*.

---

### Step 2: Fund the Escrow in Anchor Sandbox

Since we are in the Sandbox, you simulate the tenant making the bank transfer:

1. Open your **Anchor Dashboard**: `https://app.getanchor.co`.
2. Go to **Accounts → Deposit Accounts**.
3. Click the **Simulate Transfer** button.
4. Fill out the simulation modal:
   * **Sandbox API Key:** Your test key (starts with `UYY2w...`).
   * **Account Number ID \*:** Enter the **Virtual NUBAN Resource ID** (e.g. `179443403814110-anc_acc_num`).  
     *(Do NOT use the parent `-anc_acc` ID; always use the `-anc_acc_num` Virtual NUBAN ID).*
   * **Source Account Number \*:** `0123456789` *(mock sender bank account)*.
   * **Source Account Name \*:** Any test name (e.g. `Harun Bah`).
   * **Amount \*:** The rent amount in Naira (e.g. `817786`).
5. Click **"Send Request"**.
6. The modal returns `200 OK` with a Payment ID (e.g. `1794434038...-anc_py`).

---

### Step 3: Webhook Verification & Automated Escrow Vaulting

1. Anchor dispatches an automated webhook event to:  
   **`https://renthub-4jhq.onrender.com/api/webhooks/anchor`**
2. RentHub backend validates the `Base64(HMAC-SHA1(rawBody, secretToken))` signature.
3. The transaction status transitions to **`ESCROWED`** (`escrowHeld = true`).
4. RentHub sends email confirmations to both Tenant and Landlord.
5. On the RentHub Dashboard, the card automatically updates to:  
   **"Funds Secured in Escrow Vault"** (Blue lock badge).

> [!NOTE]
> Ensure your Anchor webhook URL under **Developer → Webhooks** is configured as `https://renthub-4jhq.onrender.com/api/webhooks/anchor` (Render backend API), not the Vercel frontend URL.

---

### Step 4: Physical Inspection & 6-Digit Handover OTP

1. Tenant visits the property and physically verifies:
   * Physical keys, doors, and window locks.
   * Water supply, plumbing, and electrical fixtures.
   * House vacancy and match with listed photos.
2. Tenant opens RentHub Dashboard → **"Active Escrow & Key Handover"** tab.
3. Tenant clicks **"Generate Handover OTP"**.
4. RentHub generates a cryptographically secure 6-digit code:
   * Sent immediately to Tenant's registered email via Resend (`hello@nexgentech.dev`).
   * Rendered in high-contrast individual digit tiles for mobile and dark-mode visibility.
   * Delivered via SMS backup.
   * Notice: *"Never share this code over phone or WhatsApp. Give this code to the landlord ONLY after physically receiving the keys at the premises."*

---

### Step 5: Landlord Enters OTP & Automated Fund Release

1. Tenant hands the 6-digit code to the Landlord at the door in exchange for physical keys.
2. Landlord logs into RentHub Dashboard → **"Escrow & Payouts"** tab.
3. Under the property listing, Landlord enters the **6-Digit OTP** and clicks **"Verify & Claim Payout"**.
4. RentHub verifies the OTP:
   * **Brute-Force Guard:** Maximum 5 attempts allowed; atomic lock protection.
   * **Transaction Marked RELEASED:** `status = "RELEASED"`, `escrowReleased = true`.
   * **Property Updated:** `status = "RENTED"`.
5. **Split Automated Disbursement**:
   * **2% Platform Fee (RentHub)**: Swept from FBO account (`17943034048583-anc_acc`) to Revenue account (`17943034048272-anc_acc`) via intra-bank Book Transfer (Free, ₦0 fee).
   * **98% Net Rent + Caution (Landlord)**: Disbursed directly from Anchor to the Landlord's verified Nigerian commercial bank account (GTBank, Zenith, Access, Providus, Kuda, etc.) via outbound NIP transfer (`ANCHOR_NIP`).
   * **Payout Status:** `landlordPayout.status = "COMPLETED"`.
   * **Notification:** Landlord receives in-app and email alert confirming funds have hit their personal bank account.

---

### Step 6: Landlord Nigerian Bank Account Linking (Anchor BaaS Rail)

To receive automated NIP bank disbursements upon escrow release, landlords link their verified Nigerian commercial bank account:

1. Navigate to RentHub **Dashboard → Payouts & Settlements** tab (or **Profile → Payout Settlement**).
2. Select the **Commercial Bank (Anchor NIP)** rail tab (highlighted as **Recommended**).
3. Select your Nigerian bank from the dropdown (Access Bank, GTBank, Zenith, First Bank, Providus, UBA, etc.).
4. Enter your **10-Digit NUBAN Account Number**.
5. RentHub automatically resolves and verifies the account name against the Nigerian Inter-Bank Settlement System (NIBSS / Anchor BaaS).
6. Click **"Link Verified Bank Account"**.

#### 🧪 Sandbox Testing Hints & 1-Click Test Credentials
In the Anchor Sandbox environment, commercial bank verification and outbound NIP disbursements can be tested using Anchor's standard test bank credentials:
* **Bank:** `Access Bank` (CBN Code: `000014`)
* **Account Number:** `0123456789`
* **Account Name:** Auto-resolved to the Landlord's profile name
* **⚡ 1-Click Fast Fill:** Click the **"Fill Test Details ⚡"** button directly inside the green sandbox hint banner on the bank linking card to pre-fill these credentials instantly!

---

### Step 7: Escrow Settlement Records Table & Rail Differentiation

In the **Escrow Settlement Records** section of the Landlord Dashboard:

1. **Dual-Rail Filtering**:
   * **Rail Selector Pills:** Filter records by `[All Rails]`, `[Commercial Bank (NIP)]`, or `[AfriExchange Wallet]`.
   * **Status Pills:** Filter by `[All]`, `[Settled]`, `[In Escrow]`, `[Deferred]`, or `[Attention]`.
   * **Search Bar:** Real-time search by property title, tenant name, bank name, or reference ID.

2. **Visual Rail Badges in Records Table**:
   * **Anchor BaaS Rail:** Rendered with an emerald **`Commercial Bank (Anchor NIP)`** badge featuring a Landmark icon (`🏦`).
   * **AfriExchange Rail:** Rendered with a purple **`AfriExchange Wallet (NT)`** badge featuring a Wallet icon (`📱`).
   * **Net Payout Column:** Formatted clearly as Naira (`₦686,000`) for Anchor Bank NIP, and Naira Tokens (`₦686,000 NT`) for AfriExchange.
   * **Status Badges:** Shows **`Settled to Bank (NIP)`** for completed Anchor payouts and **`Settled to Wallet`** for AfriExchange payouts.

3. **Settlement Breakdown Modal**:
   Clicking **"Breakdown"** on any record displays:
   * **Payout Rail:** `Anchor BaaS Commercial Bank NIP` vs `AfriExchange Mobile Rail`.
   * **Recipient Bank:** Verified bank name (e.g. `Access Bank (Sandbox)`) and masked account number (`•••• 6789`).
   * **NIP Session ID:** Unique inter-bank settlement session ID for bank reconciliation.
   * **Idempotency Reference:** Cryptographic payout reference with 1-click copy button.
   * **Escrow Accounting:** Transparent itemization of Gross Rent Paid (100%), RentHub 2% Guarantee Fee, and Net Landlord Payout (98%).

---

### Step 8: Caution Deposit Custody, Move-Out Reclaim & Dispute Protocol

The Caution Deposit flow is a completely closed-loop, tri-party protocol between the **Tenant**, the **Landlord**, and **Anchor BaaS Escrow**.

#### 1. Financial Accounting & 4% Total Take-Rate
RentHub operates on a **4% total platform commission**:
* **Tenant-Side (2% Escrow Protection Fee):** Paid on top of the rent at checkout. *(e.g. ₦20,000 on a ₦1,000,000 lease).*
* **Landlord-Side (2% Escrow Guarantee / Commission Fee):** Deducted from gross rent upon 6-digit key handover verification. *(e.g. ₦20,000 deducted, yielding ₦980,000 net payout).*
* **Platform Earnings:** RentHub collects ₦40,000 total (4%), swept into RentHub's Anchor Revenue Ledger (`17943034048272-anc_acc`) via a ₦0 intra-bank book transfer.

#### 2. Custodial Segregation: Who Holds the Caution Deposit?
**RentHub holds the Caution Deposit in the Anchor FBO Segregated Vault (`17943034048583-anc_acc`), NOT the Landlord.**

When the tenant hands over the 6-digit OTP and the landlord verifies it:
1. **Net Rent (98%)** is disbursed to the landlord's commercial bank account.
2. **Platform Commission (2% + 2%)** is swept to the RentHub revenue ledger.
3. **Caution Deposit REMAINS in Anchor FBO Escrow** for the entire 12-month tenancy.

> [!IMPORTANT]
> **Why Landlords Must Never Hold the Caution Deposit (RentHub's Defensive Moat):**  
> In traditional Nigerian real estate, landlords treat caution deposits as free spending money and almost **never refund them** (fabricating bogus "repairs" or dodging calls).  
> By locking the deposit in Anchor BaaS:
> * **Guaranteed Refund Assurance:** Tenants trust RentHub because landlords cannot touch or withhold their deposit.
> * **1-Click ₦0 Caution Rollover (`renewalService.ts:95`):** On lease renewal, the existing caution deposit rolls over with **₦0 new caution deposit required**.
> * **Custodial Float:** Building institutional escrow balances under custody in Anchor.

#### 3. End-of-Tenancy Move-Out & Reclaim Protocol

```mermaid
sequenceDiagram
    autonumber
    actor Tenant
    participant RentHub as RentHub Platform
    participant Anchor as Anchor FBO Escrow Pool
    actor Landlord

    Note over Tenant,Landlord: Step 1: Move-Out Condition Inspection
    Landlord->>RentHub: Submits Move-Out Condition Report & Photos
    alt Scenario A: Clean Move-Out (0 Deductions)
        RentHub->>Anchor: Outbound NIP dispatches 100% Caution Refund to Tenant Bank
        Anchor-->>Tenant: 100% Caution Deposit hits Tenant Bank
    else Scenario B: Landlord Claims Damage Deductions
        Tenant->>RentHub: Reviews itemized damage invoice
        alt Tenant Accepts
            RentHub->>Anchor: NIP dispatches repair amount to Landlord Bank
            RentHub->>Anchor: NIP dispatches remaining balance to Tenant Bank
        else Tenant Contests (Dispute Raised)
            Tenant->>RentHub: Clicks "Contest Deductions"
            Note over RentHub,Anchor: Funds ATOMICALLY FROZEN in Anchor Escrow
            RentHub->>RentHub: Escrow Arbitration Desk compares Move-In vs Move-Out photos
            RentHub->>Anchor: Arbitrated split disbursed to Landlord & Tenant
        end
    end
```

#### 4. The Dispute Connection & Arbitration Protocol
1. **Tenant Instant Contest (`transactionService.ts:922`):**
   * Tenant reviews the landlord's damage claim on the dashboard.
   * Clicking **"Contest Deductions"** instantly transitions the transaction to:
     * `disputed: true`
     * `status: "CONTESTED_IN_ARBITRATION"`
2. **Atomic Escrow Freeze:**
   * The deposit is locked inside Anchor FBO escrow; neither party can withdraw or touch the funds.
3. **Escrow Arbitration Desk Review (`adminService.ts:525`):**
   * RentHub arbitrates using side-by-side evidence:
     1. **Move-In Inventory Condition Photos** (recorded at key handover).
     2. **Move-Out Report & Photos** submitted by the landlord.
     3. **Statutory Standards:** Fair wear-and-tear (e.g. minor paint aging) is protected by law and cannot be deducted.
4. **Arbitrated Settlement Payout:**
   * Unjustified claims are dismissed and refunded 100% to the tenant.
   * Legitimate repair quotes are approved to the landlord via Anchor NIP, and the remaining balance is refunded to the tenant via Anchor NIP.
   * The dispute flag is cleared (`disputed: false`).

---

## Verification & Status Checklist

| Step | Component | Status | Verification Method |
| :--- | :--- | :--- | :--- |
| **1. Auth & Accounts** | Anchor API Gateway | Verified ✅ | Program accounts cataloged (`17943034048583-anc_acc`) |
| **2. Virtual NUBAN** | Providus Bank Rail | Verified ✅ | `POST /virtual-nubans` returns 201 Created (`2332851782`) |
| **3. UI Display** | RentHub Frontend | Verified ✅ | ApplicationsTab renders Providus account card with copy buttons |
| **4. Inflow Simulation**| Sandbox Inbound NIP | Verified ✅ | `POST /transaction-notification` returns 200 OK |
| **5. Webhook Reconcile**| Express Webhook Rail| Verified ✅ | HMAC-SHA1 Base64 validation; flips status to `ESCROWED` |
| **6. Handover OTP** | Email / SMS Rail | Verified ✅ | Resend high-contrast digit cards; 5-attempt rate limit |
| **7. Landlord Bank Link**| Anchor NUBAN Resolve| Verified ✅ | `AnchorBankLinkingCard` with 1-click sandbox test fill button |
| **8. Landlord Payout** | Anchor Outbound NIP | Verified ✅ | 2-step CounterParty + `NIPTransfer` dispatches funds to bank |
| **9. Audit Records** | Settlement Table | Verified ✅ | Multi-rail filter, distinct badges, bank metadata breakdown |
| **10. Caution Custody** | Anchor FBO Vault | Verified ✅ | Caution retained in FBO; move-out report & dispute protocol |

---

## Troubleshooting Common Errors

### 1. `404: Invalid account Id.` in Simulate Transfer
* **Cause:** Entering a Deposit Account ID (`-anc_acc`) instead of a Virtual NUBAN ID (`-anc_acc_num`).
* **Fix:** Use the Virtual NUBAN ID (e.g. `179443403814110-anc_acc_num`).

### 2. `Bad request: Unable to fetch account reference` in Dashboard
* **Cause:** Newly provisioned sandbox organization parent accounts need initial core banking ledger mapping by Anchor support.
* **Fix:** Request Fortunate / Anchor support on Slack to initialize and seed sandbox test float.

### 3. Webhook Not Updating Status
* **Cause:** Webhook URL in Anchor Dashboard pointing to Vercel frontend instead of Render API backend.
* **Fix:** Set Webhook URL to `https://renthub-4jhq.onrender.com/api/webhooks/anchor`.

