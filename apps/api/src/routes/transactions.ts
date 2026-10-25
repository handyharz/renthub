import { Router } from "express";
import { transactionController } from "../controllers/transactionController";
import { requireAuth, requireDbUser, requireRole } from "../middleware/auth";

const router: Router = Router();

router.use(requireAuth, requireDbUser);

router.post("/", transactionController.createTransaction.bind(transactionController));

router.get("/tenant/all", transactionController.getTenantTransactions.bind(transactionController));
router.get("/landlord/all", transactionController.getLandlordTransactions.bind(transactionController));

router.get("/:id", transactionController.getTransaction.bind(transactionController));

router.patch(
    "/:id/status",
    requireRole("ADMIN"),
    transactionController.updateTransactionStatus.bind(transactionController)
);

router.post(
    "/:id/release",
    requireRole("ADMIN"),
    transactionController.releaseEscrow.bind(transactionController)
);

router.post("/:id/handover-otp", transactionController.requestHandoverOtp.bind(transactionController));
router.post("/:id/release-otp", transactionController.releaseEscrowWithOtp.bind(transactionController));
router.post("/:id/dispute", transactionController.raiseDispute.bind(transactionController));

export default router;
