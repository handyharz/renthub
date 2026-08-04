"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

interface PhoneVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    clerkId: string;
    phone: string;
    onVerified: () => void;
}

export function PhoneVerificationModal({ isOpen, onClose, clerkId, phone, onVerified }: PhoneVerificationModalProps) {
    const [step, setStep] = useState<"REQUEST" | "VERIFY">("REQUEST");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRequestOtp = async () => {
        setLoading(true);
        setError("");
        try {
            await api.post(`/verification/phone/request?clerkId=${clerkId}`, { phone });
            setStep("VERIFY");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setLoading(true);
        setError("");
        try {
            await api.post(`/verification/phone/verify?clerkId=${clerkId}`, { otp });
            onVerified();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{step === "REQUEST" ? "Verify Phone Number" : "Enter Verification Code"}</DialogTitle>
                    <DialogDescription>
                        {step === "REQUEST"
                            ? `We will send a 6-digit code to ${phone} to verify your number.`
                            : `Enter the 6-digit code sent to ${phone}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

                    {step === "REQUEST" ? (
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleRequestOtp} disabled={loading} className="bg-[var(--color-brand-blue)]">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Code"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Input
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                className="text-center text-2xl tracking-widest"
                                maxLength={6}
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setStep("REQUEST")}>Back</Button>
                                <Button onClick={handleVerifyOtp} disabled={loading || otp.length < 6} className="bg-[var(--color-brand-green)]">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Code"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
