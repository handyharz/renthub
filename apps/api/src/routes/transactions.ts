import { Router } from "express";
import { transactionController } from "../controllers/transactionController";
import { requireAuth } from "../middleware/auth";

const router: Router = Router();

// Create transaction
router.post("/", requireAuth, transactionController.createTransaction.bind(transactionController));

// Get transaction by ID
router.get("/:id", requireAuth, transactionController.getTransaction.bind(transactionController));

// Get tenant transactions
router.get("/tenant/all", requireAuth, transactionController.getTenantTransactions.bind(transactionController));

// Get landlord transactions
router.get("/landlord/all", requireAuth, transactionController.getLandlordTransactions.bind(transactionController));

// Update transaction status
router.patch("/:id/status", requireAuth, transactionController.updateTransactionStatus.bind(transactionController));

// Release escrow (legacy)
router.post("/:id/release", requireAuth, transactionController.releaseEscrow.bind(transactionController));

// Stage 6 Key Handover & Release OTP routes
router.post("/:id/handover-otp", requireAuth, transactionController.requestHandoverOtp.bind(transactionController));
router.post("/:id/release-otp", requireAuth, transactionController.releaseEscrowWithOtp.bind(transactionController));
router.post("/:id/dispute", requireAuth, transactionController.raiseDispute.bind(transactionController));

export default router;
