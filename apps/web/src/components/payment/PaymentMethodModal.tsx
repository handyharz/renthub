"use client";

import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    CreditCard,
    Zap,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    Loader2,
    AlertCircle,
    ExternalLink,
    Wallet,
    Landmark,
    Copy,
    Check,
    Sparkles,
    ChevronLeft,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export type AfriExchangeTokenType = "NT" | "CT" | "USDT";

export const TOKEN_RATES: Record<
    AfriExchangeTokenType,
    {
        name: string;
        rateDesc: string;
        badge: string;
        convert: (ngn: number) => number;
        formatConverted: (amount: number) => string;
    }
> = {
    NT: {
        name: "Naira Token",
        rateDesc: "1 NT = ₦1.00 (1:1 NGN)",
        badge: "1:1 with Naira",
        convert: (ngn: number) => ngn,
        formatConverted: (val: number) => `${val.toLocaleString()} NT`,
    },
    CT: {
        name: "CFA Token",
        rateDesc: "1 CT ≈ ₦2.70 NGN (0.37 CT per ₦1)",
        badge: "1 CT ≈ ₦2.70 NGN",
        convert: (ngn: number) => parseFloat((ngn * 0.37).toFixed(2)),
        formatConverted: (val: number) => `${val.toLocaleString()} CT`,
    },
    USDT: {
        name: "Tether USD",
        rateDesc: "1 USDT ≈ ₦1,500 NGN ($1.00 USD)",
        badge: "1 USDT ≈ ₦1,500 NGN",
        convert: (ngn: number) => parseFloat((ngn / 1500).toFixed(2)),
        formatConverted: (val: number) =>
            `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`,
    },
};

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    totalAmount: number;
    propertyTitle: string;
    defaultEmail?: string;
    onPaystack: () => Promise<void>;
    onAfriExchange: (params: {
        accountEmail: string;
        walletAddress?: string;
        tokenType: AfriExchangeTokenType;
        amountInToken: number;
    }) => Promise<void>;
    onAnchor?: () => Promise<{
        virtualNuban: string;
        bankName: string;
        accountName: string;
        reference: string;
        totalAmount?: number;
    } | void>;
}

