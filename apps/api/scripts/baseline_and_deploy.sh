#!/usr/bin/env bash
set -e

DIRECT_URL="postgresql://neondb_owner:npg_9CQbM0HvZdYE@ep-rough-unit-b47bfofa.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"

echo "==> Baselining 20260122164330_add_tour_requests"
DATABASE_URL="$DIRECT_URL" pnpm exec prisma migrate resolve --applied 20260122164330_add_tour_requests

echo "==> Baselining 20260123123041_add_revenue_streams"
DATABASE_URL="$DIRECT_URL" pnpm exec prisma migrate resolve --applied 20260123123041_add_revenue_streams

echo "==> Baselining 20260123190728_add_onboarding_completed"
DATABASE_URL="$DIRECT_URL" pnpm exec prisma migrate resolve --applied 20260123190728_add_onboarding_completed

echo "==> Deploying 20261025000000_phase4_audit_sync"
DATABASE_URL="$DIRECT_URL" pnpm exec prisma migrate deploy

echo "==> All done ✅"
