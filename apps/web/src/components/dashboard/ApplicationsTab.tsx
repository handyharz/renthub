"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    CreditCard,
    Home,
    ArrowRight,
    Loader2,
    ShieldCheck,
    Star,
    KeyRound,
    AlertTriangle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Search,
    X,
    RefreshCw,
    ExternalLink,
    MapPin,
    Phone,
    Mail,
    Info,
    Sparkles,
    ShieldAlert,
    Lock,
    Landmark,
    Copy,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { EscrowStatusModal } from "./EscrowStatusModal";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { PaymentMethodModal } from "@/components/payment/PaymentMethodModal";
import { RenewalsSection } from "./RenewalsSection";

interface RentalApplication {
    id: string;
    propertyId: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    proposedMoveInDate: string;
    leaseDuration: number;
    note?: string;
    createdAt: string;
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        pricePerYear: number;
        cautionFee?: number;
        legalFee?: number;
        serviceFee?: number;
        images: { url: string; isPrimary: boolean }[];
    };
    landlord?: {
        firstName: string;
        lastName: string;
        phone?: string;
        email?: string;
    };
}

interface Transaction {
    id: string;
    propertyId: string;
    applicationId?: string;
    rentAmount: number;
    cautionFee: number;
    legalFee: number;
    platformFee: number;
    totalAmount: number;
    status: string;
    paymentGateway?: string;
    anchorVirtualNuban?: string;
    anchorBankName?: string;
    anchorCollectionRef?: string;
    anchorEscrowLedgerId?: string;
    createdAt: string;
    escrowHeld: boolean;
    escrowReleased: boolean;
    disputed?: boolean;
    disputeReason?: string;
    releaseOtp?: string;
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        images: { url: string; isPrimary: boolean }[];
        reviews?: { id: string }[];
    };
    landlord?: {
        firstName: string;
        lastName: string;
        phone?: string;
        email?: string;
    };
    tenantId: string;
}

