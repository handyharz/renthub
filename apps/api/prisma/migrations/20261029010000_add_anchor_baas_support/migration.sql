-- Add ANCHOR value to PaymentGateway enum
ALTER TYPE "PaymentGateway" ADD VALUE IF NOT EXISTS 'ANCHOR';

-- Create PayoutRail enum
DO $$ BEGIN
    CREATE TYPE "PayoutRail" AS ENUM ('AFRIEXCHANGE', 'ANCHOR_NIP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add Anchor BaaS sub-ledger and virtual account columns to transactions
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "anchorEscrowLedgerId" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "anchorCautionLedgerId" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "anchorVirtualNuban" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "anchorBankName" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "anchorCollectionRef" TEXT;

-- Create unique indexes for Anchor transaction references
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_anchorEscrowLedgerId_key" ON "transactions"("anchorEscrowLedgerId");
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_anchorCautionLedgerId_key" ON "transactions"("anchorCautionLedgerId");
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_anchorCollectionRef_key" ON "transactions"("anchorCollectionRef");

-- Add Anchor transfer references and payoutRail to landlord_payouts
ALTER TABLE "landlord_payouts" ADD COLUMN IF NOT EXISTS "payoutRail" "PayoutRail" NOT NULL DEFAULT 'AFRIEXCHANGE';
ALTER TABLE "landlord_payouts" ADD COLUMN IF NOT EXISTS "anchorTransferId" TEXT;
ALTER TABLE "landlord_payouts" ADD COLUMN IF NOT EXISTS "anchorReference" TEXT;

-- Create unique indexes for Anchor landlord payout references
CREATE UNIQUE INDEX IF NOT EXISTS "landlord_payouts_anchorTransferId_key" ON "landlord_payouts"("anchorTransferId");
CREATE UNIQUE INDEX IF NOT EXISTS "landlord_payouts_anchorReference_key" ON "landlord_payouts"("anchorReference");
