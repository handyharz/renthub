import axios from "axios";
import crypto from "crypto";

export interface AnchorVirtualAccountResult {
    ledgerId: string;
    virtualNuban: string;
    bankName: string;
    accountName: string;
    cautionLedgerId: string;
    reference: string;
}

export interface AnchorPayoutParams {
    transactionId: string;
    amountKobo: number;
    destinationBankCode: string;
    destinationAccountNumber: string;
    destinationAccountName: string;
    narration?: string;
}

export interface AnchorPayoutResult {
    transferId: string;
    reference: string;
    status: "SUCCESSFUL" | "PENDING" | "FAILED";
    feeKobo: number;
    destinationAccount: string;
}

export interface AnchorCustomFeeResult {
    feeId: string;
    amountKobo: number;
    sourceLedgerId: string;
    destinationLedgerId: string;
    status: string;
}

export class AnchorService {
    private baseUrl: string;
    private apiKey: string;
    private webhookSecret: string;
    private revenueLedgerId: string;
    private escrowPoolId: string;

    constructor() {
        this.baseUrl = process.env.ANCHOR_BASE_URL || "https://api.getanchor.co/api/v1";
        this.apiKey = process.env.ANCHOR_API_KEY || "";
        this.webhookSecret = process.env.ANCHOR_WEBHOOK_SECRET || "";
        this.revenueLedgerId = process.env.ANCHOR_REVENUE_LEDGER_ID || "ledg_rev_renthub_platform_fees";
        this.escrowPoolId = process.env.ANCHOR_ESCROW_POOL_ID || "ledg_escrow_pool_holding";

        if (!this.apiKey && process.env.NODE_ENV === "production") {
            console.warn("⚠️  ANCHOR_API_KEY is not set in environment variables");
        }
    }

    /**
     * Exact integer Naira to Kobo conversion.
     * Prevents IEEE 754 floating point precision issues.
     */
    nairaToKobo(naira: number): number {
        return Math.round(naira * 100);
    }

    /**
     * Exact integer Kobo to Naira conversion.
     */
    koboToNaira(kobo: number): number {
        return Math.floor(kobo / 100);
    }

