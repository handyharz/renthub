-- CreateEnum
CREATE TYPE "PublicChallengeType" AS ENUM ('PROPERTY_DUPLICATE', 'FAKE_GEOTAG', 'UNAUTHORIZED_FEE', 'ESCROW_QUERY');

-- CreateEnum
CREATE TYPE "PublicChallengeStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'UPHELD', 'DISMISSED');

-- CreateTable
CREATE TABLE "transparency_snapshots" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeEscrowsCount" INTEGER NOT NULL DEFAULT 0,
    "dbExpectedKobo" BIGINT NOT NULL DEFAULT 0,
    "anchorPoolKobo" BIGINT NOT NULL DEFAULT 0,
    "afriExchangePoolKobo" BIGINT NOT NULL DEFAULT 0,
    "varianceKobo" BIGINT NOT NULL DEFAULT 0,
    "isReconciled" BOOLEAN NOT NULL DEFAULT true,
    "systemStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
    "reconciledBy" TEXT NOT NULL DEFAULT 'AUTOMATED_CRON',
    "rawDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transparency_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_proofs" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "geotagHash" TEXT NOT NULL,
    "duplicateHash" TEXT NOT NULL,
    "verifierAlias" TEXT NOT NULL,
    "photoCount" INTEGER NOT NULL DEFAULT 0,
    "hasVideoWalkthrough" BOOLEAN NOT NULL DEFAULT false,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Abuja',
    "state" TEXT NOT NULL DEFAULT 'FCT',
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "challengeCount" INTEGER NOT NULL DEFAULT 0,
    "resolvedValidCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_challenges" (
    "id" TEXT NOT NULL,
    "challengeType" "PublicChallengeType" NOT NULL,
    "targetRef" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceUrl" TEXT NOT NULL,
    "reporterEmail" TEXT,
    "ipHash" TEXT NOT NULL,
    "status" "PublicChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transparency_snapshots_timestamp_idx" ON "transparency_snapshots"("timestamp");

-- CreateIndex
CREATE INDEX "transparency_snapshots_isReconciled_idx" ON "transparency_snapshots"("isReconciled");

-- CreateIndex
CREATE UNIQUE INDEX "property_proofs_propertyId_key" ON "property_proofs"("propertyId");

-- CreateIndex
CREATE INDEX "property_proofs_neighborhood_idx" ON "property_proofs"("neighborhood");

-- CreateIndex
CREATE INDEX "property_proofs_city_idx" ON "property_proofs"("city");

-- CreateIndex
CREATE INDEX "property_proofs_duplicateHash_idx" ON "property_proofs"("duplicateHash");

-- CreateIndex
CREATE INDEX "property_proofs_verifiedAt_idx" ON "property_proofs"("verifiedAt");

-- CreateIndex
CREATE INDEX "public_challenges_targetRef_idx" ON "public_challenges"("targetRef");

-- CreateIndex
CREATE INDEX "public_challenges_status_idx" ON "public_challenges"("status");

-- CreateIndex
CREATE INDEX "public_challenges_ipHash_idx" ON "public_challenges"("ipHash");

-- CreateIndex
CREATE INDEX "public_challenges_createdAt_idx" ON "public_challenges"("createdAt");

-- AddForeignKey
ALTER TABLE "property_proofs" ADD CONSTRAINT "property_proofs_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
