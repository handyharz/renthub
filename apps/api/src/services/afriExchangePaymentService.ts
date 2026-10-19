import axios from "axios";
import { prisma } from "../config/database";
import { PaymentGateway, TransactionStatus } from "@prisma/client";

import { getCleanAfriExchangeUrl, getAfriExchangeApiKey } from "../config/afriExchange";

/**
 * Service handling inbound rent collections via AfriExchange.
 * Tenants can pay their rent and caution fee directly into RentHub escrow
 * using their AfriExchange CT or NGN wallet balance.
 */
export class AfriExchangePaymentService {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly enabled: boolean;

    constructor() {
        this.baseUrl = getCleanAfriExchangeUrl();
        this.apiKey = getAfriExchangeApiKey();
        this.enabled = !!(this.baseUrl && this.apiKey);

        if (!this.enabled) {
            console.warn(
                "[AfriExchangePaymentService] AFRIEXCHANGE_API_URL or RENTHUB_AFRIEXCHANGE_API_KEY not configured."
            );
        }
    }

    /**
     * Collect rent & fees from tenant's AfriExchange wallet into RentHub Escrow.
     */
    async collectRent({
        transactionId,
        tenantId,
        afriExchangeAccountEmail,
        afriExchangeWalletAddress,
        afriExchangeUserId,
        tokenType = "NT",
        amountInToken,
    }: {
        transactionId: string;
        tenantId: string;
        afriExchangeAccountEmail?: string;
        afriExchangeWalletAddress?: string;
        afriExchangeUserId?: string;
        tokenType?: "NT" | "CT" | "USDT";
        amountInToken?: number;
    }) {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                tenant: true,
                property: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                    },
                },
            },
        });

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        if (transaction.tenantId !== tenantId) {
            throw new Error("Unauthorized: You are not the tenant for this transaction");
        }

        if (transaction.status === TransactionStatus.ESCROWED || transaction.escrowReleased) {
            throw new Error("Payment has already been secured in escrow for this transaction");
        }

        // Determine buyer's AfriExchange identity:
        // Priority: Passed in request > Tenant's profile linked credentials > Tenant's email
        const buyerEmail =
            afriExchangeAccountEmail ||
            transaction.tenant.afriExchangeAccountEmail ||
            transaction.tenant.email ||
            undefined;

        const buyerWallet =
            afriExchangeWalletAddress ||
            transaction.tenant.afriExchangeWalletAddress ||
            undefined;

        const buyerUserId =
            afriExchangeUserId ||
            transaction.tenant.afriExchangeUserId ||
            undefined;

        if (!buyerEmail && !buyerWallet && !buyerUserId) {
            throw new Error(
                "Please provide your AfriExchange account email, wallet address, or user ID."
            );
        }

        const idempotencyKey = `RENTHUB-COLLECTION-${transactionId}`;

        // Calculate converted token amount if not provided:
        // NT: 1 NT = 1 NGN
        // CT: 1 CT ≈ 2.70 NGN (0.37 CT per 1 NGN)
        // USDT: 1 USDT ≈ 1,500 NGN (0.00067 USDT per 1 NGN)
        let resolvedTokenAmount: number;
        if (amountInToken && amountInToken > 0) {
            resolvedTokenAmount = amountInToken;
        } else if (tokenType === "USDT") {
            resolvedTokenAmount = Math.round((transaction.totalAmount / 1500) * 100) / 100;
        } else if (tokenType === "CT") {
            resolvedTokenAmount = Math.round((transaction.totalAmount / 2.7) * 100) / 100;
        } else {
            resolvedTokenAmount = transaction.totalAmount;
        }

        // If AfriExchange credentials are configured, execute live collection
        if (this.enabled) {
            try {
                const payload = {
                    idempotencyKey,
                    rentHubTransactionId: transactionId,
                    tenantId,
                    buyerAfriExchangeUserId: buyerUserId,
                    buyerWalletAddress: buyerWallet,
                    buyerAccountEmail: buyerEmail,
                    amount: resolvedTokenAmount, // Converted token units to debit
                    amountInToken: resolvedTokenAmount,
                    amountInNgn: transaction.totalAmount,
                    currency: "NGN",
                    tokenType: tokenType || "NT",
                    description: `RentHub Escrow Payment — ${transaction.property.title} (tx: ${transactionId})`,
                    metadata: {
                        transactionId,
                        propertyId: transaction.propertyId,
                        propertyTitle: transaction.property.title,
                        tenantEmail: transaction.tenant.email,
                        amountInNgn: transaction.totalAmount,
                        amountInToken: resolvedTokenAmount,
                        tokenType: tokenType || "NT",
                    },
                };

                // Try dedicated RentHub endpoint first, fall back to Kaalis collections endpoint
                let response;
                try {
                    response = await axios.post(
                        `${this.baseUrl}/integrations/renthub/collections`,
                        payload,
                        {
                            headers: {
                                "Content-Type": "application/json",
                                "x-renthub-api-key": this.apiKey,
                            },
                            timeout: 15000,
                        }
                    );
                } catch (endpointErr: unknown) {
                    if (axios.isAxiosError(endpointErr) && endpointErr.response?.status === 404) {
                        // Fallback to kaalis collection endpoint if no dedicated RentHub route exists yet
                        response = await axios.post(
                            `${this.baseUrl}/integrations/kaalis/collections`,
                            payload,
                            {
                                headers: {
                                    "Content-Type": "application/json",
                                    "x-kaalis-api-key": this.apiKey,
                                },
                                timeout: 15000,
                            }
                        );
                    } else {
                        throw endpointErr;
                    }
                }

                const collectionData = response.data?.data || {};
                const reference = collectionData.reference || `AFRI-${Date.now()}`;

                // Mark transaction as ESCROWED
                const updated = await prisma.transaction.update({
                    where: { id: transactionId },
                    data: {
                        status: TransactionStatus.ESCROWED,
                        escrowHeld: true,
                        paymentGateway: PaymentGateway.AFRIEXCHANGE,
                        afriExchangeRef: reference,
                    },
                    include: {
                        property: true,
                        tenant: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                });

                return {
                    success: true,
                    reference,
                    transaction: updated,
                    collection: collectionData,
                };
            } catch (err: unknown) {
                let message = "AfriExchange payment collection failed";
                let details: any = null;
                if (axios.isAxiosError(err)) {
                    message =
                        (err.response?.data as { message?: string })?.message ||
                        err.message ||
                        message;
                    details = (err.response?.data as { details?: any })?.details || null;
                } else if (err instanceof Error) {
                    message = err.message;
                }
                const customError = new Error(message);
                if (details) (customError as any).details = details;
                throw customError;
            }
        }

        // Simulation mode (when API keys are not yet configured in local environment)
        const mockReference = `SIMULATED-AFRI-${Date.now()}`;
        const updated = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: TransactionStatus.ESCROWED,
                escrowHeld: true,
                paymentGateway: PaymentGateway.AFRIEXCHANGE,
                afriExchangeRef: mockReference,
            },
            include: {
                property: true,
                tenant: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        console.info(
            `[AfriExchangePaymentService] Simulated payment successful for tx=${transactionId} ref=${mockReference}`
        );

        return {
            success: true,
            simulated: true,
            reference: mockReference,
            transaction: updated,
        };
    }

    /**
     * Create a secure hosted checkout session on AfriExchange.
     * Returns the hosted checkout URL where the tenant reviews the exact breakdown and authorizes
     * the transaction using their AfriExchange password.
     */
    async createHostedCheckoutSession({
        transactionId,
        tenantId,
        tokenType = "NT",
        amountInToken,
        customerEmail,
        returnUrl,
    }: {
        transactionId: string;
        tenantId: string;
        tokenType?: "NT" | "CT" | "USDT";
        amountInToken?: number;
        customerEmail?: string;
        returnUrl?: string;
    }) {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                tenant: true,
                property: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                    },
                },
            },
        });

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        if (transaction.tenantId !== tenantId) {
            throw new Error("Unauthorized: You are not the tenant for this transaction");
        }

        if (transaction.status === TransactionStatus.ESCROWED || transaction.escrowReleased) {
            throw new Error("Payment has already been secured in escrow for this transaction");
        }

        // Calculate converted token amount if not provided
        let resolvedTokenAmount: number;
        if (amountInToken && amountInToken > 0) {
            resolvedTokenAmount = amountInToken;
        } else if (tokenType === "USDT") {
            resolvedTokenAmount = Math.round((transaction.totalAmount / 1500) * 100) / 100;
        } else if (tokenType === "CT") {
            resolvedTokenAmount = Math.round((transaction.totalAmount / 2.7) * 100) / 100;
        } else {
            resolvedTokenAmount = transaction.totalAmount;
        }

        const buyerEmail =
            customerEmail ||
            transaction.tenant.afriExchangeAccountEmail ||
            transaction.tenant.email ||
            undefined;

        const frontendBaseUrl = (
            process.env.FRONTEND_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "https://renthub-seven.vercel.app"
        ).replace(/\/$/, "");

        const effectiveReturnUrl =
            returnUrl ||
            `${frontendBaseUrl}/dashboard?tab=applications&payment=success&txId=${transactionId}`;

        if (this.enabled) {
            try {
                const payload = {
                    rentHubTransactionId: transactionId,
                    amount: resolvedTokenAmount,
                    amountInToken: resolvedTokenAmount,
                    amountInNgn: transaction.totalAmount,
                    currency: "NGN",
                    tokenType: tokenType || "NT",
                    customerEmail: buyerEmail,
                    returnUrl: effectiveReturnUrl,
                    description: `RentHub Escrow Payment — ${transaction.property.title}`,
                    metadata: {
                        propertyId: transaction.propertyId,
                        propertyTitle: transaction.property.title,
                        tenantEmail: transaction.tenant.email,
                        totalUpfrontNgn: transaction.totalAmount,
                    },
                };

                const response = await axios.post(
                    `${this.baseUrl}/integrations/renthub/checkout-session`,
                    payload,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "x-renthub-api-key": this.apiKey,
                        },
                        timeout: 15000,
                    }
                );

                const data = response.data?.data || {};
                const reference = data.reference;

                if (reference) {
                    await prisma.transaction.update({
                        where: { id: transactionId },
                        data: {
                            afriExchangeRef: reference,
                            paymentGateway: PaymentGateway.AFRIEXCHANGE,
                        },
                    });
                }

                return {
                    success: true,
                    paymentUrl: data.paymentUrl || data.payment_url,
                    reference: data.reference,
                    amount: data.amount,
                    tokenType: data.tokenType,
                    expiresAt: data.expires_at,
                };
            } catch (err: unknown) {
                let message = "Failed to initialize AfriExchange hosted checkout";
                if (axios.isAxiosError(err)) {
                    message =
                        (err.response?.data as { message?: string })?.message ||
                        err.message ||
                        message;
                } else if (err instanceof Error) {
                    message = err.message;
                }
                throw new Error(message);
            }
        }

        // Simulation mode
        const mockRef = `SIM-RQST-${transactionId.slice(0, 8)}`;
        const webBaseUrl = (process.env.AFRIEXCHANGE_WEB_APP_URL || "https://afri-x.vercel.app").replace(/\/$/, "");
        const mockUrl = `${webBaseUrl}/pay/${mockRef}?amount=${resolvedTokenAmount}&token=${tokenType}`;

        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                afriExchangeRef: mockRef,
                paymentGateway: PaymentGateway.AFRIEXCHANGE,
            },
        });

        return {
            success: true,
            simulated: true,
            paymentUrl: mockUrl,
            reference: mockRef,
            amount: resolvedTokenAmount,
            tokenType,
        };
    }

    /**
     * Verify payment status with AfriExchange and finalize RentHub escrow if completed.
     */
    async verifyAndFinalizePayment(reference: string) {
        if (!reference) {
            throw new Error("Payment reference is required");
        }

        const cleanRef = reference.replace(/^RQST-/i, "");
        const transaction = await prisma.transaction.findFirst({
            where: {
                OR: [
                    { afriExchangeRef: reference },
                    { afriExchangeRef: cleanRef },
                    { afriExchangeRef: `RQST-${cleanRef}` },
                ],
            },
            include: { property: true, tenant: true },
        });

        if (!transaction) {
            throw new Error(`Transaction with AfriExchange reference '${reference}' not found`);
        }

        if (transaction.status === TransactionStatus.ESCROWED) {
            return { success: true, verified: true, transaction, alreadyEscrowed: true };
        }

        if (this.enabled) {
            const response = await axios.get(
                `${this.baseUrl}/integrations/renthub/verify/${reference}`,
                {
                    headers: {
                        "x-renthub-api-key": this.apiKey,
                    },
                    timeout: 15000,
                }
            );

            const result = response.data?.data || {};
            if (result.verified) {
                const updated = await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: TransactionStatus.ESCROWED,
                        escrowHeld: true,
                        paymentGateway: PaymentGateway.AFRIEXCHANGE,
                    },
                });

                return { success: true, verified: true, transaction: updated };
            }

            return { success: true, verified: false, status: result.status, transaction };
        }

        // In simulation mode: mark escrowed
        const updated = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                status: TransactionStatus.ESCROWED,
                escrowHeld: true,
                paymentGateway: PaymentGateway.AFRIEXCHANGE,
            },
        });

        return { success: true, verified: true, transaction: updated };
    }
}

export const afriExchangePaymentService = new AfriExchangePaymentService();
