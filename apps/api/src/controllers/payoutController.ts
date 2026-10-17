import { Request, Response } from "express";
import { Prisma, PayoutStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { afriExchangePayoutService } from "../services/afriExchangePayoutService";
import { afriExchangeAccountVerificationService } from "../services/afriExchangeAccountVerificationService";

/** Helper to extract a safe error message from unknown catch values */
const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : "Unknown error";

/**
 * Controller for:
 * 1. Landlord AfriExchange wallet linking (self-service with 2FA OTP verification)
 * 2. Landlord payout history & summary
 * 3. Admin: all payouts, retry failed, stats
 */
export class PayoutController {
    // ─────────────────────────────────────────────
    // LANDLORD: Step 1 - Request 2FA OTP verification code
    // POST /api/payouts/link-verification/request
    // ─────────────────────────────────────────────
    async requestLinkVerification(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const { afriExchangeUserId, walletAddress, accountEmail, tokenType = "NT" } = req.body;
            if (!afriExchangeUserId && !walletAddress && !accountEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Provide an AfriExchange user ID, wallet address, or account email",
                });
            }

            const result = await afriExchangeAccountVerificationService.requestLinkVerification({
                afriExchangeUserId,
                walletAddress,
                accountEmail,
                tokenType,
            });

            return res.status(200).json({
                success: true,
                message: "AfriExchange verification code sent successfully",
                data: result,
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to request link verification",
            });
        }
    }

    // ─────────────────────────────────────────────
    // LANDLORD: Step 2 - Confirm 6-digit OTP code & link account
    // POST /api/payouts/link-verification/confirm
    // ─────────────────────────────────────────────
    async confirmLinkVerification(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const { requestId, code } = req.body;
            if (!requestId || !code) {
                return res.status(400).json({
                    success: false,
                    message: "requestId and verification code are required",
                });
            }

            const result = await afriExchangeAccountVerificationService.confirmLinkVerification(
                requestId,
                code
            );

            const updated = await prisma.user.update({
                where: { id: userId },
                data: {
                    afriExchangeUserId: result.user.id,
                    afriExchangeAccountEmail: result.user.email,
                    afriExchangeWalletAddress: result.wallet.blockchain_address,
                    settlementLinkedAt: new Date(),
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    afriExchangeUserId: true,
                    afriExchangeWalletAddress: true,
                    afriExchangeAccountEmail: true,
                    settlementLinkedAt: true,
                },
            });

            // Auto-queue any previously SKIPPED payouts for this landlord now that wallet is verified
            try {
                await prisma.landlordPayout.updateMany({
                    where: {
                        landlordId: userId,
                        status: "SKIPPED",
                    },
                    data: {
                        status: "PENDING",
                        failureReason: null,
                    },
                });
            } catch (autoQueueErr) {
                console.warn("[payoutController] Failed to auto-queue skipped payouts after account link:", autoQueueErr);
            }

            return res.status(200).json({
                success: true,
                message: "AfriExchange settlement account verified and linked successfully!",
                data: {
                    user: updated,
                    afriExchange: result,
                },
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to confirm verification code",
            });
        }
    }

    // ─────────────────────────────────────────────
    // LANDLORD: Unlink AfriExchange Account
    // DELETE /api/payouts/unlink-afriexchange
    // ─────────────────────────────────────────────
    async unlinkAfriExchangeAccount(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const updated = await prisma.user.update({
                where: { id: userId },
                data: {
                    afriExchangeUserId: null,
                    afriExchangeWalletAddress: null,
                    afriExchangeAccountEmail: null,
                    settlementLinkedAt: null,
                },
            });

            return res.status(200).json({
                success: true,
                message: "AfriExchange account unlinked successfully",
                data: updated,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Failed to unlink account",
                error: getErrorMessage(error),
            });
        }
    }

    // ─────────────────────────────────────────────
    // LANDLORD: Direct link (fallback/admin compatible)
    // PUT /api/payouts/link-afriexchange
    // ─────────────────────────────────────────────
    async linkAfriExchangeAccount(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const { afriExchangeUserId, afriExchangeWalletAddress, afriExchangeAccountEmail } = req.body;

            if (!afriExchangeUserId && !afriExchangeWalletAddress && !afriExchangeAccountEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Provide at least one: afriExchangeUserId, afriExchangeWalletAddress, or afriExchangeAccountEmail",
                });
            }

            const updated = await prisma.user.update({
                where: { id: userId },
                data: {
                    afriExchangeUserId: afriExchangeUserId || undefined,
                    afriExchangeWalletAddress: afriExchangeWalletAddress || undefined,
                    afriExchangeAccountEmail: afriExchangeAccountEmail || undefined,
                    settlementLinkedAt: new Date(),
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    afriExchangeUserId: true,
                    afriExchangeWalletAddress: true,
                    afriExchangeAccountEmail: true,
                    settlementLinkedAt: true,
                },
            });

            return res.status(200).json({
                success: true,
                message: "AfriExchange settlement account linked successfully. Future payouts will be sent automatically.",
                data: updated,
            });
        } catch (error: unknown) {
            console.error("Error linking AfriExchange account:", error);
            return res.status(500).json({ success: false, message: "Failed to link account", error: getErrorMessage(error) });
        }
    }

    // ─────────────────────────────────────────────
    // LANDLORD: Get my AfriExchange link status
    // GET /api/payouts/link-status
    // ─────────────────────────────────────────────
    async getAfriExchangeLinkStatus(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    afriExchangeUserId: true,
                    afriExchangeWalletAddress: true,
                    afriExchangeAccountEmail: true,
                    settlementLinkedAt: true,
                },
            });

            const linked = !!(
                user?.afriExchangeUserId ||
                user?.afriExchangeWalletAddress ||
                user?.afriExchangeAccountEmail
            );

            return res.status(200).json({
                success: true,
                data: { linked, ...user },
            });
        } catch (error: unknown) {
            return res.status(500).json({ success: false, message: "Failed to fetch link status", error: getErrorMessage(error) });
        }
    }

    // ─────────────────────────────────────────────
    // LANDLORD: Get my payouts
    // GET /api/payouts/my-payouts
    // ─────────────────────────────────────────────
    async getMyPayouts(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { afriExchangeWalletAddress: true, afriExchangeAccountEmail: true },
            });
            const isLinked = !!(user?.afriExchangeWalletAddress || user?.afriExchangeAccountEmail);

            if (isLinked) {
                // Clear stale failureReason and reset skipped payouts to PENDING
                try {
                    await prisma.landlordPayout.updateMany({
                        where: {
                            landlordId: userId,
                            status: "SKIPPED",
                            failureReason: { contains: "not linked" },
                        },
                        data: {
                            status: "PENDING",
                            failureReason: null,
                        },
                    });
                } catch (healErr) {
                    console.warn("[payoutController] Failed to auto-heal skipped payouts:", healErr);
                }
            }

            const payouts = await prisma.landlordPayout.findMany({
                where: { landlordId: userId },
                orderBy: { createdAt: "desc" },
            });

            // Enrich with transaction/property details
            const enriched = await Promise.all(
                payouts.map(async (p) => {
                    const tx = await prisma.transaction.findUnique({
                        where: { id: p.transactionId },
                        select: {
                            property: {
                                select: { title: true, address: true, city: true },
                            },
                            tenant: {
                                select: { firstName: true, lastName: true },
                            },
                            createdAt: true,
                        },
                    });
                    return { ...p, transaction: tx };
                })
            );

            return res.status(200).json({ success: true, data: enriched });
        } catch (error: unknown) {
            return res.status(500).json({ success: false, message: "Failed to fetch payouts", error: getErrorMessage(error) });
        }
    }

    // ─────────────────────────────────────────────
    // ADMIN: Get all payouts (with filters)
    // GET /api/payouts/admin/all
    // ─────────────────────────────────────────────
    async adminGetAllPayouts(req: Request, res: Response) {
        try {
            const { status, page = "1", limit = "20" } = req.query;
            const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
            const limitNum = Math.max(1, parseInt(limit as string, 10) || 20);
            const skip = (pageNum - 1) * limitNum;

            const where: Prisma.LandlordPayoutWhereInput = {};
            if (status && typeof status === "string") {
                where.status = status as PayoutStatus;
            }

            const [payouts, total] = await Promise.all([
                prisma.landlordPayout.findMany({
                    where,
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: limitNum,
                    include: {
                        landlord: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                afriExchangeUserId: true,
                                afriExchangeWalletAddress: true,
                                afriExchangeAccountEmail: true,
                            },
                        },
                    },
                }),
                prisma.landlordPayout.count({ where }),
            ]);

            return res.status(200).json({
                success: true,
                data: payouts,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum),
                },
            });
        } catch (error: unknown) {
            return res.status(500).json({ success: false, message: "Failed to fetch payouts", error: getErrorMessage(error) });
        }
    }

    // ─────────────────────────────────────────────
    // ADMIN: Get payout summary stats
    // GET /api/payouts/admin/summary
    // ─────────────────────────────────────────────
    async adminGetPayoutSummary(_req: Request, res: Response) {
        try {
            const summary = await afriExchangePayoutService.getPayoutSummary();
            return res.status(200).json({ success: true, data: summary });
        } catch (error: unknown) {
            return res.status(500).json({ success: false, message: "Failed to fetch summary", error: getErrorMessage(error) });
        }
    }

    // ─────────────────────────────────────────────
    // ADMIN: Retry a failed payout
    // POST /api/payouts/admin/:payoutId/retry
    // ─────────────────────────────────────────────
    async adminRetryPayout(req: Request, res: Response) {
        try {
            const payoutId = req.params.payoutId as string;

            await afriExchangePayoutService.retryFailedPayout(payoutId);

            const updated = await prisma.landlordPayout.findUnique({ where: { id: payoutId } });

            return res.status(200).json({
                success: true,
                message: `Payout retry triggered. New status: ${updated?.status}`,
                data: updated,
            });
        } catch (error: unknown) {
            return res.status(400).json({ success: false, message: getErrorMessage(error) });
        }
    }

    // ─────────────────────────────────────────────
    // ADMIN: Link or update landlord's AfriExchange account
    // PUT /api/payouts/admin/landlord/:landlordId/link-afriexchange
    // ─────────────────────────────────────────────
    async adminLinkLandlordAfriExchange(req: Request, res: Response) {
        try {
            const landlordId = req.params.landlordId as string;
            const { afriExchangeUserId, afriExchangeWalletAddress, afriExchangeAccountEmail } = req.body;

            const updated = await prisma.user.update({
                where: { id: landlordId },
                data: {
                    afriExchangeUserId: afriExchangeUserId || undefined,
                    afriExchangeWalletAddress: afriExchangeWalletAddress || undefined,
                    afriExchangeAccountEmail: afriExchangeAccountEmail || undefined,
                    settlementLinkedAt: new Date(),
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    afriExchangeUserId: true,
                    afriExchangeWalletAddress: true,
                    afriExchangeAccountEmail: true,
                    settlementLinkedAt: true,
                },
            });

            return res.status(200).json({
                success: true,
                message: "Landlord AfriExchange settlement account linked successfully",
                data: updated,
            });
        } catch (error: unknown) {
            return res.status(400).json({ success: false, message: getErrorMessage(error) });
        }
    }

    // ─────────────────────────────────────────────
    // ADMIN: Disburse payout for a transaction (manual or OTP released)
    // POST /api/payouts/admin/disburse/:transactionId
    // ─────────────────────────────────────────────
    async adminDisbursePayout(req: Request, res: Response) {
        try {
            const transactionId = req.params.transactionId as string;
            await afriExchangePayoutService.disburseLandlordPayout(transactionId);

            const idempotencyKey = `RENTHUB-ESCROW-${transactionId}`;
            const payout = await prisma.landlordPayout.findUnique({
                where: { idempotencyKey },
                include: { landlord: true },
            });

            return res.status(200).json({
                success: true,
                message: `Payout disburse processed. Status: ${payout?.status}`,
                data: payout,
            });
        } catch (error: unknown) {
            return res.status(400).json({ success: false, message: getErrorMessage(error) });
        }
    }

    // ─────────────────────────────────────────────
    // ADMIN: Get single payout detail
    // GET /api/payouts/admin/:payoutId
    // ─────────────────────────────────────────────
    async adminGetPayoutDetail(req: Request, res: Response) {
        try {
            const payoutId = req.params.payoutId as string;

            const payout = await prisma.landlordPayout.findUnique({
                where: { id: payoutId },
                include: {
                    landlord: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            afriExchangeUserId: true,
                            afriExchangeWalletAddress: true,
                            afriExchangeAccountEmail: true,
                        },
                    },
                },
            });

            if (!payout) {
                return res.status(404).json({ success: false, message: "Payout not found" });
            }

            const transaction = await prisma.transaction.findUnique({
                where: { id: payout.transactionId },
                include: {
                    property: { select: { id: true, title: true, address: true, city: true } },
                    tenant: { select: { firstName: true, lastName: true, email: true, phone: true } },
                },
            });

            return res.status(200).json({ success: true, data: { ...payout, transaction } });
        } catch (error: unknown) {
            return res.status(500).json({ success: false, message: "Failed to fetch payout", error: getErrorMessage(error) });
        }
    }
}

export const payoutController = new PayoutController();
