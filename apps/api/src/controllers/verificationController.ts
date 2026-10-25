import { Request, Response } from "express";
import { verificationService } from "../services/verificationService";
import { prisma } from "../config/database";

export const verificationController = {
    // Request OTP
    async requestPhoneVerification(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { phone } = req.body;

            let user = userId
                ? await prisma.user.findUnique({ where: { id: userId } })
                : null;

            if (!user) {
                return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
            }

            // If a specific phone is provided, use it and update the user record if it's different
            let targetPhone = phone || user.phone;

            if (phone && phone !== user.phone) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        phone: phone,
                        phoneVerified: false
                    },
                });
                targetPhone = phone;
            }

            if (!targetPhone || targetPhone.startsWith("no-phone-user_")) {
                return res.status(400).json({ success: false, message: "Please add a valid phone number to your profile first." });
            }

            if (user.phoneVerified && targetPhone === user.phone) {
                return res.status(400).json({ success: false, message: "Phone number is already verified." });
            }

            const result = await verificationService.sendPhoneVerification(user.id, targetPhone);

            if (result.success) {
                res.json({ success: true, message: result.message });
            } else {
                res.status(500).json({ success: false, message: result.message });
            }

        } catch (error) {
            console.error("Error requesting verification:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    },

    // Verify OTP
    async verifyPhone(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { otp } = req.body;

            const user = userId
                ? await prisma.user.findUnique({ where: { id: userId } })
                : null;

            if (!user) {
                return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
            }

            const isValid = await verificationService.verifyPhone(user.id, otp);

            if (isValid) {
                // Update user status
                await prisma.user.update({
                    where: { id: user.id },
                    data: { phoneVerified: true },
                });

                res.json({ success: true, message: "Phone number verified successfully!" });
            } else {
                res.status(400).json({ success: false, message: "Invalid or expired OTP." });
            }

        } catch (error) {
            console.error("Error verifying phone:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
};
