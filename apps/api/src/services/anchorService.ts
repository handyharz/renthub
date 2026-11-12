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
        this.escrowPoolId = process.env.ANCHOR_ESCROW_POOL_ID || "17943034048583-anc_acc";

        if (!this.apiKey && process.env.NODE_ENV === "production") {
            console.warn("⚠️  ANCHOR_API_KEY is not set in environment variables");
        }
    }

    /**
     * Startup verification: validates that Anchor environment variables are correctly provisioned
     * and alerts or fails fast if an invalid placeholder or missing FBO account ID is detected.
     */
    validateConfiguration(): { valid: boolean; warnings: string[]; errors: string[] } {
        const warnings: string[] = [];
        const errors: string[] = [];

        if (!this.apiKey) {
            if (process.env.NODE_ENV === "production") {
                errors.push("ANCHOR_API_KEY is missing in production environment");
            } else {
                warnings.push("ANCHOR_API_KEY is not set (mock mode enabled)");
            }
        }

        // Check if escrowPoolId is invalid or placeholder
        if (!this.escrowPoolId || this.escrowPoolId.startsWith("ledg_")) {
            const msg = `ANCHOR_ESCROW_POOL_ID is set to placeholder ('${this.escrowPoolId}'). Anchor requires a valid DepositAccount ID (e.g. 17943034048583-anc_acc). Transfers will fail.`;
            if (process.env.NODE_ENV === "production") {
                errors.push(msg);
            } else {
                warnings.push(msg);
            }
        } else if (!this.escrowPoolId.endsWith("-anc_acc")) {
            warnings.push(`ANCHOR_ESCROW_POOL_ID ('${this.escrowPoolId}') does not match expected Anchor DepositAccount format ('...-anc_acc').`);
        }

        return { valid: errors.length === 0, warnings, errors };
    }

    /**
     * Standard Anchor BaaS HTTP headers.
     * Anchor requires 'x-anchor-key', supports 'Authorization: Bearer' as fallback.
     */
    private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
        return {
            "x-anchor-key": this.apiKey,
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            ...extraHeaders,
        };
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
     * Generate dedicated Virtual NUBAN linked to the FBO Escrow Pool.
     * Uses Anchor BaaS official Virtual NUBAN endpoint (POST /api/v1/virtual-nubans).
     */
    async createEscrowSubAccount(
        transactionId: string,
        totalAmountNaira: number,
        tenantName: string,
        landlordName: string,
        tenantEmail?: string,
        tenantBvn?: string
    ): Promise<AnchorVirtualAccountResult> {
        const reference = `rh_escrow_${transactionId}`;

        // Development / Test mock fallback when API key is not configured or in test mode
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
            // Anchor BaaS Official Virtual NUBAN (JSON:API format) linked to FBO Escrow Pool
            const virtualNubanPayload = {
                data: {
                    type: "VirtualNuban",
                    attributes: {
                        virtualAccountDetail: {
                            name: `RentHub: ${tenantName.slice(0, 20)}`,
                            bvn: tenantBvn || "22222222226", // Sandbox test BVN fallback
                            reference,
                            email: tenantEmail || "escrow@renthub.ng",
                            description: `RentHub Escrow for tx=${transactionId} (Landlord: ${landlordName})`,
                            permanent: false,
                        },
                    },
                    relationships: {
                        settlementAccount: {
                            data: {
                                type: "DepositAccount",
                                id: this.escrowPoolId,
                            },
                        },
                    },
                },
            };

            const response = await axios.post(
                `${this.baseUrl}/virtual-nubans`,
                virtualNubanPayload,
                {
                    headers: this.getHeaders(),
                }
            );

            const vData = response.data?.data;
            const attributes = vData?.attributes || {};
            const bankInfo = attributes?.bank || {};

            const virtualNuban = attributes.accountNumber || vData?.id;
            const bankName = bankInfo.name ? `${bankInfo.name}` : "PROVIDUS BANK";
            const accountName = attributes.accountName || `RentHub Escrow: ${tenantName}`;

            return {
                ledgerId: vData?.id || reference,
                virtualNuban,
                bankName,
                accountName,
                cautionLedgerId: `caution_${vData?.id || reference}`,
                reference,
            };
        } catch (error: any) {
            console.error("[AnchorService] Failed to create escrow Virtual NUBAN:", error.response?.data || error.message);
            throw new Error(error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || "Failed to create Anchor Virtual NUBAN");
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
                    headers: this.getHeaders({ "Idempotency-Key": idempotencyKey }),
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
     * Calculate the actual Anchor NIP transfer fee for a given kobo amount.
     * Anchor charges: ₦50 flat + 0.1% of amount, capped at ₦50,000.
     * (Note: values < ₦10,000 are free — but rent amounts always exceed this.)
     */
    computeAnchorNipFeeKobo(amountKobo: number): number {
        const flatFeeKobo = 5000;                       // ₦50 flat
        const percentFeeKobo = Math.round(amountKobo * 0.001); // 0.1%
        const rawFeeKobo = flatFeeKobo + percentFeeKobo;
        return Math.min(rawFeeKobo, 5000000);            // cap at ₦50,000
    }

    /**
     * Disburse escrowed rent to Landlord via Anchor NIP Transfer rail.
     * Fee: ₦50 + 0.1% (capped at ₦50,000). Enforces deterministic
     * idempotency key = "payout_" + transactionId.
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
                feeKobo: this.computeAnchorNipFeeKobo(amountKobo),
                destinationAccount: `${destinationAccountNumber} (${destinationBankCode})`,
            };
        }

        try {
            // Step 1: Register or resolve CounterParty in Anchor
            let counterPartyId: string | undefined;
            try {
                const cpRes = await axios.post(
                    `${this.baseUrl}/counterparties`,
                    {
                        data: {
                            type: "CounterParty",
                            attributes: {
                                bankCode: destinationBankCode,
                                accountName: destinationAccountName,
                                accountNumber: destinationAccountNumber,
                                // Fix (Claude): In production, verify the account name matches
                                // the landlord's registered account to prevent misdirected payouts.
                                verifyName: process.env.NODE_ENV === "production",
                            },
                        },
                    },
                    { headers: this.getHeaders() }
                );
                counterPartyId = cpRes.data?.data?.id;
            } catch (cpErr: any) {
                console.warn("[AnchorService] CounterParty resolution note:", cpErr.response?.data || cpErr.message);
                counterPartyId = cpErr.response?.data?.data?.id || cpErr.response?.data?.errors?.[0]?.meta?.id;
            }

            if (!counterPartyId) {
                throw new Error("Failed to register Landlord bank account CounterParty with Anchor");
            }

            // Step 2: Post NIPTransfer via Anchor JSON:API schema
            const transferPayload = {
                data: {
                    type: "NIPTransfer",
                    attributes: {
                        amount: amountKobo,
                        currency: "NGN",
                        reason: narration || `RentHub Escrow Release for tx=${transactionId}`,
                        reference: idempotencyKey,
                    },
                    relationships: {
                        counterParty: {
                            data: {
                                type: "CounterParty",
                                id: counterPartyId,
                            },
                        },
                        account: {
                            data: {
                                type: "DepositAccount",
                                id: this.escrowPoolId,
                            },
                        },
                    },
                },
            };

            const response = await axios.post(
                `${this.baseUrl}/transfers`,
                transferPayload,
                {
                    headers: this.getHeaders({ "Idempotency-Key": idempotencyKey }),
                }
            );

            const transfer = response.data?.data;
            const transferStatus = transfer?.attributes?.status;
            // Anchor may return "SUCCESS", "PENDING", "PROCESSING", or "FAILED"
            const normalizedStatus: AnchorPayoutResult["status"] =
                transferStatus === "SUCCESS" || transferStatus === "SUCCESSFUL"
                    ? "SUCCESSFUL"
                    : transferStatus === "FAILED"
                    ? "FAILED"
                    : "PENDING";
            const computedFee = this.computeAnchorNipFeeKobo(amountKobo);
            return {
                transferId: transfer?.id || `trf_${Date.now()}`,
                reference: transfer?.attributes?.reference || idempotencyKey,
                status: normalizedStatus,
                feeKobo: transfer?.attributes?.fee ?? computedFee,
                destinationAccount: `${destinationAccountNumber} (${destinationBankCode})`,
            };
        } catch (error: any) {
            console.error("[AnchorService] Landlord NIP disbursement failed:", error.response?.data || error.message);
            // Fix (Claude): A 500 from Anchor means the transfer did NOT go through —
            // likely because the payment is still unsettled on Anchor's side.
            // We MUST NOT simulate success here — throw so disburseLandlordPayout
            // marks the payout as FAILED and keeps the property in PAYOUT_PENDING state.
            // The sandbox "Internal Error" is a real error, not a quirk to work around.
            if (this.baseUrl.includes("sandbox") && (error.response?.status === 500 || error.response?.data?.errors?.[0]?.title === "Internal Error")) {
                console.warn(
                    `[AnchorService] Anchor sandbox returned 500 on POST /transfers for tx=${transactionId}. ` +
                    `This likely means the payment (${idempotencyKey}) is unsettled. ` +
                    `Ask Fortunate at Anchor to settle it and retry payout.`
                );
                // Re-throw as a retriable error — do NOT fake success
            }
            throw new Error(error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || "Anchor NIP disbursement failed");
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
                    headers: this.getHeaders({ "Idempotency-Key": idempotencyKey }),
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
     * Verify HMAC signature for incoming Anchor webhooks.
     * Anchor specifies Base64-encoded HMAC-SHA1 signature in `x-anchor-signature`.
     * Also supports HMAC-SHA256 hex as fallback.
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

        // Optional timestamp check (only enforce if header is sent)
        if (timestampHeader) {
            const eventTime = parseInt(timestampHeader, 10);
            const now = Math.floor(Date.now() / 1000);
            const ts = eventTime > 1e12 ? Math.floor(eventTime / 1000) : eventTime;
            if (!isNaN(ts) && Math.abs(now - ts) > 300) {
                console.warn("[AnchorService] Webhook rejected: timestamp expired or drifted > 300s");
                return false;
            }
        }

        const raw = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");

        // 1. Official Anchor BaaS signature: Base64(HMAC_SHA1(rawBody, secretToken).digest('hex'))
        try {
            const hexDigest = crypto.createHmac("sha1", this.webhookSecret).update(raw).digest("hex");
            const expectedBase64 = Buffer.from(hexDigest).toString("base64");
            if (
                signatureHeader.length === expectedBase64.length &&
                crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedBase64))
            ) {
                return true;
            }
        } catch { }

        // 2. Direct Base64 digest of HMAC-SHA1
        try {
            const expectedDirectBase64 = crypto.createHmac("sha1", this.webhookSecret).update(raw).digest("base64");
            if (
                signatureHeader.length === expectedDirectBase64.length &&
                crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedDirectBase64))
            ) {
                return true;
            }
        } catch { }

        // 3. Fallback HMAC-SHA256 hex digest
        try {
            const expectedSha256Hex = crypto.createHmac("sha256", this.webhookSecret).update(raw).digest("hex");
            if (
                signatureHeader.length === expectedSha256Hex.length &&
                crypto.timingSafeEqual(Buffer.from(signatureHeader, "hex"), Buffer.from(expectedSha256Hex, "hex"))
            ) {
                return true;
            }
        } catch { }

        return false;
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
                // Anchor endpoint: GET /api/v1/accounts/balance/{accountId}
                const response = await axios.get(`${this.baseUrl}/accounts/balance/${ledgerId}`, {
                    headers: this.getHeaders(),
                });
                const data = response.data?.data || response.data?.attributes || response.data || {};
                const bal = data.availableBalance ?? data.balance ?? 0;
                return typeof bal === "number" ? bal : parseFloat(bal) || 0;
            } catch (error: any) {
                // Fallback: Query account details via GET /api/v1/accounts/{accountId}
                try {
                    const accRes = await axios.get(`${this.baseUrl}/accounts/${ledgerId}`, {
                        headers: this.getHeaders(),
                    });
                    const attr = accRes.data?.data?.attributes || {};
                    const bal = attr.availableBalance ?? attr.balance ?? 0;
                    return typeof bal === "number" ? bal : parseFloat(bal) || 0;
                } catch { }
                console.warn(`[AnchorService] Balance unread for ledger ${ledgerId} (defaulting to 0):`, error.response?.data?.errors?.[0]?.detail || error.message);
                return 0;
            }
        }

    /**
     * Settle Landlord via Anchor NIP Transfer rail.
     * Creates or updates LandlordPayout record with payoutRail = "ANCHOR_NIP".
     * Idempotent — safe against retry loops.
     */
    async disburseLandlordPayout(transactionId: string): Promise < void> {
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

            if(!transaction) {
                console.error(`[AnchorService] Transaction ${transactionId} not found`);
                return;
            }

        const landlord = transaction.property.landlord;
            const idempotencyKey = `payout_${transactionId}`;

            const existingPayout = await prisma.landlordPayout.findUnique({
                where: { idempotencyKey },
            });

            if(existingPayout && existingPayout.status === "COMPLETED") {
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

        const isLive = process.env.NODE_ENV === "production" && !this.baseUrl.includes("sandbox");
        if (isLive && (!landlord.bankCode || !landlord.accountNumber)) {
            console.warn(`[AnchorService] Landlord ${landlord.id} has no linked bank account in live mode. Marking payout as SKIPPED.`);
            await prisma.landlordPayout.update({
                where: { id: payout.id },
                data: {
                    status: "SKIPPED",
                    failureReason: "Landlord bank account not linked. Please link your commercial bank account under Payouts & Settlements to receive this escrow release.",
                },
            });
            return;
        }

        const bankCode = landlord.bankCode || "000014";
        const accountNumber = landlord.accountNumber || "0123456789";
        const accountName = landlord.accountName || `${landlord.firstName || ""} ${landlord.lastName || ""}`.trim() || "Landlord";

        try {
            const transferResult = await this.disburseToLandlord({
                transactionId,
                amountKobo: this.nairaToKobo(netAmount),
                destinationBankCode: bankCode,
                destinationAccountNumber: accountNumber,
                destinationAccountName: accountName,
                narration: `RentHub Escrow Release for ${transaction.property.title}`,
            });

            // Fix (Claude): Only mark COMPLETED when Anchor confirms the transfer.
            // If Anchor returns PENDING (queued transfer), keep payout as PROCESSING until
            // a transfer webhook confirms it. Never mark COMPLETED on a 500 or unknown status.
            const payoutStatus = transferResult.status === "SUCCESSFUL" ? "COMPLETED" : "PROCESSING";

            await prisma.landlordPayout.update({
                where: { id: payout.id },
                data: {
                    status: payoutStatus,
                    failureReason: null,
                    anchorTransferId: transferResult.transferId,
                    anchorReference: transferResult.reference,
                    processedAt: payoutStatus === "COMPLETED" ? new Date() : null,
                    metadata: {
                        rail: "ANCHOR_NIP",
                        feeKobo: transferResult.feeKobo,
                        destinationAccount: transferResult.destinationAccount,
                    },
                },
            });

            // Fix (Claude): Only mark property RENTED and notify landlord when
            // the transfer is confirmed SUCCESSFUL, not while it's still PROCESSING.
            if (payoutStatus === "COMPLETED") {
                await prisma.property.update({
                    where: { id: transaction.propertyId },
                    data: { status: "RENTED" },
                });

                // Dispatch in-app notification to landlord
                try {
                    await prisma.notification.create({
                        data: {
                            userId: landlord.id,
                            type: "PAYMENT_SUCCESS",
                            title: "Escrow Disbursed to Bank Account",
                            message: `₦${netAmount.toLocaleString()} has been disbursed via NIP to your bank account (${accountNumber}) for ${transaction.property.title}.`,
                            actionUrl: "/dashboard/payouts",
                            actionText: "View Payout",
                        },
                    });
                } catch (notifyErr) {
                    console.warn("[AnchorService] Failed to create payout notification:", notifyErr);
                }
            } else {
                // Payout is queued on Anchor's side — notify landlord of pending state
                console.info(
                    `[AnchorService] Payout for tx=${transactionId} queued on Anchor (status=PROCESSING). ` +
                    `transferId=${transferResult.transferId}. Awaiting transfer webhook to confirm.`
                );
                try {
                    await prisma.notification.create({
                        data: {
                            userId: landlord.id,
                            type: "PAYMENT_SUCCESS",
                            title: "Payout Processing",
                            message: `Your payout of ₦${netAmount.toLocaleString()} for ${transaction.property.title} is being processed via NIP. It will arrive within 1 business day.`,
                            actionUrl: "/dashboard/payouts",
                            actionText: "View Payout",
                        },
                    });
                } catch (notifyErr) {
                    console.warn("[AnchorService] Failed to create payout-processing notification:", notifyErr);
                }
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
     * Query recent incoming payments from Anchor API.
     */
    async getRecentPayments(): Promise<any[]> {
        if (!this.apiKey || process.env.NODE_ENV === "test" || process.env.ANCHOR_MOCK === "true") {
            return [];
        }

        try {
            const response = await axios.get(`${this.baseUrl}/payments`, {
                headers: this.getHeaders(),
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error("[AnchorService] Failed to fetch payments list:", error.response?.data || error.message);
            return [];
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

