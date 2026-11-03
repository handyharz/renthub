-- N18: unfunded transactions must not look escrowed by default
ALTER TABLE "transactions" ALTER COLUMN "escrowHeld" SET DEFAULT false;

-- N9: 48h offer lock must not ride on updatedAt (view counts)
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "offerLockedAt" TIMESTAMP(3);

UPDATE "properties"
SET "offerLockedAt" = "updatedAt"
WHERE "status" = 'UNDER_OFFER' AND "offerLockedAt" IS NULL;
