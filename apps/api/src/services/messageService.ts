import { prisma } from "../config/database";
import { Message, Prisma } from "@prisma/client";

// Explicitly define Conversation type as any if it's missing from the generated client to satisfy the compiler
type Conversation = any;

export class MessageService {
    /**
     * Get or create a conversation between participants for a specific property.
     */
    async getOrCreateConversation(
        participantIds: string[],
        propertyId?: string
    ): Promise<Conversation> {
        // Find if a conversation already exists between these exact participants for this property
        // For simplicity, we assume 1-on-1 for property inquiries
        const existingConversation = await (prisma as any).conversation.findFirst({
            where: {
                propertyId: propertyId || null,
                AND: participantIds.map((id) => ({
                    participants: { some: { id } },
                })),
                // Ensure it's ONLY these participants (optional, but good for 1-on-1)
                participants: {
                    every: {
                        id: { in: participantIds },
                    },
                },
            },
            include: {
                participants: true,
                messages: {
                    take: 1,
                    orderBy: { createdAt: "asc" }
                }
            },
        });

        if (existingConversation) {
            return existingConversation;
        }

        // Create new conversation
        return await (prisma as any).conversation.create({
            data: {
                propertyId: propertyId || null,
                participants: {
                    connect: participantIds.map((id) => ({ id })),
                },
            },
            include: {
                participants: true,
                messages: {
                    take: 1
                }
            },
        });
    }

    /**
     * Send a message within a conversation.
     */
    async sendMessage(data: {
        conversationId: string;
        senderId: string;
        receiverId: string;
        content: string;
        propertyId?: string;
        attachments?: any;
    }): Promise<Message> {
        const { conversationId, senderId, receiverId, content, propertyId, attachments } = data;

        const [message] = await (prisma as any).$transaction([
            // 1. Create the message
            (prisma as any).message.create({
                data: {
                    conversationId,
                    senderId,
                    receiverId,
                    content,
                    propertyId: propertyId || null,
                    attachments: attachments || Prisma.JsonNull,
                },
            }),
            // 2. Update conversation's lastMessageAt
            (prisma as any).conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() },
            }),
        ]);

        return message;
    }

    /**
     * Get all conversations for a user.
     */
    async getUserConversations(userId: string) {
        return await (prisma as any).conversation.findMany({
            where: {
                participants: {
                    some: { id: userId },
                },
            },
            include: {
                participants: true,
                property: {
                    select: {
                        id: true,
                        title: true,
                        images: {
                            take: 1,
                            select: { url: true },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: {
                lastMessageAt: "desc",
            },
        });
    }

    /**
     * Get messages for a specific conversation.
     */
    async getConversationMessages(conversationId: string, limit = 50, offset = 0) {
        return await (prisma as any).message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" },
            take: limit,
            skip: offset,
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });
    }

    /**
     * Mark all messages in a conversation as read for a user.
     */
    async markAsRead(conversationId: string, userId: string) {
        return await (prisma as any).message.updateMany({
            where: {
                conversationId,
                receiverId: userId,
                read: false,
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });
    }

    /**
     * Get unread message count for a user.
     */
    async getUnreadCount(userId: string): Promise<number> {
        return await (prisma as any).message.count({
            where: {
                receiverId: userId,
                read: false,
            },
        });
    }
}

export const messageService = new MessageService();
