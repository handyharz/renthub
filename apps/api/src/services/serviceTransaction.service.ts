import { PrismaClient, ServiceType, TransactionStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { paymentService } from './paymentService';

export class ServiceTransactionService {
    /**
     * Initiate a service payment (Verification or Featured Listing)
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
                throw new Error('Invalid service type');
        }

        // Fetch user for email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });

        if (!user || !user.email) {
            throw new Error('User email not found for payment initialization');
        }

        // Generate unique payment reference
        const reference = paymentService.generateReference(type === ServiceType.FEATURED_LISTING ? 'FEAT' : 'VERI');

        // Initialize payment with Paystack
        const paymentData = await paymentService.initializePayment({
            email: user.email,
            amount: paymentService.nairaToKobo(amount),
            reference,
            callback_url: `${process.env.FRONTEND_URL}/dashboard?tab=properties&payment=success`, // Redirect back to landlord dashboard properties tab
            metadata: {
                userId,
                propertyId,
                type,
                serviceName: type.replace(/_/g, ' '),
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
            },
        });

        return {
            transaction,
            authorizationUrl: paymentData.authorization_url,
            accessCode: paymentData.access_code,
            reference: paymentData.reference
        };
    }

    /**
     * Verify a transaction (called after Paystack callback or manually)
     */
    async verifyTransaction(reference: string) {
        const transaction = await prisma.serviceTransaction.findUnique({
            where: { reference },
            include: { property: true },
        });

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (transaction.status === TransactionStatus.SUCCESSFUL) {
            return { status: 'already_verified', transaction };
        }

        // Real Paystack verification
        const verification = await paymentService.verifyPayment(reference);
        const isSuccess = verification.status === 'success';

        if (isSuccess) {
            // update transaction status
            const updatedTx = await prisma.serviceTransaction.update({
                where: { id: transaction.id },
                data: { status: TransactionStatus.SUCCESSFUL },
            });

            // Apply benefits based on type
            if (transaction.type === ServiceType.PROPERTY_VERIFICATION && transaction.propertyId) {
                // Queue property for physical field inspection instead of auto-verifying
                await prisma.property.update({
                    where: { id: transaction.propertyId },
                    data: {
                        status: 'PENDING_REVIEW',
                        verifiedBy: 'PAYMENT_RECEIVED_PENDING_INSPECTION'
                    },
                });
            } else if (transaction.type === ServiceType.FEATURED_LISTING && transaction.propertyId) {
                // Feature for 30 days
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                await prisma.property.update({
                    where: { id: transaction.propertyId },
                    data: {
                        featured: true,
                        featuredExpiresAt: expiresAt
                    },
                });
            }

            return { status: 'success', transaction: updatedTx };
        }

        return { status: 'failed' };
    }
}
