import { Router } from "express";
import { verificationController } from "../controllers/verificationController";

const router: Router = Router();

// Request OTP
router.post("/phone/request", verificationController.requestPhoneVerification);

// Verify OTP
router.post("/phone/verify", verificationController.verifyPhone);

export default router;
