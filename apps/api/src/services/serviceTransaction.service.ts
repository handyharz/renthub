import { PrismaClient, ServiceType, TransactionStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { paymentService } from "./paymentService";
import axios from "axios";

export class ServiceTransactionService {
    /**
     * Initiate a service payment with Paystack (Verification or Featured Listing)
     */
    async initiateTransaction(userId: string, type: ServiceType, propertyId?: string) {
        let amount = 0;

        // determine amount based on type
        switch (type) {
            case ServiceType.PROPERTY_VERIFICATION:
                amount = 20000; // 20,000 NGN
                break;
            case ServiceType.FEATURED_LISTING:
                amount = 50000; // 50,000 NGN
                break;
            case ServiceType.USER_VERIFICATION:
                amount = 5000;
                break;
            default:
                throw new Error("Invalid service type");
        }

        // Fetch user for email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        if (!user || !user.email) {
            throw new Error("User email not found for payment initialization");
        }

        // Generate unique payment reference
        const reference = paymentService.generateReference(
            type === ServiceType.FEATURED_LISTING ? "FEAT" : "VERI"
        );

        // Initialize payment with Paystack
        const paymentData = await paymentService.initializePayment({
            email: user.email,
            amount: paymentService.nairaToKobo(amount),
            reference,
            callback_url: `${process.env.FRONTEND_URL}/dashboard?tab=properties&payment=success`,
            metadata: {
                userId,
                propertyId,
                type,
                serviceName: type.replace(/_/g, " "),
                gateway: "PAYSTACK",
            },
        });

        // Create pending service transaction in DB
        const transaction = await prisma.serviceTransaction.create({
            data: {
                userId,
                propertyId,
                type,
                amount: paymentService.nairaToKobo(amount),
                status: TransactionStatus.PENDING,
                reference,
                metadata: {
                    gateway: "PAYSTACK",
                },
            },
        });

        return {
            transaction,
            authorizationUrl: paymentData.authorization_url,
            accessCode: paymentData.access_code,
            reference: paymentData.reference,
        };
    }

    /**
     * Initiate a service payment with AfriExchange (NT, CT, USDT)
     */
    async initiateAfriExchangeTransaction({
        userId,
        type,
        propertyId,
        accountEmail,
        walletAddress,
        tokenType = "NT",
        amountInToken,
        returnUrl,
    }: {
        userId: string;
        type: ServiceType;
        propertyId?: string;
        accountEmail?: string;
        walletAddress?: string;
        tokenType?: "NT" | "CT" | "USDT";
        amountInToken?: number;
        returnUrl?: string;
    }) {
        let amount = 0;
        switch (type) {
            case ServiceType.PROPERTY_VERIFICATION:
                amount = 20000;
                break;
            case ServiceType.FEATURED_LISTING:
                amount = 50000;
                break;
            case ServiceType.USER_VERIFICATION:
                amount = 5000;
                break;
            default:
                throw new Error("Invalid service type");
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, firstName: true, lastName: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Calculate converted token amount if not provided
        let resolvedTokenAmount: number;
        if (amountInToken && amountInToken > 0) {
            resolvedTokenAmount = amountInToken;
        } else if (tokenType === "USDT") {
            resolvedTokenAmount = Math.round((amount / 1500) * 100) / 100;
        } else if (tokenType === "CT") {
            resolvedTokenAmount = Math.round((amount / 2.7) * 100) / 100;
        } else {
            resolvedTokenAmount = amount;
        }

        const reference = paymentService.generateReference(
            type === ServiceType.FEATURED_LISTING ? "FEAT-AFRI" : "VERI-AFRI"
        );

        let propertyTitle = "Property Boost Service";
        if (propertyId) {
            const p = await prisma.property.findUnique({
                where: { id: propertyId },
                select: { title: true },
            });
            if (p?.title) propertyTitle = p.title;
        }

        const frontendBaseUrl = (
            process.env.FRONTEND_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "https://renthub-seven.vercel.app"
        ).replace(/\/$/, "");

        const effectiveReturnUrl =
            returnUrl ||
            `${frontendBaseUrl}/dashboard?tab=properties&payment=success&serviceTxId=${reference}`;

        // Create pending service transaction in DB
        const transaction = await prisma.serviceTransaction.create({
            data: {
                userId,
                propertyId,
                type,
                amount: paymentService.nairaToKobo(amount),
                status: TransactionStatus.PENDING,
                reference,
                metadata: {
                    gateway: "AFRIEXCHANGE",
                    tokenType,
                    amountInToken: resolvedTokenAmount,
                    accountEmail,
                    walletAddress,
                },
            },
        });

        const baseUrl = (process.env.AFRIEXCHANGE_API_URL || "").replace(/\/$/, "");
        const apiKey = process.env.RENTHUB_AFRIEXCHANGE_API_KEY || "";
        const isEnabled = !!(baseUrl && apiKey);

        if (isEnabled) {
            try {
                const payload = {
                    rentHubTransactionId: transaction.id,
                    amount: resolvedTokenAmount,
                    amountInToken: resolvedTokenAmount,
                    amountInNgn: amount,
                    currency: "NGN",
                    tokenType: tokenType || "NT",
                    customerEmail: accountEmail || user.email,
                    returnUrl: effectiveReturnUrl,
                    description: `RentHub ${type.replace(/_/g, " ")} — ${propertyTitle}`,
                    metadata: {
                        serviceType: type,
                        propertyId,
                        propertyTitle,
                        serviceTransactionId: transaction.id,
                        reference,
                    },
                };

                const response = await axios.post(
                    `${baseUrl}/integrations/renthub/checkout-session`,
                    payload,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "x-renthub-api-key": apiKey,
                        },
                        timeout: 10000,
                    }
                );

                const data = response.data?.data || {};
                return {
                    success: true,
                    transaction,
                    paymentUrl: data.paymentUrl || data.payment_url,
                    reference: data.reference || reference,
                    amount: data.amount || resolvedTokenAmount,
                    tokenType,
                };
            } catch (err: any) {
                console.warn(
                    "[AfriExchange Service Checkout] Error calling external checkout session:",
                    err.message
                );
            }
        }

        // Simulation / Hosted Portal fallback
        const mockRef = `SIM-${reference}`;
        const webBaseUrl = (process.env.AFRIEXCHANGE_WEB_APP_URL || "https://afri-x.vercel.app").replace(/\/$/, "");
        const mockUrl = `${webBaseUrl}/pay/${mockRef}?amount=${resolvedTokenAmount}&token=${tokenType}`;

        return {
            success: true,
            simulated: true,
            transaction,
            paymentUrl: mockUrl,
            reference,
            amount: resolvedTokenAmount,
            tokenType,
        };
    }

    /**
     * Mark a service transaction successful and activate the respective property boost
     */
    async completeServicePayment(reference: string) {
        const cleanRef = reference.replace(/^SIM-/i, "").replace(/^RQST-/i, "");
        const transaction = await prisma.serviceTransaction.findFirst({
            where: {
                OR: [
                    { reference },
                    { reference: cleanRef },
                    { reference: `SIM-${cleanRef}` },
                ],
            },
            include: { property: true },
        });

        if (!transaction) {
            throw new Error(`Service transaction with reference '${reference}' not found`);
        }

        if (transaction.status === TransactionStatus.SUCCESSFUL) {
            return { status: "already_verified", transaction };
        }

        const updatedTx = await prisma.serviceTransaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.SUCCESSFUL },
        });

        // Apply benefits
        if (transaction.type === ServiceType.PROPERTY_VERIFICATION && transaction.propertyId) {
            await prisma.property.update({
                where: { id: transaction.propertyId },
                data: {
                    status: "PENDING_REVIEW",
                    verifiedBy: "PAYMENT_RECEIVED_PENDING_INSPECTION",
                },
            });
        } else if (transaction.type === ServiceType.FEATURED_LISTING && transaction.propertyId) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            await prisma.property.update({
                where: { id: transaction.propertyId },
                data: {
                    featured: true,
                    featuredExpiresAt: expiresAt,
                },
            });
        }

        return { status: "success", transaction: updatedTx };
    }

    /**
     * Verify a transaction (called after callback or manually)
     */
    async verifyTransaction(reference: string) {
        const cleanRef = reference.replace(/^SIM-/i, "").replace(/^RQST-/i, "");
        const transaction = await prisma.serviceTransaction.findFirst({
            where: {
                OR: [
                    { reference },
                    { reference: cleanRef },
                    { reference: `SIM-${cleanRef}` },
                ],
            },
            include: { property: true },
        });

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        if (transaction.status === TransactionStatus.SUCCESSFUL) {
            return { status: "already_verified", transaction };
        }

        // If AfriExchange or simulated
        const meta = transaction.metadata as any;
        if (meta?.gateway === "AFRIEXCHANGE" || reference.includes("AFRI") || reference.startsWith("SIM-")) {
            return await this.completeServicePayment(reference);
        }

        // Real Paystack verification
        const verification = await paymentService.verifyPayment(reference);
        const isSuccess = verification.status === "success";

        if (isSuccess) {
            return await this.completeServicePayment(reference);
        }

        return { status: "failed" };
    }
}
