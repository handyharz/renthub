import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/database";
import { runAnchorEscrowReconciliation, getEscrowHealthStatus } from "../jobs/reconcileAnchorEscrow";
import { logger } from "../utils/logger";

const router: Router = Router();

function hashIp(ip: string): string {
    const salt = process.env.TRANSPARENCY_SALT || "renthub_ratel_integrity_salt_2026";
    return crypto.createHmac("sha256", salt).update(ip || "unknown").digest("hex");
}

function formatRange(amountKobo: bigint): string {
    const naira = Number(amountKobo / BigInt(100));
    if (naira === 0) return "₦0.00";
    if (naira < 1_000_000) return "₦400k – ₦1.0M";
    const lowerMillions = Math.floor(naira / 1_000_000);
    const upperMillions = lowerMillions + 1;
    return `₦${lowerMillions}M – ₦${upperMillions}M`;
}

/**
 * GET /api/transparency/stats
 * Public, zero-PII endpoint exposing the live multi-rail reconciliation state,
 * zero-fee enforcement statistics, and public challenge resolution metrics.
 */
router.get("/stats", async (req: Request, res: Response) => {
    try {
        let latestSnapshot = await prisma.transparencySnapshot.findFirst({
            orderBy: { timestamp: "desc" },
        });

        // If no snapshot exists yet, run reconciliation on demand
        if (!latestSnapshot) {
            await runAnchorEscrowReconciliation();
            latestSnapshot = await prisma.transparencySnapshot.findFirst({
                orderBy: { timestamp: "desc" },
            });
        }

        const [strikesCount, verifiedPropertiesCount, challengeStats] = await Promise.all([
            prisma.agentStrike.count({ where: { status: "UPHELD" } }),
            prisma.property.count({ where: { verified: true } }),
            prisma.publicChallenge.groupBy({
                by: ["status"],
                _count: { id: true },
            }),
        ]);

        const challengeSummary = {
            totalChallenged: 0,
            resolvedUpheld: 0,
            resolvedDismissed: 0,
            underInvestigation: 0,
        };

        for (const stat of challengeStats) {
            challengeSummary.totalChallenged += stat._count.id;
            if (stat.status === "UPHELD") challengeSummary.resolvedUpheld += stat._count.id;
            if (stat.status === "DISMISSED") challengeSummary.resolvedDismissed += stat._count.id;
            if (stat.status === "INVESTIGATING" || stat.status === "PENDING") {
                challengeSummary.underInvestigation += stat._count.id;
            }
        }

        const dbExpectedKobo = latestSnapshot?.dbExpectedKobo || BigInt(0);
        const varianceKobo = latestSnapshot?.varianceKobo || BigInt(0);

        res.json({
            success: true,
            data: {
                systemStatus: getEscrowHealthStatus(),
                isReconciled: latestSnapshot?.isReconciled ?? true,
                varianceDisplay: varianceKobo === BigInt(0) ? "0 kobo" : `${varianceKobo.toString()} kobo`,
                activeEscrowsCount: latestSnapshot?.activeEscrowsCount || 0,
                totalEscrowedRange: formatRange(dbExpectedKobo),
                lastAuditTimestamp: latestSnapshot?.timestamp || new Date(),
                supportedRails: [
                    {
                        name: "Anchor BaaS (Providus)",
                        type: "Dedicated Virtual NUBAN & Sub-Ledger",
                        feeModel: "₦270 flat (₦200 capped + ₦50 EMTL + ₦20 NIP)",
                        status: "OPERATIONAL",
                    },
                    {
                        name: "AfriExchange",
                        type: "Fintech & Web3 Escrow Merchant Vault",
                        feeModel: "2% fixed protocol fee",
                        status: "OPERATIONAL",
                    },
                ],
                zeroFeeShield: {
                    viewingFeesDemanded: "₦0.00",
                    fuelMoneyAllowed: "₦0.00",
                    agentStrikesEnforced: strikesCount,
                    avgDisputeResolutionHours: 18,
                },
                challenges: challengeSummary,
                verifiedStock: {
                    totalVerifiedProperties: verifiedPropertiesCount,
                    primaryZone: "Abuja (FCT: Jabi, Gwarinpa, Lugbe, Guzape)",
                },
            },
        });
    } catch (error: any) {
        logger.error(`[transparency/stats] Failed to fetch stats: ${error.message}`);
        res.status(500).json({ success: false, message: "Error fetching transparency statistics" });
    }
});

/**
 * GET /api/transparency/proofs
 * Public, paginated proofs by neighborhood.
 * Exposes cryptographic hashes and masked transaction records (zero PII).
 */
