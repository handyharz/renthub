# 📖 RentHub Platform Guide
### The User Manual for Tenants, Landlords, Regulated Agents, and Diaspora Payers

> **Draft note:** Items marked ⚠️ **[TO CONFIRM]** are business or legal decisions that must be settled before this guide is published. Search for "TO CONFIRM" and replace each with the final policy.

---

## 📑 Table of Contents
1. [Platform Overview](#1-platform-overview)
2. [Tenant Guide](#2-tenant-guide)
3. [Landlord Guide](#3-landlord-guide)
4. [Regulated Agent & Delegation Guide](#4-regulated-agent--delegation-guide)
5. [Key Handover OTP, Disputes & Edge Cases](#5-key-handover-otp-disputes--edge-cases)
6. [Caution Deposit & Move-Out](#6-caution-deposit--move-out)
7. [1-Click Lease Renewal](#7-1-click-lease-renewal)
8. [Diaspora Cross-Border Payments (AfriExchange)](#8-diaspora-cross-border-payments-afriexchange)
9. [Nigerian Infrastructure & Amenities Standards](#9-nigerian-infrastructure--amenities-standards)
10. [Documents, Receipts & Rent Relief](#10-documents-receipts--rent-relief)
11. [Legal Framework, Privacy & Data Protection](#11-legal-framework-privacy--data-protection)

---

## 1. Platform Overview

RentHub is a direct landlord-to-tenant rental marketplace designed to remove unearned middleman fees in Nigeria. Instead of paying agent commissions, inspection tolls and arbitrary legal fees, tenants and landlords use a structured **7-Stage Trust Chain**:

```
[1. Discovery] ──> [2. Free Inspection] ──> [3. Application] ──> [4. Landlord Acceptance]
                                                                        │
[7. Review] <──── [6. Key OTP Release] <── [5. Escrow Payment] <────────┘
```

**How your money is held:** Tenant payments are collected into a segregated collection account with a licensed banking partner, separate from RentHub's operating funds, and are released only according to the rules in this guide. ⚠️ **[TO CONFIRM: partner bank / account structure and final wording]**

---

## 2. Tenant Guide

### Step 1: Search and Filter
- Browse by city, neighborhood, budget and property type.
- Filter by the utilities that matter in Nigeria:
  - **Power Supply**: Dedicated prepaid meter, Grid + Generator, Grid + Solar, Solar Only, or Mixed.
  - **Water Supply**: Borehole, Treated Water, Tank Only, or Both.
  - **Security**: Gated estate, uniform security, electrified perimeter.

### Step 2: Book a Free Inspection Tour
- Choose a time slot from the landlord's calendar.
- **Rule:** Tenants never pay viewing fees, gate tolls, "fuel money" or transport money. If anyone asks for money to show you a property, report it in the app.

### Step 3: Submit a Rental Application
- Choose the lease term: **12 months** (standard) or **24 months** where permitted. In Lagos, 12-month terms apply (see Section 11).
- Attach identity documents (NIN, Driver's License, Voter's Card or International Passport).
- Provide your proposed move-in date and a short employment/background summary.

### Step 4: Pay into Escrow
- When the landlord accepts, the listing is locked for **48 hours** to prevent double-letting. If you do not pay within the lock, the listing reopens and you are not charged.
- You pay:
  - **Annual Rent**, held in escrow until the handover OTP is confirmed.
  - **Caution Deposit**, held in escrow until move-out (see Section 6).
  - **Platform Escrow Protection Fee**: 2% on top of rent.
  - **Legal Agreement**: ₦0 (standard digital lease included).
- **Example (₦2,000,000 rent, ₦200,000 caution):** you pay ₦2,000,000 + ₦200,000 + ₦40,000 fee = **₦2,240,000**.
- Pay by Paystack (card, bank transfer, USSD) or AfriExchange (see Section 8).

### Step 5: Inspect the Property and Hand Over the OTP
- Meet the landlord or authorized agent at the vacant apartment.
- Check water pressure, electrical sockets, the meter, windows and locks.
- If satisfied, give the landlord your secret **6-digit OTP** in exchange for the keys.
- **Release is final.** Once you share the OTP and the landlord enters it, the rent is paid out and cannot be pulled back through escrow. Only share it after you have inspected the property and received the keys.
- If there are serious undisclosed defects, **withhold the OTP and file a dispute** (Section 5).

---

## 3. Landlord Guide

### Step 1: List Your Property for Free
- Go to `/properties/new`.
- Upload clear photos and an optional video walkthrough.
- Declare exact utilities (prepaid meter number, borehole system, service charges).

### Step 2: Request Field Verification (₦20,000, once per listing)
- A RentHub field verifier inspects structure, plumbing and electrical supply, and checks ownership documents (C of O, R of O or Deed of Assignment).
- Approved listings receive the green **"Verified Property"** badge, which helps tenants trust the listing.

### Step 3: Review Applications and TrustScores
Each user has a **TrustScore (0–100)**:

| Milestone | Points |
| :--- | :--- |
| Account created | 10 |
| Profile photo | 10 |
| Legal first and last name | 10 |
| Phone number registered | 10 |
| Phone verified by SMS OTP | 20 |
| Government ID uploaded | 20 |
| Admin KYC audit completed | 20 |
| **Maximum** | **100** |

Review applicants' scores and background, then accept or decline in one click.

### Step 4: Handover and Payout
- Meet the tenant at the property for the key exchange.
- After the tenant inspects and shares the OTP, enter it in your dashboard.
- RentHub releases your net rent to your linked Nigerian bank account or AfriExchange wallet.

### What You Receive: Worked Example (₦2,000,000 annual rent)

| Line | Without an agent | With a delegated agent (5%) |
| :--- | :--- | :--- |
| Rent paid by tenant | ₦2,000,000 | ₦2,000,000 |
| Landlord platform fee (2%) | − ₦40,000 | − ₦40,000 |
| Agent commission (agreed, max 5% of rent) | — | − ₦100,000 |
| **Net to landlord** | **₦1,960,000** | **₦1,860,000** |

The tenant's separate 2% protection fee (₦40,000) and the caution deposit are not part of your payout. The caution deposit stays in escrow until move-out.

---

## 4. Regulated Agent & Delegation Guide

Busy or diaspora landlords can delegate viewings and listing management to verified agents.

### Rules for RentHub Agents
1. **Landlord-paid only (max 5%):** Tenants never pay agent commissions. The landlord agrees a commission of up to 5% of rent, deducted from the landlord's rent at release.
2. **Zero side-payments:** Agents are contractually barred from collecting:
   - Inspection or viewing fees
   - "Fuel money" or transport allowances
   - Registration or form fees
   - Cash rent or deposits
3. **3-strike system:**
   - Tenants can report side-fee demands in the app with evidence.
   - Strikes are upheld only after review by RentHub moderators.
   - Strikes expire on a **90-day rolling basis**.
   - **Three upheld strikes lead to a permanent platform ban.** Where misconduct involves a registered professional, RentHub may notify the relevant professional body (e.g., NIESV or ESVARBON).
4. **Automated settlement:** When the landlord confirms the tenant's OTP, the agent's commission is calculated and paid automatically.

---

## 5. Key Handover OTP, Disputes & Edge Cases

The escrow release is governed by a 6-digit, time-limited OTP.

### 5.1 How the OTP Works
1. **Generation:** Created inside the tenant's authenticated session after payment succeeds.
2. **Delivery:** Shown in the tenant's app and sent by SMS.
3. **Validity:** Active from the agreed move-in date until ⚠️ **[TO CONFIRM: expiry, proposed 48 hours after the scheduled handover time]**.
4. **Finality:** When the landlord enters a valid OTP, the net rent is released and cannot be recalled through escrow.

### 5.2 Tenant Disputes (Undisclosed Defects)
- The tenant may file a dispute from the scheduled handover time until ⚠️ **[TO CONFIRM: dispute window, proposed 48 hours]**.
- Escrow funds freeze immediately.
- Both sides upload photo or video evidence.
- RentHub aims to resolve the dispute within 48 hours: release to the landlord, refund to the tenant, or a negotiated remedy.

### 5.3 Tenant Takes Possession but Withholds the OTP
- If the tenant occupies the property but neither shares the OTP nor files a dispute by the end of the dispute window, the landlord may submit **proof of handover** (signed key acknowledgment, meter sign-off, or photos/video of occupancy).
- RentHub **notifies the tenant** and gives a response period of ⚠️ **[TO CONFIRM: proposed 24 hours]**.
- If the tenant does not respond with evidence of a genuine problem, an admin reviews the proof and may release the net rent to the landlord.
- If the tenant responds with evidence, the case is treated as a dispute under 5.2.

### 5.4 Landlord No-Show or Property Not Available
- The tenant reports the problem in the app before the OTP is shared.
- Funds remain frozen, and after review the tenant receives a refund to the original payment method within ⚠️ **[TO CONFIRM: refund timing and treatment of the 2% protection fee]**.
- Repeated landlord no-shows can lead to listing suspension.

### 5.5 OTP Expires With No Action
- If neither party acts before expiry, ⚠️ **[TO CONFIRM: proposed rule: funds stay frozen and both parties are prompted; if no response within X days, refund to the tenant]**.

### 5.6 Tenant Never Pays After Acceptance
- The 48-hour offer lock expires, the listing reopens and nothing is charged.

---

## 6. Caution Deposit & Move-Out

The caution deposit is held in the segregated account for the whole tenancy and is not paid to the landlord at handover.

1. **During the tenancy:** The deposit stays protected. On renewal it **rolls over** with no fresh deposit (Section 7).
2. **Move-out:** At the end of the tenancy, tenant and landlord each submit a **condition report** with photos.
3. **No dispute:** If the landlord confirms no deductions, the deposit is refunded to the tenant within ⚠️ **[TO CONFIRM: refund timing]**.
4. **Deductions:** The landlord may claim deductions only with evidence (photos, repair quotes or receipts). The tenant can accept or contest each item.
5. **Contested items:** Go to RentHub arbitration. Undisputed amounts are released immediately; only the contested portion stays frozen.

This means tenants get evidence-based refunds and landlords have a funded deposit to back legitimate damage claims.

---

## 7. 1-Click Lease Renewal

1. **60-day notice:** Both parties are notified 60 days before the lease ends.
2. **Landlord proposal:** The landlord chooses Same Rent, +5%, +10% or +15%.
3. **No fresh caution deposit:** The existing deposit stays held.
4. **Tenant acceptance:** The tenant accepts, pays the new year's rent plus the 2% protection fee, and a new digital agreement is generated.
5. **No agent commission:** Tenants do not pay agent fees on renewal, whether or not an agent was involved in the original letting.

On a ₦2,000,000 renewal, a tenant avoids a traditional ₦200,000 agent fee and pays a ₦40,000 protection fee, a net saving of about ₦160,000.

---

## 8. Diaspora Cross-Border Payments (AfriExchange)

For Nigerians abroad paying rent for family or their own tenancy:

- **Currencies:** Pay in USD, GBP or EUR. Stable-token payments (NT / CT) are available where enabled. ⚠️ **[TO CONFIRM: token availability and regulatory status]**
- **Conversion:** Payments are converted to NGN at the rate shown at checkout, which may include a conversion spread. The exact rate and any spread are displayed **before** you confirm payment.
- **Settlement:** Landlords receive Naira in their Nigerian bank account.
- **Same protections:** Funds follow the same escrow and OTP rules as any other payment.

---

## 9. Nigerian Infrastructure & Amenities Standards

Every verified listing must declare:

| Category | Permitted Options | Verification Checkpoint |
| :--- | :--- | :--- |
| **Power Supply** | Grid Only, Grid + Gen, Grid + Solar, Solar Only, Mixed | Meter serial number verified (prepaid vs postpaid) |
| **Water Supply** | Borehole, Treated Water, Tank Only, Both | Pump check and visual clarity test |
| **Waste Disposal** | Municipal collection (LAWMA/AEPB), private estate collection | Service confirmation |
| **Road Access** | Paved/Tarred, Interlocked, Graded Dirt | GPS and street-view check |

---

## 10. Documents, Receipts & Rent Relief

- **Digital lease:** Generated for every tenancy and available in your dashboard.
- **Payment receipts:** Each payment produces a digital receipt with a unique reference number.
- **Claim-ready record:** Your dashboard bundles the lease, receipts and payment trail so you can download them in one place.

### Rent relief (employees)
Under the **Nigeria Tax Act 2025**, effective 1 January 2026, an individual who pays rent can claim a deduction of **20% of annual rent paid, capped at ₦500,000**, provided the payment is documented (for example by receipts, transfer records or a lease).

*Example:* On ₦2,000,000 annual rent, the deduction is ₦400,000 from taxable income. The tax actually saved depends on your tax band.

RentHub's records are designed to make documentation easy, but bank transfer records and other proofs may also qualify. RentHub does not provide tax advice, so confirm how to claim with your employer's payroll team or a tax adviser.

---

## 11. Legal Framework, Privacy & Data Protection

### Tenancy law
- **Lagos State Tenancy Law 2011:** Lagos limits how much advance rent can be demanded for annual tenancies, so RentHub offers 12-month terms there.
- **Recovery of Premises Act (applicable in Abuja and several northern states):** Sets the notice and recovery process for premises. RentHub provides **model tenancy agreements and notice templates** aligned with these processes.
- Templates are general-purpose and do not replace independent legal advice. Either party may seek their own counsel.

### Custody of funds
Client funds are collected into a segregated account with a licensed banking partner and released only under the rules in this guide, with transaction audit trails. ⚠️ **[TO CONFIRM: final legal description of custody, e.g., escrow vs. segregated collection account, and counsel sign-off]**

### Privacy and data protection
- **What we collect:** Identity details (name, phone, email), ID documents (e.g., NIN, driver's license, passport) and property documents, used for verification, fraud prevention and lease administration.
- **Who sees it:** Access is limited to authorized RentHub staff and service providers under confidentiality obligations. Landlords see a tenant's verification status and TrustScore, not raw ID documents.
- **Your control:** You can request access to, correction or deletion of your personal data, subject to legal retention requirements.
- **Retention:** ⚠️ **[TO CONFIRM: retention periods for ID documents and transaction records]**
- **Compliance:** RentHub's data practices are intended to align with the Nigeria Data Protection Act 2023. ⚠️ **[TO CONFIRM with counsel: registration and lawful-basis documentation]**

---
*RentHub Technologies • Abuja & Lagos, Nigeria • 2026*