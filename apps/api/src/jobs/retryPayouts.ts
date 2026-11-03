import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { anchorService } from "../services/anchorService";
import { afriExchangePayoutService } from "../services/afriExchangePayoutService";

const MAX_ATTEMPTS = 8;
const STALE_MS = 2 * 60 * 1000;
const PROCESSING_STALE_MS = 15 * 60 * 1000;

export async function retryFailedLandlordPayouts(): Promise<number> {
    const now = Date.now();
    const staleBefore = new Date(now - STALE_MS);
    const processingBefore = new Date(now - PROCESSING_STALE_MS);

    const payouts = await prisma.landlordPayout.findMany({
        where: {
            attemptCount: { lt: MAX_ATTEMPTS },
            OR: [
                { status: "PENDING", lastAttemptAt: null },
                { status: "PENDING", lastAttemptAt: { lt: staleBefore } },
                { status: "FAILED", lastAttemptAt: { lt: staleBefore } },
                { status: "PROCESSING", lastAttemptAt: { lt: processingBefore } },
            ],
        },
        include: {
            transaction: { select: { id: true, paymentGateway: true } },
        },
        take: 25,
    });

    for (const payout of payouts) {
        try {
            if (payout.payoutRail === "ANCHOR_NIP" || payout.transaction.paymentGateway === "ANCHOR") {
                await anchorService.disburseLandlordPayout(payout.transactionId);
            } else {
                await afriExchangePayoutService.disburseLandlordPayout(payout.transactionId);
            }
        } catch (err: any) {
            logger.warn(`[retry-payouts] tx=${payout.transactionId} failed: ${err.message}`);
        }
    }

    if (payouts.length) {
        logger.info(`[retry-payouts] attempted ${payouts.length} landlord payouts`);
    }
    return payouts.length;
}
