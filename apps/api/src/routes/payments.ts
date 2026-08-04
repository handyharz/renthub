import { Router } from "express";
import { paymentController } from "../controllers/paymentController";

import { requireAuth } from "../middleware/auth";

const router: Router = Router();

// Initialize payment
router.post("/initialize", requireAuth, paymentController.initializePayment.bind(paymentController));

// Verify payment
router.get("/verify/:reference", paymentController.verifyPayment.bind(paymentController));

export default router;
