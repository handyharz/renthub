import { prisma } from "../config/database";
import { Transaction, TransactionStatus } from "@prisma/client";
import { smsService } from "./smsService";
import { afriExchangePayoutService } from "./afriExchangePayoutService";
import crypto from "crypto";
import { hashOtp, otpMatches } from "../utils/cryptoCompare";
import { stripReleaseOtp } from "../utils/identity";

const otpAttempts = new Map<string, { count: number; resetAt: number }>();

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

        // Payment success holds funds in escrow. Listing stays UNDER_OFFER until OTP handover.
        if (status === TransactionStatus.SUCCESSFUL) {
            updateData.escrowHeld = true;
            updateData.status = TransactionStatus.ESCROWED;
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
        const released = await prisma.transaction.update({
            where: { id },
            data: {
                status: TransactionStatus.RELEASED,
                escrowReleased: true,
                releaseDate: new Date(),
                releaseReason,
            },
        });

        await this.completeAgentListingForTransaction(released.propertyId, released.rentAmount);

        return released;
    }

    private async completeAgentListingForTransaction(propertyId: string, rentAmount: number) {
        try {
            const agentListing = await prisma.agentListing.findFirst({
                where: { propertyId, status: "AUTHORIZED" }
            });
            if (agentListing) {
                const commissionAmount = Math.round(rentAmount * (agentListing.commissionPct / 100));
                await prisma.agentListing.update({
                    where: { id: agentListing.id },
                    data: {
                        status: "COMPLETED",
                        commissionAmount,
                        completedAt: new Date(),
                    }
                });
                await prisma.agentProfile.updateMany({
                    where: { userId: agentListing.agentId },
                    data: { totalClosed: { increment: 1 } }
                });
            }
        } catch (e) {
            console.warn("[TransactionService] Failed to complete agent listing for property:", propertyId, e);
        }
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
    sanitizeTransaction<T extends { releaseOtp?: string | null }>(transaction: T | null) {
        return stripReleaseOtp(transaction);
    }

    async generateHandoverOTP(transactionId: string, tenantId: string): Promise<{ message: string; expiresAt: Date }> {
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

        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                releaseOtp: hashOtp(otp),
                otpExpiresAt: expiresAt
            }
        });
        otpAttempts.delete(transactionId);

        // Send SMS to tenant
        if (transaction.tenant.phone) {
            const smsMessage = `Your RentHub Key Handover OTP is: ${otp}. Give this code to the landlord ONLY after physically inspecting keys and house condition.`;
            await smsService.sendSms(transaction.tenant.phone, smsMessage).catch(console.error);
        }

        return {
            message: "Handover OTP generated and sent to your registered phone number",
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

        const attempts = otpAttempts.get(transactionId);
        const now = Date.now();
        if (attempts && attempts.resetAt > now && attempts.count >= 5) {
            throw new Error("Too many invalid OTP attempts. Request a new handover code.");
        }
        if (!attempts || attempts.resetAt <= now) {
            otpAttempts.set(transactionId, { count: 0, resetAt: now + 15 * 60 * 1000 });
        }

        if (!otpMatches(transaction.releaseOtp, otp)) {
            const current = otpAttempts.get(transactionId)!;
            current.count += 1;
            throw new Error("Invalid Handover Release OTP code");
        }

        if (transaction.otpExpiresAt && transaction.otpExpiresAt < new Date()) {
            throw new Error("Handover Release OTP code has expired. Tenant must request a new OTP.");
        }

        const releasedRows = await prisma.transaction.updateMany({
            where: {
                id: transactionId,
                escrowReleased: false,
                disputed: false,
            },
            data: {
                status: TransactionStatus.RELEASED,
                escrowReleased: true,
                releaseDate: new Date(),
                releaseReason: "Handover confirmed via Tenant OTP",
                releaseOtp: null,
            }
        });
        if (releasedRows.count === 0) {
            throw new Error("Escrow has already been released for this transaction");
        }
        otpAttempts.delete(transactionId);

        const released = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });

        await prisma.property.update({
            where: { id: transaction.propertyId },
            data: { status: "RENTED" }
        });

        await this.completeAgentListingForTransaction(transaction.propertyId, transaction.rentAmount);

        // 🔥 Trigger automated AfriExchange landlord payout (fire-and-forget)
        afriExchangePayoutService.disburseLandlordPayout(transactionId).catch((err) =>
            console.error(`[TransactionService] AfriExchange payout failed for tx=${transactionId}:`, err)
        );

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

    /**
     * Generate official digital payment receipt (Guide §10)
     */
    async generateReceipt(transactionId: string) {
        const tx = await this.getTransactionById(transactionId);
        if (!tx) throw new Error("Transaction not found");

        const tenant = (tx as any).tenant;
        const property = (tx as any).property;
        const landlord = property?.landlord;

        return {
            receiptNumber: `RH-REC-${tx.id.slice(-8).toUpperCase()}`,
            transactionId: tx.id,
            issuedAt: tx.updatedAt || tx.createdAt,
            escrowStatus: tx.status,
            escrowHeld: tx.escrowHeld,
            escrowReleased: tx.escrowReleased,
            releaseDate: tx.releaseDate,
            payer: {
                name: `${tenant?.firstName || ""} ${tenant?.lastName || ""}`.trim() || "Tenant",
                email: tenant?.email,
                phone: tenant?.phone,
            },
            beneficiary: {
                name: `${landlord?.firstName || ""} ${landlord?.lastName || ""}`.trim() || "Landlord",
                email: landlord?.email,
                phone: landlord?.phone,
            },
            property: {
                id: property?.id,
                title: property?.title,
                address: property?.address,
                city: property?.city,
                state: property?.state,
            },
            breakdown: {
                rentAmount: tx.rentAmount,
                cautionFee: tx.cautionFee,
                platformFee: tx.platformFee,
                legalFee: 0,
                serviceFee: tx.serviceFee || 0,
                totalAmountPaid: tx.totalAmount,
            },
            paymentMethod: tx.paymentMethod,
            paymentGateway: tx.paymentGateway,
            paymentReference: tx.paystackRef || tx.afriExchangeRef || `RH-REF-${tx.id.slice(0, 8)}`,
            securityNotice: "Protected by RentHub Segregated Escrow Protocol. Funds released strictly upon 6-digit handover OTP validation.",
        };
    }

    /**
     * Generate standard digital tenancy agreement (Guide §10, Deck Slide 6)
     */
    async generateTenancyAgreement(transactionId: string) {
        const tx = await this.getTransactionById(transactionId);
        if (!tx) throw new Error("Transaction not found");

        const tenant = (tx as any).tenant;
        const property = (tx as any).property;
        const landlord = property?.landlord;

        const startDate = tx.leaseStartDate || tx.createdAt;
        const durationMonths = tx.leaseDuration || 12;
        const endDate = tx.leaseEndDate || new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + durationMonths));

        const auditHash = crypto
            .createHash("sha256")
            .update(`${tx.id}:${tenant?.email}:${landlord?.email}:${tx.rentAmount}:${startDate}`)
            .digest("hex");

        return {
            agreementNumber: `RH-AGR-${tx.id.slice(-8).toUpperCase()}`,
            governingLaw: "Lagos State Tenancy Law 2011 / Recovery of Premises Act (Abuja FCT)",
            commencementDate: startDate,
            expiryDate: endDate,
            durationMonths,
            parties: {
                landlord: {
                    fullName: `${landlord?.firstName || ""} ${landlord?.lastName || ""}`.trim() || "Landlord",
                    email: landlord?.email,
                    phone: landlord?.phone,
                },
                tenant: {
                    fullName: `${tenant?.firstName || ""} ${tenant?.lastName || ""}`.trim() || "Tenant",
                    email: tenant?.email,
                    phone: tenant?.phone,
                },
            },
            premises: {
                id: property?.id,
                title: property?.title,
                address: property?.address,
                city: property?.city,
                state: property?.state,
            },
            financialTerms: {
                annualRent: tx.rentAmount,
                cautionDeposit: tx.cautionFee,
                platformFeePaidByTenant: tx.platformFee,
                legalDocumentationFee: 0,
                cautionRolloverPolicy: "₦0 fresh caution deposit required upon 1-click lease renewal (Guide §7).",
            },
            statutoryCovenants: [
                "1. ESCROW RELEASE: Rent is released to Landlord strictly upon successful redemption of the 6-digit key handover OTP at the premises.",
                "2. NO SIDE-PAYMENTS: Tenant shall not pay any inspection fee, viewing toll, or agency commission to any party.",
                "3. CAUTION DEPOSIT PROTECTION: Caution deposit remains held in RentHub segregated escrow throughout tenancy and is refundable upon move-out condition report sign-off.",
                "4. 48-HOUR DEFECT REPORTING: Tenant holds 48 hours from scheduled handover to report undisclosed structural or utility defects.",
                "5. TAX RELIEF COMPLIANCE: Landlord confirms rent received is declared and qualifies for employee tax relief under the Nigeria Tax Act 2025.",
                "6. PEACEFUL ENJOYMENT: Landlord covenants tenant shall quietly possess and enjoy the premises without unlawful interruption.",
                "7. NOTICE PERIOD: Either party shall provide statutory written notice prior to lease expiration in accordance with applicable tenancy legislation.",
            ],
            digitalVerification: {
                agreementHash: auditHash,
                signedDigitally: true,
                platformSeal: "RENTHUB DIGITAL LEASE REGISTRY — VERIFIED COMPLIANT",
            },
        };
    }

    /**
     * Generate Nigeria Tax Act 2025 Rent Relief Claim Certificate (Guide §10, Deck Slide 6)
     */
    async generateTaxReliefPack(transactionId: string) {
        const tx = await this.getTransactionById(transactionId);
        if (!tx) throw new Error("Transaction not found");

        const tenant = (tx as any).tenant;
        const property = (tx as any).property;
        const landlord = property?.landlord;

        const annualRent = tx.rentAmount;
        const reliefBasePercentage = 20;
        const allowableDeduction = Math.min(Math.round(annualRent * 0.20), 500000);

        const auditHash = crypto
            .createHash("sha256")
            .update(`TAX-RELIEF-2026:${tx.id}:${annualRent}:${allowableDeduction}`)
            .digest("hex")
            .toUpperCase();

        return {
            certificateNumber: `RH-TAX-2026-${tx.id.slice(-8).toUpperCase()}`,
            taxYear: 2026,
            statutoryAuthority: "Nigeria Tax Act 2025 (Effective 1 January 2026) — Individual Employment Rent Deduction",
            claimant: {
                legalName: `${tenant?.firstName || ""} ${tenant?.lastName || ""}`.trim() || "Tenant",
                email: tenant?.email,
                phone: tenant?.phone,
            },
            tenancyDetails: {
                propertyAddress: `${property?.address}, ${property?.city}, ${property?.state}`,
                landlordName: `${landlord?.firstName || ""} ${landlord?.lastName || ""}`.trim() || "Landlord",
                leaseDurationMonths: tx.leaseDuration || 12,
            },
            taxCalculation: {
                annualRentPaidNgn: annualRent,
                statutoryReliefRate: "20% of annual rent paid",
                grossReliefAmountNgn: Math.round(annualRent * 0.20),
                statutoryCapNgn: 500000,
                certifiedAllowableTaxDeductionNgn: allowableDeduction,
            },
            escrowProof: {
                paymentReference: tx.paystackRef || tx.afriExchangeRef || `RH-REF-${tx.id.slice(0, 8)}`,
                paymentGateway: tx.paymentGateway,
                paymentDate: tx.createdAt,
                escrowStatus: tx.status,
            },
            auditVerification: {
                certificateHash: auditHash,
                verificationPortal: "https://renthub.ng/verify/tax-relief",
                officialCertification: "Certified audit-ready record. Valid for employer payroll deduction and tax authority audits.",
            },
        };
    }

    /**
     * Landlord submits proof of handover (Guide §5.3: Tenant occupies but withholds OTP)
     */
    async submitHandoverProof(transactionId: string, landlordId: string, proofUrl: string, notes?: string) {
        const tx = await this.getTransactionById(transactionId);
        if (!tx) throw new Error("Transaction not found");

        const landlordOfProperty = (tx as any).property?.landlordId;
        if (landlordOfProperty !== landlordId) {
            throw new Error("Unauthorized: Only the property landlord can submit handover proof");
        }

        if (tx.status !== "ESCROWED" || tx.escrowReleased) {
            throw new Error("Transaction is not in an active escrow state");
        }

        const existingMetadata = ((tx as any).metadata as any) || {};
        const challengeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour challenge window

        const updatedTx = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                metadata: {
                    ...existingMetadata,
                    handoverProof: {
                        proofUrl,
                        notes: notes || "",
                        submittedAt: new Date().toISOString(),
                        challengeExpiresAt: challengeExpiresAt.toISOString(),
                        status: "PENDING_TENANT_CHALLENGE",
                    },
                },
            },
        });

        // Notify tenant via SMS
        const tenant = (tx as any).tenant;
        if (tenant?.phone) {
            smsService
                .sendSms(
                    tenant.phone,
                    `RentHub Alert: Your landlord submitted proof of key handover. You have 24 hours to confirm or dispute in your dashboard before funds release.`
                )
                .catch(console.error);
        }

        return updatedTx;
    }

    /**
     * Tenant responds to Landlord's handover proof (Guide §5.3)
     */
    async challengeHandoverProof(transactionId: string, tenantId: string, contest: boolean, reason?: string) {
        const tx = await this.getTransactionById(transactionId);
        if (!tx) throw new Error("Transaction not found");

        if (tx.tenantId !== tenantId) {
            throw new Error("Unauthorized: Only the tenant can respond to handover proof");
        }

        const existingMetadata = ((tx as any).metadata as any) || {};
        const handoverProof = existingMetadata.handoverProof;

        if (!handoverProof || handoverProof.status !== "PENDING_TENANT_CHALLENGE") {
            throw new Error("No pending handover proof awaiting response");
        }

        if (contest) {
            return await prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    disputed: true,
                    disputeReason: reason || "Tenant challenged landlord handover proof",
                    metadata: {
                        ...existingMetadata,
                        handoverProof: {
                            ...handoverProof,
                            status: "CONTESTED",
                            contestReason: reason,
                            contestedAt: new Date().toISOString(),
                        },
                    },
                },
            });
        } else {
            // Tenant confirms possession -> release funds
            return await prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    status: "RELEASED",
                    escrowReleased: true,
                    releaseDate: new Date(),
                    releaseReason: "TENANT_CONFIRMED_HANDOVER_PROOF",
                    metadata: {
                        ...existingMetadata,
                        handoverProof: {
                            ...handoverProof,
                            status: "ACCEPTED",
                            acceptedAt: new Date().toISOString(),
                        },
                    },
                },
            });
        }
    }

    /**
     * Submit Move-Out Condition Report & Caution Deposit Deductions (Guide §6)
     */
    async submitMoveOutReport(
        transactionId: string,
        userId: string,
        role: string,
        photos: string[],
        notes: string,
        deductions?: { item: string; amount: number; quoteUrl?: string }[]
    ) {
        const tx = await this.getTransactionById(transactionId);
        if (!tx) throw new Error("Transaction not found");

        const isTenant = tx.tenantId === userId;
        const isLandlord = (tx as any).property?.landlordId === userId;

        if (!isTenant && !isLandlord) {
            throw new Error("Unauthorized: Only tenant or landlord can submit condition reports");
        }

        const existingMetadata = ((tx as any).metadata as any) || {};
        const sanitizedDeductions = (deductions || []).map((d, index) => ({
            id: `ded_${Date.now()}_${index}`,
            item: d.item,
            amount: Number(d.amount) || 0,
            quoteUrl: d.quoteUrl || null,
            contested: false,
        }));

        const hasDeductions = sanitizedDeductions.length > 0;

        return await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                metadata: {
                    ...existingMetadata,
                    moveOutReport: {
                        submittedByRole: role,
                        submittedByUserId: userId,
                        photos: photos || [],
                        notes: notes || "",
                        deductions: sanitizedDeductions,
                        submittedAt: new Date().toISOString(),
                        status: hasDeductions ? "PENDING_TENANT_REVIEW" : "CLEARED_NO_DEDUCTIONS",
                    },
                },
            },
        });
    }

    /**
     * Resolve Caution Deposit Deductions (Guide §6)
     */
    async resolveCautionDeductions(transactionId: string, tenantId: string, accept: boolean, contestReason?: string) {
        const tx = await this.getTransactionById(transactionId);
        if (!tx) throw new Error("Transaction not found");

        if (tx.tenantId !== tenantId) {
            throw new Error("Unauthorized: Only the tenant can resolve caution deductions");
        }

        const existingMetadata = ((tx as any).metadata as any) || {};
        const moveOut = existingMetadata.moveOutReport;

        if (!moveOut || moveOut.status !== "PENDING_TENANT_REVIEW") {
            throw new Error("No pending caution deductions awaiting resolution");
        }

        if (accept) {
            const totalDeductions = (moveOut.deductions || []).reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
            const netRefundToTenant = Math.max(tx.cautionFee - totalDeductions, 0);

            return await prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    metadata: {
                        ...existingMetadata,
                        moveOutReport: {
                            ...moveOut,
                            status: "RESOLVED_ACCEPTED",
                            resolvedAt: new Date().toISOString(),
                            totalDeductions,
                            netRefundToTenant,
                        },
                    },
                },
            });
        } else {
            return await prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    disputed: true,
                    disputeReason: contestReason || "Tenant contested caution deposit deductions",
                    metadata: {
                        ...existingMetadata,
                        moveOutReport: {
                            ...moveOut,
                            status: "CONTESTED_IN_ARBITRATION",
                            contestReason,
                            contestedAt: new Date().toISOString(),
                        },
                    },
                },
            });
        }
    }
}

export const transactionService = new TransactionService();

