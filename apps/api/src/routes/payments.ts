import { Router } from "express";
import { paymentController } from "../controllers/paymentController";

import { requireAuth } from "../middleware/auth";

const router: Router = Router();

// Initialize payment with Paystack
router.post("/initialize", requireAuth, paymentController.initializePayment.bind(paymentController));

// Pay into escrow with AfriExchange
router.post("/afriexchange/pay", requireAuth, paymentController.payWithAfriExchange.bind(paymentController));
router.get("/afriexchange/verify/:reference", paymentController.verifyAfriExchangePayment.bind(paymentController));

// Verify payment
router.get("/verify/:reference", paymentController.verifyPayment.bind(paymentController));

export default router;
