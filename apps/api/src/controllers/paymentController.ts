import { Request, Response } from "express";
import { TransactionStatus } from "@prisma/client";
import { paymentService } from "../services/paymentService";
import { transactionService } from "../services/transactionService";
import { afriExchangePaymentService } from "../services/afriExchangePaymentService";
import { anchorService } from "../services/anchorService";
import { prisma } from "../config/database";
import { paidKoboMeetsExpected, afriExchangePaidMeetsExpected } from "../utils/moneyRail";
import { isWebhookTimestampFresh } from "../utils/webhookSecurity";
import { propertyService } from "../services/propertyService";

export class PaymentController {
    /**
     * Initialize payment with Paystack
     * POST /api/payments/initialize
     */
    async initializePayment(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { transactionId, callbackUrl } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification required",
                });
            }

            // Get transaction
            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId },
                include: {
                    tenant: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    property: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found",
                });
            }

            // Verify user is the tenant
            if (userId !== transaction.tenantId) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: You are not the tenant of this transaction",
                });
            }

            // Generate payment reference
            const reference = paymentService.generateReference("RENT");

            // Initialize payment with Paystack
            const paymentData = await paymentService.initializePayment({
                email: transaction.tenant.email || req.user?.email || "",
                amount: paymentService.nairaToKobo(transaction.totalAmount),
                reference,
                callback_url: callbackUrl || `${process.env.FRONTEND_URL}/payment/verify`,
                metadata: {
                    transactionId: transaction.id,
                    propertyId: transaction.propertyId,
                    tenantId: transaction.tenantId,
                    propertyTitle: transaction.property.title,
                },
            });

            // Update transaction with payment reference
            await transactionService.updateTransactionStatus(
                transaction.id,
                transaction.status,
                { paystackRef: reference }
            );

            return res.status(200).json({
                success: true,
                data: {
                    authorization_url: paymentData.authorization_url,
                    access_code: paymentData.access_code,
                    reference: paymentData.reference,
                },
            });
        } catch (error: any) {
            console.error("Error initializing payment:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to initialize payment",
            });
        }
    }

    /**
     * Verify payment
     * GET /api/payments/verify/:reference
     */
    async verifyPayment(req: Request, res: Response) {
        try {
            const { reference } = req.params;

            if (!reference) {
                return res.status(400).json({
                    success: false,
                    message: "Payment reference is required",
                });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            let transaction = await prisma.transaction.findFirst({
                where: {
                    OR: [
                        { paystackRef: reference as string },
                        { id: reference as string },
                    ],
                },
            });

            const payRef = transaction?.paystackRef || reference;
            let paymentData: any;
            try {
                paymentData = await paymentService.verifyPayment(payRef as string);
            } catch (paystackError: any) {
                return res.status(502).json({
                    success: false,
                    message: "Payment provider verification failed",
                });
            }

            if (!transaction && paymentData?.metadata?.transactionId) {
                transaction = await prisma.transaction.findUnique({
                    where: { id: paymentData.metadata.transactionId },
                });
            }

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found",
                });
            }

            if (transaction.tenantId !== userId && req.user?.role !== "ADMIN") {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }

            if (paymentData?.status !== "success") {
                return res.status(400).json({
                    success: false,
                    message: "Payment has not been confirmed by Paystack",
                });
            }

            if (!paidKoboMeetsExpected(paymentData.amount, transaction.totalAmount)) {
                return res.status(400).json({
                    success: false,
                    message: "Paid amount does not match the escrow total",
                });
            }

            await transactionService.markEscrowedIfPayable(transaction.id, {
                paystackRef: payRef as string,
                paymentGateway: "PAYSTACK",
            });
            await propertyService.lockUnderOffer(transaction.propertyId);
            const updatedTransaction = await prisma.transaction.findUniqueOrThrow({
                where: { id: transaction.id },
            });

            return res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                data: {
                    transaction: transactionService.sanitizeTransaction(updatedTransaction),
                    payment: { status: paymentData.status, reference: payRef },
                },
            });
        } catch (error: any) {
            console.error("Error verifying payment:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to verify payment",
            });
        }
    }

    /**
     * Handle Paystack webhook
     * POST /api/webhooks/paystack
     */
    async handleWebhook(req: Request, res: Response) {
        try {
            const signature = req.headers["x-paystack-signature"] as string;

            if (!signature) {
                return res.status(400).json({
                    success: false,
                    message: "No signature provided",
                });
            }

            const payload = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);
            const isValid = paymentService.verifyWebhookSignature(payload, signature);

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid signature",
                });
            }

            const event = req.body;

            // Handle different event types
            switch (event.event) {
                case "charge.success":
                    await this.handleSuccessfulCharge(event.data);
                    break;
                case "charge.failed":
                    await this.handleFailedCharge(event.data);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.event}`);
            }

            return res.status(200).json({ success: true });
        } catch (error: any) {
            console.error("Webhook error:", error);
            return res.status(500).json({
                success: false,
                message: "Webhook processing failed",
            });
        }
    }

    /**
     * Handle successful charge
     */
    private async handleSuccessfulCharge(data: any) {
        const reference = data.reference;

        // Check regular rent transaction
        const transaction = await prisma.transaction.findFirst({
            where: { paystackRef: reference },
        });

        if (transaction) {
            if (!paidKoboMeetsExpected(data.amount, transaction.totalAmount)) {
                console.warn(
                    `[Paystack Webhook] Underpayment for tx=${transaction.id}: paid=${data.amount} expectedNaira=${transaction.totalAmount}`
                );
                return;
            }
            await transactionService.markEscrowedIfPayable(transaction.id, {
                paystackRef: reference,
                paymentGateway: "PAYSTACK",
            });
            await propertyService.lockUnderOffer(transaction.propertyId);
            return;
        }

        // Check service transaction (Verification/Featured)
        const serviceTransaction = await prisma.serviceTransaction.findUnique({
            where: { reference },
        });

        if (serviceTransaction) {
            const { ServiceTransactionService } = require("../services/serviceTransaction.service");
            const serviceTxService = new ServiceTransactionService();
            await serviceTxService.verifyTransaction(reference);
            return;
        }

        // Check lease renewal payment
        const renewal = await prisma.leaseRenewal.findFirst({
            where: { paymentReference: reference },
        });

        if (renewal) {
            const { renewalService } = require("../services/renewalService");
            await renewalService.completeRenewalPayment(reference);
            return;
        }
    }

    /**
     * Handle failed charge
     */
    private async handleFailedCharge(data: any) {
        const reference = data.reference;

        // Check regular rent transaction
        const transaction = await prisma.transaction.findFirst({
            where: { paystackRef: reference },
        });

        if (transaction) {
            await transactionService.updateTransactionStatus(
                transaction.id,
                "FAILED" as any
            );
            // TODO: Send notification to tenant
            return;
        }

        // Check service transaction
        const serviceTransaction = await prisma.serviceTransaction.findUnique({
            where: { reference },
        });

        if (serviceTransaction) {
            await prisma.serviceTransaction.update({
                where: { id: serviceTransaction.id },
                data: { status: "FAILED" as any },
            });
        }
    }

    /**
     * Pay rent into escrow with AfriExchange
     * POST /api/payments/afriexchange/pay
     */
    async payWithAfriExchange(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const {
                transactionId,
                afriExchangeAccountEmail,
                afriExchangeWalletAddress,
                afriExchangeUserId,
                tokenType,
            } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification required",
                });
            }

            if (!transactionId) {
                return res.status(400).json({
                    success: false,
                    message: "transactionId is required",
                });
            }

            // If mode is explicitly requested as direct debit, run direct collection
            if (req.body.mode === "direct") {
                const result = await afriExchangePaymentService.collectRent({
                    transactionId,
                    tenantId: userId,
                    afriExchangeAccountEmail,
                    afriExchangeWalletAddress,
                    afriExchangeUserId,
                    tokenType: tokenType || "NT",
                });

                return res.status(200).json({
                    success: true,
                    message: "Escrow payment secured successfully via AfriExchange!",
                    data: result,
                });
            }

            // Default Option 3: Secure hosted checkout redirect
            const result = await afriExchangePaymentService.createHostedCheckoutSession({
                transactionId,
                tenantId: userId,
                tokenType: tokenType || "NT",
                customerEmail: afriExchangeAccountEmail,
                returnUrl: req.body.returnUrl,
            });

            return res.status(200).json({
                success: true,
                message: "Hosted payment checkout session created successfully",
                data: result,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to process AfriExchange payment";
            const details = (error as any)?.details || null;
            console.error("Error processing AfriExchange payment:", message);
            return res.status(400).json({
                success: false,
                message,
                ...(details && { details }),
            });
        }
    }

    /**
     * Verify payment status of an AfriExchange reference
     * GET /api/payments/afriexchange/verify/:reference
     */
    async verifyAfriExchangePayment(req: Request, res: Response) {
        try {
            const reference = String(req.params.reference || "");
            if (!reference) {
                return res.status(400).json({
                    success: false,
                    message: "Payment reference is required",
                });
            }

            const result = await afriExchangePaymentService.verifyAndFinalizePayment(reference);
            const tenantId = (result as any)?.transaction?.tenantId;
            if (tenantId && tenantId !== req.user?.id && req.user?.role !== "ADMIN") {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }
            if ((result as any)?.transaction) {
                (result as any).transaction = transactionService.sanitizeTransaction((result as any).transaction);
            }
            return res.status(200).json({
                success: true,
                message: "AfriExchange payment verification completed",
                data: result,
            });
        } catch (error: any) {
            console.error("Error verifying AfriExchange payment:", error.message);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to verify AfriExchange payment",
            });
        }
    }

    /**
     * Handle AfriExchange webhook
     * POST /api/webhooks/afriexchange
     */
    async handleAfriExchangeWebhook(req: Request, res: Response) {
        try {
            const timestamp = req.headers["x-afriexchange-timestamp"] as string;
            const signature = req.headers["x-afriexchange-signature"] as string;
            const webhookSecret = process.env.AFRIEXCHANGE_WEBHOOK_SECRET;

            if (!webhookSecret || !signature || !timestamp) {
                return res.status(401).json({ success: false, message: "Invalid signature" });
            }
            if (!isWebhookTimestampFresh(timestamp)) {
                return res.status(401).json({ success: false, message: "Stale webhook timestamp" });
            }

            const crypto = await import("crypto");
            const rawBody = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);
            const expected =
                "sha256=" +
                crypto
                    .createHmac("sha256", webhookSecret)
                    .update(`${timestamp}.${rawBody}`)
                    .digest("hex");
            const left = Buffer.from(expected);
            const right = Buffer.from(signature);
            if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
                return res.status(401).json({ success: false, message: "Invalid signature" });
            }

            const event = req.body;
            const eventType = event.event;
            const data = event.data || {};
            const reference = data.reference || data.transaction_id;
            const rentHubTransactionId = data.metadata?.rentHubTransactionId;

            if (eventType === "collection.completed" && (reference || rentHubTransactionId)) {
                const tx = await prisma.transaction.findFirst({
                    where: {
                        OR: [
                            ...(rentHubTransactionId ? [{ id: rentHubTransactionId }] : []),
                            ...(reference
                                ? [
                                    { afriExchangeRef: reference },
                                    { afriExchangeRef: reference.replace(/^RQST-/i, "") },
                                    { afriExchangeRef: `RQST-${reference.replace(/^RQST-/i, "")}` },
                                ]
                                : []),
                        ],
                    },
                });

                if (tx && tx.status !== "ESCROWED") {
                    if (!afriExchangePaidMeetsExpected(data, tx.totalAmount)) {
                        console.warn(
                            `[AfriExchange Webhook] Underpayment or missing amount for tx=${tx.id}`
                        );
                    } else {
                        await transactionService.markEscrowedIfPayable(tx.id, {
                            afriExchangeRef: reference || tx.afriExchangeRef || undefined,
                            paymentGateway: "AFRIEXCHANGE",
                        });
                        await propertyService.lockUnderOffer(tx.propertyId);
                        console.info(
                            `[AfriExchange Webhook] Secured escrow for transaction ${tx.id} from reference ${reference}`
                        );
                    }
                }

                // Also check if this is a ServiceTransaction (Property Verification or Featured Listing)
                const cleanRef = reference ? reference.replace(/^RQST-/i, "").replace(/^SIM-/i, "") : null;
                const serviceTx = await prisma.serviceTransaction.findFirst({
                    where: {
                        OR: [
                            ...(rentHubTransactionId ? [{ id: rentHubTransactionId }] : []),
                            ...(reference
                                ? [
                                    { reference },
                                    ...(cleanRef ? [{ reference: cleanRef }, { reference: `SIM-${cleanRef}` }] : []),
                                ]
                                : []),
                        ],
                    },
                });

                if (serviceTx && serviceTx.status !== "SUCCESSFUL") {
                    const { ServiceTransactionService } = require("../services/serviceTransaction.service");
                    const serviceTxService = new ServiceTransactionService();
                    await serviceTxService.completeServicePayment(serviceTx.reference);
                    console.info(
                        `[AfriExchange Webhook] Activated service transaction ${serviceTx.id} (${serviceTx.type}) from reference ${reference}`
                    );
                }
            }

            return res.status(200).json({ success: true, received: true });
        } catch (error: any) {
            console.error("[AfriExchange Webhook Error]:", error.message);
            return res.status(500).json({
                success: false,
                message: "Webhook processing failed",
            });
        }
    }

    /**
     * Initialize Anchor dedicated virtual NUBAN escrow account
     * POST /api/payments/anchor/initialize
     */
    async initializeAnchorPayment(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { transactionId } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification required",
                });
            }

            if (!transactionId) {
                return res.status(400).json({
                    success: false,
                    message: "transactionId is required",
                });
            }

            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId },
                include: {
                    tenant: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    property: {
                        select: {
                            id: true,
                            title: true,
                            landlordId: true,
                            landlord: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found",
                });
            }

            // Verify user is the tenant
            if (userId !== transaction.tenantId) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: You are not the tenant of this transaction",
                });
            }

            if (transaction.status !== "PENDING") {
                return res.status(400).json({
                    success: false,
                    message: `Transaction is in ${transaction.status} status; only PENDING transactions can be initialized`,
                });
            }

            // Idempotent return if account was already created
            if (transaction.anchorVirtualNuban && transaction.anchorEscrowLedgerId) {
                return res.status(200).json({
                    success: true,
                    message: "Anchor dedicated virtual escrow account retrieved",
                    data: {
                        transactionId: transaction.id,
                        virtualNuban: transaction.anchorVirtualNuban,
                        bankName: transaction.anchorBankName || "Providus Bank / Anchor BaaS",
                        accountName: `RentHub Escrow: ${transaction.tenant.firstName || "Tenant"}`,
                        totalAmount: transaction.totalAmount,
                        rentAmount: transaction.rentAmount,
                        cautionFee: transaction.cautionFee,
                        platformFee: transaction.platformFee,
                        reference: transaction.anchorCollectionRef,
                        instructions: "Transfer the exact total amount to this dedicated account to fund escrow.",
                    },
                });
            }

            const tenantFullName = `${transaction.tenant.firstName || ""} ${transaction.tenant.lastName || ""}`.trim() || "Tenant";
            const landlordFullName = transaction.property?.landlord
                ? `${transaction.property.landlord.firstName || ""} ${transaction.property.landlord.lastName || ""}`.trim()
                : "Landlord";

            const anchorAccount = await anchorService.createEscrowSubAccount(
                transaction.id,
                transaction.totalAmount,
                tenantFullName,
                landlordFullName,
                transaction.tenant.email || undefined
            );

            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    paymentGateway: "ANCHOR",
                    anchorEscrowLedgerId: anchorAccount.ledgerId,
                    anchorCautionLedgerId: anchorAccount.cautionLedgerId,
                    anchorVirtualNuban: anchorAccount.virtualNuban,
                    anchorBankName: anchorAccount.bankName,
                    anchorCollectionRef: anchorAccount.reference,
                },
            });

            return res.status(200).json({
                success: true,
                message: "Anchor dedicated virtual escrow account generated successfully",
                data: {
                    transactionId: transaction.id,
                    virtualNuban: anchorAccount.virtualNuban,
                    bankName: anchorAccount.bankName,
                    accountName: anchorAccount.accountName,
                    totalAmount: transaction.totalAmount,
                    rentAmount: transaction.rentAmount,
                    cautionFee: transaction.cautionFee,
                    platformFee: transaction.platformFee,
                    reference: anchorAccount.reference,
                    instructions: "Transfer the exact total amount to this dedicated account to fund escrow.",
                },
            });
        } catch (error: any) {
            console.error("[Anchor Initialize Error]:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to initialize Anchor virtual escrow account",
            });
        }
    }

    /**
     * Get Anchor Virtual Account Details
     * GET /api/payments/anchor/status/:transactionId
     */
    async getAnchorAccountDetails(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const transactionId = String(req.params.transactionId || "");

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification required",
                });
            }

            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId },
                include: {
                    property: true,
                },
            });

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found",
                });
            }

            // Gating: Only tenant or landlord of this transaction can inspect
            const landlordId = (transaction as any).property?.landlordId;
            if (userId !== transaction.tenantId && userId !== landlordId) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You are not a participant in this transaction",
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    transactionId: transaction.id,
                    status: transaction.status,
                    escrowHeld: transaction.escrowHeld,
                    virtualNuban: transaction.anchorVirtualNuban,
                    bankName: transaction.anchorBankName,
                    totalAmount: transaction.totalAmount,
                    collectionRef: transaction.anchorCollectionRef,
                },
            });
        } catch (error: any) {
            console.error("[Anchor Status Error]:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve Anchor virtual account details",
            });
        }
    }

    /**
     * Active Verification of Anchor Payment
     * POST /api/payments/anchor/verify/:transactionId
     * Queries Anchor API payments list directly for matches against the Virtual NUBAN ID.
     */
    async verifyAnchorPayment(req: Request, res: Response) {
        try {
            const transactionId = req.params.transactionId as string;

            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId },
                include: { property: true },
            });

            if (!transaction) {
                return res.status(404).json({ success: false, message: "Transaction not found" });
            }

            if (transaction.status === TransactionStatus.ESCROWED || transaction.escrowHeld) {
                return res.status(200).json({
                    success: true,
                    status: "ESCROWED",
                    escrowHeld: true,
                    message: "Payment already verified and secured in escrow vault.",
                    data: transaction,
                });
            }

            // Query Anchor API for recent payments
            const payments = await anchorService.getRecentPayments();
            const virtualNubanId = transaction.anchorEscrowLedgerId;

            const matchedPayment = payments.find((p: any) => {
                // Fix #2 (Claude): match by Virtual NUBAN ID (accountId in payment.received events)
                // Anchor stores it in both relationships AND in payment.virtualNuban.accountId
                const pVirtualNubanId =
                    p.relationships?.virtualNuban?.data?.id ||
                    p.attributes?.payment?.virtualNuban?.accountId;
                const pAmount = p.attributes?.amount ?? p.attributes?.payment?.amount;
                const matchesAccount = pVirtualNubanId && pVirtualNubanId === virtualNubanId;
                // Fix #1 (Claude): pAmount is in kobo — paidKoboMeetsExpected handles this correctly
                const meetsAmount = paidKoboMeetsExpected(pAmount, transaction.totalAmount);
                return matchesAccount && meetsAmount;
            });

            if (!matchedPayment) {
                return res.status(200).json({
                    success: false,
                    status: transaction.status,
                    escrowHeld: false,
                    message: "Payment transfer not yet detected on Providus / Anchor rail. Please allow 15-30 seconds after sending.",
                });
            }

            // Reconcile and transition to ESCROWED
            const claimed = await transactionService.markEscrowedIfPayable(transaction.id, {
                paymentGateway: "ANCHOR",
            });

            if (claimed.count > 0) {
                await propertyService.lockUnderOffer(transaction.propertyId);

                // Deduct platform fee
                const feeKobo = anchorService.nairaToKobo(transaction.platformFee);
                if (transaction.anchorEscrowLedgerId && feeKobo > 0) {
                    anchorService.deductPlatformFee(transaction.anchorEscrowLedgerId, feeKobo, transaction.id).catch(console.warn);
                }
            }

            const updated = await prisma.transaction.findUnique({ where: { id: transactionId } });
            return res.status(200).json({
                success: true,
                status: "ESCROWED",
                escrowHeld: true,
                message: "Payment verified! Funds secured in escrow vault.",
                data: updated,
            });
        } catch (error: any) {
            console.error("[Anchor Payment Verify Error]:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to verify Anchor payment",
            });
        }
    }

    /**
     * Handle incoming Anchor BaaS webhooks
     * POST /api/webhooks/anchor
     */
    async handleAnchorWebhook(req: Request, res: Response) {
        try {
            const signature = (req.headers["x-anchor-signature"] || req.headers["x-webhook-signature"]) as string;
            const timestamp = req.headers["x-anchor-timestamp"] as string;
            const rawPayload = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);

                if (timestamp && !isWebhookTimestampFresh(timestamp)) {
                    console.warn("[Anchor Webhook] Rejected stale timestamp from IP:", req.ip);
                    return res.status(401).json({
                        success: false,
                        message: "Invalid or stale webhook timestamp",
                    });
                }

                const isValid = anchorService.verifyWebhookSignature(rawPayload, signature, timestamp);

                if (!isValid) {
                    console.warn("[Anchor Webhook] Unauthorized attempt with invalid signature from IP:", req.ip);
                    return res.status(401).json({
                        success: false,
                        message: "Invalid webhook signature",
                    });
                }

                const event = req.body;
                const eventType = event.event || event.type || event.data?.type;
                const data = event.data || {};
                const eventEnv: string | undefined = data.attributes?.env ?? event.env;

                console.info(`[Anchor Webhook] Received event: ${eventType} env=${eventEnv ?? "unset"}`);

                // Fix #3 (Claude): Reject TEST events in production so sandbox simulations
                // can never credit a real lease.
                const isProductionMode = process.env.NODE_ENV === "production";
                if (isProductionMode && eventEnv === "TEST") {
                    console.warn(`[Anchor Webhook] Rejected TEST event in production: ${eventType}`);
                    return res.status(200).json({ success: true, received: true, skipped: "test_event_in_production" });
                }

                // We listen for inbound account credit / transfer success events
                const isCreditEvent =
                    eventType === "account.credited" ||
                    eventType === "inflow.success" ||
                    eventType === "transfer.success" ||
                    eventType === "inward_payment.success" ||
                    eventType === "payment.received" ||
                    eventType === "payment.create";

                if (isCreditEvent) {
                    const paymentObj = data.attributes?.payment || data.payment || data;

                    // Fix #2 (Claude): Deduplication — extract event ID and payment ID from the
                    // actual Anchor structure so we can skip replayed / retried webhooks.
                    const anchorEventId: string | undefined = data.id ?? event.id;
                    const anchorPaymentId: string | undefined =
                        paymentObj.paymentId ?? paymentObj.id ?? data.attributes?.payment?.paymentId;

                    const virtualNubanId: string | undefined =
                        data.relationships?.virtualNuban?.data?.id ||
                        paymentObj.relationships?.virtualNuban?.data?.id ||
                        paymentObj.virtualNuban?.data?.id ||
                        paymentObj.virtualNuban?.id ||
                        // Fix: Anchor's payment.received puts accountId here (confirmed from event log)
                        paymentObj.virtualNuban?.accountId ||
                        data.accountId;

                    const reference: string | undefined = paymentObj.reference || paymentObj.paymentReference || data.reference;
                    const accountNumber: string | undefined = paymentObj.virtualNuban?.accountNumber || paymentObj.accountNumber || data.accountNumber;

                    // Fix #1 (Claude): Amount is always in kobo in Anchor payloads.
                    // paymentObj.amount is the canonical kobo integer (e.g. 81778600 = ₦817,786.00).
                    // Never use the amountString (float) for comparisons.
                    const amountKobo: number | undefined =
                        paymentObj.amount !== undefined
                            ? paymentObj.amount
                            : data.attributes?.amount !== undefined
                            ? data.attributes.amount
                            : data.amount;

                    // Locate transaction by Virtual NUBAN ID, account number, or reference
                    const transaction = await prisma.transaction.findFirst({
                        where: {
                            OR: [
                                ...(virtualNubanId ? [{ anchorEscrowLedgerId: virtualNubanId }] : []),
                                ...(accountNumber ? [{ anchorVirtualNuban: accountNumber }] : []),
                                ...(reference ? [{ anchorCollectionRef: reference }] : []),
                            ],
                        },
                    });

                    if (transaction) {
                        // Fix #2 (Claude): If this transaction is already ESCROWED (escrowHeld=true),
                        // this is a duplicate/replayed webhook — skip crediting it again.
                        if (transaction.escrowHeld || transaction.status === "ESCROWED") {
                            console.info(
                                `[Anchor Webhook] Duplicate skipped — tx=${transaction.id} already ESCROWED. ` +
                                `eventId=${anchorEventId} paymentId=${anchorPaymentId}`
                            );
                            return res.status(200).json({ success: true, received: true, skipped: "already_escrowed" });
                        }

                        // Fix #1 (Claude): Fail-closed if kobo amount is missing or zero.
                        if (amountKobo === undefined || amountKobo === null) {
                            console.error(
                                `[Anchor Webhook] MISSING amount in payload for tx=${transaction.id}. ` +
                                `eventId=${anchorEventId}. Refusing to escrow.`
                            );
                            return res.status(200).json({ success: false, message: "Missing amount in webhook payload." });
                        }

                        // Fix #4 (Claude): Exact-match amount check: kobo-to-kobo, never float.
                        if (!paidKoboMeetsExpected(amountKobo, transaction.totalAmount)) {
                            console.warn(
                                `[Anchor Webhook] Amount mismatch for tx=${transaction.id}: ` +
                                `received ${amountKobo} kobo, expected ${transaction.totalAmount * 100} kobo. ` +
                                `eventId=${anchorEventId}`
                            );
                            return res.status(200).json({
                                success: false,
                                message: "Underpayment or amount mismatch detected. Escrow not funded.",
                            });
                        }

                        const claimed = await transactionService.markEscrowedIfPayable(transaction.id, {
                            paymentGateway: "ANCHOR",
                        });

                        if (claimed.count > 0) {
                            console.info(
                                `[Anchor Webhook] Transitioned tx=${transaction.id} to ESCROWED. ` +
                                `anchorPaymentId=${anchorPaymentId} eventId=${anchorEventId}`
                            );
                            await propertyService.lockUnderOffer(transaction.propertyId);

                            // Deduct 2% platform protection fee to RentHub revenue ledger
                            const feeKobo = anchorService.nairaToKobo(transaction.platformFee);
                            if (transaction.anchorEscrowLedgerId && feeKobo > 0) {
                                try {
                                    await anchorService.deductPlatformFee(
                                        transaction.anchorEscrowLedgerId,
                                        feeKobo,
                                        transaction.id
                                    );
                                } catch (feeErr) {
                                    console.warn("[Anchor Webhook] Platform fee transfer error:", feeErr);
                                }
                            }
                        } else {
                            // markEscrowedIfPayable found 0 rows — race condition or status mismatch
                            console.warn(
                                `[Anchor Webhook] markEscrowedIfPayable returned 0 rows for tx=${transaction.id}. ` +
                                `Current status=${transaction.status} escrowHeld=${transaction.escrowHeld}. ` +
                                `Likely a concurrent webhook — safe to ignore.`
                            );
                        }
                    } else {
                        console.warn(
                            `[Anchor Webhook] No transaction found for virtualNubanId=${virtualNubanId} ` +
                            `accountNumber=${accountNumber} reference=${reference}. eventId=${anchorEventId}`
                        );
                    }
                }

                return res.status(200).json({ success: true, received: true });
            } catch (error: any) {
                console.error("[Anchor Webhook Error]:", error);
                return res.status(500).json({
                    success: false,
                    message: "Webhook processing failed",
                });
            }
        }
}

    export const paymentController = new PaymentController();

