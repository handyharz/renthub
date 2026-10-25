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

    if (expiredFeatured.count || expiredOffers.count) {
        logger.info(
            `[compliance] cleared featured=${expiredFeatured.count} expired offer locks=${expiredOffers.count}`
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
