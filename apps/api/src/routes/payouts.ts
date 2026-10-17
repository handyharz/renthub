import { Router } from "express";
import { payoutController } from "../controllers/payoutController";
import { requireAuth, requireRole } from "../middleware/auth";

const router: Router = Router();

// ─── Landlord self-service routes ───────────────────────────────────────────
// Link/update AfriExchange wallet for automated payouts
router.put(
    "/link-afriexchange",
    requireAuth,
    payoutController.linkAfriExchangeAccount.bind(payoutController)
);

// Check if landlord has AfriExchange linked
router.get(
    "/link-status",
    requireAuth,
    payoutController.getAfriExchangeLinkStatus.bind(payoutController)
);

// Get all my payouts (landlord sees their payout history)
router.get(
    "/my-payouts",
    requireAuth,
    payoutController.getMyPayouts.bind(payoutController)
);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get(
    "/admin/summary",
    requireAuth,
    requireRole("ADMIN"),
    payoutController.adminGetPayoutSummary.bind(payoutController)
);

router.get(
    "/admin/all",
    requireAuth,
    requireRole("ADMIN"),
    payoutController.adminGetAllPayouts.bind(payoutController)
);

router.get(
    "/admin/:payoutId",
    requireAuth,
    requireRole("ADMIN"),
    payoutController.adminGetPayoutDetail.bind(payoutController)
);

router.post(
    "/admin/:payoutId/retry",
    requireAuth,
    requireRole("ADMIN"),
    payoutController.adminRetryPayout.bind(payoutController)
);

router.put(
    "/admin/landlord/:landlordId/link-afriexchange",
    requireAuth,
    requireRole("ADMIN"),
    payoutController.adminLinkLandlordAfriExchange.bind(payoutController)
);

router.post(
    "/admin/disburse/:transactionId",
    requireAuth,
    requireRole("ADMIN"),
    payoutController.adminDisbursePayout.bind(payoutController)
);

export default router;
