-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('OFFERED_BY_LANDLORD', 'PENDING_TENANT_REVIEW', 'COUNTER_OFFERED', 'ACCEPTED', 'PAID_IN_ESCROW', 'COMPLETED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgentListingStatus" AS ENUM ('PENDING_LANDLORD', 'AUTHORIZED', 'REVOKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AgentStrikeReason" AS ENUM ('INSPECTION_FEE', 'FUEL_MONEY', 'REGISTRATION_FORM_FEE', 'OFF_PLATFORM_CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "AgentStrikeStatus" AS ENUM ('PENDING', 'UPHELD', 'DISMISSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'LEASE_RENEWAL_OFFERED';
ALTER TYPE "NotificationType" ADD VALUE 'LEASE_RENEWAL_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'LEASE_RENEWAL_DECLINED';

-- AlterEnum
ALTER TYPE "PaymentGateway" ADD VALUE 'AFRIEXCHANGE';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "afriExchangeRef" TEXT,
ADD COLUMN     "applicationId" TEXT,
ADD COLUMN     "disputeReason" TEXT,
ADD COLUMN     "disputed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "releaseOtp" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "afriExchangeAccountEmail" TEXT,
ADD COLUMN     "afriExchangeUserId" TEXT,
ADD COLUMN     "afriExchangeWalletAddress" TEXT,
ADD COLUMN     "settlementLinkedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "rental_applications" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "proposedMoveInDate" TIMESTAMP(3) NOT NULL,
    "leaseDuration" INTEGER NOT NULL DEFAULT 12,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landlord_payouts" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "grossAmount" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "afriExchangePayoutId" TEXT,
    "afriExchangeRef" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landlord_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lease_renewals" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "originalTransactionId" TEXT,
    "currentRent" INTEGER NOT NULL,
    "offeredRent" INTEGER NOT NULL,
    "leaseDuration" INTEGER NOT NULL DEFAULT 12,
    "currentLeaseEndDate" TIMESTAMP(3) NOT NULL,
    "newLeaseStartDate" TIMESTAMP(3) NOT NULL,
    "newLeaseEndDate" TIMESTAMP(3) NOT NULL,
    "platformFeeTenant" INTEGER NOT NULL,
    "platformFeeLandlord" INTEGER NOT NULL,
    "cautionRolledOver" BOOLEAN NOT NULL DEFAULT true,
    "cautionAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "RenewalStatus" NOT NULL DEFAULT 'OFFERED_BY_LANDLORD',
    "landlordNote" TEXT,
    "tenantNote" TEXT,
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lease_renewals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "licenseDocUrl" TEXT,
    "businessName" TEXT,
    "businessAddress" TEXT,
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "operatingCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "status" "AgentStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "defaultCommissionPct" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "avgRating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "totalClosed" INTEGER NOT NULL DEFAULT 0,
    "strikeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_listings" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "status" "AgentListingStatus" NOT NULL DEFAULT 'PENDING_LANDLORD',
    "commissionPct" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "commissionAmount" INTEGER,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorizedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "agentNote" TEXT,
    "landlordNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_strikes" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "propertyId" TEXT,
    "reason" "AgentStrikeReason" NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strikeApplied" BOOLEAN NOT NULL DEFAULT false,
    "status" "AgentStrikeStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_strikes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rental_applications_propertyId_idx" ON "rental_applications"("propertyId");

-- CreateIndex
CREATE INDEX "rental_applications_tenantId_idx" ON "rental_applications"("tenantId");

-- CreateIndex
CREATE INDEX "rental_applications_landlordId_idx" ON "rental_applications"("landlordId");

-- CreateIndex
CREATE INDEX "rental_applications_status_idx" ON "rental_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "landlord_payouts_transactionId_key" ON "landlord_payouts"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "landlord_payouts_idempotencyKey_key" ON "landlord_payouts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "landlord_payouts_landlordId_idx" ON "landlord_payouts"("landlordId");

-- CreateIndex
CREATE INDEX "landlord_payouts_status_idx" ON "landlord_payouts"("status");

-- CreateIndex
CREATE INDEX "landlord_payouts_createdAt_idx" ON "landlord_payouts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "lease_renewals_paymentReference_key" ON "lease_renewals"("paymentReference");

-- CreateIndex
CREATE INDEX "lease_renewals_propertyId_idx" ON "lease_renewals"("propertyId");

-- CreateIndex
CREATE INDEX "lease_renewals_tenantId_idx" ON "lease_renewals"("tenantId");

-- CreateIndex
CREATE INDEX "lease_renewals_landlordId_idx" ON "lease_renewals"("landlordId");

-- CreateIndex
CREATE INDEX "lease_renewals_status_idx" ON "lease_renewals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_userId_key" ON "agent_profiles"("userId");

-- CreateIndex
CREATE INDEX "agent_profiles_status_idx" ON "agent_profiles"("status");

-- CreateIndex
CREATE INDEX "agent_profiles_userId_idx" ON "agent_profiles"("userId");

-- CreateIndex
CREATE INDEX "agent_listings_propertyId_idx" ON "agent_listings"("propertyId");

-- CreateIndex
CREATE INDEX "agent_listings_agentId_idx" ON "agent_listings"("agentId");

-- CreateIndex
CREATE INDEX "agent_listings_landlordId_idx" ON "agent_listings"("landlordId");

-- CreateIndex
CREATE INDEX "agent_listings_status_idx" ON "agent_listings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "agent_listings_propertyId_agentId_key" ON "agent_listings"("propertyId", "agentId");

-- CreateIndex
CREATE INDEX "agent_strikes_agentId_idx" ON "agent_strikes"("agentId");

-- CreateIndex
CREATE INDEX "agent_strikes_reporterId_idx" ON "agent_strikes"("reporterId");

-- CreateIndex
CREATE INDEX "agent_strikes_propertyId_idx" ON "agent_strikes"("propertyId");

-- CreateIndex
CREATE INDEX "agent_strikes_status_idx" ON "agent_strikes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_afriExchangeRef_key" ON "transactions"("afriExchangeRef");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "rental_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlord_payouts" ADD CONSTRAINT "landlord_payouts_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_renewals" ADD CONSTRAINT "lease_renewals_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_renewals" ADD CONSTRAINT "lease_renewals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_renewals" ADD CONSTRAINT "lease_renewals_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_listings" ADD CONSTRAINT "agent_listings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_listings" ADD CONSTRAINT "agent_listings_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_listings" ADD CONSTRAINT "agent_listings_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_strikes" ADD CONSTRAINT "agent_strikes_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_strikes" ADD CONSTRAINT "agent_strikes_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_strikes" ADD CONSTRAINT "agent_strikes_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