    /**
     * Generate dedicated Virtual NUBAN sub-ledger and Caution sub-ledger for a transaction.
     * Inflow fee: 0.5% capped at ₦200 + ₦50 EMTL = ₦250 total.
     */
    async createEscrowSubAccount(
        transactionId: string,
        totalAmountNaira: number,
        tenantName: string,
        landlordName: string
    ): Promise<AnchorVirtualAccountResult> {
        const reference = `rh_escrow_${transactionId}`;

        // Development / Test mock fallback when API key is not configured or in dev mode
        if (!this.apiKey || process.env.NODE_ENV === "test" || process.env.ANCHOR_MOCK === "true") {
            // Deterministic pseudo-NUBAN based on transactionId hash
            const hash = crypto.createHash("md5").update(transactionId).digest("hex");
            const virtualNuban = "99" + hash.replace(/\D/g, "").slice(0, 8).padEnd(8, "0");
            const ledgerId = `ledg_escrow_${transactionId.slice(-8)}`;
            const cautionLedgerId = `ledg_caution_${transactionId.slice(-8)}`;

            return {
                ledgerId,
                virtualNuban,
                bankName: "Providus Bank / Anchor BaaS",
                accountName: `RentHub Escrow: ${tenantName.slice(0, 15)}`,
                cautionLedgerId,
                reference,
            };
        }

        try {
            // 1. Create main transaction escrow account
            const response = await axios.post(
                `${this.baseUrl}/accounts`,
                {
                    reference,
                    accountType: "SUB_ACCOUNT",
                    metadata: {
                        transactionId,
                        tenantName,
                        landlordName,
                        purpose: "RENT_AND_CAUTION_ESCROW",
                        totalAmountKobo: this.nairaToKobo(totalAmountNaira),
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const accountData = response.data.data;

            // 2. Create segregated caution ledger (for damage deposit compliance)
            const cautionResponse = await axios.post(
                `${this.baseUrl}/accounts`,
                {
                    reference: `rh_caution_${transactionId}`,
                    accountType: "SUB_LEDGER",
                    parentAccountId: accountData.id,
                    metadata: {
                        transactionId,
                        purpose: "SEGREGATED_CAUTION_LIABILITY",
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return {
                ledgerId: accountData.id,
                virtualNuban: accountData.accountNumber,
                bankName: accountData.bankName || "Anchor / Partner Bank",
                accountName: accountData.accountName,
                cautionLedgerId: cautionResponse.data.data.id,
                reference,
            };
        } catch (error: any) {
            console.error("[AnchorService] Failed to create escrow sub-account:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to create Anchor escrow sub-account");
        }
    }

    /**
     * Deduct 2% RentHub platform protection fee from the escrow ledger into the organization revenue ledger.
     * Uses Anchor Custom Fee API (/api/v1/fee/custom-fee).
     */
    async deductPlatformFee(
        sourceLedgerId: string,
        feeKobo: number,
        transactionId: string
    ): Promise<AnchorCustomFeeResult> {
        const idempotencyKey = `fee_${transactionId}`;

        if (!this.apiKey || process.env.NODE_ENV === "test" || process.env.ANCHOR_MOCK === "true") {
            return {
                feeId: `fee_mock_${transactionId.slice(-8)}`,
                amountKobo: feeKobo,
                sourceLedgerId,
                destinationLedgerId: this.revenueLedgerId,
                status: "COMPLETED",
            };
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/fee/custom-fee`,
                {
                    sourceAccountId: sourceLedgerId,
                    destinationAccountId: this.revenueLedgerId,
                    amount: feeKobo,
                    currency: "NGN",
                    description: `RentHub 2% Escrow Protection Fee for tx=${transactionId}`,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Idempotency-Key": idempotencyKey,
                        "Content-Type": "application/json",
                    },
                }
            );

            return {
                feeId: response.data.data.id,
                amountKobo: response.data.data.amount,
                sourceLedgerId,
                destinationLedgerId: this.revenueLedgerId,
                status: response.data.data.status,
            };
        } catch (error: any) {
            console.error("[AnchorService] Platform fee deduction failed:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to deduct platform fee via Anchor");
        }
    }

    /**
     * Disburse escrowed rent to Landlord via Anchor NIP Transfer rail (₦20 flat fee).
     * Enforces deterministic idempotency key = "payout_" + transactionId.
     */
    async disburseToLandlord(params: AnchorPayoutParams): Promise<AnchorPayoutResult> {
        const {
            transactionId,
            amountKobo,
            destinationBankCode,
            destinationAccountNumber,
            destinationAccountName,
            narration,
        } = params;

        const idempotencyKey = `payout_${transactionId}`;

        if (!this.apiKey || process.env.NODE_ENV === "test" || process.env.ANCHOR_MOCK === "true") {
            return {
                transferId: `trf_mock_${transactionId.slice(-8)}`,
                reference: idempotencyKey,
                status: "SUCCESSFUL",
                feeKobo: 2000, // ₦20 flat in kobo
                destinationAccount: `${destinationAccountNumber} (${destinationBankCode})`,
            };
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/transfers`,
                {
                    channel: "NIP",
                    amount: amountKobo,
                    currency: "NGN",
                    destinationBankCode,
                    destinationAccountNumber,
                    destinationAccountName,
                    narration: narration || `RentHub Escrow Release for tx=${transactionId}`,
                    reference: idempotencyKey,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Idempotency-Key": idempotencyKey,
                        "Content-Type": "application/json",
                    },
                }
            );

            const transfer = response.data.data;
            return {
                transferId: transfer.id,
                reference: transfer.reference,
                status: transfer.status === "SUCCESS" ? "SUCCESSFUL" : "PENDING",
                feeKobo: transfer.fee || 2000,
                destinationAccount: `${destinationAccountNumber} (${destinationBankCode})`,
            };
        } catch (error: any) {
            console.error("[AnchorService] Landlord NIP disbursement failed:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Anchor NIP disbursement failed");
        }
    }

    /**
     * Rollover caution deposit between leases on 1-Click Lease Renewal.
     * Intra-bank Book Transfer: ₦0 fee.
     */
    async rolloverCautionLedger(
        oldCautionLedgerId: string,
        newCautionLedgerId: string,
        amountKobo: number,
        renewalId: string
    ): Promise<{ transferId: string; status: string; feeKobo: number }> {
        const idempotencyKey = `rollover_${renewalId}`;

        if (!this.apiKey || process.env.NODE_ENV === "test" || process.env.ANCHOR_MOCK === "true") {
            return {
                transferId: `book_mock_${renewalId.slice(-8)}`,
                status: "COMPLETED",
                feeKobo: 0,
            };
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/transfers`,
                {
                    channel: "BOOK",
                    sourceAccountId: oldCautionLedgerId,
                    destinationAccountId: newCautionLedgerId,
                    amount: amountKobo,
                    currency: "NGN",
                    narration: `RentHub Caution Deposit Rollover for renewal=${renewalId}`,
                    reference: idempotencyKey,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Idempotency-Key": idempotencyKey,
                        "Content-Type": "application/json",
                    },
                }
            );

            return {
                transferId: response.data.data.id,
                status: response.data.data.status,
                feeKobo: 0,
            };
        } catch (error: any) {
            console.error("[AnchorService] Caution ledger rollover failed:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to rollover caution deposit via Anchor");
        }
    }

    /**
     * Verify raw buffer HMAC-SHA256 signature for incoming Anchor webhooks.
     * Includes timestamp replay protection (rejects events older than 300s).
     */
    verifyWebhookSignature(
        rawBody: string | Buffer,
        signatureHeader?: string,
        timestampHeader?: string
    ): boolean {
        if (!this.webhookSecret) {
            if (process.env.NODE_ENV === "production") {
                console.error("[AnchorService] ANCHOR_WEBHOOK_SECRET is not configured in production");
                return false;
            }
            // Allow mock verification in dev if test header matches
            return signatureHeader === "test-anchor-signature";
        }

        if (!signatureHeader) {
            return false;
        }

        // Timestamp replay protection
        if (timestampHeader) {
            const eventTime = parseInt(timestampHeader, 10);
            const now = Math.floor(Date.now() / 1000);
            if (isNaN(eventTime) || Math.abs(now - eventTime) > 300) {
                console.warn("[AnchorService] Webhook rejected: timestamp expired or drifted > 300s");
                return false;
            }
        }

        const expectedSignature = crypto
            .createHmac("sha256", this.webhookSecret)
            .update(rawBody)
            .digest("hex");

        try {
            return crypto.timingSafeEqual(
                Buffer.from(signatureHeader, "hex"),
                Buffer.from(expectedSignature, "hex")
            );
        } catch {
            return false;
        }
    }

    /**
     * Fetch balance of an Anchor account or ledger in kobo.
     * Used by the 6-hour automated reconciliation cron for institutional audits.
     */
    async getLedgerBalance(ledgerId: string): Promise<number> {
        if (!this.apiKey || process.env.NODE_ENV === "test" || process.env.ANCHOR_MOCK === "true") {
            return 0;
        }

        try {
            const response = await axios.get(`${this.baseUrl}/accounts/${ledgerId}/balance`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            return response.data.data.availableBalance || 0;
        } catch (error: any) {
            console.error(`[AnchorService] Failed to fetch balance for ledger ${ledgerId}:`, error.message);
            throw error;
        }
    }

    /**
     * Settle Landlord via Anchor NIP Transfer rail.
     * Creates or updates LandlordPayout record with payoutRail = "ANCHOR_NIP".
     * Idempotent — safe against retry loops.
     */
    async disburseLandlordPayout(transactionId: string): Promise<void> {
        const { prisma } = require("../config/database");

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
            console.error(`[AnchorService] Transaction ${transactionId} not found`);
            return;
        }

        const landlord = transaction.property.landlord;
        const idempotencyKey = `payout_${transactionId}`;

        const existingPayout = await prisma.landlordPayout.findUnique({
            where: { idempotencyKey },
        });

        if (existingPayout && existingPayout.status === "COMPLETED") {
            console.info(`[AnchorService] Payout for tx=${transactionId} already COMPLETED. Skipping.`);
            return;
        }

        const grossAmount = transaction.rentAmount;
        const platformFee = transaction.platformFee;
        const netAmount = grossAmount - platformFee;

        // Create or reuse payout record with payoutRail: "ANCHOR_NIP"
        let payout = existingPayout;
        if (!payout) {
            payout = await prisma.landlordPayout.create({
                data: {
                    transactionId,
                    landlordId: landlord.id,
                    grossAmount,
                    platformFee,
                    netAmount,
                    idempotencyKey,
                    payoutRail: "ANCHOR_NIP",
                    status: "PENDING",
                },
            });
        }

        const bankCode = (landlord as any).bankCode || "058";
        const accountNumber = (landlord as any).accountNumber || "0123456789";
        const accountName = `${landlord.firstName || ""} ${landlord.lastName || ""}`.trim() || "Landlord";

        try {
            const transferResult = await this.disburseToLandlord({
                transactionId,
                amountKobo: this.nairaToKobo(netAmount),
                destinationBankCode: bankCode,
                destinationAccountNumber: accountNumber,
                destinationAccountName: accountName,
                narration: `RentHub Escrow Release for ${transaction.property.title}`,
            });

            await prisma.landlordPayout.update({
                where: { id: payout.id },
                data: {
                    status: "COMPLETED",
                    anchorTransferId: transferResult.transferId,
                    anchorReference: transferResult.reference,
                    processedAt: new Date(),
                    metadata: {
                        rail: "ANCHOR_NIP",
                        feeKobo: transferResult.feeKobo,
                        destinationAccount: transferResult.destinationAccount,
                    },
                },
            });

            // Dispatch in-app notification to landlord
            try {
                await prisma.notification.create({
                    data: {
                        userId: landlord.id,
                        type: "PAYMENT_CONFIRMED",
                        title: "Escrow Disbursed to Bank Account",
                        message: `₦${netAmount.toLocaleString()} has been disbursed via NIP to your bank account (${accountNumber}) for ${transaction.property.title}.`,
                        actionUrl: "/dashboard/payouts",
                        actionText: "View Payout",
                    },
                });
            } catch (notifyErr) {
                console.warn("[AnchorService] Failed to create payout notification:", notifyErr);
            }
        } catch (disburseErr: any) {
            console.error(`[AnchorService] NIP transfer failed for tx=${transactionId}:`, disburseErr.message);
            await prisma.landlordPayout.update({
                where: { id: payout.id },
                data: {
                    status: "FAILED",
                    failureReason: disburseErr.message,
                    lastAttemptAt: new Date(),
                    attemptCount: { increment: 1 },
                },
            });
        }
    }

    /**
     * Query total balance in the organization escrow pool account.
     */
    async getEscrowPoolBalance(): Promise<number> {
        return this.getLedgerBalance(this.escrowPoolId);
    }
}

export const anchorService = new AnchorService();

