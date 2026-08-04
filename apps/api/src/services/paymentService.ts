import axios from "axios";
import crypto from "crypto";

interface PaystackInitializeData {
    email: string;
    amount: number; // in kobo
    reference: string;
    callback_url?: string;
    metadata?: any;
}

interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        domain: string;
        status: string;
        reference: string;
        amount: number;
        message: string | null;
        gateway_response: string;
        paid_at: string;
        created_at: string;
        channel: string;
        currency: string;
        ip_address: string;
        metadata: any;
        customer: {
            id: number;
            first_name: string;
            last_name: string;
            email: string;
            customer_code: string;
            phone: string | null;
            metadata: any;
            risk_action: string;
        };
        authorization: {
            authorization_code: string;
            bin: string;
            last4: string;
            exp_month: string;
            exp_year: string;
            channel: string;
            card_type: string;
            bank: string;
            country_code: string;
            brand: string;
            reusable: boolean;
            signature: string;
            account_name: string | null;
        };
    };
}

export class PaymentService {
    private paystackSecretKey: string;
    private paystackBaseUrl = "https://api.paystack.co";

    constructor() {
        this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || "";
        if (!this.paystackSecretKey) {
            console.warn("⚠️  PAYSTACK_SECRET_KEY not set in environment variables");
        }
    }

    /**
     * Initialize Paystack payment
     */
    async initializePayment(data: PaystackInitializeData): Promise<{
        authorization_url: string;
        access_code: string;
        reference: string;
    }> {
        try {
            const response = await axios.post(
                `${this.paystackBaseUrl}/transaction/initialize`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${this.paystackSecretKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.status) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || "Payment initialization failed");
            }
        } catch (error: any) {
            console.error("Paystack initialization error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to initialize payment");
        }
    }

    /**
     * Verify Paystack payment
     */
    async verifyPayment(reference: string): Promise<PaystackVerifyResponse["data"]> {
        try {
            const response = await axios.get(
                `${this.paystackBaseUrl}/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.paystackSecretKey}`,
                    },
                }
            );

            if (response.data.status) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || "Payment verification failed");
            }
        } catch (error: any) {
            console.error("Paystack verification error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Failed to verify payment");
        }
    }

    /**
     * Verify Paystack webhook signature
     */
    verifyWebhookSignature(payload: string, signature: string): boolean {
        const hash = crypto
            .createHmac("sha512", this.paystackSecretKey)
            .update(payload)
            .digest("hex");
        return hash === signature;
    }

    /**
     * Generate unique payment reference
     */
    generateReference(prefix: string = "RENT"): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        return `${prefix}_${timestamp}_${random}`;
    }

    /**
     * Convert Naira to Kobo (Paystack uses kobo)
     */
    nairaToKobo(naira: number): number {
        return Math.round(naira * 100);
    }

    /**
     * Convert Kobo to Naira
     */
    koboToNaira(kobo: number): number {
        return kobo / 100;
    }
}

export const paymentService = new PaymentService();
