import { Router } from "express";
import { paymentController } from "../controllers/paymentController";

const router: Router = Router();

// Paystack webhook
router.post("/paystack", paymentController.handleWebhook.bind(paymentController));

// AfriExchange webhook
router.post("/afriexchange", paymentController.handleAfriExchangeWebhook.bind(paymentController));

export default router;
