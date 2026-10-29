import { Router } from "express";
import { paymentController } from "../controllers/paymentController";
import { requireAuth, requireDbUser } from "../middleware/auth";

const router: Router = Router();

router.post("/initialize", requireAuth, requireDbUser, paymentController.initializePayment.bind(paymentController));
router.post("/anchor/initialize", requireAuth, requireDbUser, paymentController.initializeAnchorPayment.bind(paymentController));
router.get("/anchor/status/:transactionId", requireAuth, requireDbUser, paymentController.getAnchorAccountDetails.bind(paymentController));
router.post("/afriexchange/pay", requireAuth, requireDbUser, paymentController.payWithAfriExchange.bind(paymentController));
router.get(
    "/afriexchange/verify/:reference",
    requireAuth,
    requireDbUser,
    paymentController.verifyAfriExchangePayment.bind(paymentController)
);
router.get("/verify/:reference", requireAuth, requireDbUser, paymentController.verifyPayment.bind(paymentController));

export default router;
