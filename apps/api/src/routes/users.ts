import { Router } from "express";
import { userController } from "../controllers/userController";
import { requireAuth, requireRole } from "../middleware/auth";

const router: Router = Router();

// Get current user (authenticated)
router.get("/me", requireAuth, userController.getCurrentUser.bind(userController));

// Update current user (authenticated)
router.patch("/me", requireAuth, userController.updateCurrentUser.bind(userController));

// Create user (webhook from Clerk / initial sync)
router.post("/", userController.createUser.bind(userController));

// Get all users (admin only)
router.get("/", requireAuth, requireRole("ADMIN"), userController.getAllUsers.bind(userController));

// Get user by ID (public profile)
router.get("/:id", userController.getUserById.bind(userController));

// Get user statistics
router.get("/:id/stats", userController.getUserStats.bind(userController));

// Get user activity
router.get("/:id/activity", userController.getUserActivity.bind(userController));

// Verify user (admin only)
router.post("/:id/verify", requireAuth, requireRole("ADMIN"), userController.verifyUser.bind(userController));

export default router;
