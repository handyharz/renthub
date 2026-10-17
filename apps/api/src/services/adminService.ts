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
            escrowHeld,
        ] = await Promise.all([
            prisma.property.count({ where: { status: PropertyStatus.PENDING_REVIEW } }),
            prisma.transaction.count({ where: { disputed: true } }),
            prisma.user.count(),
            prisma.property.count({ where: { deletedAt: null } }),
            prisma.transaction.count({
                where: {
                    status: TransactionStatus.ESCROWED,
                    escrowHeld: true,
                    disputed: false,
                },
            }),
        ]);

        return {
            pendingVerifications,
            activeDisputes,
            totalUsers,
            totalProperties,
            escrowHeld,
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
        if (status && status !== "ALL") {
            where.status = status as TransactionStatus;
        }

        const [transactions, totalEscrowVolume, lockedCount, releasedCount, disputedCount] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: 50,
                include: {
                    property: {
                        select: { id: true, title: true, address: true, city: true },
                    },
                    tenant: {
                        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                    },
                },
            }),
            prisma.transaction.aggregate({
                _sum: { totalAmount: true },
                where: { status: TransactionStatus.ESCROWED },
            }),
            prisma.transaction.count({ where: { status: TransactionStatus.ESCROWED } }),
            prisma.transaction.count({ where: { status: TransactionStatus.RELEASED } }),
            prisma.transaction.count({ where: { disputed: true } }),
        ]);

        return {
            transactions,
            stats: {
                totalLockedAmount: totalEscrowVolume._sum.totalAmount || 0,
                lockedCount,
                releasedCount,
                disputedCount,
            },
        };
    }

    async getAllProperties(status?: string) {
        const where: any = { deletedAt: null };
        if (status && status !== "ALL") {
            where.status = status as PropertyStatus;
        }

        return prisma.property.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 50,
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
                    },
                },
                images: {
                    orderBy: { order: "asc" },
                    take: 1,
                },
            },
        });
    }
}

export const adminService = new AdminService();
