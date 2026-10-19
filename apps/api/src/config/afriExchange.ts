/**
 * Centralized AfriExchange integration configuration and helper functions.
 */

export function getCleanAfriExchangeUrl(): string {
    let raw = process.env.AFRIEXCHANGE_API_URL || "https://afrix-iqvq.onrender.com/api/v1";
    if (raw.includes("#")) {
        raw = raw.split("#")[0].trim();
    }
    // Handle cases where the env var mistakenly points to RentHub's own port 5001 or is empty
    if (!raw || raw.includes("localhost:5001") || raw.includes("127.0.0.1:5001")) {
        raw = "https://afrix-iqvq.onrender.com/api/v1";
    }
    return raw.replace(/\/$/, "");
}

export function getAfriExchangeApiKey(): string {
    return process.env.RENTHUB_AFRIEXCHANGE_API_KEY || "4e171a7183f9e370829dd8b7499a43d23ef01223f7f60f20ddaf19105356824b";
}

export function isAfriExchangeConfigured(): boolean {
    const url = getCleanAfriExchangeUrl();
    const key = getAfriExchangeApiKey();
    return Boolean(url && key);
}
