import axios from "axios";
import { prisma } from "../config/database";
import { PropertyStatus, TransactionStatus } from "@prisma/client";
import { transactionService } from "./transactionService";
import { afriExchangePayoutService } from "./afriExchangePayoutService";

const getCleanAfriExchangeUrl = () => {
    let raw = process.env.AFRIEXCHANGE_API_URL || "https://afrix-iqvq.onrender.com/api/v1";
    if (raw.includes("#")) {
        raw = raw.split("#")[0].trim();
    }
    if (raw.includes("localhost:5001")) {
        raw = "https://afrix-iqvq.onrender.com/api/v1";
    }
    return raw.replace(/\/$/, "");
};

let platformConfig = {
    financial: {
        platformCommissionRateBps: 200, // 2.0% (200 basis points)
        inspectionFeeAmount: 2000000,   // ₦20,000 in kobo
        escrowOtpExpiryHours: 48,       // 48 hours
        disputeFilingWindowDays: 7,     // 7 days
        autoRefundCancelledTransactions: true,
    },
    policies: {
        enforceLandlordWalletLinking: true,
        requireInspectionForCertifiedBadge: true,
        requireTenantPhoneVerification: true,
        autoDelistRejectedProperties: true,
    },
    gateways: {
        afriExchangeEnabled: true,
        paystackEnabled: true,
        flutterwaveEnabled: true,
        termiiEnabled: true,
    },
    support: {
        supportEmail: "admin@renthub.ng",
        disputesEmail: "disputes@renthub.ng",
        emergencyPhone: "+234 (0) 800-RENTHUB",
        maintenanceMode: false,
    },
    afriExchangeSettings: {
        defaultSettlementToken: "NT" as "NT" | "CT" | "USDT",
        autoDisburseOnOtp: true,
    },
};

export class AdminService {
    async getStats() {
        const [
            pendingVerifications,
            activeDisputes,
            totalUsers,
            totalProperties,
            escrowHeldCount,
            escrowHeldVolumeAgg,
            settledEscrowCount,
            settledEscrowVolumeAgg,
            pendingPayoutsCount,
            completedPayoutsCount,
            completedPayoutsVolumeAgg,
            completedPayoutsFeesAgg,
            actionablePayoutsCount,
            propertiesByStatus,
            usersByRole,
            agentTotal,
            agentActive,
            agentPending,
            agentStrikes,
            agentCommissionAgg,
        ] = await Promise.all([
            prisma.property.count({ where: { status: PropertyStatus.PENDING_REVIEW, deletedAt: null } }),
            prisma.transaction.count({ where: { disputed: true } }),
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.property.count({ where: { deletedAt: null } }),
            prisma.transaction.count({
                where: {
                    status: TransactionStatus.ESCROWED,
                    escrowHeld: true,
                    disputed: false,
                },
            }),
            prisma.transaction.aggregate({
                _sum: { totalAmount: true, rentAmount: true },
                where: {
                    status: TransactionStatus.ESCROWED,
                    escrowHeld: true,
                    disputed: false,
                },
            }),
            prisma.transaction.count({
                where: {
                    status: TransactionStatus.RELEASED,
                },
            }),
            prisma.transaction.aggregate({
                _sum: { totalAmount: true, rentAmount: true, platformFee: true },
                where: {
                    status: TransactionStatus.RELEASED,
                },
            }),
            prisma.landlordPayout.count({
                where: {
                    status: { in: ["PENDING", "PROCESSING"] },
                },
            }),
            prisma.landlordPayout.count({
                where: {
                    status: "COMPLETED",
                },
            }),
            prisma.landlordPayout.aggregate({
                _sum: { netAmount: true },
                where: {
                    status: "COMPLETED",
                },
            }),
            prisma.landlordPayout.aggregate({
                _sum: { platformFee: true },
                where: {
                    status: "COMPLETED",
                },
            }),
            prisma.landlordPayout.count({
                where: {
                    status: { in: ["FAILED", "SKIPPED", "PENDING"] },
                },
            }),
            prisma.property.groupBy({
                by: ["status"],
                where: { deletedAt: null },
                _count: { id: true },
            }),
            prisma.user.groupBy({
                by: ["role"],
                where: { deletedAt: null },
                _count: { id: true },
            }),
            prisma.agentProfile.count(),
            prisma.agentProfile.count({ where: { status: "ACTIVE" } }),
            prisma.agentProfile.count({ where: { status: "PENDING_REVIEW" } }),
            prisma.agentStrike.count({ where: { status: "UPHELD", strikeApplied: true } }),
            prisma.agentListing.aggregate({
                _sum: { commissionAmount: true },
                where: { status: "COMPLETED" },
            }),
        ]);

        const tenantFees = settledEscrowVolumeAgg._sum.platformFee || 0;
        const landlordFees = completedPayoutsFeesAgg._sum.platformFee || 0;
        const platformRevenueTotal = tenantFees + landlordFees;

        const totalTrackedTx = settledEscrowCount + escrowHeldCount + activeDisputes;
        const disputeRate = totalTrackedTx > 0 ? Number(((activeDisputes / totalTrackedTx) * 100).toFixed(1)) : 0;

        return {
            pendingVerifications,
            activeDisputes,
            disputeRate,
            totalUsers,
            totalProperties,
            escrowHeld: escrowHeldCount,
            escrowHeldCount,
            escrowHeldAmount: escrowHeldVolumeAgg._sum.totalAmount || escrowHeldVolumeAgg._sum.rentAmount || 0,
            settledEscrowCount,
            settledEscrowAmount: settledEscrowVolumeAgg._sum.totalAmount || settledEscrowVolumeAgg._sum.rentAmount || 0,
            pendingPayoutsCount,
            completedPayoutsCount,
            completedPayoutsAmount: completedPayoutsVolumeAgg._sum.netAmount || 0,
            actionablePayoutsCount,
            platformRevenueTotal,
            tenantFees,
            landlordFees,
            agentStats: {
                totalProfiles: agentTotal,
                activeAgents: agentActive,
                pendingReview: agentPending,
                activeStrikes: agentStrikes,
                totalCommissionPaid: agentCommissionAgg._sum.commissionAmount || 0,
            },
            propertiesSummary: propertiesByStatus.reduce((acc, curr) => {
                acc[curr.status] = curr._count.id;
                return acc;
            }, {} as Record<string, number>),
            usersSummary: usersByRole.reduce((acc, curr) => {
                acc[curr.role] = curr._count.id;
                return acc;
            }, {} as Record<string, number>),
        };
    }

