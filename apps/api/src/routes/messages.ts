import { Router } from "express";
import { messageController } from "../controllers/messageController";

const router: Router = Router();

// Send a message
router.post("/", messageController.sendMessage);

// Initiate or get a conversation
router.post("/initiate", messageController.initiateConversation);

// Get all conversations for a user
router.get("/conversations", messageController.getConversations);

// Get messages for a specific conversation
router.get("/conversations/:id/messages", messageController.getMessages);

// Mark conversation as read
router.patch("/conversations/:id/read", messageController.markAsRead);

// Get unread count
router.get("/unread-count", messageController.getUnreadCount);

export default router;
