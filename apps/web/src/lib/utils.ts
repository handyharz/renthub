import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price?: number | null): string {
    const numericPrice = Number(price);
    const safePrice = !isNaN(numericPrice) && isFinite(numericPrice) ? numericPrice : 0;
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
    }).format(safePrice); // Price is in Naira
}

export function calculateTrustScore(user?: {
    trustScore?: number | null;
    avatar?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    phoneVerified?: boolean;
    idDocumentUrl?: string | null;
    verified?: boolean;
} | null): number {
    if (!user) return 10;
    // Prefer the persisted DB trust score once the backend has calculated it (> 30 default)
    // The Prisma default for a brand-new user is 30, so > 30 means the backend has run a
    // real calculation. We trust the backend over the local heuristic in that case.
    if (typeof user.trustScore === "number" && user.trustScore > 30) {
        return Math.min(Math.max(user.trustScore, 0), 100);
    }
    // Fallback local calculation (mirrors TrustScore.tsx milestones exactly)
    let score = 10; // Base score for signing up
    if (user?.avatar) score += 10;
    if (user?.phone) score += 15;
    if (user?.phoneVerified) score += 25;
    // Government ID +40 pts ONLY once admin-confirmed (verified flag)
    if (user?.idDocumentUrl && user?.verified) score += 40;
    return Math.min(score, 100);
}
