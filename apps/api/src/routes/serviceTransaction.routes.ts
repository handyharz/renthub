import { Router } from "express";
import { ServiceTransactionController } from "../controllers/serviceTransaction.controller";
import { requireAuth } from "../middleware/auth";

const router: Router = Router();
const controller = new ServiceTransactionController();

// Paystack payment initiation
router.post("/pay", requireAuth, controller.initiate.bind(controller));

// AfriExchange payment initiation
router.post("/afriexchange/pay", requireAuth, controller.initiateAfriExchange.bind(controller));

// Payment verification (Paystack or AfriExchange)
router.post("/verify", requireAuth, controller.verify.bind(controller));
router.get("/verify/:reference", controller.verify.bind(controller));

export default router;
