import { prisma } from "../config/database";
import { Transaction, TransactionStatus } from "@prisma/client";
import { smsService } from "./smsService";
import crypto from "crypto";

export class TransactionService {
    /**
     * Calculate platform fee (2% of annual rent)
     */
    calculatePlatformFee(rentAmount: number): number {
        return Math.round(rentAmount * 0.02);
    }

    /**
     * Calculate total transaction amount
     */
    calculateTotalAmount(data: {
        rentAmount: number;
        cautionFee: number;
        legalFee: number;
        serviceFee?: number;
    }): { platformFee: number; totalAmount: number } {
        const platformFee = this.calculatePlatformFee(data.rentAmount);
        const totalAmount =
            data.rentAmount +
            data.cautionFee +
            data.legalFee +
            (data.serviceFee || 0) +
            platformFee;

        return { platformFee, totalAmount };
    }

    /**
     * Create a new transaction
     */
    async createTransaction(data: {
        tenantId: string;
        propertyId: string;
        rentAmount: number;
        cautionFee: number;
        legalFee: number;
        serviceFee?: number;
        paymentMethod: string;
        paymentGateway: string;
        leaseDuration?: number;
        applicationId?: string;
    }): Promise<Transaction> {
        const { platformFee, totalAmount } = this.calculateTotalAmount({
            rentAmount: data.rentAmount,
            cautionFee: data.cautionFee,
            legalFee: data.legalFee,
            serviceFee: data.serviceFee,
        });

        const transaction = await prisma.transaction.create({
            data: {
                tenantId: data.tenantId,
                propertyId: data.propertyId,
                applicationId: data.applicationId,
                rentAmount: data.rentAmount,
                cautionFee: data.cautionFee,
                legalFee: data.legalFee,
                serviceFee: data.serviceFee || 0,
                platformFee,
                totalAmount,
                paymentMethod: data.paymentMethod as any,
                paymentGateway: data.paymentGateway as any,
                status: TransactionStatus.PENDING,
                leaseDuration: data.leaseDuration || 12,
                escrowHeld: false,
            },
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
                        landlordId: true,
                    },
                },
            },
        });

        return transaction;
    }

    /**
     * Get transaction by ID
     */
    async getTransactionById(id: string): Promise<Transaction | null> {
        return await prisma.transaction.findUnique({
            where: { id },
            include: {
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                    },
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                        state: true,
                        pricePerYear: true,
                        images: {
                            take: 1,
                            where: { isPrimary: true },
                        },
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
        });
    }

    /**
     * Update transaction status
     */
    async updateTransactionStatus(
        id: string,
        status: TransactionStatus,
        metadata?: {
            paystackRef?: string;
            flutterwaveRef?: string;
        }
    ): Promise<Transaction> {
        const updateData: any = { status };

        // If payment is successful, mark as escrowed
        if (status === TransactionStatus.SUCCESSFUL) {
            updateData.escrowHeld = true;
            updateData.status = TransactionStatus.ESCROWED;

            // Also update property status to RENTED
            const transaction = await prisma.transaction.findUnique({
                where: { id },
                select: { propertyId: true }
            });

            if (transaction) {
                await prisma.property.update({
                    where: { id: transaction.propertyId },
                    data: { status: "RENTED" } // Using string literal to match enum
                });
            }
        }

        // Add payment gateway references
        if (metadata?.paystackRef) {
            updateData.paystackRef = metadata.paystackRef;
        }
        if (metadata?.flutterwaveRef) {
            updateData.flutterwaveRef = metadata.flutterwaveRef;
        }

        return await prisma.transaction.update({
            where: { id },
            data: updateData,
        });
    }

    /**
     * Release escrow to landlord
     */
    async releaseEscrow(
        id: string,
        releaseReason: string
    ): Promise<Transaction> {
        return await prisma.transaction.update({
            where: { id },
            data: {
                status: TransactionStatus.RELEASED,
                escrowReleased: true,
                releaseDate: new Date(),
                releaseReason,
            },
        });
    }

    /**
     * Get tenant transactions
     */
    async getTenantTransactions(tenantId: string): Promise<Transaction[]> {
        return await prisma.transaction.findMany({
            where: { tenantId },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                        images: {
                            take: 1,
                            where: { isPrimary: true },
                        },
                        reviews: {
                            where: { reviewerId: tenantId },
                            select: { id: true, reviewerId: true }
                        }
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    /**
     * Get landlord transactions (for properties they own)
     */
    async getLandlordTransactions(landlordId: string): Promise<Transaction[]> {
        return await prisma.transaction.findMany({
            where: {
                property: {
                    landlordId,
                },
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                    },
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                        images: {
                            take: 1,
                            where: { isPrimary: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    /**
     * Refund transaction
     */
    async refundTransaction(
        id: string,
        refundAmount: number,
        refundReason: string
    ): Promise<Transaction> {
        return await prisma.transaction.update({
            where: { id },
            data: {
                status: TransactionStatus.REFUNDED,
                refunded: true,
                refundAmount,
                refundDate: new Date(),
                refundReason,
                escrowReleased: true,
            },
        });
    }

    /**
     * Stage 6: Generate Handover Release OTP for Tenant
     */
    async generateHandoverOTP(transactionId: string, tenantId: string): Promise<{ message: string; otp: string; expiresAt: Date }> {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { tenant: true }
        });

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        if (transaction.tenantId !== tenantId) {
            throw new Error("Unauthorized: Only the tenant can request the handover OTP");
        }

        if (transaction.status !== TransactionStatus.ESCROWED && transaction.status !== TransactionStatus.SUCCESSFUL) {
            throw new Error("Escrow must be funded before generating handover OTP");
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                releaseOtp: otp,
                otpExpiresAt: expiresAt
            }
        });

        // Send SMS to tenant
        if (transaction.tenant.phone) {
            const smsMessage = `Your RentHub Key Handover OTP is: ${otp}. Give this code to the landlord ONLY after physically inspecting keys and house condition.`;
            await smsService.sendSms(transaction.tenant.phone, smsMessage).catch(console.error);
        }

        return {
            message: "Handover OTP generated and sent to your registered phone number",
            otp,
            expiresAt
        };
    }

    /**
     * Stage 6: Release Escrow via Tenant Handover OTP Verification
     */
    async releaseEscrowWithOTP(transactionId: string, otp: string, landlordId: string): Promise<Transaction> {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { property: true }
        });

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        if (transaction.property.landlordId !== landlordId) {
            throw new Error("Unauthorized: You do not own this property");
        }

        if (transaction.disputed) {
            throw new Error("Transaction is locked due to an active dispute");
        }

        if (transaction.escrowReleased || transaction.status === TransactionStatus.RELEASED) {
            throw new Error("Escrow has already been released for this transaction");
        }

        if (!transaction.releaseOtp || transaction.releaseOtp !== otp) {
            throw new Error("Invalid Handover Release OTP code");
        }

        if (transaction.otpExpiresAt && transaction.otpExpiresAt < new Date()) {
            throw new Error("Handover Release OTP code has expired. Tenant must request a new OTP.");
        }

        // Complete release & update property to RENTED
        const released = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: TransactionStatus.RELEASED,
                escrowReleased: true,
                releaseDate: new Date(),
                releaseReason: "Handover confirmed via Tenant OTP"
            }
        });

        await prisma.property.update({
            where: { id: transaction.propertyId },
            data: { status: "RENTED" }
        });

        return released;
    }

    /**
     * Raise dispute on Escrow
     */
    async raiseDispute(transactionId: string, tenantId: string, reason: string): Promise<Transaction> {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        if (transaction.tenantId !== tenantId) {
            throw new Error("Unauthorized: Only the tenant can raise a dispute");
        }

        return await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                disputed: true,
                disputeReason: reason
            }
        });
    }
}

export const transactionService = new TransactionService();
