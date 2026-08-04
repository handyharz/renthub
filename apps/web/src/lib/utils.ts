import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
    }).format(price); // Price is in Naira
}

export function calculateTrustScore(user: {
    avatar?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    phoneVerified?: boolean;
    idDocumentUrl?: string | null;
    verified?: boolean;
}) {
    let score = 10; // Base score for signing up
    if (user?.avatar) score += 10;
    if (user?.firstName && user?.lastName) score += 10;
    if (user?.phone) score += 10;
    if (user?.phoneVerified) score += 20;
    if (user?.idDocumentUrl) score += 20;
    if (user?.verified) score += 20;
    return Math.min(score, 100);
}
