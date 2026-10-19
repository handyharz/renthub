/**
 * Centralized AfriExchange integration configuration and helper functions.
 *
 * Required env vars:
 *   AFRIEXCHANGE_API_URL       – base URL of the AfriExchange API (optional in dev)
 *   RENTHUB_AFRIEXCHANGE_API_KEY – merchant API key (REQUIRED in production)
 */

const LIVE_URL = "https://afrix-iqvq.onrender.com/api/v1";
const isProd = process.env.NODE_ENV === "production";

export function getCleanAfriExchangeUrl(): string {
    let raw = process.env.AFRIEXCHANGE_API_URL ?? "";
    if (raw.includes("#")) raw = raw.split("#")[0].trim();

    // Guard against env var mistakenly pointing back at this server
    if (!raw || raw.includes("localhost:5001") || raw.includes("127.0.0.1:5001")) {
        raw = LIVE_URL;
    }
    return raw.replace(/\/$/, "");
}

export function getAfriExchangeApiKey(): string {
    const key = process.env.RENTHUB_AFRIEXCHANGE_API_KEY;
    if (!key) {
        if (isProd) {
            throw new Error(
                "[AfriExchange] RENTHUB_AFRIEXCHANGE_API_KEY is not set. " +
                "Add it to your environment variables before deploying."
            );
        }
        // Development-only sandbox key — safe to expose, carries no real funds
        return "4e171a7183f9e370829dd8b7499a43d23ef01223f7f60f20ddaf19105356824b";
    }
    return key;
}

export function isAfriExchangeConfigured(): boolean {
    try {
        const url = getCleanAfriExchangeUrl();
        const key = getAfriExchangeApiKey();
        return Boolean(url && key);
    } catch {
        return false;
    }
}

