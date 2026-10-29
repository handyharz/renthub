import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { requireAuth, requireRole } from "../middleware/auth";

const router: Router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/stats", adminController.getStats.bind(adminController));
router.get("/verifications", adminController.getPendingVerifications.bind(adminController));
router.post("/verifications/:id/approve", adminController.approveVerification.bind(adminController));
router.post("/verifications/:id/reject", adminController.rejectVerification.bind(adminController));
router.post("/verifications/:id/revoke", adminController.revokeVerification.bind(adminController));
router.get("/disputes", adminController.getDisputes.bind(adminController));
router.post("/disputes/:id/resolve", adminController.resolveDispute.bind(adminController));
router.get("/escrow", adminController.getEscrowTransactions.bind(adminController));
router.get("/properties", adminController.getAllProperties.bind(adminController));
router.get("/settings", adminController.getSettings.bind(adminController));
router.patch("/settings", adminController.updateSettings.bind(adminController));
router.post("/settings/test-afriexchange", adminController.testAfriExchangeConnection.bind(adminController));
router.get("/transparency/audit", adminController.getTransparencyAudit.bind(adminController));
router.get("/transparency/challenges", adminController.getChallenges.bind(adminController));
router.patch("/transparency/challenges/:id", adminController.moderateChallenge.bind(adminController));

export default router;
