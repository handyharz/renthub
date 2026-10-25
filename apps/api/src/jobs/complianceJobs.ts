import { prisma } from "../config/database";
import { logger } from "../utils/logger";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export async function runComplianceJobs(): Promise<void> {
    const now = new Date();
    const offerLockCutoff = new Date(now.getTime() - FORTY_EIGHT_HOURS_MS);

    const expiredFeatured = await prisma.property.updateMany({
        where: {
            featured: true,
            featuredExpiresAt: { lt: now },
        },
        data: {
            featured: false,
        },
    });

    const expiredOffers = await prisma.property.updateMany({
        where: {
            status: "UNDER_OFFER",
            updatedAt: { lt: offerLockCutoff },
        },
        data: {
            status: "AVAILABLE",
        },
    });

    // Guide §5.5: Flag transactions where OTP expired without key handover or dispute
    const expiredOtps = await prisma.transaction.updateMany({
        where: {
            status: "ESCROWED",
            escrowHeld: true,
            escrowReleased: false,
            disputed: false,
            otpExpiresAt: { lt: now },
        },
        data: {
            disputed: true,
            disputeReason: "OTP_EXPIRED_ACTION_REQUIRED: 48h handover window elapsed without OTP redemption",
        },
    });

    if (expiredFeatured.count || expiredOffers.count || expiredOtps.count) {
        logger.info(
            `[compliance] cleared featured=${expiredFeatured.count} expired offer locks=${expiredOffers.count} expired OTPs flagged=${expiredOtps.count}`
        );
    }
}

export function startComplianceJobs(): void {
    const intervalMs = Number(process.env.COMPLIANCE_JOB_INTERVAL_MS || 15 * 60 * 1000);
    runComplianceJobs().catch((err) =>
        console.error("[compliance] initial run failed:", err)
    );
    setInterval(() => {
        runComplianceJobs().catch((err) =>
            console.error("[compliance] scheduled run failed:", err)
        );
    }, intervalMs);
}
