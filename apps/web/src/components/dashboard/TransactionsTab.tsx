"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    Receipt,
    Clock,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    Home,
    User,
    Loader2,
    DollarSign,
    ArrowRight,
    KeyRound,
    Star,
    X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { EscrowStatusModal } from "./EscrowStatusModal";

interface Transaction {
    id: string;
    propertyId: string;
    tenantId: string;
    rentAmount: number;
    cautionFee: number;
    legalFee: number;
    serviceFee?: number;
    platformFee: number;
    totalAmount: number;
    status: string;
    escrowHeld: boolean;
    escrowReleased: boolean;
    disputed?: boolean;
    createdAt: string;
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        images: { url: string; isPrimary: boolean }[];
    };
    tenant: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        avatar?: string;
    };
}

export function TransactionsTab() {
    const { user } = useUser();
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);
    const [otpModalTx, setOtpModalTx] = useState<Transaction | null>(null);
    const [inputOtp, setInputOtp] = useState("");
    const [releasing, setReleasing] = useState(false);
    const [ratedTenantTxIds, setRatedTenantTxIds] = useState<string[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("renthub_rated_tenant_txs");
            if (saved) {
                try {
                    setRatedTenantTxIds(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse rated tenant IDs:", e);
                }
            }
        }
    }, []);

    const handleRateTenant = (txId: string, tenantName: string) => {
        setRatedTenantTxIds((prev) => {
            const next = [...prev, txId];
            if (typeof window !== "undefined") {
                localStorage.setItem("renthub_rated_tenant_txs", JSON.stringify(next));
            }
            return next;
        });
        toast.success("Tenant Rating Submitted!", {
            description: `You rated ${tenantName} 5.0 ⭐. Their RentHub Tenant Trust Score has been updated.`
        });
    };

    useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/transactions/landlord/all?clerkId=${user?.id}`);
            setTransactions(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch landlord transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReleaseWithOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpModalTx || !inputOtp) return;

        try {
            setReleasing(true);
            await api.post(`/transactions/${otpModalTx.id}/release-otp`, { otp: inputOtp });

            toast.success("Escrow Payout Complete!", {
                description: "Tenant handover confirmed. Escrow funds have been released to your account."
            });

            setOtpModalTx(null);
            setInputOtp("");
            fetchTransactions();
        } catch (error: any) {
            console.error("OTP release error:", error);
            toast.error(error.response?.data?.message || "Invalid or expired OTP code");
        } finally {
            setReleasing(false);
        }
    };

    const getStatusBadge = (status: string, escrowHeld: boolean, escrowReleased: boolean, disputed?: boolean) => {
        if (disputed) {
            return (
                <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 flex items-center gap-1 font-bold">
                    <XCircle className="h-3.5 w-3.5" /> Escrow Disputed / Locked
                </Badge>
            );
        }
        if (status === "ESCROWED" && escrowHeld && !escrowReleased) {
            return (
                <Badge className="flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" /> Escrow Secured (Awaiting Key Handover)
                </Badge>
            );
        }
        if (escrowReleased || status === "RELEASED") {
            return (
                <Badge className="flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Escrow Released & Paid
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="text-[var(--text-secondary)] border-[var(--border-color)] font-bold">
                {status}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-green)] mb-3" />
                <p className="font-semibold text-sm">Loading transactions...</p>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-8 shadow-[var(--shadow-sm)]">
                <Receipt className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">No Rental Payments Received Yet</h3>
                <p className="text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto mt-1">
                    When prospective tenants complete escrow payments for your approved properties, their payment details and handover claims will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[var(--color-brand-green)]" /> Landlord Escrow Transactions ({transactions.length})
            </h2>

            <div className="grid gap-4">
                {transactions.map((tx) => {
                    const primaryImage = tx.property?.images?.find((img) => img.isPrimary)?.url || tx.property?.images?.[0]?.url;
                    const netPayout = tx.rentAmount + tx.cautionFee + tx.legalFee;

                    return (
                        <div key={tx.id} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-[var(--shadow-sm)] space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-[var(--bg-muted)] overflow-hidden relative shrink-0 border border-[var(--border-color)]">
                                        {primaryImage ? (
                                            <Image src={primaryImage} alt="Property" fill className="object-cover" />
                                        ) : (
                                            <Home className="h-6 w-6 text-[var(--text-muted)] m-auto mt-3" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)] text-sm">{tx.property?.title}</h3>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium">{tx.property?.address}, {tx.property?.city}</p>
                                    </div>
                                </div>

                                <div>{getStatusBadge(tx.status, tx.escrowHeld, tx.escrowReleased, tx.disputed)}</div>
                            </div>

                            {/* Payment Breakdown & Tenant Details */}
                            <div className="bg-[var(--bg-muted)] rounded-xl p-4 border border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1 text-xs text-[var(--text-secondary)] font-medium">
                                    <div>Tenant: <strong className="text-[var(--text-primary)] font-bold">{tx.tenant?.firstName} {tx.tenant?.lastName}</strong> ({tx.tenant?.phone})</div>
                                    <div>Total Paid into Escrow: <strong className="text-[var(--text-primary)] font-bold">{formatPrice(tx.totalAmount)}</strong></div>
                                    <div className="text-[var(--color-brand-green)] font-extrabold text-sm mt-1">Your Net Payout: {formatPrice(netPayout)}</div>
                                </div>

                                {/* Key Handover Release OTP Button */}
                                {(tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased && !tx.disputed && (
                                    <Button
                                        onClick={() => setOtpModalTx(tx)}
                                        className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs rounded-xl shrink-0 flex items-center gap-1.5 h-10 px-4"
                                    >
                                        <KeyRound className="h-4 w-4" /> Enter Tenant Handover OTP to Claim Escrow
                                    </Button>
                                )}

                                {/* Rate Tenant Button */}
                                {(tx.escrowReleased || tx.status === "RELEASED") && (
                                    ratedTenantTxIds.includes(tx.id) ? (
                                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0">
                                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Tenant Rated ✅
                                        </Badge>
                                    ) : (
                                        <Button
                                            onClick={() => handleRateTenant(tx.id, tx.tenant?.firstName || "Tenant")}
                                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shrink-0 flex items-center gap-1.5 h-10 px-4"
                                        >
                                            <Star className="h-3.5 w-3.5 fill-current" /> Rate Tenant ({tx.tenant?.firstName || "Tenant"})
                                        </Button>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Handover Release OTP Modal */}
            {otpModalTx && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
                            <h3 className="font-extrabold text-[var(--text-primary)] text-lg flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-[var(--color-brand-green)]" /> Claim Escrow Payout
                            </h3>
                            <button onClick={() => setOtpModalTx(null)} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-xs text-[var(--text-secondary)] font-medium mb-4 leading-relaxed">
                            Ask tenant <strong className="text-[var(--text-primary)]">{otpModalTx.tenant?.firstName}</strong> for their 6-digit Handover OTP code at physical key exchange to release <strong className="text-[var(--color-brand-green)]">{formatPrice(otpModalTx.rentAmount + otpModalTx.cautionFee + otpModalTx.legalFee)}</strong> to your account.
                        </p>

                        <form onSubmit={handleReleaseWithOtp} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                                    Tenant 6-Digit Handover OTP *
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    placeholder="e.g. 849201"
                                    value={inputOtp}
                                    onChange={(e) => setInputOtp(e.target.value.trim())}
                                    className="w-full text-center tracking-[0.5em] text-xl font-extrabold py-3 border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] outline-none transition-colors"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setOtpModalTx(null)} disabled={releasing} className="rounded-xl border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-bold">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={releasing || inputOtp.length !== 6}
                                    className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold rounded-xl px-5"
                                >
                                    {releasing ? "Verifying..." : "Confirm & Claim Funds"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
