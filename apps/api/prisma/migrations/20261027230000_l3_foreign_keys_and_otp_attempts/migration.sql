-- Clean up any existing orphan notification rows before applying foreign key constraint
DELETE FROM "notifications" WHERE "userId" NOT IN (SELECT "id" FROM "users");

-- Clean up any existing orphan landlord payout rows before applying foreign key constraint
DELETE FROM "landlord_payouts" WHERE "transactionId" NOT IN (SELECT "id" FROM "transactions");

-- M6: Standardize existing ServiceTransaction amounts (if stored in kobo >= 100,000, convert to naira)
UPDATE "service_transactions" SET "amount" = "amount" / 100 WHERE "amount" >= 100000;

-- M3: Add database-backed otpAttempts counter to transactions
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "otpAttempts" INTEGER NOT NULL DEFAULT 0;

-- L3: Add foreign key constraint on notifications.userId -> users.id
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_userId_fkey";
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- L3: Add foreign key constraint on landlord_payouts.transactionId -> transactions.id
ALTER TABLE "landlord_payouts" DROP CONSTRAINT IF EXISTS "landlord_payouts_transactionId_fkey";
ALTER TABLE "landlord_payouts" ADD CONSTRAINT "landlord_payouts_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
