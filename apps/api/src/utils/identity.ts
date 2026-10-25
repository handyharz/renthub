import { UserRole } from "@prisma/client";

const SELF_SERVICE_ROLES: ReadonlySet<string> = new Set([
    UserRole.TENANT,
    UserRole.LANDLORD,
    UserRole.AGENT,
]);

/** Roles a signed-in user may assign to themselves. Never ADMIN. */
export function sanitizeSelfServiceRole(role: unknown): UserRole | undefined {
    if (typeof role !== "string") return undefined;
    const normalized = role.trim().toUpperCase();
    if (SELF_SERVICE_ROLES.has(normalized)) {
        return normalized as UserRole;
    }
    return undefined;
}

export function stripReleaseOtp<T extends { releaseOtp?: string | null }>(
    record: T | null | undefined
): Omit<T, "releaseOtp"> | T | null {
    if (!record) return null;
    const { releaseOtp: _otp, ...rest } = record as T & { releaseOtp?: string | null };
    return rest as Omit<T, "releaseOtp">;
}
