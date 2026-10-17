"use client";

import { useState } from "react";
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
}

export function PaymentMethodModal({
    isOpen,
    onClose,
    totalAmount,
    propertyTitle,
    defaultEmail = "",
    onPaystack,
    onAfriExchange,
}: PaymentMethodModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<"PAYSTACK" | "AFRIEXCHANGE">("AFRIEXCHANGE");
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

    const convertedTokenAmount = TOKEN_RATES[tokenType].convert(totalAmount);

    const handleConfirm = async () => {
        setLoading(true);
        setErrorMessage(null);
        setErrorDetails(null);
        try {
            if (selectedMethod === "PAYSTACK") {
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
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
            <DialogContent className="sm:max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-3xl p-6 shadow-2xl">
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-extrabold text-[var(--text-primary)]">
                                Choose Escrow Payment Gateway
                            </DialogTitle>
                            <DialogDescription className="text-xs text-[var(--text-secondary)] font-medium">
                                Funds are safely held in RentHub Escrow until physical key handover.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Amount & Property Summary */}
                <div className="bg-[var(--bg-muted)]/70 rounded-2xl p-4 border border-[var(--border-color)] flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Total Escrow Amount
                        </p>
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[200px]">
                            {propertyTitle}
                        </p>
                        {selectedMethod === "AFRIEXCHANGE" && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                Rate: {TOKEN_RATES[tokenType].rateDesc}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-extrabold text-[var(--color-brand-green)] tabular-nums">
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
                    {/* Option 1: AfriExchange */}
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
                                                            : "border-[var(--border-color)] bg-[var(--bg-muted)] hover:border-gray-400 text-[var(--text-secondary)] font-medium"
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

                    {/* Option 2: Paystack */}
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
                                Preparing Checkout...
                            </>
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
            </DialogContent>
        </Dialog>
    );
}
