-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('PROPERTY_VERIFICATION', 'FEATURED_LISTING', 'USER_VERIFICATION');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "featuredExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "serviceFee" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "landlordAvgRating" DOUBLE PRECISION,
ADD COLUMN     "landlordReviewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "service_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "ServiceType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL,
    "propertyId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_transactions_reference_key" ON "service_transactions"("reference");

-- CreateIndex
CREATE INDEX "service_transactions_userId_idx" ON "service_transactions"("userId");

-- CreateIndex
CREATE INDEX "service_transactions_propertyId_idx" ON "service_transactions"("propertyId");

-- CreateIndex
CREATE INDEX "service_transactions_reference_idx" ON "service_transactions"("reference");

-- AddForeignKey
ALTER TABLE "service_transactions" ADD CONSTRAINT "service_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_transactions" ADD CONSTRAINT "service_transactions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
