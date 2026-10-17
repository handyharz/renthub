import { prisma } from "../config/database";
import { PropertyStatus, TransactionStatus } from "@prisma/client";
import { transactionService } from "./transactionService";

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
            actionablePayoutsCount,
            propertiesByStatus,
            usersByRole,
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
                _sum: { totalAmount: true, rentAmount: true },
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
        ]);

        return {
            pendingVerifications,
            activeDisputes,
            totalUsers,
            totalProperties,
            escrowHeld: escrowHeldCount,
            escrowHeldCount,
            escrowHeldAmount: escrowHeldVolumeAgg._sum.totalAmount || escrowHeldVolumeAgg._sum.rentAmount || 0,
            settledEscrowCount,
            settledEscrowAmount: settledEscrowVolumeAgg._sum.rentAmount || settledEscrowVolumeAgg._sum.totalAmount || 0,
            pendingPayoutsCount,
            completedPayoutsCount,
            completedPayoutsAmount: completedPayoutsVolumeAgg._sum.netAmount || 0,
            actionablePayoutsCount,
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
        return prisma.property.findMany({
            where: { status: PropertyStatus.PENDING_REVIEW },
            include: {
                landlord: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        verified: true,
                    },
                },
                images: {
                    orderBy: { order: "asc" },
                    take: 3,
                },
            },
            orderBy: { updatedAt: "asc" },
        });
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

    async getDisputes() {
        return prisma.transaction.findMany({
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
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });
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
}

export const adminService = new AdminService();
