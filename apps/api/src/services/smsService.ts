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
            // Termii requires international format without + for some endpoints, 
            // but generally accepts 23480... 
            // Let's ensure it starts with 234 if it's a Nigerian number and strip leading 0
            const formattedPhone = this.formatPhoneNumber(to);

            const payload = {
                to: formattedPhone,
                from: this.senderId,
                sms: message,
                type: "plain",
                channel: "dnd", // Use 'dnd' channel to deliver to DND numbers, or 'generic'
                api_key: this.apiKey,
            };

            const response = await axios.post(`${this.baseUrl}/api/sms/send`, payload);

            if (response.data.code === "ok" || response.status === 200) {
                console.log(`SMS sent to ${to}: ${response.data.message_id}`);
                return true;
            } else {
                console.error("Termii SMS failed:", response.data);
                throw new Error(response.data.message || "Termii SMS failed");
            }
        } catch (error: any) {
            console.error("Failed to send SMS:", error.response?.data || error.message);

            // DEV MODE BYPASS
            // If in development, log the OTP and return true so we can test the flow
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

    private formatPhoneNumber(phone: string): string {
        // Remove spaces and special chars
        let cleaned = phone.replace(/\D/g, "");

        // If it starts with '0', replace with '234' (Assuming Nigeria)
        if (cleaned.startsWith("0")) {
            cleaned = "234" + cleaned.substring(1);
        }

        // If it already starts with 234, keep it. 
        // If it's something else, we assume it's already formatted or international.
        return cleaned;
    }
}

export const smsService = new SmsService();
