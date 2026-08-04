import { Router } from "express";
import { applicationController } from "../controllers/applicationController";
import { requireAuth } from "../middleware/auth";

const router: Router = Router();

// Submit a rental application (Tenant)
router.post("/", requireAuth, applicationController.createApplication.bind(applicationController));

// Get tenant applications
router.get("/tenant", requireAuth, applicationController.getTenantApplications.bind(applicationController));

// Get landlord applications
router.get("/landlord", requireAuth, applicationController.getLandlordApplications.bind(applicationController));

// Update application status (Landlord approves/rejects)
router.patch("/:id/status", requireAuth, applicationController.updateStatus.bind(applicationController));

export default router;
