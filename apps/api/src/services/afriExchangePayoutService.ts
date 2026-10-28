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

        // 6. Strict Security Check: Landlord MUST have explicitly linked & verified their AfriExchange settlement account
        const isSettlementLinked = Boolean(
            landlord.settlementLinkedAt &&
            (landlord.afriExchangeUserId || landlord.afriExchangeWalletAddress || landlord.afriExchangeAccountEmail)
        );

        if (!isSettlementLinked) {
            await prisma.landlordPayout.update({
                where: { id: payoutRecord.id },
                data: {
                    status: "SKIPPED",
                    failureReason: "AfriExchange settlement account not linked. Landlord must verify and link their AfriExchange account in the Payouts dashboard to receive released escrow.",
                },
            });
            console.warn(
                `[AfriExchangePayoutService] Strict Security Enforcement: Payout SKIPPED for tx=${transactionId} landlord=${landlord.id}. AfriExchange settlement account not verified or linked.`
            );

            // Notify landlord so funds are not left silently stuck
            try {
                await prisma.notification.create({
                    data: {
                        userId: landlord.id,
                        type: "SYSTEM",
                        title: "Action Required: Link AfriExchange Account",
                        message: `Your escrow payment of ₦${netAmount.toLocaleString()} for ${transaction.property.title} has been released! Please link your verified AfriExchange wallet or email in Settings > Payouts to disburse funds.`,
                        actionUrl: "/dashboard/payouts",
                        actionText: "Link Settlement Account",
                    },
                });
            } catch (notifyErr) {
                console.warn("[AfriExchangePayoutService] Failed to create settlement notification:", notifyErr);
            }
            return;
        }

        const afriEmail = landlord.afriExchangeAccountEmail;
        const afriWallet = landlord.afriExchangeWalletAddress;
        const afriUserId = landlord.afriExchangeUserId;

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
                    failureReason: null,
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
        const [total, pending, processing, completed, failed, skipped, grossAgg, skippedNoWallet] = await Promise.all([
            prisma.landlordPayout.count(),
            prisma.landlordPayout.count({ where: { status: "PENDING" } }),
            prisma.landlordPayout.count({ where: { status: "PROCESSING" } }),
            prisma.landlordPayout.count({ where: { status: "COMPLETED" } }),
            prisma.landlordPayout.count({ where: { status: "FAILED" } }),
            prisma.landlordPayout.count({ where: { status: "SKIPPED" } }),
            prisma.landlordPayout.aggregate({
                _sum: { grossAmount: true, netAmount: true, platformFee: true },
                where: { status: "COMPLETED" },
            }),
            // Skipped because landlord has no wallet linked
            prisma.landlordPayout.count({
                where: {
                    status: "SKIPPED",
                    landlord: { afriExchangeWalletAddress: null },
                },
            }),
        ]);

        const netPaid = grossAgg._sum.netAmount || 0;
        const grossDisbursed = grossAgg._sum.grossAmount || 0;
        const platformFees = grossAgg._sum.platformFee || 0;
        const successRate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;
        const actionableCount = failed + skipped;

        return {
            totalPayouts: total,
            completedPayouts: completed,
            pendingPayouts: pending,
            processingPayouts: processing,
            failedPayouts: failed,
            skippedPayouts: skipped,
            skippedNoWallet,
            totalDisbursedAmount: netPaid,
            grossDisbursedAmount: grossDisbursed,
            totalPlatformFees: platformFees,
            successRate,
            actionableCount,
            counts: { total, pending, processing, completed, failed, skipped },
            totals: {
                netPaidToLandlords: netPaid,
                grossEscrowReleased: grossDisbursed,
                platformFeesCollected: platformFees,
            },
        };
    }
}

export const afriExchangePayoutService = new AfriExchangePayoutService();
