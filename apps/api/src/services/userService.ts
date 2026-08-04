import { prisma } from "../config/database";
import { User, UserRole, UserStatus, Prisma } from "@prisma/client";

export class UserService {
    /**
     * Create a new user (called from Clerk webhook)
     */
    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return await prisma.user.create({
            data,
        });
    }

    /**
     * Get user by Clerk ID
     */
    async getUserByClerkId(clerkId: string): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { clerkId },
            include: {
                propertiesOwned: {
                    where: { deletedAt: null },
                    take: 5,
                    orderBy: { createdAt: "desc" },
                },
            },
        });
    }

    /**
     * Get user by ID
     */
    async getUserById(id: string): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { id },
            include: {
                propertiesOwned: {
                    where: { deletedAt: null },
                    take: 5,
                    orderBy: { createdAt: "desc" },
                },
            },
        });
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Get user by phone
     */
    async getUserByPhone(phone: string): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { phone },
        });
    }

    /**
     * Update user
     */
    async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return await prisma.user.update({
            where: { id },
            data,
        });
    }

    /**
     * Update user by Clerk ID
     */
    async updateUserByClerkId(
        clerkId: string,
        data: Prisma.UserUpdateInput
    ): Promise<User> {
        return await prisma.user.update({
            where: { clerkId },
            data,
        });
    }

    /**
     * Delete user (soft delete)
     */
    async deleteUser(id: string): Promise<User> {
        return await prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                status: UserStatus.BANNED,
            },
        });
    }

    /**
     * Get all users (admin only)
     */
    async getAllUsers(filters?: {
        role?: UserRole;
        status?: UserStatus;
        verified?: boolean;
        limit?: number;
        offset?: number;
    }) {
        const {
            role,
            status,
            verified,
            limit = 20,
            offset = 0,
        } = filters || {};

        const where: Prisma.UserWhereInput = {
            deletedAt: null,
            ...(role && { role }),
            ...(status && { status }),
            ...(verified !== undefined && { verified }),
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    clerkId: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true,
                    status: true,
                    verified: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users,
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
        };
    }

    /**
     * Update last login time
     */
    async updateLastLogin(clerkId: string): Promise<void> {
        await prisma.user.update({
            where: { clerkId },
            data: {
                lastLoginAt: new Date(),
            },
        });
    }

    /**
     * Verify user (KYC)
     */
    async verifyUser(id: string): Promise<User> {
        return await prisma.user.update({
            where: { id },
            data: {
                verified: true,
                verifiedAt: new Date(),
            },
        });
    }

    /**
     * Get user statistics
     */
    async getUserStats(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        propertiesOwned: true,
                        favorites: true,
                        transactions: true,
                        reviews: true,
                        sentMessages: true,
                    },
                },
            },
        });

        if (!user) {
            return null;
        }

        return {
            userId: user.id,
            role: user.role,
            propertiesOwned: user._count.propertiesOwned,
            favorites: user._count.favorites,
            transactions: user._count.transactions,
            reviews: user._count.reviews,
            messagesSent: user._count.sentMessages,
        };
    }
    /**
     * Get recent activity for a user
     */
    async getUserActivity(userId: string) {
        // Fetch recent activities in parallel
        const [recentProperties, recentViews] = await Promise.all([
            // Recently listed/updated properties
            prisma.property.findMany({
                where: { landlordId: userId, deletedAt: null },
                select: {
                    id: true,
                    title: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { updatedAt: "desc" },
                take: 5,
            }),
            // Recent views on their properties
            prisma.propertyView.findMany({
                where: {
                    property: { landlordId: userId },
                },
                include: {
                    property: {
                        select: {
                            title: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
        ]);

        // Format and combine activities
        const activities = [
            ...recentProperties.map((p) => ({
                id: `prop-${p.id}`,
                type: p.createdAt.getTime() === p.updatedAt.getTime() ? "PROPERTY_LISTED" : "PROPERTY_UPDATED",
                title: p.createdAt.getTime() === p.updatedAt.getTime() ? "Property Listed" : "Property Updated",
                description: p.title,
                timestamp: p.updatedAt,
                propertyId: p.id,
            })),
            ...recentViews.map((v) => ({
                id: `view-${v.id}`,
                type: "PROPERTY_VIEWED",
                title: "Property Viewed",
                description: `Someone viewed ${v.property.title}`,
                timestamp: v.createdAt,
                propertyId: v.propertyId,
            })),
        ];

        // Sort by timestamp descending
        return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
    }
}

export const userService = new UserService();