    async getPendingVerifications() {
        const [
            properties,
            recentlyVerified,
            pendingReview,
            verifiedProps,
            unverifiedProps,
            verifiedLandlords,
        ] = await Promise.all([
            prisma.property.findMany({
                where: { status: PropertyStatus.PENDING_REVIEW, deletedAt: null },
                include: {
                    landlord: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            verified: true,
                            afriExchangeAccountEmail: true,
                            afriExchangeWalletAddress: true,
                        },
                    },
                    images: {
                        orderBy: { order: "asc" },
                        take: 3,
                    },
                },
                orderBy: { updatedAt: "asc" },
            }),
            prisma.property.findMany({
                where: { verified: true, deletedAt: null },
                take: 15,
                include: {
                    landlord: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            verified: true,
                            afriExchangeAccountEmail: true,
                            afriExchangeWalletAddress: true,
                        },
                    },
                    images: {
                        orderBy: { order: "asc" },
                        take: 1,
                    },
                },
                orderBy: { verifiedAt: "desc" },
            }),
            prisma.property.count({ where: { status: PropertyStatus.PENDING_REVIEW, deletedAt: null } }),
            prisma.property.count({ where: { verified: true, deletedAt: null } }),
            prisma.property.count({ where: { verified: false, deletedAt: null } }),
            prisma.user.count({ where: { role: "LANDLORD", verified: true, deletedAt: null } }),
        ]);

        return {
            properties,
            recentlyVerified,
            stats: {
                pendingReview,
                verifiedProps,
                unverifiedProps,
                verifiedLandlords,
            },
        };
    }

    async approveVerification(propertyId: string, adminId: string) {
        const property = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!property) throw new Error("Property not found");
        if (property.status !== PropertyStatus.PENDING_REVIEW) {
            throw new Error("Property is not pending review");
        }

        return prisma.property.update({
            where: { id: propertyId },
            data: {
                verified: true,
                verifiedAt: new Date(),
                verifiedBy: adminId,
                status: PropertyStatus.AVAILABLE,
            },
        });
    }

    async rejectVerification(propertyId: string, adminId: string, reason?: string) {
        const property = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!property) throw new Error("Property not found");
        if (property.status !== PropertyStatus.PENDING_REVIEW) {
            throw new Error("Property is not pending review");
        }

        return prisma.property.update({
            where: { id: propertyId },
            data: {
                verified: false,
                verifiedBy: reason ? `REJECTED:${adminId}:${reason}` : `REJECTED:${adminId}`,
                status: PropertyStatus.AVAILABLE,
            },
        });
    }

    async revokeVerification(propertyId: string, adminId: string, reason?: string) {
        const property = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!property) throw new Error("Property not found");

        return prisma.property.update({
            where: { id: propertyId },
            data: {
                verified: false,
                verifiedBy: reason ? `REVOKED:${adminId}:${reason}` : `REVOKED:${adminId}`,
            },
        });
    }

    async getDisputes() {
        const [
            disputes,
            resolvedHistory,
            disputedAgg,
            totalTransactions,
            resolvedCount,
        ] = await Promise.all([
            prisma.transaction.findMany({
                where: { disputed: true },
                include: {
                    tenant: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        },
                    },
                    property: {
                        select: {
                            id: true,
                            title: true,
                            address: true,
                            city: true,
                            landlord: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    phone: true,
                                    afriExchangeAccountEmail: true,
                                    afriExchangeWalletAddress: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { updatedAt: "desc" },
            }),
            prisma.transaction.findMany({
                where: {
                    OR: [
                        { releaseReason: { contains: "Dispute resolved" } },
                        { refundReason: { contains: "Dispute resolved" } },
                        { refunded: true },
                    ],
                },
                take: 10,
                include: {
                    tenant: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    property: {
                        select: { id: true, title: true, address: true, city: true },
                    },
                },
                orderBy: { updatedAt: "desc" },
            }),
            prisma.transaction.aggregate({
                _sum: { totalAmount: true },
                where: { disputed: true },
            }),
            prisma.transaction.count(),
            prisma.transaction.count({
                where: {
                    OR: [
                        { releaseReason: { contains: "Dispute resolved" } },
                        { refundReason: { contains: "Dispute resolved" } },
                        { refunded: true },
                    ],
                },
            }),
        ]);

        const activeDisputes = disputes.length;
        const disputedAmount = disputedAgg._sum.totalAmount || 0;
        const disputeRate = totalTransactions > 0
            ? `${((activeDisputes / totalTransactions) * 100).toFixed(1)}%`
            : "0%";

        return {
            disputes,
            resolvedHistory,
            stats: {
                activeDisputes,
                disputedAmount,
                resolvedCount,
                totalTransactions,
                disputeRate,
            },
        };
    }

    async resolveDispute(
        transactionId: string,
        action: "release" | "refund",
        adminId: string,
        note?: string
    ) {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { property: true },
        });

        if (!transaction) throw new Error("Transaction not found");
        if (!transaction.disputed) throw new Error("Transaction is not disputed");

        const adminNote = note ? ` [Admin ${adminId}: ${note}]` : "";

        if (action === "refund") {
            await transactionService.refundTransaction(
                transactionId,
                transaction.totalAmount,
                `Dispute resolved — refund to tenant${adminNote}`
            );
            return prisma.transaction.update({
                where: { id: transactionId },
                data: { disputed: false },
            });
        }

        const released = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                disputed: false,
                disputeReason: `${transaction.disputeReason || ""}${adminNote}`,
                status: TransactionStatus.RELEASED,
                escrowReleased: true,
                releaseDate: new Date(),
                releaseReason: `Dispute resolved — funds released to landlord${adminNote}`,
            },
        });

        await prisma.property.update({
            where: { id: transaction.propertyId },
            data: { status: PropertyStatus.RENTED },
        });

        // Automatically trigger landlord payout dispatch via AfriExchange
        afriExchangePayoutService.disburseLandlordPayout(transactionId).catch((err) => {
            console.error(`[AdminService] Auto-payout dispatch error on dispute release tx=${transactionId}:`, err);
        });

        return released;
    }

    async getEscrowTransactions(status?: string) {
        const where: any = {};
        if (status === "DISPUTED") {
            where.disputed = true;
        } else if (status && status !== "ALL") {
            where.status = status as TransactionStatus;
        }

        const [
            transactions,
            lockedVolumeAgg,
            releasedVolumeAgg,
            totalVolumeAgg,
            lockedCount,
            releasedCount,
            pendingCount,
            disputedCount,
            refundedCount,
        ] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: 50,
                include: {
                    property: {
                        select: {
                            id: true,
                            title: true,
                            address: true,
                            city: true,
                            landlord: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    phone: true,
                                    afriExchangeAccountEmail: true,
                                    afriExchangeWalletAddress: true,
                                },
                            },
                        },
                    },
                    tenant: {
                        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                    },
                },
            }),
            prisma.transaction.aggregate({
                _sum: { totalAmount: true, rentAmount: true },
                where: { status: TransactionStatus.ESCROWED },
            }),
            prisma.transaction.aggregate({
                _sum: { totalAmount: true, rentAmount: true },
                where: { status: TransactionStatus.RELEASED },
            }),
            prisma.transaction.aggregate({
                _sum: { totalAmount: true, rentAmount: true },
            }),
            prisma.transaction.count({ where: { status: TransactionStatus.ESCROWED } }),
            prisma.transaction.count({ where: { status: TransactionStatus.RELEASED } }),
            prisma.transaction.count({ where: { status: TransactionStatus.PENDING } }),
            prisma.transaction.count({ where: { disputed: true } }),
            prisma.transaction.count({ where: { status: TransactionStatus.REFUNDED } }),
        ]);

        // Fetch associated landlord payouts
        const txIds = transactions.map((t) => t.id);
        const payouts = await prisma.landlordPayout.findMany({
            where: { transactionId: { in: txIds } },
            select: {
                id: true,
                transactionId: true,
                status: true,
                grossAmount: true,
                netAmount: true,
                platformFee: true,
                failureReason: true,
                idempotencyKey: true,
                processedAt: true,
                createdAt: true,
            },
        });
        const payoutMap = new Map(payouts.map((p) => [p.transactionId, p]));

        const transactionsWithPayout = transactions.map((t) => ({
            ...t,
            payout: payoutMap.get(t.id) || null,
        }));

        return {
            transactions: transactionsWithPayout,
            stats: {
                totalLockedAmount: lockedVolumeAgg._sum.totalAmount || 0,
                totalReleasedAmount: releasedVolumeAgg._sum.rentAmount || releasedVolumeAgg._sum.totalAmount || 0,
                totalVolume: totalVolumeAgg._sum.totalAmount || 0,
                lockedCount,
                releasedCount,
                pendingCount,
                disputedCount,
                refundedCount,
            },
        };
    }

    async getAllProperties(status?: string) {
        const where: any = { deletedAt: null };
        if (status && status !== "ALL") {
            where.status = status as PropertyStatus;
        }

        const [properties, statusCounts, totalCount] = await Promise.all([
            prisma.property.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: 100,
                include: {
                    landlord: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            verified: true,
                            afriExchangeAccountEmail: true,
                            afriExchangeWalletAddress: true,
                        },
                    },
                    images: {
                        orderBy: { order: "asc" },
                        take: 3,
                    },
                },
            }),
            prisma.property.groupBy({
                by: ["status"],
                where: { deletedAt: null },
                _count: { id: true },
            }),
            prisma.property.count({ where: { deletedAt: null } }),
        ]);

        const countsMap = statusCounts.reduce((acc, curr) => {
            acc[curr.status] = curr._count.id;
            return acc;
        }, {} as Record<string, number>);

        return {
            properties,
            stats: {
                total: totalCount,
                available: countsMap[PropertyStatus.AVAILABLE] || 0,
                rented: countsMap[PropertyStatus.RENTED] || 0,
                underOffer: countsMap[PropertyStatus.UNDER_OFFER] || 0,
                pendingReview: countsMap[PropertyStatus.PENDING_REVIEW] || 0,
            },
        };
    }

    async testAfriExchangeConnection() {
        const baseUrl = getCleanAfriExchangeUrl();
        const apiKey = process.env.RENTHUB_AFRIEXCHANGE_API_KEY || "";
        const start = Date.now();
        try {
            const response = await axios.get(`${baseUrl}/integrations/renthub/rates`, {
                headers: {
                    "x-api-key": apiKey,
                },
                timeout: 5000,
            });
            const latencyMs = Date.now() - start;
            return {
                status: "OPERATIONAL" as const,
                latencyMs,
                timestamp: new Date().toISOString(),
                endpoint: `${baseUrl}/integrations/renthub/rates`,
                rates: response.data?.data?.rates || null,
                merchantName: process.env.AFRIEXCHANGE_LINKED_MERCHANT_NAME || "RentHub",
                merchantId: process.env.AFRIEXCHANGE_LINKED_MERCHANT_ID || null,
            };
        } catch (err: any) {
            const latencyMs = Date.now() - start;
            return {
                status: "DEGRADED" as const,
                latencyMs,
                timestamp: new Date().toISOString(),
                endpoint: `${baseUrl}/integrations/renthub/rates`,
                error:
                    (err.response?.data as { message?: string })?.message ||
                    err.message ||
                    "Could not ping AfriExchange",
                rates: {
                    NT: { token: "NT", name: "Naira Token", ngnPerToken: 1.0, tokensPerNgn: 1.0, desc: "1 NT = ₦1.00 (1:1 NGN)" },
                    CT: { token: "CT", name: "CFA Token", ngnPerToken: 2.7, tokensPerNgn: 0.37, desc: "1 CT ≈ ₦2.70 NGN" },
                    USDT: { token: "USDT", name: "Tether USD", ngnPerToken: 1500, tokensPerNgn: 0.00067, desc: "1 USDT ≈ ₦1,500 NGN" },
                },
                merchantName: process.env.AFRIEXCHANGE_LINKED_MERCHANT_NAME || "RentHub",
                merchantId: process.env.AFRIEXCHANGE_LINKED_MERCHANT_ID || null,
            };
        }
    }

    async getSettings() {
        const afriStatus = await this.testAfriExchangeConnection();
        const payoutSummary = await afriExchangePayoutService.getPayoutSummary();

        const maskKey = (key?: string) => {
            if (!key) return "Not configured";
            if (key.length <= 8) return "••••••••";
            return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
        };

        return {
            afriExchange: {
                apiUrl: getCleanAfriExchangeUrl(),
                merchantId: process.env.AFRIEXCHANGE_LINKED_MERCHANT_ID || "e1fb66f3-fef1-4129-9e8d-4d166be6c357",
                merchantName: process.env.AFRIEXCHANGE_LINKED_MERCHANT_NAME || "RentHub",
                hasApiKey: !!process.env.RENTHUB_AFRIEXCHANGE_API_KEY,
                apiKeyMasked: maskKey(process.env.RENTHUB_AFRIEXCHANGE_API_KEY),
                webhookUrl: (process.env.AFRIEXCHANGE_WEBHOOK_CALLBACK_URL || "https://renthub-4jhq.onrender.com/api/afriexchange/webhooks").split("#")[0].trim(),
                hasWebhookSecret: !!process.env.AFRIEXCHANGE_WEBHOOK_SECRET,
                defaultToken: platformConfig.afriExchangeSettings.defaultSettlementToken,
                autoDisburseOnOtp: platformConfig.afriExchangeSettings.autoDisburseOnOtp,
                connectionStatus: afriStatus.status,
                lastPingLatencyMs: afriStatus.latencyMs,
                lastPingAt: afriStatus.timestamp,
                rates: afriStatus.rates,
                payoutStats: payoutSummary,
            },
            financial: { ...platformConfig.financial },
            gateways: {
                afriExchange: {
                    enabled: platformConfig.gateways.afriExchangeEnabled,
                    name: "AfriExchange Token Escrow",
                    token: platformConfig.afriExchangeSettings.defaultSettlementToken,
                    mode: "LIVE_STABLECOIN",
                },
                paystack: {
                    enabled: platformConfig.gateways.paystackEnabled,
                    publicKeyMasked: maskKey(process.env.PAYSTACK_PUBLIC_KEY),
                    testMode: (process.env.PAYSTACK_PUBLIC_KEY || "").startsWith("pk_test_"),
                },
                flutterwave: {
                    enabled: platformConfig.gateways.flutterwaveEnabled,
                    publicKeyMasked: maskKey(process.env.FLUTTERWAVE_PUBLIC_KEY),
                    testMode: (process.env.FLUTTERWAVE_SECRET_KEY || "").includes("TEST"),
                },
                termii: {
                    enabled: platformConfig.gateways.termiiEnabled,
                    senderId: process.env.TERMII_SENDER_ID || "RentHub",
                    hasSecret: !!process.env.TERMII_API_KEY,
                },
            },
            policies: { ...platformConfig.policies },
            support: { ...platformConfig.support },
            systemInfo: {
                environment: process.env.NODE_ENV || "development",
                serverTime: new Date().toISOString(),
                nodeVersion: process.version,
                uptimeSeconds: Math.floor(process.uptime()),
            },
        };
    }

    async updateSettings(updates: any) {
        if (updates.financial) {
            platformConfig.financial = {
                ...platformConfig.financial,
                ...updates.financial,
            };
        }
        if (updates.policies) {
            platformConfig.policies = {
                ...platformConfig.policies,
                ...updates.policies,
            };
        }
        if (updates.gateways) {
            platformConfig.gateways = {
                ...platformConfig.gateways,
                ...updates.gateways,
            };
        }
        if (updates.support) {
            platformConfig.support = {
                ...platformConfig.support,
                ...updates.support,
            };
        }
        if (updates.afriExchangeSettings) {
            platformConfig.afriExchangeSettings = {
                ...platformConfig.afriExchangeSettings,
                ...updates.afriExchangeSettings,
            };
        }

        return this.getSettings();
    }
}

export const adminService = new AdminService();
