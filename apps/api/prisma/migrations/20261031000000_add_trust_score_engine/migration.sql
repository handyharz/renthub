-- AlterTable
ALTER TABLE "users" ADD COLUMN "trustScore" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "trustFactors" JSONB;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "trustScore" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "trustFactors" JSONB;

-- CreateIndex
CREATE INDEX "users_trustScore_idx" ON "users"("trustScore");

-- CreateIndex
CREATE INDEX "properties_trustScore_idx" ON "properties"("trustScore");
