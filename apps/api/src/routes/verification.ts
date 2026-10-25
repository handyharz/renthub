import { Router } from "express";
import { verificationController } from "../controllers/verificationController";
import { requireAuth, requireDbUser } from "../middleware/auth";

const router: Router = Router();

router.use(requireAuth, requireDbUser);

router.post("/phone/request", verificationController.requestPhoneVerification);
router.post("/phone/verify", verificationController.verifyPhone);

export default router;
