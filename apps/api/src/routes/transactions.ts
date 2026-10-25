import { Router } from "express";
import { transactionController } from "../controllers/transactionController";
import { requireAuth, requireDbUser, requireRole } from "../middleware/auth";

const router: Router = Router();

router.use(requireAuth, requireDbUser);

router.post("/", transactionController.createTransaction.bind(transactionController));

router.get("/tenant/all", transactionController.getTenantTransactions.bind(transactionController));
router.get("/landlord/all", transactionController.getLandlordTransactions.bind(transactionController));

router.get("/:id", transactionController.getTransaction.bind(transactionController));

// Document & Tax Relief Pack endpoints (Guide §10, Deck Slide 6)
router.get("/:id/receipt", transactionController.getReceipt.bind(transactionController));
router.get("/:id/agreement", transactionController.getAgreement.bind(transactionController));
router.get("/:id/tax-pack", transactionController.getTaxPack.bind(transactionController));

// Landlord Handover Proof & Tenant Challenge (Guide §5.3)
router.post("/:id/handover-proof", transactionController.submitHandoverProof.bind(transactionController));
router.post("/:id/handover-challenge", transactionController.challengeHandoverProof.bind(transactionController));

// Move-Out Condition Report & Caution Dispute (Guide §6)
router.post("/:id/move-out-report", transactionController.submitMoveOutReport.bind(transactionController));
router.post("/:id/caution-resolve", transactionController.resolveCautionDeductions.bind(transactionController));

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
