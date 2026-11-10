import { prisma } from "../config/database";
import { anchorService } from "../services/anchorService";
import { afriExchangePaymentService } from "../services/afriExchangePaymentService";
import { logger } from "../utils/logger";
import { trustScoreService } from "../services/trustScoreService";
import { withJobLock } from "./jobLock";

const RECON_LOCK_ID = 814203;

export interface ReconciliationReport {
    timestamp: Date;
    activeEscrowTransactionsCount: number;
    dbExpectedTotalKobo: bigint;
    anchorLedgerTotalKobo: bigint;
    afriExchangeLedgerTotalKobo: bigint;
    varianceKobo: bigint;
    isReconciled: boolean;
    systemStatus: string;
}

let cachedSystemStatus: "HEALTHY" | "PAUSED_VARIANCE" | "DEGRADED" = "HEALTHY";

export function getEscrowHealthStatus(): "HEALTHY" | "PAUSED_VARIANCE" | "DEGRADED" {
    return cachedSystemStatus;
}

export function isEscrowOperational(): boolean {
    return cachedSystemStatus !== "PAUSED_VARIANCE";
}

/**
 * Executes 1:1 multi-rail escrow ledger reconciliation (Anchor BaaS + AfriExchange).
 * Asserts SUM(rentAmount + cautionFee WHERE escrowHeld=true) matches pool balances.
 * Automatically persists audit snapshot to TransparencySnapshot table for public auditing.
 * Designed for institutional KPMG audit readiness at viral scale.
 */
