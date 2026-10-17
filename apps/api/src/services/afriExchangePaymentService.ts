import axios from "axios";
import { prisma } from "../config/database";
import { PaymentGateway, TransactionStatus } from "@prisma/client";

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
        this.baseUrl = (process.env.AFRIEXCHANGE_API_URL || "").replace(/\/$/, "");
        this.apiKey = process.env.RENTHUB_AFRIEXCHANGE_API_KEY || "";
        this.enabled = !!(this.baseUrl && this.apiKey);

        if (!this.enabled) {
            console.warn(
                "[AfriExchangePaymentService] AFRIEXCHANGE_API_URL or RENTHUB_AFRIEXCHANGE_API_KEY not configured. " +
                "AfriExchange payments will run in simulation mode for development."
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
    }: {
        transactionId: string;
        tenantId: string;
        afriExchangeAccountEmail?: string;
        afriExchangeWalletAddress?: string;
        afriExchangeUserId?: string;
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
                    amount: transaction.totalAmount, // Sub-unit (kobo/smallest unit)
                    currency: "NGN",
                    tokenType: "CT",
                    description: `RentHub Escrow Payment — ${transaction.property.title} (tx: ${transactionId})`,
                    metadata: {
                        transactionId,
                        propertyId: transaction.propertyId,
                        propertyTitle: transaction.property.title,
                        tenantEmail: transaction.tenant.email,
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
}

export const afriExchangePaymentService = new AfriExchangePaymentService();