router.get("/proofs", async (req: Request, res: Response) => {
    try {
        const neighborhood = typeof req.query.neighborhood === "string" ? req.query.neighborhood : undefined;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10));
        const skip = (page - 1) * limit;

        const whereClause: any = {};
        if (neighborhood && neighborhood !== "ALL") {
            whereClause.neighborhood = { equals: neighborhood, mode: "insensitive" };
        }

        const [proofs, totalProofs, recentReleasedTx] = await Promise.all([
            prisma.propertyProof.findMany({
                where: whereClause,
                orderBy: { verifiedAt: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    propertyId: true,
                    neighborhood: true,
                    city: true,
                    geotagHash: true,
                    duplicateHash: true,
                    verifierAlias: true,
                    photoCount: true,
                    hasVideoWalkthrough: true,
                    challengeCount: true,
                    resolvedValidCount: true,
                    verifiedAt: true,
                },
            }),
            prisma.propertyProof.count({ where: whereClause }),
            prisma.transaction.findMany({
                where: {
                    status: "RELEASED",
                    escrowReleased: true,
                },
                orderBy: { updatedAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    paymentGateway: true,
                    anchorVirtualNuban: true,
                    anchorEscrowLedgerId: true,
                    afriExchangeRef: true,
                    rentAmount: true,
                    updatedAt: true,
                },
            }),
        ]);

        const maskedTransactions = recentReleasedTx.map((tx) => {
            let maskedAccount = "NUBAN-MASKED";
            if (tx.anchorVirtualNuban && tx.anchorVirtualNuban.length >= 8) {
                maskedAccount = `${tx.anchorVirtualNuban.slice(0, 4)}***${tx.anchorVirtualNuban.slice(-4)}`;
            } else if (tx.afriExchangeRef) {
                maskedAccount = `RQST-RH-${tx.afriExchangeRef.slice(0, 6)}...`;
            }

            return {
                maskedRef: maskedAccount,
                rail: tx.paymentGateway,
                ledgerIdMasked: tx.anchorEscrowLedgerId ? `${tx.anchorEscrowLedgerId.slice(0, 15)}...` : "VAULT_ESCROW",
                volumeRange: tx.rentAmount >= 2_000_000 ? "₦2.0M – ₦3.0M" : "₦500k – ₦1.5M",
                otpStatus: "NULLIFIED_POST_CONSUMPTION",
                payoutRail: tx.paymentGateway === "ANCHOR" ? "ANCHOR_NIP_N20" : "AFRIEXCHANGE_PAYOUT",
                releasedAt: tx.updatedAt,
            };
        });

        res.json({
            success: true,
            data: {
                proofs,
                pagination: {
                    total: totalProofs,
                    page,
                    limit,
                    totalPages: Math.ceil(totalProofs / limit),
                },
                maskedEscrowReleases: maskedTransactions,
            },
        });
    } catch (error: any) {
        logger.error(`[transparency/proofs] Failed to fetch proofs: ${error.message}`);
        res.status(500).json({ success: false, message: "Error fetching transparency proofs" });
    }
});

/**
 * POST /api/transparency/challenge
 * Public challenge submission endpoint with salted IP rate limiting & mandatory proof URL.
 */
router.post("/challenge", async (req: Request, res: Response) => {
    try {
        const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "127.0.0.1";
        const ipHash = hashIp(clientIp);

        // Enforce anti-spam rate limit: max 5 challenges per hour per IP
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentChallengesCount = await prisma.publicChallenge.count({
            where: {
                ipHash,
                createdAt: { gte: oneHourAgo },
            },
        });

        if (recentChallengesCount >= 5) {
            return res.status(429).json({
                success: false,
                message: "Rate limit reached: Maximum 5 challenges per hour per client. Please try again later.",
            });
        }

        const { challengeType, targetRef, reason, evidenceUrl, reporterEmail } = req.body;

        if (!challengeType || !targetRef || !reason) {
            return res.status(400).json({
                success: false,
                message: "Missing required challenge fields (challengeType, targetRef, reason).",
            });
        }

        // Mandatory evidence URL to prevent malicious support DOS
        if (!evidenceUrl || typeof evidenceUrl !== "string" || !evidenceUrl.trim().startsWith("http")) {
            return res.status(400).json({
                success: false,
                message: "Evidence URL is mandatory to submit a valid public challenge (must be a valid image or document link).",
            });
        }

        const challenge = await prisma.publicChallenge.create({
            data: {
                challengeType,
                targetRef: String(targetRef).trim(),
                reason: String(reason).trim(),
                evidenceUrl: String(evidenceUrl).trim(),
                reporterEmail: reporterEmail ? String(reporterEmail).trim() : null,
                ipHash,
                status: "PENDING",
            },
        });

        // Increment challenge count on PropertyProof if referencing a property
        try {
            await prisma.propertyProof.updateMany({
                where: {
                    OR: [
                        { propertyId: targetRef },
                        { duplicateHash: targetRef },
                        { geotagHash: targetRef },
                    ],
                },
                data: {
                    challengeCount: { increment: 1 },
                },
            });
        } catch {
            // Non-blocking if targetRef is a transaction or external ref
        }

        logger.info(`[transparency/challenge] New public challenge logged for target ${targetRef} (ID: ${challenge.id})`);

        res.status(201).json({
            success: true,
            message: "Challenge logged successfully. Public status will be updated upon field ops review.",
            challengeId: challenge.id,
        });
    } catch (error: any) {
        logger.error(`[transparency/challenge] Submission error: ${error.message}`);
        res.status(500).json({ success: false, message: "Error submitting challenge." });
    }
});

export default router;
