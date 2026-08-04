import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { requireAuth, requireRole } from "../middleware/auth";

const router: Router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/stats", adminController.getStats.bind(adminController));
router.get("/verifications", adminController.getPendingVerifications.bind(adminController));
router.post("/verifications/:id/approve", adminController.approveVerification.bind(adminController));
router.post("/verifications/:id/reject", adminController.rejectVerification.bind(adminController));
router.get("/disputes", adminController.getDisputes.bind(adminController));
router.post("/disputes/:id/resolve", adminController.resolveDispute.bind(adminController));

export default router;
