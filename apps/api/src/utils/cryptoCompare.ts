import crypto from "crypto";

export function timingSafeEqualString(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) {
        return false;
    }
    return crypto.timingSafeEqual(left, right);
}

export function hashOtp(otp: string): string {
    const pepper =
        process.env.OTP_PEPPER ||
        process.env.CLERK_SECRET_KEY ||
        "renthub-otp-dev-pepper";
    return crypto.createHmac("sha256", pepper).update(otp).digest("hex");
}

/** Accept hashed storage or legacy plaintext 6-digit codes. */
export function otpMatches(stored: string | null | undefined, provided: string): boolean {
    if (!stored || !provided) return false;
    if (stored.length === 6) {
        return timingSafeEqualString(stored, provided);
    }
    return timingSafeEqualString(stored, hashOtp(provided));
}
