import { Router } from "express";
import { userController } from "../controllers/userController";
import { requireAuth, requireRole } from "../middleware/auth";

const router: Router = Router();

router.get("/me", requireAuth, userController.getCurrentUser.bind(userController));
router.patch("/me", requireAuth, userController.updateCurrentUser.bind(userController));
router.post("/", requireAuth, userController.createUser.bind(userController));

router.get("/", requireAuth, requireRole("ADMIN"), userController.getAllUsers.bind(userController));
router.get("/:id", userController.getUserById.bind(userController));
router.get("/:id/stats", requireAuth, userController.getUserStats.bind(userController));
router.get("/:id/activity", requireAuth, userController.getUserActivity.bind(userController));
router.post("/:id/verify", requireAuth, requireRole("ADMIN"), userController.verifyUser.bind(userController));

export default router;
