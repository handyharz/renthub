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
import { CreditCard, Zap, ShieldCheck, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalAmount: number;
    propertyTitle: string;
    defaultEmail?: string;
    onPaystack: () => Promise<void>;
    onAfriExchange: (params: { accountEmail: string; walletAddress?: string }) => Promise<void>;
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
    const [selectedMethod, setSelectedMethod] = useState<"PAYSTACK" | "AFRIEXCHANGE">("PAYSTACK");
    const [afriEmail, setAfriEmail] = useState(defaultEmail);
    const [afriWallet, setAfriWallet] = useState("");
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            if (selectedMethod === "PAYSTACK") {
                await onPaystack();
            } else {
                await onAfriExchange({
                    accountEmail: afriEmail.trim(),
                    walletAddress: afriWallet.trim() || undefined,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[220px]">
                            {propertyTitle}
                        </p>
                    </div>
                    <p className="text-xl font-extrabold text-[var(--color-brand-green)] tabular-nums">
                        {formatPrice(totalAmount)}
                    </p>
                </div>

                {/* Gateway Options */}
                <div className="space-y-3 pt-1">
                    {/* Option 1: Paystack */}
                    <div
                        onClick={() => setSelectedMethod("PAYSTACK")}
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
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                                selectedMethod === "PAYSTACK"
                                    ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)] text-white"
                                    : "border-gray-300 dark:border-gray-600"
                            }`}>
                                {selectedMethod === "PAYSTACK" && <CheckCircle2 className="h-4 w-4 fill-current" />}
                            </div>
                        </div>
                    </div>

                    {/* Option 2: AfriExchange */}
                    <div
                        onClick={() => setSelectedMethod("AFRIEXCHANGE")}
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
                                            CT Wallet / Instant
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                        Pay directly from your linked AfriExchange wallet balance
                                    </p>
                                </div>
                            </div>
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                                selectedMethod === "AFRIEXCHANGE"
                                    ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)] text-white"
                                    : "border-gray-300 dark:border-gray-600"
                            }`}>
                                {selectedMethod === "AFRIEXCHANGE" && <CheckCircle2 className="h-4 w-4 fill-current" />}
                            </div>
                        </div>

                        {/* Extra fields if AfriExchange selected */}
                        {selectedMethod === "AFRIEXCHANGE" && (
                            <div className="mt-4 pt-3 border-t border-[var(--border-color)] space-y-3" onClick={(e) => e.stopPropagation()}>
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                                        AfriExchange Account Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={afriEmail}
                                        onChange={(e) => setAfriEmail(e.target.value)}
                                        placeholder="your-email@afriexchange.com"
                                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand-green)] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                                        Wallet Address <span className="text-[10px] font-normal lowercase">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={afriWallet}
                                        onChange={(e) => setAfriWallet(e.target.value)}
                                        placeholder="0x..."
                                        className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand-green)] transition-all"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                    <Button
                        disabled={loading || (selectedMethod === "AFRIEXCHANGE" && !afriEmail.trim())}
                        onClick={handleConfirm}
                        className="w-full h-11 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-sm rounded-xl gap-2 shadow-lg transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing Payment...
                            </>
                        ) : selectedMethod === "PAYSTACK" ? (
                            <>
                                Continue to Paystack Checkout <ArrowRight className="h-4 w-4" />
                            </>
                        ) : (
                            <>
                                Pay with AfriExchange <Zap className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
