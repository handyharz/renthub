import { Request, Response } from "express";
import { paymentService } from "../services/paymentService";
import { transactionService } from "../services/transactionService";
import { afriExchangePaymentService } from "../services/afriExchangePaymentService";
import { prisma } from "../config/database";

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
                error: error.message,
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

            const expectedKobo = paymentService.nairaToKobo(transaction.totalAmount);
            if (typeof paymentData.amount === "number" && paymentData.amount < expectedKobo) {
                return res.status(400).json({
                    success: false,
                    message: "Paid amount does not match the escrow total",
                });
            }

            const updatedTransaction = await transactionService.updateTransactionStatus(
                transaction.id,
                "SUCCESSFUL" as any,
                { paystackRef: payRef as string }
            );

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
                error: error.message,
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
                error: error.message,
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
            await transactionService.updateTransactionStatus(
                transaction.id,
                "SUCCESSFUL" as any
            );
            // TODO: Send notification to landlord
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
                    await prisma.transaction.update({
                        where: { id: tx.id },
                        data: {
                            status: "ESCROWED",
                            escrowHeld: true,
                            paymentGateway: "AFRIEXCHANGE",
                            afriExchangeRef: reference || tx.afriExchangeRef,
                        },
                    });
                    console.info(
                        `[AfriExchange Webhook] Secured escrow for transaction ${tx.id} from reference ${reference}`
                    );
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
}

export const paymentController = new PaymentController();
