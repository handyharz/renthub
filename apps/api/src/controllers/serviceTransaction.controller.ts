import { Request, Response } from 'express';
import { ServiceTransactionService } from '../services/serviceTransaction.service';
import { ServiceType } from '@prisma/client';

const serviceTransactionService = new ServiceTransactionService();

export class ServiceTransactionController {

    /**
     * INITIATE PAYMENT
     * POST /api/services/pay
     * Body: { type: 'PROPERTY_VERIFICATION' | 'FEATURED_LISTING', propertyId: string }
     */
    async initiate(req: Request, res: Response): Promise<void> {
        try {
            // Assuming userId is available from auth middleware (req.user.id)
            // Check interface augmentation for req.user
            const userId = (req as any).user?.id;

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { type, propertyId } = req.body;

            if (!type || !Object.values(ServiceType).includes(type)) {
                res.status(400).json({ error: 'Invalid service type' });
                return;
            }

            if ((type === ServiceType.PROPERTY_VERIFICATION || type === ServiceType.FEATURED_LISTING) && !propertyId) {
                res.status(400).json({ error: 'Property ID is required for this service' });
                return;
            }

            const result = await serviceTransactionService.initiateTransaction(userId, type, propertyId);

            res.status(201).json({
                message: 'Payment initiated successfully',
                data: result
            });
        } catch (error: any) {
            console.error('Initiate payment error:', error);
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }

    /**
     * VERIFY PAYMENT
     * POST /api/services/verify
     * Body: { reference: string }
     */
    async verify(req: Request, res: Response): Promise<void> {
        try {
            const { reference } = req.body;

            if (!reference) {
                res.status(400).json({ error: 'Transaction reference is required' });
                return;
            }

            const result = await serviceTransactionService.verifyTransaction(reference);

            if (result.status === 'failed') {
                res.status(400).json({ error: 'Payment verification failed' });
                return;
            }

            res.status(200).json({
                message: 'Payment verified successfully',
                data: result
            });
        } catch (error: any) {
            console.error('Verify payment error:', error);
            if (error.message === 'Transaction not found') {
                res.status(404).json({ success: false, message: 'Transaction not found' });
                return;
            }
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
}
