import axios from "axios";
import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

/**
 * Builds a deterministic reference for idempotency
 * Mirrors the pattern from AfriExchange kaalisIntegrationController.js
 */
const buildIdempotencyKey = (transactionId: string): string => {
    return `RENTHUB-ESCROW-${transactionId}`;
};

/**
 * Service responsible for disbursing landlord payouts via AfriExchange
 * after escrow is released via the 6-digit key handover OTP.
 *
 * Flow:
 *  1. Tenant hands over OTP → landlord enters it in app
 *  2. transactionService.releaseEscrowWithOTP() verifies OTP & marks RELEASED
 *  3. afriExchangePayoutService.disburseLandlordPayout() is called automatically
 *  4. We create a LandlordPayout record (PENDING)
 *  5. We call AfriExchange /integrations/renthub/payouts
 *  6. We update the record to COMPLETED or FAILED
 */
export class AfriExchangePayoutService {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly enabled: boolean;

    constructor() {
        this.baseUrl = (process.env.AFRIEXCHANGE_API_URL || "").replace(/\/$/, "");
        this.apiKey = process.env.RENTHUB_AFRIEXCHANGE_API_KEY || "";
        this.enabled = !!(this.baseUrl && this.apiKey);

        if (!this.enabled) {
            console.warn(
                "[AfriExchangePayoutService] AFRIEXCHANGE_API_URL or RENTHUB_AFRIEXCHANGE_API_KEY not set — " +
                "landlord payouts will be SKIPPED and recorded as SKIPPED in the database."
            );
        }
    }

