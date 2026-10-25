import axios from "axios";

export class SmsService {
    private apiKey: string;
    private baseUrl: string;
    private senderId: string;

    constructor() {
        this.apiKey = process.env.TERMII_API_KEY || "";
        this.baseUrl = process.env.TERMII_BASE_URL || "https://v3.api.termii.com";
        this.senderId = process.env.TERMII_SENDER_ID || "RentHub";

        if (!this.apiKey) {
            console.warn("TERMII_API_KEY is not set. SMS sending will fail.");
        }
    }

    /**
     * Send an OTP or message to a phone number.
     * @param to Phone number (international format preferred, e.g., 234...)
     * @param message Message content
     */
    async sendSms(to: string, message: string): Promise<boolean> {
        try {
            if (!to) return false;
            const formattedPhone = this.formatPhoneNumber(to);
            if (!formattedPhone) {
                console.warn(`[SmsService] Skipped sending SMS: invalid or unroutable phone number "${to}"`);
                return false;
            }

            if (!this.apiKey) {
                console.log("\n==================================================");
                console.log("             DEV MODE SMS BYPASS                  ");
                console.log("==================================================");
                console.log(`TO: ${formattedPhone} (raw: ${to})`);
                console.log(`MESSAGE: ${message}`);
                console.log("--------------------------------------------------");
                console.log("Mocking successful send for development purpose.");
                console.log("==================================================\n");
                return true;
            }

            const payload = {
                to: formattedPhone,
                from: this.senderId,
                sms: message,
                type: "plain",
                channel: "dnd",
                api_key: this.apiKey,
            };

            const response = await axios.post(`${this.baseUrl}/api/sms/send`, payload);

            if (response.data.code === "ok" || response.status === 200) {
                console.log(`SMS sent to ${to}: ${response.data.message_id}`);
                return true;
            } else {
                console.error("Termii SMS failed:", response.data);
                return false;
            }
        } catch (error: any) {
            console.error("Failed to send SMS:", error.response?.data || error.message);

            if (process.env.NODE_ENV !== 'production') {
                console.log("\n==================================================");
                console.log("             DEV MODE SMS BYPASS                  ");
                console.log("==================================================");
                console.log(`TO: ${to}`);
                console.log(`MESSAGE: ${message}`);
                console.log("--------------------------------------------------");
                console.log("Mocking successful send for development purpose.");
                console.log("==================================================\n");
                return true;
            }

            return false;
        }
    }

    private formatPhoneNumber(phone: string): string | null {
        if (!phone) return null;
        let cleaned = phone.replace(/\D/g, "");

        if (cleaned.startsWith("0")) {
            cleaned = "234" + cleaned.substring(1);
        } else if (!cleaned.startsWith("234") && cleaned.length === 10) {
            cleaned = "234" + cleaned;
        }

        // Valid international phone number must have at least 10 digits and at most 15 digits
        if (cleaned.length < 10 || cleaned.length > 15) {
            return null;
        }

        return cleaned;
    }
}

export const smsService = new SmsService();
