import axios from "axios";

export class EmailService {
    private apiKey: string;
    private from: string;

    constructor() {
        this.apiKey = process.env.RESEND_API_KEY || "";
        this.from = process.env.RESEND_FROM || "RentHub <hello@nexgentech.dev>";
    }

    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        if (!to) return false;

        if (this.apiKey) {
            try {
                const response = await axios.post(
                    "https://api.resend.com/emails",
                    {
                        from: this.from,
                        to: [to],
                        subject,
                        html,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                console.log(`[EmailService] Email sent to ${to}:`, response.data?.id);
                return true;
            } catch (error: any) {
                console.error("[EmailService] Failed to send email via Resend:", error.response?.data || error.message);
            }
        }

        console.log("\n==================================================");
        console.log("             RENTHUB EMAIL DISPATCH               ");
        console.log("==================================================");
        console.log(`TO: ${to}`);
        console.log(`SUBJECT: ${subject}`);
        console.log("--------------------------------------------------");
        console.log("Mocking email send for development / preview.");
        console.log("==================================================\n");
        return true;
    }

    async sendHandoverOtpEmail(to: string, tenantName: string, otp: string, propertyTitle: string): Promise<boolean> {
        const subject = `Your RentHub Key Handover OTP: ${otp}`;
        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h1 style="color: #10b981; margin: 0 0 16px; font-size: 22px;">RentHub Escrow Key Release</h1>
                <p style="font-size: 14px; color: #334155;">Hello <strong>${tenantName}</strong>,</p>
                <p style="font-size: 14px; color: #334155;">Your escrow payment for <strong>${propertyTitle}</strong> is active and protected.</p>
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #15803d; font-weight: bold; display: block; margin-bottom: 8px;">Your 6-Digit Key Handover OTP</span>
                    <span style="font-size: 36px; font-weight: 900; letter-spacing: 0.35em; color: #166534; font-family: monospace;">${otp}</span>
                </div>
                <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 14px 16px; border-radius: 10px; font-size: 13px; color: #92400e; margin-bottom: 20px; line-height: 1.5;">
                    ⚠️ <strong>IMPORTANT SECURITY RULE:</strong> Share this OTP with the landlord <em>ONLY</em> at the property after you have physically inspected the apartment, verified the keys work, and checked water/electrical fixtures. Entering this OTP releases the rent from escrow.
                </div>
                <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                    RentHub Technologies • Abuja & Lagos, Nigeria • 7-Stage Trust Protocol
                </p>
            </div>
        `;
        return this.sendEmail(to, subject, html);
    }
}

export const emailService = new EmailService();
