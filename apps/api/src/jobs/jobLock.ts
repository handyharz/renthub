import { prisma } from "../config/database";

/** Postgres advisory lock so multi-instance API processes do not double-run jobs. */
export async function withJobLock<T>(lockId: number, fn: () => Promise<T>): Promise<T | undefined> {
    const rows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
        SELECT pg_try_advisory_lock(${lockId}) AS locked
    `;
    if (!rows[0]?.locked) {
        return undefined;
    }
    try {
        return await fn();
    } finally {
        await prisma.$queryRaw`SELECT pg_advisory_unlock(${lockId})`;
    }
}
