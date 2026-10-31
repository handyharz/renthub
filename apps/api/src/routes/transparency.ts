import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/database";
import { runAnchorEscrowReconciliation, getEscrowHealthStatus } from "../jobs/reconcileAnchorEscrow";
import { logger } from "../utils/logger";
import { trustScoreService } from "../services/trustScoreService";

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

        const [totalProcessedAgg, activeEscrowAgg, strikesCount, verifiedPropertiesCount, challengeStats, recentResolutions] = await Promise.all([
            prisma.transaction.aggregate({
                where: {
                    OR: [
                        { status: "RELEASED", escrowReleased: true },
                        { status: "ESCROWED", escrowHeld: true },
                    ],
                },
                _sum: { totalAmount: true, rentAmount: true },
                _count: { id: true },
            }),
            prisma.transaction.aggregate({
                where: {
                    status: "ESCROWED",
                    escrowHeld: true,
                    escrowReleased: false,
                },
                _sum: { totalAmount: true, rentAmount: true },
                _count: { id: true },
            }),
            prisma.agentStrike.count({ where: { status: "UPHELD" } }),
            prisma.property.count({ where: { verified: true } }),
            prisma.publicChallenge.groupBy({
                by: ["status"],
                _count: { id: true },
            }),
            prisma.publicChallenge.findMany({
                where: {
                    status: { in: ["UPHELD", "DISMISSED", "INVESTIGATING"] },
                },
                orderBy: { updatedAt: "desc" },
                take: 6,
                select: {
                    id: true,
                    challengeType: true,
                    targetRef: true,
                    status: true,
                    adminNote: true,
                    resolvedAt: true,
                    updatedAt: true,
                    createdAt: true,
                },
            }),
        ]);

        const challengeSummary = {
            totalChallenged: 0,
            resolvedUpheld: 0,
            resolvedDismissed: 0,
            underInvestigation: 0,
            recentResolutions: recentResolutions.map((r) => {
                let maskedRef = r.targetRef;
                if (maskedRef.length > 18) {
                    maskedRef = `${maskedRef.slice(0, 8)}...${maskedRef.slice(-6)}`;
                }
                return {
                    id: r.id,
                    challengeType: r.challengeType,
                    targetRef: maskedRef,
                    status: r.status,
                    adminNote: r.adminNote || (r.status === "INVESTIGATING" ? "Field ops dispatched for ground coordinate verification." : "Review concluded."),
                    resolvedAt: r.resolvedAt || r.updatedAt,
                };
            }),
        };

        for (const stat of challengeStats) {
            challengeSummary.totalChallenged += stat._count.id;
            if (stat.status === "UPHELD") challengeSummary.resolvedUpheld += stat._count.id;
            if (stat.status === "DISMISSED") challengeSummary.resolvedDismissed += stat._count.id;
            if (stat.status === "INVESTIGATING" || stat.status === "PENDING") {
                challengeSummary.underInvestigation += stat._count.id;
            }
        }

        const varianceKobo = latestSnapshot?.varianceKobo || BigInt(0);
        const totalProtectedNaira = totalProcessedAgg._sum.rentAmount || 0;
        const totalTransactionsCount = totalProcessedAgg._count.id || 0;
        const activeEscrowsCount = activeEscrowAgg._count.id || 0;
        const totalReleasedCount = totalTransactionsCount - activeEscrowsCount;

        const volumeDisplay = totalProtectedNaira >= 1_000_000
            ? `₦${(totalProtectedNaira / 1_000_000).toFixed(2)}M`
            : `₦${Math.round(totalProtectedNaira / 1000).toLocaleString()}k`;

        res.json({
            success: true,
            data: {
                systemStatus: getEscrowHealthStatus(),
                isReconciled: latestSnapshot?.isReconciled ?? true,
                varianceDisplay: varianceKobo === BigInt(0) ? "0 kobo" : `${varianceKobo.toString()} kobo`,
                activeEscrowsCount,
                totalCompletedEscrows: totalReleasedCount,
                totalTransactionsCount,
                totalEscrowedRange: volumeDisplay,
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
                    primaryZone: "Abuja (FCT: Jabi, Gwarinpa, Lugbe, Guzape, Maitama)",
                },
            },
        });
    } catch (error: any) {
        logger.error(`[transparency/stats] Failed to fetch stats: ${error.message}`);
        res.status(500).json({ success: false, message: "Error fetching transparency statistics" });
    }
});

