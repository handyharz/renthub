import { Request, Response, NextFunction } from "express";
import { createClerkClient, verifyToken } from "@clerk/backend";

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string; // Clerk user ID
                sessionId: string;
            };
            user?: {
                id: string; // Our database user ID
                clerkId: string;
                email: string | null;
                phone: string;
                firstName: string;
                lastName: string;
                role: string;
            };
        }
    }
}

/**
 * Middleware to verify Clerk JWT token
 * Extracts user info from the token and attaches to req.auth
 */
export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No authorization token provided",
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token with Clerk
        try {
            // verifyToken is the standard way to verify the Bearer JWT in @clerk/backend
            const payload = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
            });

            if (!payload) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired token",
                });
            }

            const clerkUserId = payload.sub;

            // Fetch user from DB to attach to req.user
            const { prisma: dbPrisma } = require("../config/database");
            const user = await dbPrisma.user.findUnique({
                where: { clerkId: clerkUserId },
            });

            // Attach auth info to request
            req.auth = {
                userId: clerkUserId,
                sessionId: payload.sid as string || "",
            };

            if (user) {
                if (user.status === "SUSPENDED" || user.status === "BANNED") {
                    return res.status(403).json({
                        success: false,
                        message: `Your account is ${user.status.toLowerCase()}. Access denied.`,
                    });
                }

                req.user = {
                    id: user.id,
                    clerkId: user.clerkId,
                    email: user.email,
                    phone: user.phone,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                };
            }

            next();
        } catch (clerkError: any) {
            console.error("Clerk verification error:", clerkError.message || clerkError);
            return res.status(401).json({
                success: false,
                message: "Token verification failed",
                error: clerkError.message,
            });
        }
    } catch (error: any) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Authentication error",
            error: error.message,
        });
    }
}

/**
 * Middleware to check if user has a specific role
 */
export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions",
            });
        }

        next();
    };
}

/**
 * Optional auth middleware - doesn't fail if no token
 * Useful for endpoints that work with or without auth
 */
export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        // No token provided, continue without auth
        return next();
    }

    try {
        const token = authHeader.substring(7);
        const session = await clerkClient.sessions.verifySession(token, token);

        if (session) {
            req.auth = {
                userId: session.userId,
                sessionId: session.id,
            };
        }
    } catch (error) {
        // Token invalid, but we don't fail - just continue without auth
        console.warn("Optional auth failed:", error);
    }

    next();
}
