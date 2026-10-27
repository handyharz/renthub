import { Router } from "express";
import { renewalController } from "../controllers/renewalController";
import { requireAuth } from "../middleware/auth";

const router: Router = Router();

// Landlord creates/triggers renewal offer
router.post("/offer", requireAuth, renewalController.createRenewalOffer.bind(renewalController));

// Landlord gets all renewal offers
router.get("/landlord", requireAuth, renewalController.getLandlordRenewals.bind(renewalController));

// Tenant gets all renewal offers
router.get("/tenant", requireAuth, renewalController.getTenantRenewals.bind(renewalController));

// Tenant responds (Accept / Decline / Counter)
router.patch("/:id/respond", requireAuth, renewalController.respondToRenewal.bind(renewalController));

// Tenant pays for accepted renewal into escrow
router.post("/:id/pay", requireAuth, renewalController.initiateRenewalPayment.bind(renewalController));

// Verify renewal payment
router.post("/verify", requireAuth, renewalController.verifyRenewalPayment.bind(renewalController));

export default router;
