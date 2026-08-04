import redis from "../lib/redis";
import { smsService } from "./smsService";
import crypto from "crypto";

export class VerificationService {
    private readonly OTP_TTL = 600; // 10 minutes in seconds

    /**
     * Generate and send an OTP to the user's phone.
     */
    async sendPhoneVerification(userId: string, phone: string): Promise<{ success: boolean; message: string }> {
        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Store in Redis: verification:phone:{userId} -> otp
        const key = `verification:phone:${userId}`;
        await redis.set(key, otp, "EX", this.OTP_TTL);

        // Send SMS
        const message = `Your RentHub verification code is: ${otp}. Valid for 10 minutes.`;
        const sent = await smsService.sendSms(phone, message);

        if (sent) {
            return { success: true, message: "OTP sent successfully" };
        } else {
            return { success: false, message: "Failed to send OTP. Please try again." };
        }
    }

    /**
     * Verify the OTP provided by the user.
     */
    async verifyPhone(userId: string, otp: string): Promise<boolean> {
        const key = `verification:phone:${userId}`;
        const storedOtp = await redis.get(key);

        if (storedOtp && storedOtp === otp) {
            // OTP matches
            await redis.del(key); // Invalidate OTP
            return true;
        }

        return false;
    }
}

export const verificationService = new VerificationService();