export function ApplicationsTab() {
    const { user } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [applications, setApplications] = useState<RentalApplication[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
    const [otpLoading, setOtpLoading] = useState<string | null>(null);
    const [checkingAnchorStatus, setCheckingAnchorStatus] = useState<string | null>(null);
    const [paymentModalApp, setPaymentModalApp] = useState<RentalApplication | null>(null);
    const [otpRequestedIds, setOtpRequestedIds] = useState<Record<string, boolean>>({});

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewedTxIds, setReviewedTxIds] = useState<string[]>([]);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = (text: string, fieldId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Tab, Search, Filter & Pagination State
    const [activeTab, setActiveTab] = useState<"applications" | "escrow" | "renewals">("applications");
    const [appSearchQuery, setAppSearchQuery] = useState("");
    const [appStatusFilter, setAppStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
    const [escrowFilter, setEscrowFilter] = useState<"all" | "active" | "completed">("all");
    const [appPage, setAppPage] = useState<number>(1);
    const [escrowPage, setEscrowPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        if (user) {
            fetchData();

            // Auto-verify payment if returning from AfriExchange hosted checkout
            const paymentStatus = searchParams.get("payment");
            const ref = searchParams.get("reference") || searchParams.get("ref");
            if (paymentStatus === "success") {
                if (ref) {
                    api.get(`/payments/afriexchange/verify/${encodeURIComponent(ref)}`)
                        .then(() => {
                            toast.success("Payment Verified & Escrow Secured!", {
                                description: "Your rent payment is safely held in escrow.",
                            });
                            fetchData();
                        })
                        .catch((err) => {
                            console.warn("Verification check:", err);
                        });
                } else {
                    toast.success("Escrow Payment Successful!");
                }
            }
        }
    }, [user, searchParams]);

    const fetchData = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);

            const [appRes, txRes] = await Promise.all([
                api.get("/applications/tenant"),
                api.get("/transactions/tenant/all")
            ]);
            setApplications(appRes.data.data || []);
            setTransactions(txRes.data.data || []);

            if (isManualRefresh) {
                toast.success("Applications & Escrow updated");
            }
        } catch (error) {
            console.error("Failed to fetch tenant application data:", error);
            toast.error("Failed to load applications");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePaystackPayment = async () => {
        if (!paymentModalApp) return;
        try {
            setPaymentLoading(paymentModalApp.id);

            const txRes = await api.post("/transactions", {
                propertyId: paymentModalApp.propertyId,
                paymentMethod: "CARD",
                paymentGateway: "PAYSTACK",
                leaseDuration: paymentModalApp.leaseDuration,
                applicationId: paymentModalApp.id
            });

            const transaction = txRes.data.data;

            const payRes = await api.post("/payments/initialize", {
                transactionId: transaction.id,
                callbackUrl: `${window.location.origin}/dashboard?tab=applications&payment=success`
            });

            const { authorization_url } = payRes.data.data;

            toast.loading("Redirecting to Paystack...", { duration: 2000 });
            window.location.href = authorization_url;
        } catch (error: any) {
            console.error("Paystack escrow payment initialization failed:", error);
            toast.error(error.response?.data?.message || "Failed to initialize Paystack payment");
        } finally {
            setPaymentLoading(null);
        }
    };

    const handleAfriExchangePayment = async ({
        accountEmail,
        walletAddress,
        tokenType,
        amountInToken,
    }: {
        accountEmail: string;
        walletAddress?: string;
        tokenType: "NT" | "CT" | "USDT";
        amountInToken?: number;
    }) => {
        if (!paymentModalApp) return;
        try {
            setPaymentLoading(paymentModalApp.id);

            // 1. Create transaction with AFRIEXCHANGE gateway
            const txRes = await api.post("/transactions", {
                propertyId: paymentModalApp.propertyId,
                paymentMethod: "BANK_TRANSFER",
                paymentGateway: "AFRIEXCHANGE",
                leaseDuration: paymentModalApp.leaseDuration,
                applicationId: paymentModalApp.id
            });

            const transaction = txRes.data.data;

            // 2. Initialize AfriExchange hosted payment checkout session
            const payRes = await api.post("/payments/afriexchange/pay", {
                transactionId: transaction.id,
                afriExchangeAccountEmail: accountEmail,
                afriExchangeWalletAddress: walletAddress,
                tokenType: tokenType || "NT",
                amountInToken,
                returnUrl: `${window.location.origin}/dashboard?tab=applications&payment=success&txId=${transaction.id}`,
            });

            const paymentUrl = payRes.data?.data?.paymentUrl;
            if (paymentUrl) {
                toast.loading("Redirecting to AfriExchange Checkout...", { duration: 2500 });
                window.location.href = paymentUrl;
                return;
            }

            toast.success("Escrow Payment Secured!", {
                description: payRes.data?.message || "Your rent has been successfully paid into escrow via AfriExchange!"
            });

            setPaymentModalApp(null);
            await fetchData();
        } catch (error: any) {
            console.error("AfriExchange payment failed:", error);
            toast.error(error.response?.data?.message || "Failed to process AfriExchange payment");
            throw error;
        } finally {
            setPaymentLoading(null);
        }
    };

    const handleAnchorPayment = async () => {
        if (!paymentModalApp) return;
        try {
            setPaymentLoading(paymentModalApp.id);

            const txRes = await api.post("/transactions", {
                propertyId: paymentModalApp.propertyId,
                paymentMethod: "BANK_TRANSFER",
                paymentGateway: "ANCHOR",
                leaseDuration: paymentModalApp.leaseDuration,
                applicationId: paymentModalApp.id,
            });

            const transaction = txRes.data.data;

            const payRes = await api.post("/payments/anchor/initialize", {
                transactionId: transaction.id,
            });

            const anchorData = payRes.data?.data;
            const formatted = {
                virtualNuban: anchorData?.virtualNuban || anchorData?.accountNumber,
                bankName: anchorData?.bankName || "PROVIDUS BANK",
                accountName: anchorData?.accountName || "RentHub Escrow",
                reference: anchorData?.reference || anchorData?.collectionRef,
                totalAmount: anchorData?.totalAmount || transaction.totalAmount,
            };

            toast.success("Anchor Virtual Account Ready!", {
                description: `Transfer ${formatPrice(formatted.totalAmount)} to ${formatted.virtualNuban} (${formatted.bankName}).`
            });

            await fetchData();
            return formatted;
        } catch (error: any) {
            console.error("Anchor payment initialization failed:", error);
            toast.error(error.response?.data?.message || "Failed to initialize Anchor bank transfer");
            throw error;
        } finally {
            setPaymentLoading(null);
        }
    };

    const handleCancelPendingPayment = async (transactionId: string) => {
        try {
            setPaymentLoading(transactionId);
            await api.post(`/transactions/${transactionId}/cancel`);
            toast.success("Payment attempt cancelled", {
                description: "You can now choose a payment method to pay into escrow."
            });
            await fetchData();
        } catch (error: any) {
            console.error("Failed to cancel pending transaction:", error);
            toast.error(error.response?.data?.message || "Failed to cancel payment attempt");
        } finally {
            setPaymentLoading(null);
        }
    };

    const handleCheckAnchorStatus = async (txId: string) => {
        try {
            setCheckingAnchorStatus(txId);
            const res = await api.post(`/payments/anchor/verify/${txId}`);
            if (res.data?.success && res.data?.escrowHeld) {
                toast.success(res.data?.message || "Payment verified! Funds secured in escrow vault.");
                await fetchData(true);
            } else {
                toast.info(res.data?.message || "Transfer not yet confirmed on bank rail. Rechecking shortly.");
                await fetchData(true);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to check Anchor payment status");
            await fetchData(true);
        } finally {
            setCheckingAnchorStatus(null);
        }
    };

    const handleRequestOtp = async (transactionId: string) => {
        try {
            setOtpLoading(transactionId);
            const res = await api.post(`/transactions/${transactionId}/handover-otp`);
            setOtpRequestedIds((prev) => ({ ...prev, [transactionId]: true }));
            toast.success("Handover OTP sent", {
                description: res.data.message || "Check your registered email and phone. The code is not shown in the app."
            });
            fetchData();
        } catch (error: any) {
            console.error("Failed to generate OTP:", error);
            toast.error(error.response?.data?.message || "Failed to generate Handover OTP");
        } finally {
            setOtpLoading(null);
        }
    };

    const handleRaiseDispute = async (transactionId: string) => {
        const reason = prompt("Please describe the issue (e.g. house not empty, keys do not work):");
        if (!reason) return;

        try {
            await api.post(`/transactions/${transactionId}/dispute`, { reason });
            toast.success("Dispute Raised!", {
                description: "Escrow funds have been locked. RentHub support team will contact you within 24 hours."
            });
            fetchData();
        } catch (error: any) {
            console.error("Dispute failed:", error);
            toast.error(error.response?.data?.message || "Failed to raise dispute");
        }
    };

    const handleOpenReviewModal = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsReviewModalOpen(true);
    };

    // Deduplicate and prioritize transactions per application/property
    const getTxForApplication = (app: RentalApplication) => {
        const matchingTxs = transactions.filter(
            (tx) =>
                (tx.applicationId === app.id || tx.propertyId === app.propertyId) &&
                tx.status !== "CANCELLED" &&
                tx.status !== "FAILED"
        );
        // Precedence: completed handover (RELEASED) > active escrow (ESCROWED/SUCCESSFUL) > pending
        const releasedTx = matchingTxs.find((tx) => tx.status === "RELEASED" || tx.escrowReleased);
        if (releasedTx) return releasedTx;
        const escrowedTx = matchingTxs.find((tx) => tx.status === "ESCROWED" || tx.status === "SUCCESSFUL");
        if (escrowedTx) return escrowedTx;
        return matchingTxs[0] || null;
    };

    // Deduplicated escrow transactions list: one entry per application/property
    const deduplicatedEscrowTxs = useMemo(() => {
        const validTxs = transactions.filter(
            (tx) =>
                (tx.status === "ESCROWED" || tx.status === "SUCCESSFUL" || tx.status === "RELEASED" || tx.escrowReleased) &&
                tx.status !== "CANCELLED" &&
                tx.status !== "FAILED"
        );

        const groupMap = new Map<string, Transaction>();
        for (const tx of validTxs) {
            const key = tx.applicationId || tx.propertyId;
            const existing = groupMap.get(key);
            if (!existing) {
                groupMap.set(key, tx);
            } else {
                if (existing.status === "RELEASED" || existing.escrowReleased) {
                    continue;
                }
                if (tx.status === "RELEASED" || tx.escrowReleased) {
                    groupMap.set(key, tx);
                }
            }
        }
        return Array.from(groupMap.values());
    }, [transactions]);

    // Summary metrics calculations
    const stats = useMemo(() => {
        const total = applications.length;
        const pending = applications.filter((a) => a.status === "PENDING").length;
        const approved = applications.filter((a) => a.status === "APPROVED").length;
        const activeEscrows = deduplicatedEscrowTxs.filter(
            (tx) => (tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased
        ).length;
        const completedHandovers = deduplicatedEscrowTxs.filter(
            (tx) => tx.status === "RELEASED" || tx.escrowReleased
        ).length;

        return { total, pending, approved, activeEscrows, completedHandovers };
    }, [applications, deduplicatedEscrowTxs]);

    // Applications filtering
    const filteredApps = useMemo(() => {
        return applications.filter((app) => {
            const matchesStatus = appStatusFilter === "ALL" || app.status === appStatusFilter;
            const q = appSearchQuery.toLowerCase().trim();
            if (!q) return matchesStatus;

            const title = (app.property?.title || "").toLowerCase();
            const city = (app.property?.city || "").toLowerCase();
            const address = (app.property?.address || "").toLowerCase();
            const landlordName = `${app.landlord?.firstName || ""} ${app.landlord?.lastName || ""}`.toLowerCase();

            const matchesSearch =
                title.includes(q) || city.includes(q) || address.includes(q) || landlordName.includes(q);

            return matchesStatus && matchesSearch;
        });
    }, [applications, appStatusFilter, appSearchQuery]);

    // Escrow filtering
    const filteredEscrowTxs = useMemo(() => {
        return deduplicatedEscrowTxs.filter((tx) => {
            if (escrowFilter === "active") {
                return (tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased;
            }
            if (escrowFilter === "completed") {
                return tx.status === "RELEASED" || tx.escrowReleased;
            }
            return true;
        });
    }, [deduplicatedEscrowTxs, escrowFilter]);

    // Pagination calculations
    const totalAppPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE) || 1;
    const paginatedApps = useMemo(() => {
        return filteredApps.slice((appPage - 1) * ITEMS_PER_PAGE, appPage * ITEMS_PER_PAGE);
    }, [filteredApps, appPage]);

    const totalEscrowPages = Math.ceil(filteredEscrowTxs.length / ITEMS_PER_PAGE) || 1;
    const paginatedEscrowTxs = useMemo(() => {
        return filteredEscrowTxs.slice((escrowPage - 1) * ITEMS_PER_PAGE, escrowPage * ITEMS_PER_PAGE);
    }, [filteredEscrowTxs, escrowPage]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-green)]/10 flex items-center justify-center animate-pulse">
                        <FileText className="h-6 w-6 text-[var(--color-brand-green)]" />
                    </div>
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand-green)] absolute -bottom-1 -right-1" />
                </div>
                <p className="font-bold text-sm text-[var(--text-primary)] mt-4">Loading your applications & escrow vault...</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Retrieving payment status, agreements, and key handover OTPs</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full min-w-0 max-w-full">
            {/* Header with Title & Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0">
                <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-[var(--color-brand-green)]/10 border border-emerald-500/30 flex items-center justify-center text-[var(--color-brand-green)] shadow-xs shrink-0">
                            <FileText className="h-4 w-4" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight truncate">
                            My Rental Applications & Escrow
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1 break-words">
                        Track application approvals, pay securely via RentHub Escrow, and verify key handover with 6-digit OTP
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="h-9 px-3.5 rounded-xl border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5 shadow-xs"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[var(--color-brand-green)]" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Metric Overview Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0 max-w-full">
                <div
                    onClick={() => { setActiveTab("applications"); setAppStatusFilter("ALL"); setAppPage(1); }}
                    className={`p-3 sm:p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs min-w-0 ${
                        activeTab === "applications" && appStatusFilter === "ALL"
                            ? "border-[var(--color-brand-green)] ring-2 ring-[var(--color-brand-green)]/15"
                            : "border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40"
                    }`}
                >
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                            Submitted
                        </span>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                        <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)] shrink-0">{stats.total}</span>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--text-muted)] truncate">applications</span>
                    </div>
                </div>

                <div
                    onClick={() => { setActiveTab("applications"); setAppStatusFilter("PENDING"); setAppPage(1); }}
                    className={`p-3 sm:p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs min-w-0 ${
                        activeTab === "applications" && appStatusFilter === "PENDING"
                            ? "border-amber-500 ring-2 ring-amber-500/15"
                            : "border-[var(--border-color)] hover:border-amber-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
                            Awaiting Landlord
                        </span>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                        <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 shrink-0">{stats.pending}</span>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600/80 dark:text-amber-400/80 truncate">in review</span>
                    </div>
                </div>

                <div
                    onClick={() => { setActiveTab("escrow"); setEscrowFilter("active"); setEscrowPage(1); }}
                    className={`p-3 sm:p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs min-w-0 ${
                        activeTab === "escrow" && escrowFilter === "active"
                            ? "border-blue-500 ring-2 ring-blue-500/15"
                            : "border-[var(--border-color)] hover:border-blue-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">
                            Escrow Protected
                        </span>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                        <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 shrink-0">{stats.activeEscrows}</span>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-blue-600/80 dark:text-blue-400/80 truncate">awaiting OTP</span>
                    </div>
                </div>

                <div
                    onClick={() => { setActiveTab("escrow"); setEscrowFilter("completed"); setEscrowPage(1); }}
                    className={`p-3 sm:p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs min-w-0 ${
                        activeTab === "escrow" && escrowFilter === "completed"
                            ? "border-emerald-500 ring-2 ring-emerald-500/15"
                            : "border-[var(--border-color)] hover:border-emerald-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
                            Handovers Done
                        </span>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                        <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 shrink-0">{stats.completedHandovers}</span>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 truncate">keys received</span>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION PILLS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3 w-full min-w-0 max-w-full">
                <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-muted)] rounded-2xl border border-[var(--border-color)] w-full sm:w-auto min-w-0 max-w-full shadow-inner overflow-x-auto no-scrollbar scroll-smooth">
                    <button
                        onClick={() => {
                            setActiveTab("applications");
                            setAppPage(1);
                        }}
                        className={`shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 whitespace-nowrap ${
                            activeTab === "applications"
                                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-color)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <FileText className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                        <span>Rental Applications</span>
                        <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                activeTab === "applications"
                                    ? "bg-[var(--color-brand-green)] text-white"
                                    : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                            }`}
                        >
                            {applications.length}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("escrow");
                            setEscrowPage(1);
                        }}
                        className={`shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 whitespace-nowrap ${
                            activeTab === "escrow"
                                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-color)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <ShieldCheck className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                        <span>Escrow & Key Handover</span>
                        <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                activeTab === "escrow"
                                    ? "bg-[var(--color-brand-green)] text-white"
                                    : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                            }`}
                        >
                            {deduplicatedEscrowTxs.length}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("renewals");
                        }}
                        className={`shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 whitespace-nowrap ${
                            activeTab === "renewals"
                                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-color)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <Sparkles className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                        <span>Lease Renewals</span>
                    </button>
                </div>
            </div>

            {/* TAB CONTENT 1: RENTAL APPLICATIONS */}
            {activeTab === "applications" && (
                <div className="space-y-4">
                    {/* Search & Filter Ribbon */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 p-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-xs w-full min-w-0 max-w-full">
                        {/* Search input */}
                        <div className="relative flex-1 w-full min-w-0">
                            <Search className="h-4 w-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={appSearchQuery}
                                onChange={(e) => {
                                    setAppSearchQuery(e.target.value);
                                    setAppPage(1);
                                }}
                                placeholder="Search applications by property, city, or landlord..."
                                className="w-full h-10 pl-10 pr-4 text-xs font-medium bg-[var(--bg-muted)] rounded-xl border border-transparent focus:border-[var(--color-brand-green)] focus:bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden transition-all"
                            />
                            {appSearchQuery && (
                                <button
                                    onClick={() => setAppSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold p-1"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Status Filter Chips */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pb-1 md:pb-0 w-full md:w-auto min-w-0 max-w-full">
                            {(
                                [
                                    { id: "ALL", label: "All", count: stats.total },
                                    { id: "PENDING", label: "Pending", count: stats.pending },
                                    { id: "APPROVED", label: "Approved", count: stats.approved },
                                    { id: "REJECTED", label: "Declined", count: applications.filter(a => a.status === "REJECTED").length }
                                ] as const
                            ).map((filter) => {
                                const isActive = appStatusFilter === filter.id;
                                return (
                                    <button
                                        key={filter.id}
                                        onClick={() => {
                                            setAppStatusFilter(filter.id);
                                            setAppPage(1);
                                        }}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                                            isActive
                                                ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                                : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)]"
                                        }`}
                                    >
                                        <span>{filter.label}</span>
                                        <span
                                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                                isActive
                                                    ? "bg-white/20 text-white"
                                                    : "bg-[var(--bg-card)] text-[var(--text-muted)]"
                                            }`}
                                        >
                                            {filter.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {applications.length === 0 ? (
                        <div className="text-center py-12 sm:py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-4 sm:p-8 shadow-xs w-full min-w-0 max-w-full">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-green)]/10 text-[var(--color-brand-green)] flex items-center justify-center mx-auto mb-4 border border-[var(--color-brand-green)]/20 shadow-xs">
                                <Home className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">You haven't applied for any homes yet</h3>
                            <p className="text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto mt-1 leading-relaxed">
                                Browse thousands of verified apartments and duplexes across Nigeria with 100% escrow fraud protection.
                            </p>
                            <Link href="/search" className="inline-block mt-6">
                                <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white text-xs font-bold rounded-xl h-10 px-5 shadow-xs gap-1.5">
                                    <Search className="h-3.5 w-3.5" />
                                    Explore Available Homes
                                </Button>
                            </Link>
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="text-center py-10 sm:py-14 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-4 sm:p-8 shadow-xs w-full min-w-0 max-w-full">
                            <Search className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
                            <h3 className="text-base font-bold text-[var(--text-primary)]">No matching applications</h3>
                            <p className="text-xs text-[var(--text-secondary)] font-medium max-w-sm mx-auto mt-1">
                                We couldn't find any applications matching your search query or active filter.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAppSearchQuery("");
                                    setAppStatusFilter("ALL");
                                    setAppPage(1);
                                }}
                                className="mt-4 h-9 px-4 rounded-xl text-xs font-bold border-[var(--border-color)]"
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 w-full min-w-0 max-w-full">
                            {paginatedApps.map((app) => {
                                const primaryImage =
                                    app.property.images?.find((img) => img.isPrimary)?.url ||
                                    app.property.images?.[0]?.url;
                                const platformFee = Math.round(app.property.pricePerYear * 0.02);
                                const totalEstimated =
                                    app.property.pricePerYear +
                                    (app.property.cautionFee || 0) +
                                    (app.property.legalFee || 0) +
                                    (app.property.serviceFee || 0) +
                                    platformFee;

                                const txForApp = getTxForApplication(app);

                                const isHandoverCompleted =
                                    txForApp && (txForApp.status === "RELEASED" || txForApp.escrowReleased);
                                const isPaidInEscrow =
                                    txForApp &&
                                    (txForApp.status === "ESCROWED" || txForApp.status === "SUCCESSFUL") &&
                                    !txForApp.escrowReleased;
                                const hasActiveTransaction = txForApp && !txForApp.escrowReleased;

                                return (
                                    <div
                                        key={app.id}
                                        className="bg-[var(--bg-card)] rounded-2xl p-3.5 sm:p-5 border border-[var(--border-color)] shadow-xs hover:border-[var(--color-brand-green)]/40 transition-all duration-200 space-y-4 w-full min-w-0 max-w-full"
                                    >
                                        {/* Top Property Info & Status */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4 w-full min-w-0">
                                            <div className="flex items-center gap-3 sm:gap-3.5 w-full sm:w-auto flex-1 min-w-0">
                                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-[var(--bg-muted)] overflow-hidden relative shrink-0 border border-[var(--border-color)] shadow-xs">
                                                    {primaryImage ? (
                                                        <Image
                                                            src={primaryImage}
                                                            alt={app.property.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-[var(--bg-muted)] text-[var(--text-muted)]">
                                                            <Home className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <h3 className="font-extrabold text-[var(--text-primary)] text-sm sm:text-base leading-snug truncate">
                                                            {app.property.title}
                                                        </h3>
                                                        <Link
                                                            href={`/properties/${app.property.id}`}
                                                            target="_blank"
                                                            className="text-[var(--text-muted)] hover:text-[var(--color-brand-green)] transition-colors shrink-0"
                                                            title="View property listing"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1 mt-0.5 min-w-0">
                                                        <MapPin className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                                                        <span className="truncate">{app.property.address}, {app.property.city}</span>
                                                    </p>
                                                    <div className="text-xs font-black text-[var(--color-brand-green)] mt-1 truncate">
                                                        Annual Rent: {formatPrice(app.property.pricePerYear)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full sm:w-auto flex flex-wrap items-center shrink-0 self-start sm:self-center">
                                                {app.status === "PENDING" && (
                                                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs max-w-full break-words">
                                                        <Clock className="h-3.5 w-3.5 animate-pulse shrink-0" /> Awaiting Landlord Approval
                                                    </Badge>
                                                )}
                                                {app.status === "APPROVED" && !isPaidInEscrow && !isHandoverCompleted && (
                                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs max-w-full break-words">
                                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Approved — Action Required
                                                    </Badge>
                                                )}
                                                {app.status === "APPROVED" && isPaidInEscrow && !isHandoverCompleted && (
                                                    <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs max-w-full break-words">
                                                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Rent Secured in Escrow
                                                    </Badge>
                                                )}
                                                {isHandoverCompleted && (
                                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs max-w-full break-words">
                                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Handover Complete
                                                    </Badge>
                                                )}
                                                {app.status === "REJECTED" && (
                                                    <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs max-w-full break-words">
                                                        <XCircle className="h-3.5 w-3.5 shrink-0" /> Application Declined
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Application Details Strip */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[var(--bg-muted)]/60 border border-[var(--border-color)] text-xs">
                                            <div className="min-w-0">
                                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block truncate">Proposed Move-In</span>
                                                <span className="font-extrabold text-[var(--text-primary)] mt-0.5 block truncate">
                                                    {new Date(app.proposedMoveInDate).toLocaleDateString("en-NG", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block truncate">Duration</span>
                                                <span className="font-extrabold text-[var(--text-primary)] mt-0.5 block truncate">
                                                    {app.leaseDuration} Months
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block truncate">Est. Total Deposit</span>
                                                <span className="font-extrabold text-[var(--color-brand-green)] mt-0.5 block truncate">
                                                    {formatPrice(totalEstimated)}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block truncate">Application Date</span>
                                                <span className="font-semibold text-[var(--text-secondary)] mt-0.5 block truncate">
                                                    {new Date(app.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Application Note */}
                                        {app.note && (
                                            <div className="text-xs text-[var(--text-secondary)] font-medium bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 break-words">
                                                <span className="font-bold text-[var(--text-primary)] mr-1">Your Note to Landlord:</span>
                                                <span className="italic">"{app.note}"</span>
                                            </div>
                                        )}

                                        {/* DYNAMIC ACTION BANNERS ACROSS ALL STATUSES */}
                                        {/* Status: PENDING (Awaiting Landlord Approval) */}
                                        {app.status === "PENDING" && (
                                            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-medium flex items-start gap-2.5">
                                                <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 animate-pulse" />
                                                <div className="space-y-0.5 min-w-0">
                                                    <span className="font-bold text-[var(--text-primary)] block">Awaiting Landlord Review</span>
                                                    <span className="leading-relaxed text-[var(--text-secondary)] block">
                                                        Your application has been submitted. As soon as the landlord accepts, this listing will lock for you to deposit rent into protected escrow.
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Status: REJECTED (Application Declined) */}
                                        {app.status === "REJECTED" && (
                                            <div className="p-3.5 sm:p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-start gap-2.5 min-w-0">
                                                    <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                                                    <div className="space-y-0.5 min-w-0">
                                                        <span className="font-bold text-[var(--text-primary)] block">Application Declined</span>
                                                        <span className="leading-relaxed text-[var(--text-secondary)] block">
                                                            This application was declined. Explore other verified homes on RentHub with 0% broker fee and full escrow protection.
                                                        </span>
                                                    </div>
                                                </div>
                                                <Link href="/search" className="shrink-0 w-full sm:w-auto">
                                                    <Button size="sm" variant="outline" className="w-full sm:w-auto h-9 px-4 rounded-xl border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold gap-1.5 hover:bg-red-500/10 shadow-2xs">
                                                        <Search className="h-3.5 w-3.5" /> Browse Homes
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}

                                        {/* Status: APPROVED & Ready to Pay Escrow */}
                                        {app.status === "APPROVED" && !hasActiveTransaction && !isHandoverCompleted && (
                                            <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent rounded-2xl p-4 sm:p-5 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base flex items-center gap-2">
                                                        <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" /> Landlord Accepted Your Application!
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
                                                        Property is locked for you. Deposit{" "}
                                                        <strong className="text-[var(--text-primary)] font-extrabold">
                                                            {formatPrice(totalEstimated)}
                                                        </strong>{" "}
                                                        into RentHub Escrow. Funds remain 100% protected until you inspect the house and release the OTP keys.
                                                    </p>
                                                </div>

                                                <Button
                                                    disabled={paymentLoading === app.id}
                                                    onClick={() => setPaymentModalApp(app)}
                                                    className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold text-xs rounded-xl shrink-0 h-11 px-6 gap-2 shadow-xs w-full md:w-auto"
                                                >
                                                    <CreditCard className="h-4 w-4 shrink-0" />
                                                    {paymentLoading === app.id ? "Processing..." : "Pay Into Escrow"}
                                                </Button>
                                            </div>
                                        )}

                                        {/* Status: APPROVED with Payment Pending / Processing */}
                                        {app.status === "APPROVED" &&
                                            txForApp &&
                                            txForApp.status === "PENDING" &&
                                            !isHandoverCompleted && (
                                                txForApp.paymentGateway === "ANCHOR" && txForApp.anchorVirtualNuban ? (
                                                    <div className="bg-emerald-500/10 rounded-2xl p-4 sm:p-5 border border-emerald-500/30 space-y-3.5">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                                                    <Landmark className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                                                                        Dedicated Providus Escrow Account Ready
                                                                    </div>
                                                                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                                                                        Transfer from any Nigerian banking app. Escrow locks automatically upon receipt.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-none text-[10px] font-bold py-1 px-2.5 self-start sm:self-center">
                                                                Awaiting Inbound Transfer
                                                            </Badge>
                                                        </div>

                                                        {/* Account Transfer Details Strip */}
                                                        <div className="bg-[var(--bg-card)] rounded-xl p-3.5 border border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                            <div>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Bank Name</span>
                                                                <p className="font-extrabold text-[var(--text-primary)] mt-0.5">{txForApp.anchorBankName || "PROVIDUS BANK"}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Account Number</span>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">{txForApp.anchorVirtualNuban}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => copyToClipboard(txForApp.anchorVirtualNuban!, `app-nuban-${txForApp.id}`)}
                                                                        className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-all"
                                                                        title="Copy account number"
                                                                    >
                                                                        {copiedField === `app-nuban-${txForApp.id}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Account Name</span>
                                                                <p className="font-semibold text-[var(--text-primary)] truncate mt-0.5">RentHub: {user?.fullName || "Tenant"}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Exact Amount</span>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="font-extrabold text-sm text-[var(--text-primary)]">{formatPrice(txForApp.totalAmount)}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => copyToClipboard(String(txForApp.totalAmount), `app-amt-${txForApp.id}`)}
                                                                        className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-all"
                                                                        title="Copy amount"
                                                                    >
                                                                        {copiedField === `app-amt-${txForApp.id}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Sandbox Simulation Guide Helper Box */}
                                                        {txForApp.anchorEscrowLedgerId && (
                                                            <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/20 text-xs space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-[11px]">
                                                                        🧪 Anchor Sandbox Testing Helper
                                                                    </span>
                                                                    <span className="text-[10px] text-[var(--text-secondary)]">For Anchor Dashboard &ldquo;Simulate Transfer&rdquo;</span>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-[var(--bg-card)]/80 p-2.5 rounded-lg border border-emerald-500/10">
                                                                    <div>
                                                                        <span className="text-[10px] text-[var(--text-secondary)] font-medium">Anchor Account Number ID *</span>
                                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold truncate">{txForApp.anchorEscrowLedgerId}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => copyToClipboard(txForApp.anchorEscrowLedgerId!, `app-ledger-${txForApp.id}`)}
                                                                                className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-all shrink-0"
                                                                                title="Copy Anchor Account ID"
                                                                            >
                                                                                {copiedField === `app-ledger-${txForApp.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[10px] text-[var(--text-secondary)] font-medium">Source Account (Sender)</span>
                                                                        <p className="font-medium text-[var(--text-primary)] mt-0.5 truncate">Any Mock Bank (e.g. Stanbic / 0123456789)</p>
                                                                    </div>
                                                                </div>
                                                                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                                                                    💡 In Anchor Dashboard &gt; <strong>Simulate Transfer</strong>: paste the <strong>Anchor Account Number ID</strong> above into <code>Account Number ID *</code>, and <code>{txForApp.totalAmount}</code> into <code>Amount *</code>. Once simulated, click <strong>Check Status</strong> below to verify!
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-0.5">
                                                            <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                                                                <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                                Reconciles automatically within 10–30 seconds after transfer.
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleCheckAnchorStatus(txForApp.id)}
                                                                    disabled={refreshing || checkingAnchorStatus === txForApp.id}
                                                                    className="text-xs h-8 px-3 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                                                                >
                                                                    <RefreshCw className={`h-3 w-3 mr-1 ${refreshing || checkingAnchorStatus === txForApp.id ? "animate-spin" : ""}`} /> Check Status
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled={paymentLoading === txForApp.id}
                                                                    onClick={() => handleCancelPendingPayment(txForApp.id)}
                                                                    className="text-xs h-8 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                                                                >
                                                                    Cancel / Change Method
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-amber-500/10 rounded-2xl p-4 sm:p-5 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="space-y-1 text-xs min-w-0">
                                                            <div className="font-bold text-amber-600 dark:text-amber-400 text-sm flex items-center gap-1.5">
                                                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> Payment Initiated — Awaiting Confirmation
                                                            </div>
                                                            <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                                                                Your transaction was initiated via {txForApp.paymentGateway === "ANCHOR" ? "Anchor BaaS" : txForApp.paymentGateway === "AFRIEXCHANGE" ? "AfriExchange" : "Paystack"}. If you closed or cancelled the checkout session, you can switch payment methods or retry.
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
                                                            {txForApp.paymentGateway === "ANCHOR" && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleCheckAnchorStatus(txForApp.id)}
                                                                    disabled={refreshing || checkingAnchorStatus === txForApp.id}
                                                                    className="text-xs h-9 px-3 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 w-full sm:w-auto text-center"
                                                                >
                                                                    <RefreshCw className={`h-3 w-3 mr-1 ${refreshing || checkingAnchorStatus === txForApp.id ? "animate-spin" : ""}`} /> Check Status
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="outline"
                                                                disabled={paymentLoading === txForApp.id}
                                                                onClick={() => handleCancelPendingPayment(txForApp.id)}
                                                                className="text-xs h-9 px-3 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 w-full sm:w-auto text-center"
                                                            >
                                                                {paymentLoading === txForApp.id ? "Cancelling..." : "Cancel / Change Method"}
                                                            </Button>
                                                            <Button
                                                                disabled={paymentLoading === app.id}
                                                                onClick={() => setPaymentModalApp(app)}
                                                                className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs h-9 px-4 w-full sm:w-auto text-center"
                                                            >
                                                                Retry Payment
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )
                                            )}

                                        {/* Status: APPROVED with Funds Secured in Escrow */}
                                        {app.status === "APPROVED" && isPaidInEscrow && !isHandoverCompleted && (
                                            <div className="bg-blue-500/10 rounded-2xl p-4 sm:p-5 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="font-black text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2">
                                                        <Lock className="h-4 w-4 text-blue-500 shrink-0" /> Funds Secured in Escrow Vault
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                                                        Your payment is safely locked in escrow. Switch to the{" "}
                                                        <button
                                                            onClick={() => setActiveTab("escrow")}
                                                            className="font-bold underline text-[var(--color-brand-green)] hover:opacity-80"
                                                        >
                                                            Active Escrow & Key Handover
                                                        </button>{" "}
                                                        tab to generate or view your 6-digit OTP code.
                                                    </p>
                                                </div>

                                                <Button
                                                    onClick={() => setActiveTab("escrow")}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shrink-0 h-10 px-4 gap-1.5 shadow-xs w-full md:w-auto"
                                                >
                                                    <KeyRound className="h-3.5 w-3.5 shrink-0" />
                                                    View Handover OTP
                                                </Button>
                                            </div>
                                        )}

                                        {/* Status: Handover Completed & Finalized */}
                                        {isHandoverCompleted && (
                                            <div className="bg-emerald-500/10 rounded-2xl p-4 sm:p-5 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Key Handover Complete & Escrow Released!
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                                                        You have physically received the keys and the landlord has been paid. Enjoy your new home!
                                                    </p>
                                                </div>

                                                {txForApp && (
                                                    reviewedTxIds.includes(txForApp.id) ||
                                                    (txForApp.property?.reviews && txForApp.property.reviews.length > 0) ? (
                                                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0 shadow-2xs self-start sm:self-center">
                                                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" /> Review Submitted ✅
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            onClick={() => handleOpenReviewModal(txForApp)}
                                                            className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shrink-0 flex items-center gap-1.5 h-10 px-4 shadow-xs w-full md:w-auto"
                                                        >
                                                            <Star className="h-3.5 w-3.5 fill-current shrink-0" /> Write Verified Review
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination for Applications */}
                    {filteredApps.length > ITEMS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-color)] w-full min-w-0">
                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                Showing{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {(appPage - 1) * ITEMS_PER_PAGE + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {Math.min(appPage * ITEMS_PER_PAGE, filteredApps.length)}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {filteredApps.length}
                                </span>{" "}
                                applications
                            </p>

                            <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={appPage === 1}
                                    onClick={() => setAppPage((p) => Math.max(1, p - 1))}
                                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-[var(--border-color)]"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                </Button>

                                {Array.from({ length: totalAppPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setAppPage(page)}
                                        className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                                            appPage === page
                                                ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={appPage === totalAppPages}
                                    onClick={() => setAppPage((p) => Math.min(totalAppPages, p + 1))}
                                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-[var(--border-color)]"
                                >
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT 2: ACTIVE ESCROW & KEY HANDOVER */}
            {activeTab === "escrow" && (
                <div className="space-y-4 w-full min-w-0 max-w-full">
                    {/* Sub-filter Pills */}
                    <div className="flex items-center gap-2 pb-1 overflow-x-auto no-scrollbar scroll-smooth w-full min-w-0 max-w-full">
                        <button
                            onClick={() => {
                                setEscrowFilter("all");
                                setEscrowPage(1);
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                                escrowFilter === "all"
                                    ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                    : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            <span>All</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                escrowFilter === "all" ? "bg-white/20 text-white" : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                            }`}>
                                {deduplicatedEscrowTxs.length}
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                setEscrowFilter("active");
                                setEscrowPage(1);
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                                escrowFilter === "active"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            <KeyRound className="h-3.5 w-3.5" />
                            <span>Awaiting Keys & OTP</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                escrowFilter === "active" ? "bg-white/20 text-white" : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                            }`}>
                                {stats.activeEscrows}
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                setEscrowFilter("completed");
                                setEscrowPage(1);
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                                escrowFilter === "completed"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Completed Handovers</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                escrowFilter === "completed" ? "bg-white/20 text-white" : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                            }`}>
                                {stats.completedHandovers}
                            </span>
                        </button>
                    </div>

                    {filteredEscrowTxs.length === 0 ? (
                        <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 shadow-xs">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-xs">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <h3 className="text-base font-bold text-[var(--text-primary)]">
                                {escrowFilter === "active"
                                    ? "No active escrow payments awaiting key handover"
                                    : escrowFilter === "completed"
                                    ? "No completed rental handovers yet"
                                    : "No escrow transactions found"}
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] font-medium max-w-sm mx-auto mt-1 leading-relaxed">
                                When a landlord accepts your application and you deposit rent into Escrow, your funds and 6-digit Key OTP will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {paginatedEscrowTxs.map((tx) => {
                                const primaryImage =
                                    tx.property?.images?.find((img) => img.isPrimary)?.url ||
                                    tx.property?.images?.[0]?.url;

                                return (
                                    <div
                                        key={tx.id}
                                        className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-xs hover:border-[var(--color-brand-green)]/40 transition-all duration-200 space-y-4"
                                    >
                                        {/* Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
                                            <div className="flex items-center gap-3 sm:gap-3.5 w-full sm:w-auto flex-1 min-w-0">
                                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-[var(--bg-muted)] overflow-hidden relative shrink-0 border border-[var(--border-color)] shadow-xs">
                                                    {primaryImage ? (
                                                        <Image
                                                            src={primaryImage}
                                                            alt={tx.property?.title || "Property"}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-[var(--bg-muted)] text-[var(--text-muted)]">
                                                            <Home className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <h3 className="font-extrabold text-[var(--text-primary)] text-sm sm:text-base leading-snug truncate">
                                                            {tx.property?.title}
                                                        </h3>
                                                        <Link
                                                            href={`/properties/${tx.propertyId}`}
                                                            target="_blank"
                                                            className="text-[var(--text-muted)] hover:text-[var(--color-brand-green)] transition-colors shrink-0"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1 mt-0.5 min-w-0">
                                                        <MapPin className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                                                        <span className="truncate">
                                                            {tx.property?.city} • Paid into Escrow:{" "}
                                                            <strong className="text-[var(--color-brand-green)]">
                                                                {formatPrice(tx.totalAmount)}
                                                            </strong>
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="shrink-0 self-start sm:self-center">
                                                {(tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased && (
                                                    <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                                                        <ShieldCheck className="h-3.5 w-3.5" /> Funds Secured in Escrow
                                                    </Badge>
                                                )}
                                                {(tx.status === "RELEASED" || tx.escrowReleased) && (
                                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Handover Complete & Escrow Released
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Handover OTP Card */}
                                        {(tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased && (
                                            <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent rounded-2xl p-4 sm:p-5 border border-blue-500/30 space-y-4 shadow-xs">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="font-black text-blue-600 dark:text-blue-400 text-sm sm:text-base flex items-center gap-2">
                                                            <KeyRound className="h-5 w-5 text-blue-500" /> Physical Key Handover OTP
                                                        </div>
                                                        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
                                                            Share your 6-digit OTP code with the landlord{" "}
                                                            <strong className="text-red-600 dark:text-red-400 font-extrabold">
                                                                ONLY AFTER
                                                            </strong>{" "}
                                                            physically inspecting the property, verifying all keys work, and confirming the house matches the agreed terms.
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                                        <Button
                                                            disabled={otpLoading === tx.id}
                                                            onClick={() => handleRequestOtp(tx.id)}
                                                            className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold text-xs rounded-xl h-10 px-4 gap-1.5 shadow-xs"
                                                        >
                                                            {otpLoading === tx.id ? (
                                                                <>
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                    Generating...
                                                                </>
                                                            ) : otpRequestedIds[tx.id] ? (
                                                                <>
                                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                                    Resend OTP
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <KeyRound className="h-3.5 w-3.5" />
                                                                    Generate Handover OTP
                                                                </>
                                                            )}
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleRaiseDispute(tx.id)}
                                                            className="text-red-500 border-red-500/30 hover:bg-red-500/10 text-xs font-bold rounded-xl h-10 px-4 gap-1 shadow-xs"
                                                        >
                                                            <ShieldAlert className="h-3.5 w-3.5" />
                                                            Dispute
                                                        </Button>
                                                    </div>
                                                </div>

                                                {otpRequestedIds[tx.id] && (
                                                    <div className="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-5 border border-[var(--border-color)] text-center space-y-2 shadow-xs">
                                                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                                            <Lock className="h-3.5 w-3.5 text-[var(--color-brand-green)]" />
                                                            OTP sent to your email and phone
                                                        </div>
                                                        <p className="text-[11px] text-[var(--text-muted)] font-medium max-w-md mx-auto">
                                                            Give that code to your landlord only after you hold the physical keys. It is never shown in the app.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Completed Handover Card */}
                                        {(tx.status === "RELEASED" || tx.escrowReleased) && (
                                            <div className="bg-emerald-500/10 rounded-2xl p-4 sm:p-5 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1 text-xs">
                                                    <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Key Handover Completed & Escrow Finalized!
                                                    </div>
                                                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                                                        Escrow funds have been successfully disbursed to the landlord. Thank you for using RentHub's verified escrow platform!
                                                    </p>
                                                </div>

                                                {reviewedTxIds.includes(tx.id) ||
                                                (tx.property?.reviews && tx.property.reviews.length > 0) ? (
                                                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0 shadow-2xs">
                                                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Review Submitted ✅
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleOpenReviewModal(tx)}
                                                        className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shrink-0 flex items-center gap-1.5 h-10 px-4 shadow-xs"
                                                    >
                                                        <Star className="h-3.5 w-3.5 fill-current" /> Write Verified Review
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination for Escrow */}
                    {filteredEscrowTxs.length > ITEMS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-color)]">
                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                Showing{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {(escrowPage - 1) * ITEMS_PER_PAGE + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {Math.min(escrowPage * ITEMS_PER_PAGE, filteredEscrowTxs.length)}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {filteredEscrowTxs.length}
                                </span>{" "}
                                transactions
                            </p>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={escrowPage === 1}
                                    onClick={() => setEscrowPage((p) => Math.max(1, p - 1))}
                                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-[var(--border-color)]"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                </Button>

                                {Array.from({ length: totalEscrowPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setEscrowPage(page)}
                                        className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                                            escrowPage === page
                                                ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={escrowPage === totalEscrowPages}
                                    onClick={() => setEscrowPage((p) => Math.min(totalEscrowPages, p + 1))}
                                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-[var(--border-color)]"
                                >
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT 3: LEASE RENEWALS */}
            {activeTab === "renewals" && (
                <RenewalsSection role="TENANT" />
            )}

            {/* Escrow Modal */}
            {selectedTransaction && isEscrowModalOpen && (
                <EscrowStatusModal
                    isOpen={isEscrowModalOpen}
                    onClose={() => setIsEscrowModalOpen(false)}
                    transaction={selectedTransaction}
                    userRole="TENANT"
                />
            )}

            {/* Review Modal */}
            {selectedTransaction && isReviewModalOpen && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    transaction={selectedTransaction as any}
                    onSuccess={() => {
                        if (selectedTransaction) {
                            setReviewedTxIds((prev) => [...prev, selectedTransaction.id]);
                        }
                        fetchData();
                    }}
                />
            )}

            {/* Payment Method Gateway Modal */}
            {paymentModalApp && (
                <PaymentMethodModal
                    isOpen={!!paymentModalApp}
                    onClose={() => setPaymentModalApp(null)}
                    totalAmount={
                        paymentModalApp.property?.pricePerYear +
                        (paymentModalApp.property?.cautionFee || 0) +
                        (paymentModalApp.property?.legalFee || 0) +
                        (paymentModalApp.property?.serviceFee || 0) +
                        Math.round(paymentModalApp.property?.pricePerYear * 0.02)
                    }
                    propertyTitle={paymentModalApp.property?.title}
                    defaultEmail={user?.emailAddresses?.[0]?.emailAddress || ""}
                    onPaystack={handlePaystackPayment}
                    onAfriExchange={handleAfriExchangePayment}
                    onAnchor={handleAnchorPayment}
                />
            )}
        </div>
    );
}