    /**
     * Main entry point called after a successful OTP escrow release.
     * Idempotent — calling multiple times for the same transactionId is safe.
     */
    async disburseLandlordPayout(transactionId: string): Promise<void> {
        // 1. Fetch transaction with landlord and property info
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                property: {
                    include: {
                        landlord: true,
                    },
                },
            },
        });

        if (!transaction) {
            console.error(`[AfriExchangePayoutService] Transaction ${transactionId} not found`);
            return;
        }

        const landlord = transaction.property.landlord;
        const idempotencyKey = buildIdempotencyKey(transactionId);

        // 2. Check for an existing payout record (idempotency guard)
        const existingPayout = await prisma.landlordPayout.findUnique({
            where: { idempotencyKey },
        });

        if (existingPayout && existingPayout.status === "COMPLETED") {
            console.info(
                `[AfriExchangePayoutService] Payout for transaction ${transactionId} already COMPLETED (${existingPayout.id}). Skipping.`
            );
            return;
        }

        // 3. Calculate amounts
        const grossAmount = transaction.rentAmount; // escrow held amount (rent only)
        const platformFee = transaction.platformFee; // 2% already calculated
        const netAmount = grossAmount - platformFee;

        // 4. Create or reuse the payout record
        let payoutRecord = existingPayout;
        if (!payoutRecord) {
            payoutRecord = await prisma.landlordPayout.create({
                data: {
                    transactionId,
                    landlordId: landlord.id,
                    grossAmount,
                    platformFee,
                    netAmount,
                    idempotencyKey,
                    status: "PENDING",
                    metadata: {
                        propertyId: transaction.propertyId,
                        propertyTitle: transaction.property.title,
                        tenantId: transaction.tenantId,
                    },
                },
            });
        }

        // 5. If AfriExchange is not configured, mark SKIPPED and log
        if (!this.enabled) {
            await prisma.landlordPayout.update({
                where: { id: payoutRecord.id },
                data: {
                    status: "SKIPPED",
                    failureReason:
                        "AfriExchange integration not configured (AFRIEXCHANGE_API_URL / RENTHUB_AFRIEXCHANGE_API_KEY missing)",
                },
            });
            console.warn(
                `[AfriExchangePayoutService] Payout SKIPPED for tx=${transactionId} landlord=${landlord.id}. ` +
                `Net amount would have been ₦${(netAmount / 100).toLocaleString()}`
            );
            return;
        }

        // 6. Check landlord has AfriExchange account linked (or fallback to landlord primary email)
        const afriEmail = landlord.afriExchangeAccountEmail || landlord.email;
        const afriWallet = landlord.afriExchangeWalletAddress;
        const afriUserId = landlord.afriExchangeUserId;

        if (!afriUserId && !afriWallet && !afriEmail) {
            await prisma.landlordPayout.update({
                where: { id: payoutRecord.id },
                data: {
                    status: "SKIPPED",
                    failureReason: "Landlord has not linked an AfriExchange wallet and no email was found",
                },
            });
            console.warn(
                `[AfriExchangePayoutService] Payout SKIPPED for landlord ${landlord.id} — no AfriExchange account or email found.`
            );
            return;
        }

        // 7. Mark as PROCESSING
        await prisma.landlordPayout.update({
            where: { id: payoutRecord.id },
            data: {
                status: "PROCESSING",
                attemptCount: { increment: 1 },
                lastAttemptAt: new Date(),
            },
        });

        // 8. Call AfriExchange
        try {
            const payload = {
                idempotencyKey,
                rentHubPayoutId: payoutRecord.id,
                rentHubTransactionId: transactionId,
                landlordRentHubId: landlord.id,
                // Landlord's AfriExchange identity (at least one required)
                landlordAfriExchangeUserId: afriUserId || undefined,
                landlordWalletAddress: afriWallet || undefined,
                landlordAccountEmail: afriEmail || undefined,
                // Amount in kobo (AfriExchange expects sub-unit amounts)
                amount: netAmount,
                currency: "NGN",
                grossAmount,
                platformFee,
                description: `RentHub landlord payout — ${transaction.property.title} (tx: ${transactionId})`,
                metadata: {
                    propertyId: transaction.propertyId,
                    transactionId,
                },
            };

            const response = await axios.post(
                `${this.baseUrl}/integrations/renthub/payouts`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-renthub-api-key": this.apiKey,
                    },
                    timeout: 15000,
                }
            );

            const data = (response.data as { data?: { payoutId?: string; reference?: string } })?.data || {};

            // 9. Mark COMPLETED
            await prisma.landlordPayout.update({
                where: { id: payoutRecord.id },
                data: {
                    status: "COMPLETED",
                    afriExchangePayoutId: data.payoutId || null,
                    afriExchangeRef: data.reference || null,
                    processedAt: new Date(),
                },
            });

            console.info(
                `[AfriExchangePayoutService] ✅ Payout COMPLETED for tx=${transactionId} ` +
                `landlord=${landlord.id} net=₦${(netAmount / 100).toLocaleString()} ` +
                `afriPayoutId=${data.payoutId}`
            );
        } catch (error: unknown) {
            let reason = "Unknown AfriExchange API error";
            if (axios.isAxiosError(error)) {
                reason =
                    (error.response?.data as { message?: string })?.message ||
                    error.message ||
                    reason;
            } else if (error instanceof Error) {
                reason = error.message;
            }

            // 10. Mark FAILED
            await prisma.landlordPayout.update({
                where: { id: payoutRecord.id },
                data: {
                    status: "FAILED",
                    failureReason: reason,
                },
            });

            console.error(
                `[AfriExchangePayoutService] ❌ Payout FAILED for tx=${transactionId} landlord=${landlord.id}: ${reason}`
            );
            // Don't rethrow — payout failure should never block the escrow release response
        }
    }

    /**
     * Retry a failed payout manually (admin use)
     */
    async retryFailedPayout(payoutId: string): Promise<void> {
        const payout = await prisma.landlordPayout.findUnique({
            where: { id: payoutId },
        });

        if (!payout) {
            throw new Error(`LandlordPayout ${payoutId} not found`);
        }

        if (payout.status === "COMPLETED") {
            throw new Error("Payout is already completed");
        }

        await this.disburseLandlordPayout(payout.transactionId);
    }

    /**
     * Summary of all payouts for admin overview
     */
    async getPayoutSummary() {
        const [total, pending, processing, completed, failed, skipped] = await Promise.all([
            prisma.landlordPayout.count(),
            prisma.landlordPayout.count({ where: { status: "PENDING" } }),
            prisma.landlordPayout.count({ where: { status: "PROCESSING" } }),
            prisma.landlordPayout.count({ where: { status: "COMPLETED" } }),
            prisma.landlordPayout.count({ where: { status: "FAILED" } }),
            prisma.landlordPayout.count({ where: { status: "SKIPPED" } }),
        ]);

        const totalNetPaid = await prisma.landlordPayout.aggregate({
            _sum: { netAmount: true },
            where: { status: "COMPLETED" },
        });

        const totalPlatformFee = await prisma.landlordPayout.aggregate({
            _sum: { platformFee: true },
            where: { status: "COMPLETED" },
        });

        return {
            totalPayouts: total,
            completedPayouts: completed,
            pendingPayouts: pending,
            processingPayouts: processing,
            failedPayouts: failed,
            skippedPayouts: skipped,
            totalDisbursedAmount: totalNetPaid._sum.netAmount || 0,
            totalPlatformFees: totalPlatformFee._sum.platformFee || 0,
            counts: { total, pending, processing, completed, failed, skipped },
            totals: {
                netPaidToLandlords: totalNetPaid._sum.netAmount || 0,
                platformFeesCollected: totalPlatformFee._sum.platformFee || 0,
            },
        };
    }
}

export const afriExchangePayoutService = new AfriExchangePayoutService();
