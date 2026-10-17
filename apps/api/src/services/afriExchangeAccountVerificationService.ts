import axios from "axios";

export interface AccountVerificationParams {
    afriExchangeUserId?: string;
    walletAddress?: string;
    accountEmail?: string;
    tokenType?: string;
}

export interface VerificationRequestResult {
    requestId: string;
    expiresInSeconds: number;
    maskedEmail: string;
    code?: string;
}

export interface VerificationConfirmResult {
    verified: boolean;
    tokenType: string;
    user: {
        id: string;
        email: string;
    };
    wallet: {
        id: string;
        blockchain_address: string;
        token_type: string;
    };
}

export class AfriExchangeAccountVerificationService {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly enabled: boolean;

    constructor() {
        this.baseUrl = (process.env.AFRIEXCHANGE_API_URL || "https://afri-x.vercel.app").replace(/\/$/, "");
        this.apiKey = process.env.RENTHUB_AFRIEXCHANGE_API_KEY || "";
        this.enabled = !!(this.baseUrl && this.apiKey);
    }

    private getHeaders() {
        return {
            "Content-Type": "application/json",
            "x-renthub-api-key": this.apiKey,
        };
    }

    /**
     * Step 1: Pre-verify account exists on AfriExchange
     */
    async verifyAccount(params: AccountVerificationParams) {
        if (!this.enabled) {
            throw new Error("AfriExchange integration is not configured");
        }

        const res = await axios.post(
            `${this.baseUrl}/api/v1/integrations/renthub/verify-account`,
            {
                ...params,
                tokenType: params.tokenType || "NT",
            },
            { headers: this.getHeaders(), timeout: 15000 }
        );

        return res.data?.data;
    }

    /**
     * Step 2: Request 2FA OTP verification code sent to AfriExchange user's email/phone
     */
    async requestLinkVerification(params: AccountVerificationParams): Promise<VerificationRequestResult> {
        if (!this.enabled) {
            throw new Error("AfriExchange integration is not configured");
        }

        try {
            const res = await axios.post(
                `${this.baseUrl}/api/v1/integrations/renthub/link-verification/request`,
                {
                    ...params,
                    tokenType: params.tokenType || "NT",
                },
                { headers: this.getHeaders(), timeout: 15000 }
            );

            return res.data?.data;
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || "Failed to request link verification";
            throw new Error(msg);
        }
    }

    /**
     * Step 3: Confirm 6-digit OTP code & retrieve cryptographically validated user and wallet
     */
    async confirmLinkVerification(requestId: string, code: string): Promise<VerificationConfirmResult> {
        if (!this.enabled) {
            throw new Error("AfriExchange integration is not configured");
        }

        try {
            const res = await axios.post(
                `${this.baseUrl}/api/v1/integrations/renthub/link-verification/confirm`,
                { requestId, code: code.trim() },
                { headers: this.getHeaders(), timeout: 15000 }
            );

            return res.data?.data;
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || "Invalid or expired verification code";
            throw new Error(msg);
        }
    }
}

export const afriExchangeAccountVerificationService = new AfriExchangeAccountVerificationService();
