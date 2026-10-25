import { Request, Response } from "express";
import { messageService } from "../services/messageService";

export class MessageController {
    /**
     * Initiate or Get Conversation
     * POST /api/messages/initiate
     */
    async initiateConversation(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { receiverId, propertyId, content } = req.body;

            if (!userId || !receiverId) {
                return res.status(401).json({ success: false, message: "Unauthorized or missing receiverId" });
            }

            const conversation = await messageService.getOrCreateConversation(
                [userId, receiverId],
                propertyId
            );

            // Send initial message if provided and conversation is brand new
            if (content && (!conversation.messages || conversation.messages.length === 0)) {
                await messageService.sendMessage({
                    conversationId: conversation.id,
                    senderId: userId,
                    receiverId,
                    content,
                    propertyId
                });
            }

            return res.status(200).json({
                success: true,
                data: conversation,
            });
        } catch (error: any) {
            console.error("Error initiating conversation:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to initiate conversation",
                error: error.message,
            });
        }
    }

    /**
     * Send a message
     * POST /api/messages
     */
    async sendMessage(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { receiverId, content, propertyId, conversationId: existingConvId } = req.body;

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized: User identification required" });
            }

            let conversationId: string | undefined = existingConvId as string;
            if (conversationId) {
                const member = await messageService.isParticipant(conversationId, userId);
                if (!member) {
                    return res.status(403).json({ success: false, message: "Forbidden" });
                }
            } else {
                if (!receiverId) {
                    return res.status(400).json({ success: false, message: "receiverId is required" });
                }
                const conversation = await messageService.getOrCreateConversation(
                    [userId, receiverId],
                    propertyId
                );
                conversationId = conversation.id;
            }

            // 2. Send message
            const message = await messageService.sendMessage({
                conversationId: conversationId as string,
                senderId: userId,
                receiverId: receiverId as string,
                content: content as string,
                propertyId: propertyId as string,
            });

            return res.status(201).json({
                success: true,
                data: message,
            });
        } catch (error: any) {
            console.error("Error sending message:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to send message",
                error: error.message,
            });
        }
    }

    /**
     * Get user conversations
     * GET /api/messages/conversations
     */
    async getConversations(req: Request, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized: User identification required" });
            }

            const conversations = await messageService.getUserConversations(userId);

            return res.status(200).json({
                success: true,
                data: conversations,
            });
        } catch (error: any) {
            console.error("Error fetching conversations:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch conversations",
                error: error.message,
            });
        }
    }

    /**
     * Get messages for a conversation
     * GET /api/messages/conversations/:id/messages
     */
    async getMessages(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const conversationId = req.params.id;
            const member = await messageService.isParticipant(conversationId as string, userId);
            if (!member) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

            const messages = await messageService.getConversationMessages(conversationId as string, limit, offset);

            return res.status(200).json({
                success: true,
                data: messages,
            });
        } catch (error: any) {
            console.error("Error fetching messages:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch messages",
                error: error.message,
            });
        }
    }

    /**
     * Mark conversation as read
     * PATCH /api/messages/conversations/:id/read
     */
    async markAsRead(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const conversationId = req.params.id;

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized: User identification required" });
            }

            const member = await messageService.isParticipant(conversationId as string, userId);
            if (!member) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }

            await messageService.markAsRead(conversationId as string, userId);

            return res.status(200).json({
                success: true,
                message: "Messages marked as read",
            });
        } catch (error: any) {
            console.error("Error marking messages as read:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to update messages",
                error: error.message,
            });
        }
    }

    /**
     * Get unread count
     * GET /api/messages/unread-count
     */
    async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized: User identification required" });
            }

            const count = await messageService.getUnreadCount(userId);

            return res.status(200).json({
                success: true,
                data: { count },
            });
        } catch (error: any) {
            console.error("Error fetching unread count:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch unread count",
                error: error.message,
            });
        }
    }
}

export const messageController = new MessageController();