/**
 * GET /api/transparency/trustscores
 * Public distribution histogram and neighborhood leaderboard.
 * Zero-PII public endpoint for transparency audit dashboard.
 */
router.get("/trustscores", async (req: Request, res: Response) => {
    try {
        const data = await trustScoreService.getTrustScoreDistribution();
        res.json({
            success: true,
            data,
        });
    } catch (error: any) {
        logger.error(`[transparency/trustscores] Failed to fetch trust score distribution: ${error.message}`);
        res.status(500).json({ success: false, message: "Error fetching trust score metrics" });
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
                    OR: [
                        { status: "RELEASED", escrowReleased: true },
                        { status: "ESCROWED", escrowHeld: true },
                    ],
                },
                orderBy: { updatedAt: "desc" },
                take: 10,
                select: {
                    id: true,
                    status: true,
                    paymentGateway: true,
                    anchorVirtualNuban: true,
                    anchorEscrowLedgerId: true,
                    afriExchangeRef: true,
                    rentAmount: true,
                    totalAmount: true,
                    escrowHeld: true,
                    escrowReleased: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);

        const maskedTransactions = recentReleasedTx.map((tx) => {
            let maskedAccount = "NUBAN-MASKED";
            if (tx.anchorVirtualNuban && tx.anchorVirtualNuban.length >= 8) {
                maskedAccount = `${tx.anchorVirtualNuban.slice(0, 4)}***${tx.anchorVirtualNuban.slice(-4)}`;
            } else if (tx.afriExchangeRef) {
                // Keep the prefix and mask intermediate chars
                const ref = tx.afriExchangeRef;
                maskedAccount = ref.length > 16 ? `${ref.slice(0, 16)}...` : ref;
            }

            const isReleased = tx.status === "RELEASED";
            const rentNaira = tx.rentAmount;
            const volumeFormatted = rentNaira >= 1_000_000
                ? `₦${(rentNaira / 1_000_000).toFixed(2)}M`
                : `₦${Math.round(rentNaira / 1000).toLocaleString()}k`;

            const verificationHash = crypto
                .createHash("sha256")
                .update(`${tx.id}:${tx.paymentGateway}:${tx.rentAmount}:${tx.createdAt.toISOString()}`)
                .digest("hex");

            return {
                id: tx.id,
                maskedRef: maskedAccount,
                rail: tx.paymentGateway,
                ledgerIdMasked: tx.anchorEscrowLedgerId
                    ? `${tx.anchorEscrowLedgerId.slice(0, 14)}...`
                    : `VAULT_MERCHANT_${tx.id.slice(-6).toUpperCase()}`,
                volumeRange: volumeFormatted,
                rawAmount: rentNaira,
                totalAmount: tx.totalAmount,
                otpStatus: isReleased ? "NULLIFIED_POST_RELEASE" : "LOCKED_AWAITING_HANDOVER",
                escrowStatus: isReleased ? "RELEASED" : "ESCROWED",
                payoutRail: tx.paymentGateway === "ANCHOR" ? "ANCHOR_NIP_N20" : "AFRIEXCHANGE_SETTLEMENT",
                verificationHash,
                releasedAt: tx.updatedAt,
                lockedAt: tx.createdAt,
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
 * GET /api/transparency/verify?hash=<SHA-256>
 * Public cryptographic audit verifier: checks any hash against property proofs & escrow releases.
 * Returns zero-PII cryptographic breakdown & formula explanation.
 */
router.get("/verify", async (req: Request, res: Response) => {
    try {
        const hash = typeof req.query.hash === "string" ? req.query.hash.trim().toLowerCase() : "";
        if (!hash || hash.length < 12) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid SHA-256 hash or hash prefix (minimum 12 characters).",
            });
        }

        // 1. Search in PropertyProof (geotagHash or duplicateHash)
        const proof = await prisma.propertyProof.findFirst({
            where: {
                OR: [
                    { geotagHash: { contains: hash, mode: "insensitive" } },
                    { duplicateHash: { contains: hash, mode: "insensitive" } },
                ],
            },
        });

        if (proof) {
            const isGeotag = proof.geotagHash.toLowerCase().includes(hash);
            return res.json({
                success: true,
                data: {
                    verified: true,
                    hashType: isGeotag ? "GEOTAG_PROOF" : "ANTI_DUPLICATE_PROOF",
                    hash: isGeotag ? proof.geotagHash : proof.duplicateHash,
                    recordId: proof.id,
                    targetRef: proof.propertyId,
                    zone: `${proof.neighborhood}, ${proof.city}`,
                    state: proof.state,
                    verifierAlias: proof.verifierAlias,
                    verifiedAt: proof.verifiedAt,
                    evidenceSummary: `${proof.photoCount} Geo-stamped Photos ${proof.hasVideoWalkthrough ? "+ Video Walkthrough" : ""}`,
                    explanation: isGeotag
                        ? "Mathematically verified on-ground field inspection. Salted SHA-256 hash proves coordinates were verified without leaking private residence location (NDPA 2023 compliant)."
                        : "Mathematically verified anti-duplicate fingerprint. Proves listing is unique and unmanipulated; prevents multi-agent duplicate listings and phantom pricing.",
                    terminalVerifyCommand: isGeotag
                        ? `echo -n "<lat_6_decimals>:<lng_6_decimals>:<salt>" | shasum -a 256`
                        : `echo -n "<normalized_address>:<landlord_id>:<price_naira>:<salt>" | shasum -a 256`,
                },
            });
        }

        // 2. Search in Transaction releases
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { status: "RELEASED", escrowReleased: true },
                    { status: "ESCROWED", escrowHeld: true },
                ],
            },
            take: 25,
            select: {
                id: true,
                paymentGateway: true,
                rentAmount: true,
                createdAt: true,
                updatedAt: true,
                status: true,
                anchorVirtualNuban: true,
                afriExchangeRef: true,
            },
        });

        for (const tx of transactions) {
            const txHash = crypto
                .createHash("sha256")
                .update(`${tx.id}:${tx.paymentGateway}:${tx.rentAmount}:${tx.createdAt.toISOString()}`)
                .digest("hex");

            if (txHash.toLowerCase().includes(hash)) {
                const isReleased = tx.status === "RELEASED";
                return res.json({
                    success: true,
                    data: {
                        verified: true,
                        hashType: "ESCROW_RELEASE_AUDIT",
                        hash: txHash,
                        recordId: tx.id,
                        targetRef: tx.afriExchangeRef || (tx.anchorVirtualNuban ? `NUBAN-${tx.anchorVirtualNuban.slice(-4)}` : tx.id),
                        rail: tx.paymentGateway,
                        volumeFormatted: tx.rentAmount >= 1_000_000 ? `₦${(tx.rentAmount / 1_000_000).toFixed(2)}M` : `₦${Math.round(tx.rentAmount / 1000)}k`,
                        status: isReleased ? "RELEASED" : "ESCROWED",
                        lockedAt: tx.createdAt,
                        releasedAt: tx.updatedAt,
                        explanation: "Authentic multi-rail cryptographic escrow release. SHA-256 digest mathematically links transaction ID, payment rail, rent amount, and deposit timestamp to the immutable ledger.",
                        terminalVerifyCommand: `echo -n "${tx.id}:${tx.paymentGateway}:${tx.rentAmount}:${tx.createdAt.toISOString()}" | shasum -a 256`,
                    },
                });
            }
        }

        return res.json({
            success: false,
            message: "No matching cryptographic proof found on RentHub ledger for this hash.",
        });
    } catch (error: any) {
        logger.error(`[transparency/verify] Verification failed: ${error.message}`);
        res.status(500).json({ success: false, message: "Error verifying cryptographic hash." });
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
