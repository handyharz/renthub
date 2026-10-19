"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import { Loader2, Phone, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

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
            setError(err.response?.data?.message || "Failed to send OTP code");
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
            setError(err.response?.data?.message || "Invalid or expired verification code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-9 w-9 rounded-xl bg-[var(--color-brand-green)]/10 text-[var(--color-brand-green)] flex items-center justify-center border border-[var(--color-brand-green)]/20">
                            {step === "REQUEST" ? <Phone className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                        </div>
                        <DialogTitle>
                            {step === "REQUEST" ? "Verify Phone Number" : "Enter Verification Code"}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        {step === "REQUEST"
                            ? `We will dispatch a secure 6-digit SMS verification code to ${phone}.`
                            : `Please enter the 6-digit OTP code sent to ${phone}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {error && (
                        <div className="flex items-center gap-2 text-xs font-semibold p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === "REQUEST" ? (
                        <div className="flex justify-end gap-2.5 pt-2">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="rounded-xl border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRequestOtp}
                                disabled={loading}
                                className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs rounded-xl px-5"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                        Sending Code...
                                    </>
                                ) : (
                                    "Send OTP Code"
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <Input
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    placeholder="••••••"
                                    className="text-center text-2xl tracking-[0.4em] font-mono h-12 rounded-xl"
                                    maxLength={6}
                                />
                                <p className="text-[11px] text-center text-[var(--text-muted)] mt-1.5 font-medium">
                                    Didn&apos;t receive code?{" "}
                                    <button
                                        type="button"
                                        onClick={handleRequestOtp}
                                        disabled={loading}
                                        className="text-[var(--color-brand-green)] font-bold hover:underline"
                                    >
                                        Resend OTP
                                    </button>
                                </p>
                            </div>
                            <div className="flex justify-end gap-2.5 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep("REQUEST")}
                                    className="rounded-xl border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-xs"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleVerifyOtp}
                                    disabled={loading || otp.length < 6}
                                    className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs rounded-xl px-5"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                            Verifying...
                                        </>
                                    ) : (
                                        "Confirm Code"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