export function PaymentMethodModal({
    isOpen,
    onClose,
    onSuccess,
    totalAmount,
    propertyTitle,
    defaultEmail = "",
    onPaystack,
    onAfriExchange,
    onAnchor,
}: PaymentMethodModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<"ANCHOR" | "PAYSTACK" | "AFRIEXCHANGE">("ANCHOR");
    const [step, setStep] = useState<"SELECT" | "ANCHOR">("SELECT");
    const [afriEmail, setAfriEmail] = useState(defaultEmail);
    const [afriWallet, setAfriWallet] = useState("");
    const [tokenType, setTokenType] = useState<AfriExchangeTokenType>("NT");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<{
        code?: string;
        tokenType?: string;
        requiredAmount?: number;
        availableBalance?: number;
        wallets?: Array<{ tokenType: string; balance: number }>;
    } | null>(null);
    const [anchorDetails, setAnchorDetails] = useState<{
        virtualNuban: string;
        bankName: string;
        accountName: string;
        reference: string;
    } | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const isServicePayment =
        propertyTitle.toLowerCase().includes("featured") ||
        propertyTitle.toLowerCase().includes("verification") ||
        propertyTitle.toLowerCase().includes("boost") ||
        propertyTitle.toLowerCase().includes("badge");

    const convertedTokenAmount = TOKEN_RATES[tokenType].convert(totalAmount);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleConfirm = async () => {
        setLoading(true);
        setErrorMessage(null);
        setErrorDetails(null);
        try {
            if (selectedMethod === "ANCHOR") {
                // If in dedicated Anchor view, perform status check / verification
                if (step === "ANCHOR" && anchorDetails) {
                    if (isServicePayment) {
                        try {
                            const ref = encodeURIComponent(anchorDetails.reference);
                            const verifyRes = await api.get(`/services/verify/${ref}`);
                            const verifyData = verifyRes.data?.data;
                            if (verifyData?.status === "success" || verifyData?.status === "already_verified") {
                                toast.success("Boost Payment Confirmed!", {
                                    description: "Listing boost is now active for 30 consecutive days.",
                                });
                                if (onSuccess) {
                                    onSuccess();
                                }
                                handleModalClose();
                                return;
                            } else {
                                toast.info("Payment Pending Detection", {
                                    description: verifyData?.message || "Anchor has not yet detected the inbound transfer. If you just sent it via simulation, please allow 10-15 seconds and click Check again.",
                                });
                                return;
                            }
                        } catch (vErr: any) {
                            console.warn("Verification check error:", vErr);
                            // Fallback to POST /services/verify
                            try {
                                const postRes = await api.post("/services/verify", { reference: anchorDetails.reference });
                                const postData = postRes.data?.data;
                                if (postData?.status === "success" || postData?.status === "already_verified") {
                                    toast.success("Boost Payment Confirmed!", {
                                        description: "Listing boost is now active for 30 consecutive days.",
                                    });
                                    if (onSuccess) {
                                        onSuccess();
                                    }
                                    handleModalClose();
                                    return;
                                }
                            } catch (fallbackErr) {}

                            const msg = vErr.response?.data?.message || vErr.response?.data?.error || vErr.message || "Failed to verify transfer status.";
                            toast.error("Status Check", {
                                description: msg,
                            });
                            return;
                        }
                    } else {
                        // Standard escrow flow
                        if (onSuccess) {
                            onSuccess();
                        }
                        handleModalClose();
                        return;
                    }
                }

                // If in SELECT step and already generated, jump straight to ANCHOR view
                if (anchorDetails) {
                    setStep("ANCHOR");
                    return;
                }

                // Otherwise generate virtual NUBAN and transition to ANCHOR view
                if (onAnchor) {
                    const res = await onAnchor();
                    if (res && res.virtualNuban) {
                        setAnchorDetails({
                            virtualNuban: res.virtualNuban,
                            bankName: res.bankName,
                            accountName: res.accountName,
                            reference: res.reference,
                        });
                        setStep("ANCHOR");
                        return;
                    }
                }
            } else if (selectedMethod === "PAYSTACK") {
                await onPaystack();
            } else {
                await onAfriExchange({
                    accountEmail: afriEmail.trim(),
                    walletAddress: afriWallet.trim() || undefined,
                    tokenType,
                    amountInToken: convertedTokenAmount,
                });
            }
        } catch (err: any) {
            const resData = err?.response?.data;
            const msg =
                resData?.message ||
                err?.message ||
                "Failed to process payment. Please verify your details.";
            setErrorMessage(msg);
            if (resData?.details) {
                setErrorDetails(resData.details);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        setErrorMessage(null);
        setErrorDetails(null);
        setAnchorDetails(null);
        setStep("SELECT");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
            <DialogContent className="sm:max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-3xl p-6 shadow-2xl">
                {step === "ANCHOR" && anchorDetails ? (
                    <div className="space-y-4">
                        <DialogHeader className="space-y-1">
                            <button
                                type="button"
                                onClick={() => setStep("SELECT")}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group mb-1 w-fit"
                            >
                                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                                Back to Payment Methods
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                    <Landmark className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-extrabold text-[var(--text-primary)]">
                                        {isServicePayment ? "Direct Bank Transfer" : "Dedicated Escrow Transfer"}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-[var(--text-secondary)] font-medium">
                                        Pay into your dedicated Providus/Anchor NUBAN below.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Amount & Property Summary */}
                        <div className="bg-[var(--bg-muted)]/70 rounded-2xl p-3.5 border border-[var(--border-color)] flex items-center justify-between gap-3 min-w-0">
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                    {isServicePayment ? "Total Service Fee" : "Total Escrow Amount"}
                                </p>
                                <p className="text-xs font-bold text-[var(--text-primary)] truncate" title={propertyTitle}>
                                    {propertyTitle}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-lg font-extrabold text-[var(--color-brand-green)] tabular-nums">
                                    {formatPrice(totalAmount)}
                                </p>
                            </div>
                        </div>

                        {/* Dedicated Bank Details Card */}
                        <div className="bg-[var(--bg-muted)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Bank Name
                                </span>
                                <span className="text-xs font-bold text-[var(--text-primary)]">
                                    {anchorDetails.bankName}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Account Number
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-extrabold text-[var(--color-brand-green)]">
                                        {anchorDetails.virtualNuban}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(anchorDetails.virtualNuban, "nuban")}
                                        className="p-1 rounded-md hover:bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all"
                                        title="Copy account number"
                                    >
                                        {copiedField === "nuban" ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Account Name
                                </span>
                                <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                                    {anchorDetails.accountName}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-[var(--border-color)]/60 pt-2">
                                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Exact Amount
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold text-[var(--text-primary)]">
                                        {formatPrice(totalAmount)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(String(totalAmount), "amount")}
                                        className="p-1 rounded-md hover:bg-[var(--bg-card)] text-[var(--text-secondary)] transition-all"
                                        title="Copy amount"
                                    >
                                        {copiedField === "amount" ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sandbox Simulation Helper */}
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                    🧪 Sandbox Simulation Helper
                                </span>
                                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                    Anchor takes Kobo!
                                </span>
                            </div>
                            <div className="flex items-center justify-between bg-[var(--bg-card)] p-2.5 rounded-xl border border-amber-500/20">
                                <div>
                                    <p className="text-[10px] text-[var(--text-secondary)]">Amount in Kobo (Required by Anchor)</p>
                                    <p className="font-mono font-extrabold text-xs text-amber-600 dark:text-amber-400">
                                        {Math.round(totalAmount * 100).toLocaleString()} kobo
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(String(Math.round(totalAmount * 100)), "kobo")}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all"
                                    title="Copy Kobo Amount for Anchor Simulation"
                                >
                                    {copiedField === "kobo" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    <span>Copy Kobo</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                                In Anchor Dashboard → <strong>Simulate Transfer</strong>: paste <code>{anchorDetails.virtualNuban}</code> into <strong>Account Number ID *</strong>, and <code>{Math.round(totalAmount * 100)}</code> into <strong>Amount *</strong>.
                            </p>
                        </div>

                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic text-center">
                            {isServicePayment
                                ? "💡 Transfer the exact amount from any Nigerian bank app. Service activates automatically upon receipt."
                                : "💡 Transfer the exact amount from any Nigerian bank app. Escrow funds automatically upon receipt."}
                        </p>

                        {/* Status Check / Confirmation Button */}
                        <div className="pt-1">
                            <Button
                                disabled={loading}
                                onClick={handleConfirm}
                                className="w-full h-11 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-sm rounded-xl gap-2 shadow-lg transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verifying Status...
                                    </>
                                ) : (
                                    <>
                                        {isServicePayment ? "Check Payment Status" : "I Have Completed Transfer"} <CheckCircle2 className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <DialogHeader className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-extrabold text-[var(--text-primary)]">
                                        {isServicePayment ? "Choose Payment Method" : "Choose Escrow Payment Gateway"}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-[var(--text-secondary)] font-medium">
                                        {isServicePayment
                                            ? "Instant activation upon payment confirmation. Direct settlement to RentHub Revenue."
                                            : "Funds are safely held in RentHub Escrow until physical key handover."}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Amount & Property Summary */}
                        <div className="bg-[var(--bg-muted)]/70 rounded-2xl p-4 border border-[var(--border-color)] flex items-center justify-between gap-3 min-w-0">
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                    {isServicePayment ? "Total Service Fee" : "Total Escrow Amount"}
                                </p>
                                <p className="text-xs font-bold text-[var(--text-primary)] truncate" title={propertyTitle}>
                                    {propertyTitle}
                                </p>
                                {selectedMethod === "AFRIEXCHANGE" && (
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 truncate">
                                        Rate: {TOKEN_RATES[tokenType].rateDesc}
                                    </p>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-lg sm:text-xl font-extrabold text-[var(--color-brand-green)] tabular-nums">
                                    {formatPrice(totalAmount)}
                                </p>
                                {selectedMethod === "AFRIEXCHANGE" && (
                                    <p className="text-xs font-mono font-extrabold text-amber-600 dark:text-amber-400">
                                        ≈ {TOKEN_RATES[tokenType].formatConverted(convertedTokenAmount)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* In-Modal Error Banner with Action Buttons */}
                        {errorMessage && (
                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-2.5 animate-in fade-in duration-200">
                                <div className="flex items-start gap-2.5">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <div className="text-xs space-y-1">
                                        <p className="font-bold">Payment Error</p>
                                        <p className="leading-relaxed text-[11px] opacity-90">{errorMessage}</p>
                                    </div>
                                </div>

                                {/* If wallet breakdown returned from AfriExchange */}
                                {errorDetails?.wallets && errorDetails.wallets.length > 0 && (
                                    <div className="bg-rose-500/5 p-2 rounded-xl border border-rose-500/15">
                                        <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Wallet className="h-3 w-3" /> Your AfriExchange Balances:
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {errorDetails.wallets.map((w) => (
                                                <button
                                                    key={w.tokenType}
                                                    type="button"
                                                    onClick={() => {
                                                        setTokenType(w.tokenType as AfriExchangeTokenType);
                                                        setErrorMessage(null);
                                                    }}
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                                                        tokenType === w.tokenType
                                                            ? "bg-rose-500 text-white border-rose-500"
                                                            : "bg-[var(--bg-card)] border-[var(--border-color)] hover:border-rose-400"
                                                    }`}
                                                >
                                                    {w.tokenType}: {Number(w.balance).toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quick action buttons */}
                                <div className="flex items-center gap-2 pt-1 border-t border-rose-500/15">
                                    <a
                                        href="https://afri-x.vercel.app"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-sm transition-all"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Top Up Wallet
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedMethod("PAYSTACK");
                                            setErrorMessage(null);
                                            setErrorDetails(null);
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm transition-all"
                                    >
                                        <CreditCard className="h-3 w-3" />
                                        Pay with Card Instead
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Gateway Options */}
                        <div className="space-y-3 pt-1">
                            {/* Option 1: Direct Bank Transfer (Anchor BaaS Escrow) - Recommended */}
                            <div
                                onClick={() => {
                                    setSelectedMethod("ANCHOR");
                                    setErrorMessage(null);
                                }}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                    selectedMethod === "ANCHOR"
                                        ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]/5 shadow-sm"
                                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-gray-300 dark:hover:border-gray-700"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                            <Landmark className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm text-[var(--text-primary)]">
                                                    {isServicePayment ? "Bank Transfer (Direct Revenue)" : "Bank Transfer (Dedicated Escrow)"}
                                                </p>
                                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold py-0.5 flex items-center gap-1">
                                                    <Sparkles className="h-2.5 w-2.5" />
                                                    Recommended · 0% Fee
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                                Pay into a dedicated Providus/Anchor NUBAN. Instant auto-reconciliation.
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                                            selectedMethod === "ANCHOR"
                                                ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)] text-white"
                                                : "border-gray-300 dark:border-gray-600"
                                        }`}
                                    >
                                        {selectedMethod === "ANCHOR" && <CheckCircle2 className="h-4 w-4 fill-current" />}
                                    </div>
                                </div>
                            </div>

                            {/* Option 2: AfriExchange */}
                            <div
                                onClick={() => {
                                    setSelectedMethod("AFRIEXCHANGE");
                                    setErrorMessage(null);
                                }}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                    selectedMethod === "AFRIEXCHANGE"
                                        ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]/5 shadow-sm"
                                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-gray-300 dark:hover:border-gray-700"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                            <Zap className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm text-[var(--text-primary)]">AfriExchange</p>
                                                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-none text-[10px] font-bold py-0.5">
                                                    {TOKEN_RATES[tokenType].badge}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                                Pay {TOKEN_RATES[tokenType].formatConverted(convertedTokenAmount)} from your wallet
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                                            selectedMethod === "AFRIEXCHANGE"
                                                ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)] text-white"
                                                : "border-gray-300 dark:border-gray-600"
                                        }`}
                                    >
                                        {selectedMethod === "AFRIEXCHANGE" && <CheckCircle2 className="h-4 w-4 fill-current" />}
                                    </div>
                                </div>

                                {/* Extra fields if AfriExchange selected */}
                                {selectedMethod === "AFRIEXCHANGE" && (
                                    <div
                                        className="mt-4 pt-3 border-t border-[var(--border-color)] space-y-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Token Selector with live converted prices */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                                                Select Wallet Token & Rate
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(
                                                    [
                                                        { id: "NT", label: "NT (Naira)", rateText: "1:1 with ₦" },
                                                        { id: "CT", label: "CT (CFA)", rateText: "1 CT ≈ ₦2.70" },
                                                        { id: "USDT", label: "USDT", rateText: "1 USDT ≈ ₦1,500" },
                                                    ] as const
                                                ).map((t) => {
                                                    const converted = TOKEN_RATES[t.id].convert(totalAmount);
                                                    return (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setTokenType(t.id);
                                                                setErrorMessage(null);
                                                            }}
                                                            className={`p-2.5 rounded-xl border text-center transition-all ${
                                                                tokenType === t.id
                                                                    ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 text-[var(--color-brand-green)] font-bold shadow-xs"
                                                                    : "border-[var(--border-color)] bg-[var(--bg-muted)] hover:border-gray-400 dark:hover:border-gray-500 text-[var(--text-secondary)] font-medium"
                                                            }`}
                                                        >
                                                            <p className="text-xs font-bold">{t.label}</p>
                                                            <p className="text-[10px] opacity-75">{t.rateText}</p>
                                                            <p className="text-[10px] font-mono font-extrabold text-[var(--color-brand-green)] mt-1">
                                                                {TOKEN_RATES[t.id].formatConverted(converted)}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Secure Hosted Checkout Notice */}
                                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
                                            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                            <div>
                                                <p className="font-bold">Secure Hosted Authorization</p>
                                                <p className="text-[11px] opacity-90 mt-0.5">
                                                    You will be securely redirected to AfriExchange&apos;s encrypted portal to review and authorize this payment with your account password.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Email input (pre-filled, optional) */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                                                AfriExchange Account Email <span className="text-[10px] font-normal lowercase">(optional pre-fill)</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={afriEmail}
                                                onChange={(e) => {
                                                    setAfriEmail(e.target.value);
                                                    setErrorMessage(null);
                                                }}
                                                placeholder="your-email@afriexchange.com"
                                                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand-green)] transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Option 3: Paystack */}
                            <div
                                onClick={() => {
                                    setSelectedMethod("PAYSTACK");
                                    setErrorMessage(null);
                                }}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                    selectedMethod === "PAYSTACK"
                                        ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]/5 shadow-sm"
                                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-gray-300 dark:hover:border-gray-700"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm text-[var(--text-primary)]">Paystack Checkout</p>
                                                <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-none text-[10px] font-bold py-0.5">
                                                    Cards & Bank
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                                Pay with Nigerian Debit Card, Bank Transfer, or USSD
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                                            selectedMethod === "PAYSTACK"
                                                ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)] text-white"
                                                : "border-gray-300 dark:border-gray-600"
                                        }`}
                                    >
                                        {selectedMethod === "PAYSTACK" && <CheckCircle2 className="h-4 w-4 fill-current" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit button */}
                        <div className="pt-2">
                            <Button
                                disabled={loading}
                                onClick={handleConfirm}
                                className="w-full h-11 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-sm rounded-xl gap-2 shadow-lg transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Preparing Payment...
                                    </>
                                ) : selectedMethod === "ANCHOR" ? (
                                    anchorDetails ? (
                                        <>
                                            View Bank Transfer Details <ArrowRight className="h-4 w-4" />
                                        </>
                                    ) : (
                                        <>
                                            {isServicePayment ? "Generate Bank Account" : "Generate Escrow Bank Account"} <ArrowRight className="h-4 w-4" />
                                        </>
                                    )
                                ) : selectedMethod === "PAYSTACK" ? (
                                    <>
                                        Continue to Paystack Checkout <ArrowRight className="h-4 w-4" />
                                    </>
                                ) : (
                                    <>
                                        Authorize & Pay {TOKEN_RATES[tokenType].formatConverted(convertedTokenAmount)} on AfriExchange{" "}
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
