import { Request, Response } from "express";
import { transactionService } from "../services/transactionService";
import { prisma } from "../config/database";

export class TransactionController {
    /**
     * Create a new transaction
     * POST /api/transactions
     */
    async createTransaction(req: Request, res: Response) {
        try {
            const tenantId = req.user?.id;

            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification required",
                });
            }

            const {
                propertyId,
                paymentMethod,
                paymentGateway,
                leaseDuration,
                applicationId
            } = req.body;

            // Get property details
            const property = await prisma.property.findUnique({
                where: { id: propertyId },
                include: { landlord: { select: { id: true, clerkId: true } } },
            });

            if (!property) {
                return res.status(404).json({
                    success: false,
                    message: "Property not found",
                });
            }

            if (
                property.landlordId === tenantId ||
                property.landlord?.id === tenantId ||
                property.landlord?.clerkId === tenantId
            ) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot rent or make payments on your own property",
                });
            }

            // Idempotency guard: Return existing active transaction for this application/property+tenant
            // Prevents duplicate transactions when the Pay button is clicked multiple times
            const existingTransaction = await prisma.transaction.findFirst({
                where: {
                    tenantId,
                    propertyId: property.id,
                    ...(applicationId ? { applicationId } : {}),
                    status: {
                        in: ["PENDING", "ESCROWED", "SUCCESSFUL"],
                    },
                    escrowReleased: false,
                },
                orderBy: { createdAt: "desc" },
                include: {
                    tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                    property: { select: { id: true, title: true, address: true, city: true, landlordId: true } },
                },
            });

            if (existingTransaction) {
                console.info(`[TransactionController] Returning existing transaction ${existingTransaction.id} for tenant=${tenantId} property=${property.id}`);
                return res.status(200).json({
                    success: true,
                    data: transactionService.sanitizeTransaction(existingTransaction),
                });
            }

            // Create new transaction
            const transaction = await transactionService.createTransaction({
                tenantId,
                propertyId: property.id,
                applicationId,
                rentAmount: property.pricePerYear,
                cautionFee: property.cautionFee,
                legalFee: property.legalFee,
                serviceFee: property.serviceFee,
                paymentMethod: paymentMethod || "CARD",
                paymentGateway: paymentGateway || "PAYSTACK",
                leaseDuration: leaseDuration || 12,
            });

            return res.status(201).json({
                success: true,
                data: transactionService.sanitizeTransaction(transaction),
            });
        } catch (error: any) {
            console.error("Error creating transaction:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to create transaction",
                error: error.message,
            });
        }
    }

    /**
     * Get transaction by ID
     * GET /api/transactions/:id
     */
    async getTransaction(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const transaction = await transactionService.getTransactionById(id as string);

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found",
                });
            }

            const isParty =
                transaction.tenantId === req.user?.id ||
                (transaction as any).property?.landlordId === req.user?.id ||
                req.user?.role === "ADMIN";
            if (!isParty) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }

            return res.status(200).json({
                success: true,
                data: transactionService.sanitizeTransaction(transaction),
            });
        } catch (error: any) {
            console.error("Error fetching transaction:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch transaction",
                error: error.message,
            });
        }
    }

    /**
     * Get tenant's transactions
     * GET /api/transactions/tenant/all
     */
    async getTenantTransactions(req: Request, res: Response) {
        try {
            const tenantId = req.user?.id;

            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification required",
                });
            }

            const transactions = await transactionService.getTenantTransactions(
                tenantId
            );

            return res.status(200).json({
                success: true,
                data: transactions.map((tx) => transactionService.sanitizeTransaction(tx)),
            });
        } catch (error: any) {
            console.error("Error fetching tenant transactions:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch transactions",
                error: error.message,
            });
        }
    }

    /**
     * Get landlord's transactions
     * GET /api/transactions/landlord/all
     */
    async getLandlordTransactions(req: Request, res: Response) {
        try {
            const landlordId = req.user?.id;

            if (!landlordId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification required",
                });
            }

            const transactions =
                await transactionService.getLandlordTransactions(landlordId);

            return res.status(200).json({
                success: true,
                data: transactions.map((tx) => transactionService.sanitizeTransaction(tx)),
            });
        } catch (error: any) {
            console.error("Error fetching landlord transactions:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch transactions",
                error: error.message,
            });
        }
    }

    /**
     * Update transaction status
     * PATCH /api/transactions/:id/status
     */
    async updateTransactionStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, paystackRef, flutterwaveRef } = req.body;

            const transaction = await transactionService.updateTransactionStatus(
                id as string,
                status,
                { paystackRef, flutterwaveRef }
            );

            return res.status(200).json({
                success: true,
                data: transactionService.sanitizeTransaction(transaction),
            });
        } catch (error: any) {
            console.error("Error updating transaction status:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to update transaction status",
                error: error.message,
            });
        }
    }

    /**
     * Release escrow
     * POST /api/transactions/:id/release
     */
    async releaseEscrow(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { releaseReason } = req.body;

            const transaction = await transactionService.releaseEscrow(
                id as string,
                releaseReason || "Move-in confirmed"
            );

            return res.status(200).json({
                success: true,
                data: transaction,
                message: "Escrow released successfully",
            });
        } catch (error: any) {
            console.error("Error releasing escrow:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to release escrow",
                error: error.message,
            });
        }
    }

    /**
     * Request Handover Release OTP (Tenant)
     * POST /api/transactions/:id/handover-otp
     */
    async requestHandoverOtp(req: Request, res: Response) {
        try {
            const tenantId = req.user?.id;
            if (!tenantId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const id = req.params.id as string;
            const result = await transactionService.generateHandoverOTP(id, tenantId);

            return res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    otp: result.otp,
                    expiresAt: result.expiresAt,
                },
            });
        } catch (error: any) {
            console.error("Error generating handover OTP:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to generate handover OTP"
            });
        }
    }

    /**
     * Release Escrow with OTP (Landlord validates code)
     * POST /api/transactions/:id/release-otp
     */
    async releaseEscrowWithOtp(req: Request, res: Response) {
        try {
            const landlordId = req.user?.id;
            if (!landlordId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const id = req.params.id as string;
            const { otp } = req.body;

            if (!otp) {
                return res.status(400).json({ success: false, message: "6-digit OTP code is required" });
            }

            const transaction = await transactionService.releaseEscrowWithOTP(id, otp, landlordId);

            return res.status(200).json({
                success: true,
                message: "Handover confirmed and escrow released to landlord successfully!",
                data: transaction
            });
        } catch (error: any) {
            console.error("Error releasing escrow with OTP:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to release escrow"
            });
        }
    }

    /**
     * Raise Escrow Dispute (Tenant)
     * POST /api/transactions/:id/dispute
     */
    async raiseDispute(req: Request, res: Response) {
        try {
            const tenantId = req.user?.id;
            if (!tenantId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const id = req.params.id as string;
            const { reason } = req.body;

            if (!reason) {
                return res.status(400).json({ success: false, message: "Dispute reason is required" });
            }

            const transaction = await transactionService.raiseDispute(id, tenantId, reason);

            return res.status(200).json({
                success: true,
                message: "Dispute submitted successfully. RentHub support team has locked escrow funds and will contact you within 24 hours.",
                data: transaction
            });
        } catch (error: any) {
            console.error("Error raising dispute:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to raise dispute"
            });
        }
    }

    /**
     * Get Digital Escrow Payment Receipt (Guide §10)
     * GET /api/transactions/:id/receipt
     */
    async getReceipt(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const tx = await transactionService.getTransactionById(id);
            if (!tx) return res.status(404).json({ success: false, message: "Transaction not found" });

            const isParty =
                tx.tenantId === req.user?.id ||
                (tx as any).property?.landlordId === req.user?.id ||
                req.user?.role === "ADMIN";
            if (!isParty) return res.status(403).json({ success: false, message: "Forbidden" });

            const receipt = await transactionService.generateReceipt(id);
            return res.status(200).json({ success: true, data: receipt });
        } catch (error: any) {
            console.error("Error generating receipt:", error);
            return res.status(500).json({ success: false, message: error.message || "Failed to generate receipt" });
        }
    }

    /**
     * Get Digital Tenancy Agreement (Guide §10, Deck Slide 6)
     * GET /api/transactions/:id/agreement
     */
    async getAgreement(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const tx = await transactionService.getTransactionById(id);
            if (!tx) return res.status(404).json({ success: false, message: "Transaction not found" });

            const isParty =
                tx.tenantId === req.user?.id ||
                (tx as any).property?.landlordId === req.user?.id ||
                req.user?.role === "ADMIN";
            if (!isParty) return res.status(403).json({ success: false, message: "Forbidden" });

            const agreement = await transactionService.generateTenancyAgreement(id);
            return res.status(200).json({ success: true, data: agreement });
        } catch (error: any) {
            console.error("Error generating agreement:", error);
            return res.status(500).json({ success: false, message: error.message || "Failed to generate tenancy agreement" });
        }
    }

    /**
     * Get Nigeria Tax Act 2025 Rent Relief Claim Certificate (Guide §10, Deck Slide 6)
     * GET /api/transactions/:id/tax-pack
     */
    async getTaxPack(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const tx = await transactionService.getTransactionById(id);
            if (!tx) return res.status(404).json({ success: false, message: "Transaction not found" });

            const isParty =
                tx.tenantId === req.user?.id ||
                (tx as any).property?.landlordId === req.user?.id ||
                req.user?.role === "ADMIN";
            if (!isParty) return res.status(403).json({ success: false, message: "Forbidden" });

            const taxPack = await transactionService.generateTaxReliefPack(id);
            return res.status(200).json({ success: true, data: taxPack });
        } catch (error: any) {
            console.error("Error generating tax relief pack:", error);
            return res.status(500).json({ success: false, message: error.message || "Failed to generate tax relief pack" });
        }
    }

    /**
     * Submit Landlord Handover Proof (Guide §5.3)
     * POST /api/transactions/:id/handover-proof
     */
    async submitHandoverProof(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const landlordId = req.user?.id;
            const { proofUrl, notes } = req.body;

            if (!landlordId) return res.status(401).json({ success: false, message: "Unauthorized" });
            if (!proofUrl) return res.status(400).json({ success: false, message: "Proof document or photo URL is required" });

            const updated = await transactionService.submitHandoverProof(id, landlordId, proofUrl, notes);
            return res.status(200).json({
                success: true,
                message: "Handover proof submitted successfully. Tenant has been notified with a 24-hour response window.",
                data: transactionService.sanitizeTransaction(updated),
            });
        } catch (error: any) {
            console.error("Error submitting handover proof:", error);
            return res.status(400).json({ success: false, message: error.message || "Failed to submit handover proof" });
        }
    }

    /**
     * Tenant Handover Challenge (Guide §5.3)
     * POST /api/transactions/:id/handover-challenge
     */
    async challengeHandoverProof(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const tenantId = req.user?.id;
            const { contest, reason } = req.body;

            if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const updated = await transactionService.challengeHandoverProof(id, tenantId, !!contest, reason);
            return res.status(200).json({
                success: true,
                message: contest
                    ? "Contest recorded. Transaction routed to RentHub arbitration."
                    : "Key handover confirmed. Funds released.",
                data: transactionService.sanitizeTransaction(updated),
            });
        } catch (error: any) {
            console.error("Error responding to handover proof:", error);
            return res.status(400).json({ success: false, message: error.message || "Failed to respond to handover proof" });
        }
    }

    /**
     * Submit Move-Out Condition Report (Guide §6)
     * POST /api/transactions/:id/move-out-report
     */
    async submitMoveOutReport(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const userId = req.user?.id;
            const role = req.user?.role || "TENANT";
            const { photos, notes, deductions } = req.body;

            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const updated = await transactionService.submitMoveOutReport(
                id,
                userId,
                role,
                photos || [],
                notes || "",
                deductions
            );

            return res.status(200).json({
                success: true,
                message: "Move-out condition report submitted successfully.",
                data: transactionService.sanitizeTransaction(updated),
            });
        } catch (error: any) {
            console.error("Error submitting move-out report:", error);
            return res.status(400).json({ success: false, message: error.message || "Failed to submit move-out report" });
        }
    }

    /**
     * Resolve Caution Deposit Deductions (Guide §6)
     * POST /api/transactions/:id/caution-resolve
     */
    async resolveCautionDeductions(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const tenantId = req.user?.id;
            const { accept, contestReason } = req.body;

            if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const updated = await transactionService.resolveCautionDeductions(id, tenantId, !!accept, contestReason);
            return res.status(200).json({
                success: true,
                message: accept
                    ? "Caution deposit deductions accepted. Net refund queued."
                    : "Caution deposit deductions contested. Routed to RentHub arbitration.",
                data: transactionService.sanitizeTransaction(updated),
            });
        } catch (error: any) {
            console.error("Error resolving caution deductions:", error);
            return res.status(400).json({ success: false, message: error.message || "Failed to resolve caution deductions" });
        }
    }
}

export const transactionController = new TransactionController();

