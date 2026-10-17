"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import {
    Loader2,
    CheckCircle2,
    ShieldCheck,
    Wallet,
    KeyRound,
    Mail,
    RefreshCw,
    Trash2,
    Edit2,
    Lock,
    ExternalLink,
    AlertCircle,
    AlertTriangle,
    X,
} from "lucide-react";
import { toast } from "sonner";

interface AfriExchangeLinkingCardProps {
    dbUser: any;
    onRefresh?: () => void;
    title?: string;
    subtitle?: string;
}

export function AfriExchangeLinkingCard({
    dbUser,
    onRefresh,
    title = "AfriExchange Rent Payout Settlement",
    subtitle = "Escrow releases are automatically settled directly into your linked AfriX mobile wallet.",
}: AfriExchangeLinkingCardProps) {
    const { user } = useUser();
    const [afriExchangeEmail, setAfriExchangeEmail] = useState(dbUser?.afriExchangeAccountEmail || "");
    const [afriExchangeWallet, setAfriExchangeWallet] = useState(dbUser?.afriExchangeWalletAddress || "");
    const [isEditing, setIsEditing] = useState(false);
    const [verificationStep, setVerificationStep] = useState<"idle" | "code_sent">("idle");
    const [verificationRequestId, setVerificationRequestId] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [isRequestingCode, setIsRequestingCode] = useState(false);
    const [isConfirmingCode, setIsConfirmingCode] = useState(false);
    const [isUnlinking, setIsUnlinking] = useState(false);
    const [showUnlinkModal, setShowUnlinkModal] = useState(false);

    const isLinked = Boolean(
        dbUser?.settlementLinkedAt &&
        (dbUser?.afriExchangeAccountEmail || dbUser?.afriExchangeWalletAddress || dbUser?.afriExchangeUserId)
    );

    const handleRequestLinkVerification = async () => {
        const email = afriExchangeEmail.trim();
        const wallet = afriExchangeWallet.trim();

        if (!email && !wallet) {
            toast.error("Please enter your AfriExchange email address or wallet address");
            return;
        }

        setIsRequestingCode(true);
        try {
            const res = await api.post("/payouts/link-verification/request", {
                accountEmail: email || undefined,
                walletAddress: wallet || undefined,
            });

            if (res.data?.success) {
                const verification = res.data.data;
                setVerificationRequestId(verification.requestId);
                setMaskedEmail(verification.maskedEmail || email);
                setVerificationStep("code_sent");
                toast.success("Security verification code sent!", {
                    description: `Check your email (${verification.maskedEmail || email}) for your 6-digit OTP code.`,
                });
            } else {
                toast.error(res.data?.message || "Failed to initiate verification");
            }
        } catch (error: any) {
            const errMsg = error.response?.data?.message || error.message || "";
            toast.error(
                errMsg || "Failed to send verification code",
                {
                    description: errMsg
                        ? "Ensure this email is registered on the AfriExchange (AfriX) mobile app."
                        : "Please check your AfriExchange email and try again.",
                }
            );
        } finally {
            setIsRequestingCode(false);
        }
    };

    const handleConfirmLinkVerification = async () => {
        const cleanCode = otpCode.trim();
        if (!cleanCode || cleanCode.length < 6) {
            toast.error("Please enter the complete 6-digit verification code");
            return;
        }

        setIsConfirmingCode(true);
        try {
            const res = await api.post("/payouts/link-verification/confirm", {
                requestId: verificationRequestId,
                code: cleanCode,
            });

            if (res.data?.success) {
                toast.success("AfriExchange Account Verified & Linked!", {
                    description: "Your rent escrow payouts will now be automatically disbursed to your verified AfriExchange wallet.",
                });
                onRefresh?.();
                setVerificationStep("idle");
                setIsEditing(false);
                setOtpCode("");
                setVerificationRequestId("");
            } else {
                toast.error(res.data?.message || "Failed to verify code");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Invalid or expired verification code");
        } finally {
            setIsConfirmingCode(false);
        }
    };

    const handleConfirmUnlink = async () => {
        setIsUnlinking(true);
        try {
            const res = await api.delete("/payouts/unlink-afriexchange");
            if (res.data?.success) {
                toast.success("Settlement account unlinked");
                setShowUnlinkModal(false);
                onRefresh?.();
                setIsEditing(false);
                setVerificationStep("idle");
                setVerificationRequestId("");
                setOtpCode("");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to unlink account");
        } finally {
            setIsUnlinking(false);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)] p-5 sm:p-7 transition-colors">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-color)] mb-6">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl shrink-0">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-[var(--text-primary)] text-lg sm:text-xl tracking-tight">
                            {title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {isLinked && !isEditing ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 self-start sm:self-auto">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Verified & Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 self-start sm:self-auto">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        Action Required: Unlinked
                    </span>
                )}
            </div>

            {/* State 1: Active & Verified */}
            {isLinked && !isEditing ? (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-[var(--bg-card)] to-teal-500/5 p-5 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                <span className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider block mb-1.5">
                                    AfriExchange Account Email / ID
                                </span>
                                <span className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-sm sm:text-base">
                                    <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    {dbUser.afriExchangeAccountEmail || dbUser.afriExchangeUserId || "—"}
                                </span>
                            </div>

                            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                <span className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider block mb-1.5">
                                    Settlement Wallet Address
                                </span>
                                <span className="font-mono text-xs sm:text-sm text-[var(--text-primary)] break-all flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    {dbUser.afriExchangeWalletAddress || "Auto-routed to primary AfriX wallet"}
                                </span>
                            </div>

                            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                <span className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider block mb-1.5">
                                    Security Status
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    2FA Ownership Verified
                                </span>
                            </div>

                            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                <span className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider block mb-1.5">
                                    Linked Date
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)]">
                                    {dbUser.settlementLinkedAt
                                        ? new Date(dbUser.settlementLinkedAt).toLocaleDateString(undefined, {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })
                                        : "Active"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex items-start sm:items-center gap-2.5 text-xs text-[var(--text-secondary)]">
                            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                            <span>
                                When RentHub admin releases tenant rent from escrow, your net rent tokens will be immediately deposited into this AfriExchange account.
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="outline"
                            className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] flex items-center gap-2 text-xs sm:text-sm font-bold h-11 px-5 rounded-xl transition-colors"
                            onClick={() => {
                                setIsEditing(true);
                                setVerificationStep("idle");
                                setOtpCode("");
                            }}
                        >
                            <Edit2 className="h-4 w-4" />
                            Change Account
                        </Button>

                        <Button
                            variant="outline"
                            className="border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 text-xs sm:text-sm font-bold h-11 px-5 rounded-xl transition-colors"
                            onClick={() => setShowUnlinkModal(true)}
                        >
                            <Trash2 className="h-4 w-4" />
                            Unlink Payout Account
                        </Button>
                    </div>
                </div>
            ) : (
                /* State 2: Setup or Edit Mode */
                <div className="space-y-6">
                    {verificationStep === "idle" ? (
                        <>
                            <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-900 dark:text-blue-200 space-y-1">
                                <div className="font-bold flex items-center gap-2 text-blue-900 dark:text-blue-300">
                                    <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    Two-Factor Security Verification
                                </div>
                                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                    To protect your rent payouts, we verify account ownership via a one-time 6-digit confirmation code dispatched to the email registered on your AfriExchange mobile app.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                                        <label className="block text-sm font-bold text-[var(--text-primary)]">
                                            AfriExchange Account Email / ID
                                        </label>
                                        {(user?.primaryEmailAddress?.emailAddress || dbUser?.email) && (
                                            <button
                                                type="button"
                                                className="text-xs text-[var(--color-brand-blue)] hover:underline font-bold"
                                                onClick={() => {
                                                    const myEmail = user?.primaryEmailAddress?.emailAddress || dbUser?.email || "";
                                                    setAfriExchangeEmail(myEmail);
                                                }}
                                            >
                                                Use my login email ({user?.primaryEmailAddress?.emailAddress || dbUser?.email})
                                            </button>
                                        )}
                                    </div>
                                    <Input
                                        type="email"
                                        value={afriExchangeEmail}
                                        onChange={(e) => setAfriExchangeEmail(e.target.value)}
                                        placeholder="e.g. harunjibs@gmail.com"
                                        className="h-11"
                                    />
                                    <p className="text-xs text-[var(--text-muted)] mt-1.5">
                                        The email registered on your AfriX mobile app.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                                        AfriExchange Wallet Address (Optional)
                                    </label>
                                    <Input
                                        value={afriExchangeWallet}
                                        onChange={(e) => setAfriExchangeWallet(e.target.value)}
                                        placeholder="0x..."
                                        className="h-11 font-mono text-sm"
                                    />
                                    <p className="text-xs text-[var(--text-muted)] mt-1.5">
                                        Optional. If left blank, AfriExchange automatically resolves your registered primary wallet.
                                    </p>
                                </div>

                                <div className="pt-2 flex flex-wrap items-center gap-3">
                                    <Button
                                        className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold h-11 px-6 rounded-xl flex items-center gap-2 shadow-xs"
                                        onClick={handleRequestLinkVerification}
                                        disabled={isRequestingCode}
                                    >
                                        {isRequestingCode ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Sending Code...
                                            </>
                                        ) : (
                                            <>
                                                <KeyRound className="h-4 w-4" />
                                                Send Verification Code
                                            </>
                                        )}
                                    </Button>

                                    {isEditing && (
                                        <Button
                                            variant="outline"
                                            className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] font-bold h-11 px-5 rounded-xl"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setVerificationStep("idle");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Step 2: Enter OTP Code */
                        <div className="space-y-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6">
                            <div className="space-y-1">
                                <h4 className="font-extrabold text-[var(--text-primary)] text-base sm:text-lg flex items-center gap-2">
                                    <KeyRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    Enter 6-Digit Verification Code
                                </h4>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                                    We have sent a 6-digit confirmation code to{" "}
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{maskedEmail}</span>.
                                    Enter the code below to authorize and link this account.
                                </p>
                            </div>

                            <div className="max-w-xs">
                                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                                    6-Digit Security Code
                                </label>
                                <Input
                                    type="text"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="123456"
                                    className="text-center font-mono text-2xl font-extrabold tracking-[0.5em] h-14 bg-[var(--bg-input)] text-[var(--text-primary)] border-2 border-emerald-500/40 focus:border-[var(--color-brand-green)]"
                                    autoFocus
                                />
                            </div>

                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                <Button
                                    className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold h-11 px-6 rounded-xl flex items-center gap-2 shadow-xs"
                                    onClick={handleConfirmLinkVerification}
                                    disabled={isConfirmingCode || otpCode.trim().length < 6}
                                >
                                    {isConfirmingCode ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Verifying Code...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="h-4 w-4" />
                                            Confirm & Link Account
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] font-bold h-11 px-5 rounded-xl"
                                    onClick={() => {
                                        setVerificationStep("idle");
                                        setOtpCode("");
                                    }}
                                >
                                    Back / Use Different Email
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 text-xs font-bold flex items-center gap-1.5 h-11 px-3"
                                    onClick={handleRequestLinkVerification}
                                    disabled={isRequestingCode}
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${isRequestingCode ? "animate-spin" : ""}`} />
                                    Resend Code
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Custom Unlink Confirmation Modal */}
            {showUnlinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 text-center transform transition-all animate-in zoom-in-95 duration-200">
                        {/* Icon */}
                        <div className="w-14 h-14 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-rose-500/20">
                            <AlertTriangle className="w-7 h-7" />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
                            Unlink Payout Account?
                        </h3>

                        {/* Body Message */}
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                            Are you sure you want to unlink your AfriExchange payout account? You will need to re-verify a new account to receive rent escrow payouts.
                        </p>

                        {/* Warning Box */}
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 text-left mb-6 flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <span>
                                <strong>Important:</strong> Released rent escrow payouts cannot be transferred until a verified AfriExchange settlement account is re-linked.
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] font-bold text-sm h-11 px-5 rounded-xl"
                                onClick={() => setShowUnlinkModal(false)}
                                disabled={isUnlinking}
                            >
                                Cancel
                            </Button>

                            <Button
                                className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-sm h-11 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                onClick={handleConfirmUnlink}
                                disabled={isUnlinking}
                            >
                                {isUnlinking ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Unlinking...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Yes, Unlink Account
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
