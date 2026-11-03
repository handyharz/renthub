const DEFAULT_MAX_SKEW_SEC = 300;

function toUnixSeconds(raw: string): number | null {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (n > 1e12) return Math.floor(n / 1000);
    return n;
}

/** Reject missing or stale webhook timestamps (replay window). */
export function isWebhookTimestampFresh(
    timestampHeader: string | undefined,
    maxSkewSec: number = DEFAULT_MAX_SKEW_SEC
): boolean {
    if (!timestampHeader) return false;
    const eventTime = toUnixSeconds(timestampHeader.trim());
    if (eventTime === null) return false;
    const now = Math.floor(Date.now() / 1000);
    return Math.abs(now - eventTime) <= maxSkewSec;
}
