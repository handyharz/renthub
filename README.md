# 📜 RentHub: The Agent-Free Rental Platform

RentHub is a mission-driven rental marketplace designed to eliminate the **"Agent Tax"** in the Nigerian housing market. By directly connecting verified landlords with tenants through a secure, transparent, multi-stage trust infrastructure, we aim to save Nigerians billions of naira in unnecessary fees.

> **Our Mission:** To save Nigerians ₦10 Billion in agent fees over the next 5 years, starting with Abuja.
>
> 🚀 **Read the full Pitch & Traction Deck:** [PITCH.md](./PITCH.md)

---

## 🛡️ Core Pillars of Trust (The 7-Stage Trust Chain)

RentHub isn't just a listing site; it's a trust infrastructure engineered specifically for the Nigerian real estate landscape where trust is low and fraud is rife.

```
[1. Discovery] ➔ [2. Free Inspection Tour] ➔ [3. Application & Offer] ➔ [4. Landlord Acceptance] 
                                                                                │
[7. Verified Review]  [6. Key OTP & Release]  [5. RentHub Escrow Pay] ◄──────┘
```

- **Physical Property Inspection**: Verified properties undergo physical inspection by field verifiers checking structural condition, plumbing, power supply, and land title documents before receiving the "Verified" badge.
- **Zero Inspection Fees**: Tenants schedule physical tours directly with verified landlords with zero "showing" or inspection fees.
- **Application & Offer Lock**: Landlords review tenant profiles and issue formal lease offers, temporarily locking listings to prevent multiple-tenant rental scams.
- **OTP Key Handover Escrow Protection**: Rent payments are deposited securely into RentHub Escrow via Paystack. Funds are only released to the landlord once the tenant inspects the empty property at handover and provides their 6-digit Release OTP code (backed by a 48-hour dispute window).
- **Direct Connection**: No middlemen gatekeepers. Secure in-app messaging between verified tenants and landlords.
- **Multi-Dimensional Reviews**: Accountability for both parties through verified multi-dimensional ratings (location, value, condition, landlord conduct).

---

## 🚀 Key Features

### For Tenants
- **Advanced Search**: Filter by location, price, property type, power supply type, and verified amenities.
- **Free Inspection Scheduling**: Book physical viewing appointments directly through the app calendar.
- **Application & Lease Offer Manager**: Apply to rent and view itemized lease cost breakdowns (Rent + Caution + Legal + 2% Platform Fee).
- **Escrow & Key OTP Release**: Deposit rent into escrow and trigger payout upon key exchange using a secure 6-digit OTP code.
- **Digital Receipts**: Legal-compliant proof of payment for every completed transaction.
- **Resource Hub**: Access to tenant rights, inspection checklists, and Nigerian moving guides.

### For Landlords
- **Direct Listing**: List properties for free and reach verified tenants directly.
- **Tenant Application Vetting**: Review tenant identity profiles and rental terms before accepting applications.
- **Property Verification Service**: Request physical field verification visits to earn the "Verified Property" badge.
- **Featured Listing Boosts**: Promote listings to top search positions for maximum visibility.
- **98% Net Rent Payout**: Receive 98% net rent directly to your bank account upon key handover OTP input (only 2% escrow fee vs 10% traditional agent deductions).
- **Escrow Guarantee**: Know funds are secured in escrow before handing over keys.

---

## 🛠️ Technical Architecture

RentHub is built as a **Turborepo monorepo**, ensuring a shared type-safe environment between the frontend and backend.

### Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js (TypeScript).
- **ORM & Database**: Prisma with PostgreSQL.
- **Authentication**: Clerk (Identity Management & Verification).
- **Payments**: Paystack (Escrow & Service Transactions primary).
- **SMS & OTP**: Termii API.
- **Media**: Cloudinary.

### Project Structure
```text
renthub/
├── apps/
│   ├── web/          # Next.js Frontend
│   └── api/          # Express.js Backend
├── packages/
│   └── database/     # Shared Prisma Schema & Client
├── myDocs/           # Project Manifesto, Roadmap, and Progress
└── README.md         # You are here
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm
- A running PostgreSQL instance

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   - Create `.env` files in `apps/api` and `apps/web` based on `.env.example`
4. Synchronize the database:
   ```bash
   pnpm run prisma:generate
   pnpm run prisma:push
   ```
5. Start the development server:
   ```bash
   pnpm run dev
   ```

---

## 🗺️ Roadmap & Documentation
For deep dives into our technical architecture, product manifesto, and active development roadmap:
- [📜 Platform Manifesto](file:///Users/harz/Documents/backUps/renthub/myDocs/📜%20RentHub:%20The%20Platform%20Manifesto.md)
- [🗺️ Development Roadmap](file:///Users/harz/Documents/backUps/renthub/myDocs/🗺️%20Development%20Roadmap:%20From%20Zero%20to%20Launch.md)
- [📈 Project Progress Tracker](file:///Users/harz/Documents/backUps/renthub/myDocs/progress.md)

---

## 🤝 Community & Support
- **Support**: [Support Center](file:///Users/harz/Documents/backUps/renthub/apps/web/src/app/support/page.tsx)
- **Community**: [RentHub Community](file:///Users/harz/Documents/backUps/renthub/apps/web/src/app/community/page.tsx)

*Built with ❤️ for Nigeria.*
