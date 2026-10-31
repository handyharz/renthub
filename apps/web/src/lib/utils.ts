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
} | null) {
    if (!user) return 10;
    if (typeof user.trustScore === "number" && user.trustScore > 0) {
        return Math.min(Math.max(user.trustScore, 0), 100);
    }
    let score = 10; // Base score for signing up
    if (user?.avatar) score += 10;
    if (user?.firstName && user?.lastName) score += 10;
    if (user?.phone) score += 10;
    if (user?.phoneVerified) score += 20;
    // Government ID score requires admin confirmation before awarding points
    if (user?.idDocumentUrl && user?.verified) score += 40;
    return Math.min(score, 100);
}