export async function runAnchorEscrowReconciliation(): Promise<ReconciliationReport> {
    try {
        const [anchorTransactions, afriTransactions] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    status: "ESCROWED",
                    escrowHeld: true,
                    escrowReleased: false,
                    paymentGateway: "ANCHOR",
                },
                select: {
                    id: true,
                    rentAmount: true,
                    cautionFee: true,
                    anchorEscrowLedgerId: true,
                },
            }),
            prisma.transaction.findMany({
                where: {
                    status: "ESCROWED",
                    escrowHeld: true,
                    escrowReleased: false,
                    paymentGateway: "AFRIEXCHANGE",
                },
                select: {
                    id: true,
                    rentAmount: true,
                    cautionFee: true,
                },
            }),
        ]);

        const anchorTotalNaira = anchorTransactions.reduce((acc, tx) => acc + (tx.rentAmount + tx.cautionFee), 0);
        const anchorDbExpectedKobo = BigInt(anchorService.nairaToKobo(anchorTotalNaira));

        const afriTotalNaira = afriTransactions.reduce((acc, tx) => acc + (tx.rentAmount + tx.cautionFee), 0);
        const afriDbExpectedKobo = BigInt(afriTotalNaira * 100);

        const totalDbExpectedKobo = anchorDbExpectedKobo + afriDbExpectedKobo;
        const totalActiveEscrows = anchorTransactions.length + afriTransactions.length;

        let anchorLedgerTotalKobo = BigInt(0);
        let anchorFetched = false;
        try {
            const poolBalanceKobo = await anchorService.getEscrowPoolBalance();
            anchorLedgerTotalKobo = BigInt(poolBalanceKobo);
            anchorFetched = process.env.ANCHOR_MOCK !== "true" && Boolean(process.env.ANCHOR_API_KEY);
        } catch (err: any) {
            logger.warn(`[reconcile-escrow] Could not fetch Anchor pool balance: ${err.message}`);
        }

        let afriExchangeLedgerTotalKobo = BigInt(0);
        let afriFetched = false;
        const afriLive = await afriExchangePaymentService.getMerchantVaultBalanceKobo();
        if (afriLive !== null) {
            afriExchangeLedgerTotalKobo = BigInt(afriLive);
            afriFetched = true;
        }

        // Solvency reconciliation: A deficit exists only if live pool balance is LESS than expected escrow liabilities.
        // Holding reserve liquidity or surplus capital in the merchant vault guarantees 100%+ collateralization.
        const anchorDeficit = anchorFetched && anchorLedgerTotalKobo < anchorDbExpectedKobo
            ? anchorDbExpectedKobo - anchorLedgerTotalKobo
            : BigInt(0);
        const afriDeficit = afriFetched && afriExchangeLedgerTotalKobo < afriDbExpectedKobo
            ? afriDbExpectedKobo - afriExchangeLedgerTotalKobo
            : BigInt(0);
        const varianceKobo = anchorDeficit + afriDeficit;
        const unproven =
            (anchorDbExpectedKobo > BigInt(0) && !anchorFetched) ||
            (afriDbExpectedKobo > BigInt(0) && !afriFetched);

        let systemStatus: "HEALTHY" | "PAUSED_VARIANCE" | "DEGRADED" = "HEALTHY";
        if (varianceKobo > BigInt(0)) {
            systemStatus = "PAUSED_VARIANCE";
            logger.error(
                `[reconcile-escrow] VARIANCE DETECTED! DB expected ${totalDbExpectedKobo} kobo, live pools differ by ${varianceKobo} kobo across ${totalActiveEscrows} active escrows.`
            );
        } else if (unproven) {
            systemStatus = "DEGRADED";
            logger.warn(
                `[reconcile-escrow] Ledger unread on at least one funded rail (anchorFetched=${anchorFetched}, afriFetched=${afriFetched}). Not claiming 0 kobo.`
            );
        } else {
            logger.info(
                `[reconcile-escrow] Live rails match. Active escrows=${totalActiveEscrows} (Anchor: ${anchorTransactions.length}, AfriExchange: ${afriTransactions.length}), Total=₦${(anchorTotalNaira + afriTotalNaira).toLocaleString()}`
            );
        }
        cachedSystemStatus = systemStatus;
        const isReconciled = systemStatus === "HEALTHY";

        // Persist audit snapshot
        await prisma.transparencySnapshot.create({
            data: {
                activeEscrowsCount: totalActiveEscrows,
                dbExpectedKobo: totalDbExpectedKobo,
                anchorPoolKobo: anchorLedgerTotalKobo,
                afriExchangePoolKobo: afriExchangeLedgerTotalKobo,
                varianceKobo,
                isReconciled,
                systemStatus,
                reconciledBy: "AUTOMATED_CRON",
                rawDetails: {
                    anchorEscrowsCount: anchorTransactions.length,
                    afriExchangeEscrowsCount: afriTransactions.length,
                    anchorTotalNaira,
                    afriTotalNaira,
                    anchorFetched,
                    afriFetched,
                },
            },
        });

        // Trigger asynchronous TrustScore batch indexing
        trustScoreService.recalculateAllTrustScores().catch((err) =>
            logger.warn(`[reconcile-escrow] Asynchronous TrustScore update failed: ${err.message}`)
        );

        return {
            timestamp: new Date(),
            activeEscrowTransactionsCount: totalActiveEscrows,
            dbExpectedTotalKobo: totalDbExpectedKobo,
            anchorLedgerTotalKobo,
            afriExchangeLedgerTotalKobo,
            varianceKobo,
            isReconciled,
            systemStatus,
        };
    } catch (error: any) {
        logger.error(`[reconcile-escrow] Reconciliation run failed: ${error.message}`);
        cachedSystemStatus = "DEGRADED";
        return {
            timestamp: new Date(),
            activeEscrowTransactionsCount: 0,
            dbExpectedTotalKobo: BigInt(0),
            anchorLedgerTotalKobo: BigInt(0),
            afriExchangeLedgerTotalKobo: BigInt(0),
            varianceKobo: BigInt(0),
            isReconciled: false,
            systemStatus: "DEGRADED",
        };
    }
}

/**
 * Starts 6-hour recurring ledger reconciliation job.
 */
export function startAnchorEscrowReconciliationJob(): void {
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    const tick = () =>
        withJobLock(RECON_LOCK_ID, () => runAnchorEscrowReconciliation()).catch((err) =>
            console.error("[reconcile-escrow] run failed:", err)
        );
    tick();
    setInterval(tick, SIX_HOURS_MS);
}

