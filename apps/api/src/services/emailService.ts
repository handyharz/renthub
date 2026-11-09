import axios from "axios";

export class EmailService {
    private apiKey: string;
    private from: string;
    private frontendUrl: string;

    constructor() {
        this.apiKey = process.env.RESEND_API_KEY || "";
        this.from = process.env.RESEND_FROM || "RentHub <hello@nexgentech.dev>";
        this.frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    }

    /**
     * Send email via Resend API with modern HTML template, fallback to mock console output in dev.
     */
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
                console.log(`[EmailService] Live email dispatched to ${to} (id: ${response.data?.id})`);
                return true;
            } catch (error: any) {
                console.error("[EmailService] Failed to send email via Resend:", error.response?.data || error.message);
            }
        }

        console.log("\n==================================================");
        console.log("             RENTHUB EMAIL DISPATCH (DEV MOCK)    ");
        console.log("==================================================");
        console.log(`TO: ${to}`);
        console.log(`FROM: ${this.from}`);
        console.log(`SUBJECT: ${subject}`);
        console.log("--------------------------------------------------");
        console.log("Mocking email send for development / preview.");
        console.log("==================================================\n");
        return true;
    }

    /**
     * Reusable modern email wrapper with RentHub design tokens.
     */
    private baseTemplate(content: string, preheader: string = ""): string {
        const year = new Date().getFullYear();
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>RentHub</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f1f5f9;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
        }
        .preheader {
            display: none !important;
            visibility: hidden;
            mso-hide: all;
            font-size: 1px;
            line-height: 1px;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            padding: 36px 16px;
        }
        .card {
            background-color: #ffffff;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 10px 25px -5px rgba(10, 37, 64, 0.05), 0 8px 10px -6px rgba(10, 37, 64, 0.03);
            overflow: hidden;
        }
        .header {
            padding: 32px 32px 24px;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .body {
            padding: 32px;
            font-size: 15px;
            line-height: 1.6;
            color: #334155;
        }
        .footer {
            padding: 24px 32px 32px;
            background-color: #f8fafc;
            border-top: 1px solid #f1f5f9;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
        }
        @media only screen and (max-width: 600px) {
            .container { padding: 16px 8px; }
            .body { padding: 24px 20px; }
            .header { padding: 24px 20px; }
            .footer { padding: 20px; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    ${preheader ? `<span class="preheader" style="display:none!important;visibility:hidden;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>` : ""}
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9;">
        <tr>
            <td align="center" style="padding: 32px 12px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(10, 37, 64, 0.05); overflow: hidden;">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 28px 32px 20px; border-bottom: 1px solid #f1f5f9;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="left" style="vertical-align: middle;">
                                        <div style="font-size: 24px; font-weight: 900; letter-spacing: -0.03em; color: #0A2540;">
                                            Rent<span style="color: #00A651;">Hub</span>
                                        </div>
                                        <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px;">
                                            Zero-Agent Escrow Platform
                                        </div>
                                    </td>
                                    <td align="right" style="vertical-align: middle;">
                                        <span style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.06em;">
                                            🛡️ Verified Escrow
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Main Body Content -->
                    <tr>
                        <td style="padding: 32px; font-size: 15px; line-height: 1.6; color: #334155;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Modern Minimalist Footer -->
                    <tr>
                        <td style="padding: 24px 32px 28px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                            <div style="font-size: 12px; font-weight: 700; color: #0A2540; letter-spacing: 0.02em; margin-bottom: 4px;">
                                RentHub 7-Stage Trust Protocol
                            </div>
                            <div style="font-size: 12px; color: #64748b; margin-bottom: 12px; line-height: 1.5;">
                                Securing tenant funds and verified landlord payouts across Nigeria.
                            </div>
                            <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; line-height: 1.5;">
                                Have questions? Reach out to our escrow protection team at 
                                <a href="mailto:hello@nexgentech.dev" style="color: #00A651; text-decoration: none; font-weight: 600;">hello@nexgentech.dev</a>
                                <br>&copy; ${year} RentHub Technologies Inc. All rights reserved.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    /**
     * Stage 6: Key Handover OTP Email for Tenant
     */
    async sendHandoverOtpEmail(to: string, tenantName: string, otp: string, propertyTitle: string): Promise<boolean> {
        const subject = `🔐 Handover OTP: ${otp} • RentHub Escrow Release`;
        const preheader = `Your 6-digit handover code for ${propertyTitle} is ready. Give this to your landlord ONLY after inspecting the keys.`;
        const dashboardUrl = `${this.frontendUrl}/dashboard?tab=applications`;

        const content = `
            <!-- Badge / Subheading -->
            <div style="margin-bottom: 16px;">
                <span style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 9999px;">
                    Stage 6 • Physical Key Handover
                </span>
            </div>

            <!-- Heading -->
            <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0A2540; line-height: 1.25; letter-spacing: -0.02em;">
                Your Physical Key Handover Code
            </h1>

            <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">
                Hello <strong>${tenantName}</strong>,
            </p>

            <p style="margin: 0 0 24px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                Your rent payment for <strong>${propertyTitle}</strong> is secured in RentHub Escrow. When you meet your landlord to collect the keys, provide the 6-digit authorization code below to finalize handover and release payout.
            </p>

            <!-- OTP Hero Box -->
            <div style="background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px dashed #86efac; border-radius: 16px; padding: 24px 16px; text-align: center; margin: 24px 0;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; color: #15803d; margin-bottom: 8px;">
                    Your 6-Digit Release Code
                </div>
                <div style="font-size: 44px; font-weight: 900; letter-spacing: 0.22em; color: #0A2540; font-family: 'SF Mono', Consolas, 'Roboto Mono', Monaco, monospace; padding: 6px 0 10px 10px; line-height: 1;">
                    ${otp}
                </div>
                <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #166534; background-color: #dcfce7; padding: 4px 12px; border-radius: 9999px;">
                    ⏱️ Valid for 24 Hours • One-Time Use
                </div>
            </div>

            <!-- Mandatory Security Checklist -->
            <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 18px 20px; margin: 24px 0;">
                <div style="font-size: 13px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                    ⚠️ Critical Rule: Inspect Before Sharing
                </div>
                <div style="font-size: 13px; color: #78350f; line-height: 1.55;">
                    Share this code with your landlord <strong>ONLY IN PERSON</strong> after you have:
                    <ul style="margin: 8px 0 8px 0; padding-left: 20px; color: #78350f;">
                        <li style="margin-bottom: 4px;">Walked through the property and confirmed the apartment matches the photos.</li>
                        <li style="margin-bottom: 4px;">Tested all physical keys in the locks to confirm they work.</li>
                        <li style="margin-bottom: 4px;">Checked running water, electrical fixtures, and agreed amenities.</li>
                    </ul>
                    <strong style="color: #b45309;">Never share this code over phone or WhatsApp.</strong> Entering this OTP immediately disburses your escrow funds to the landlord.
                </div>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 32px 0 12px;">
                <a href="${dashboardUrl}" style="display: inline-block; background-color: #0A2540; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(10, 37, 64, 0.15);">
                    View in RentHub Dashboard &rarr;
                </a>
            </div>
            <div style="text-align: center; font-size: 11px; color: #94a3b8;">
                Something wrong with the property? You can click <strong>Dispute</strong> in your dashboard to freeze escrow.
            </div>
        `;

        const html = this.baseTemplate(content, preheader);
        return this.sendEmail(to, subject, html);
    }

    /**
     * Handover Proof Alert for Tenant (when landlord submits proof)
     */
    async sendHandoverProofAlertEmail(to: string, tenantName: string, propertyTitle: string): Promise<boolean> {
        const subject = `⚠️ Action Required: Landlord Submitted Handover Proof • RentHub`;
        const preheader = `Your landlord submitted proof of handover for ${propertyTitle}. You have 24 hours to review or dispute.`;
        const dashboardUrl = `${this.frontendUrl}/dashboard?tab=applications`;

        const content = `
            <div style="margin-bottom: 16px;">
                <span style="display: inline-block; background-color: #fef3c7; border: 1px solid #fde68a; color: #92400e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 9999px;">
                    Action Required • 24-Hour Review Window
                </span>
            </div>

            <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0A2540; line-height: 1.25;">
                Proof of Key Handover Submitted
            </h1>

            <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">
                Hello <strong>${tenantName}</strong>,
            </p>

            <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                Your landlord has submitted proof of key handover for <strong>${propertyTitle}</strong>. Under RentHub Escrow policies, a <strong>24-hour review window</strong> is now active.
            </p>

            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
                <div style="font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 6px;">
                    What You Need to Do:
                </div>
                <div style="font-size: 13px; color: #78350f; line-height: 1.6;">
                    1. <strong>If you hold the keys and confirm the property:</strong> Log in and verify handover to release escrow.<br>
                    2. <strong>If you have NOT received keys or dispute this claim:</strong> Immediately click <em>Dispute</em> in your dashboard to lock funds and request RentHub arbitration.
                </div>
            </div>

            <div style="text-align: center; margin: 32px 0 12px;">
                <a href="${dashboardUrl}" style="display: inline-block; background-color: #FF5A1F; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(255, 90, 31, 0.2);">
                    Review Handover in Dashboard &rarr;
                </a>
            </div>
        `;

        const html = this.baseTemplate(content, preheader);
        return this.sendEmail(to, subject, html);
    }
}

export const emailService = new EmailService();
