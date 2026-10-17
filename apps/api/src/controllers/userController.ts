import { Request, Response } from "express";
import { userService } from "../services/userService";
import { UserRole, UserStatus } from "@prisma/client";

export class UserController {
    /**
     * Get current user (from auth token)
     * GET /api/users/me
     */
    async getCurrentUser(req: Request, res: Response) {
        try {
            // Get clerkId from req.user, authenticated auth token, or query param fallback
            const clerkId = req.user?.clerkId || (req as any).auth?.userId || (req.query.clerkId as string);

            if (!clerkId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification required",
                });
            }

            const user = await userService.getUserByClerkId(clerkId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Update last login
            userService.updateLastLogin(clerkId).catch(console.error);

            return res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error: any) {
            console.error("Error fetching current user:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch user",
                error: error.message,
            });
        }
    }

    /**
     * Get user by ID
     * GET /api/users/:id
     */
    async getUserById(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            const user = await userService.getUserById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Return public profile only
            const publicProfile = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                role: user.role,
                verified: user.verified,
                createdAt: user.createdAt,
            };

            return res.status(200).json({
                success: true,
                data: publicProfile,
            });
        } catch (error: any) {
            console.error("Error fetching user:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch user",
                error: error.message,
            });
        }
    }

    /**
     * Update current user
     * PATCH /api/users/me
     */
    async updateCurrentUser(req: Request, res: Response) {
        try {
            const clerkId = req.user?.clerkId || (req as any).auth?.userId || (req.query.clerkId as string);

            if (!clerkId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification required",
                });
            }

            const { firstName, lastName, avatar, phone, role, idType, idNumber } = req.body;

            // Fetch current user to check if phone changed
            const currentUser = await userService.getUserByClerkId(clerkId);
            if (!currentUser) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const isPhoneChanged = phone && phone !== currentUser.phone;

            const user = await userService.updateUserByClerkId(clerkId, {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(avatar && { avatar }),
                ...(phone && { phone }),
                ...(role && { role }),
                ...(idType && { idType }),
                ...(idNumber && { idNumber }),
                ...(isPhoneChanged && { phoneVerified: false }),
                onboardingCompleted: true, // Mark onboarding as completed on any profile update
            });

            return res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: user,
            });
        } catch (error: any) {
            console.error("Error updating user:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to update user",
                error: error.message,
            });
        }
    }

    /**
     * Create user (called from Clerk webhook)
     * POST /api/users
     */
    async createUser(req: Request, res: Response) {
        try {
            console.log("Creating user with body:", JSON.stringify(req.body, null, 2));
            const {
                clerkId,
                email,
                phone,
                firstName,
                lastName,
                avatar,
                role = UserRole.TENANT,
            } = req.body;

            // Validation - clerkId is absolute minimum
            if (!clerkId) {
                return res.status(400).json({
                    success: false,
                    message: "Clerk ID is required",
                });
            }

            // Fallbacks for data coming from Clerk without full profile setup
            const userPhone = phone || `no-phone-${clerkId}`;
            const fName = firstName || email?.split("@")[0] || "User";
            const lName = lastName || "";

            // Check if user already exists
            const existingUser = await userService.getUserByClerkId(clerkId);
            if (existingUser) {
                // If a different role is provided, update it
                if (req.body.role && req.body.role !== existingUser.role) {
                    console.log(`Updating role for user ${clerkId} from ${existingUser.role} to ${req.body.role}`);
                    const updatedUser = await userService.updateUserByClerkId(clerkId, {
                        role: req.body.role as UserRole
                    });
                    return res.status(200).json({
                        success: true,
                        message: "User role updated",
                        data: updatedUser,
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "User already exists",
                    data: existingUser,
                });
            }

            const user = await userService.createUser({
                clerkId,
                email,
                phone: userPhone,
                firstName: fName,
                lastName: lName,
                avatar,
                role,
                status: UserStatus.ACTIVE,
            });

            console.log("User created successfully in DB:", user.id);
            return res.status(201).json({
                success: true,
                message: "User created successfully",
                data: user,
            });
        } catch (error: any) {
            console.error("Error creating user:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to create user",
                error: error.message,
            });
        }
    }

    /**
     * Get all users (admin only)
     * GET /api/users
     */
    async getAllUsers(req: Request, res: Response) {
        try {
            const { role, status, verified, search, limit, offset } = req.query;

            const result = await userService.getAllUsers({
                search: typeof search === "string" ? search : undefined,
                role: typeof role === "string" ? (role as UserRole) : undefined,
                status: typeof status === "string" ? (status as UserStatus) : undefined,
                verified: verified !== undefined ? verified === "true" : undefined,
                limit: limit && typeof limit === "string" ? parseInt(limit) : 50,
                offset: offset && typeof offset === "string" ? parseInt(offset) : 0,
            });

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error("Error fetching users:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch users",
                error: error.message,
            });
        }
    }

    /**
     * Get user statistics
     * GET /api/users/:id/stats
     */
    async getUserStats(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            const stats = await userService.getUserStats(id);

            if (!stats) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            return res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            console.error("Error fetching user stats:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch user stats",
                error: error.message,
            });
        }
    }

    /**
     * Get user activity
     * GET /api/users/:id/activity
     */
    async getUserActivity(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            const activity = await userService.getUserActivity(id);

            return res.status(200).json({
                success: true,
                data: activity,
            });
        } catch (error: any) {
            console.error("Error fetching user activity:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch user activity",
                error: error.message,
            });
        }
    }

    /**
     * Verify user (admin only)
     * POST /api/users/:id/verify
     */
    async verifyUser(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            const user = await userService.verifyUser(id);

            return res.status(200).json({
                success: true,
                message: "User verified successfully",
                data: user,
            });
        } catch (error: any) {
            console.error("Error verifying user:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to verify user",
                error: error.message,
            });
        }
    }
}

export const userController = new UserController();
