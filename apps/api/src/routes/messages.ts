import { Router } from "express";
import { messageController } from "../controllers/messageController";
import { requireAuth, requireDbUser } from "../middleware/auth";

const router: Router = Router();

router.use(requireAuth, requireDbUser);

router.post("/", messageController.sendMessage);
router.post("/initiate", messageController.initiateConversation);
router.get("/conversations", messageController.getConversations);
router.get("/conversations/:id/messages", messageController.getMessages);
router.patch("/conversations/:id/read", messageController.markAsRead);
router.get("/unread-count", messageController.getUnreadCount);

export default router;
