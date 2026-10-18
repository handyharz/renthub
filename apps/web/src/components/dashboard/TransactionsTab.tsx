"use client";

import { useEffect, useState, useMemo } from "react";
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
    X,
    Wallet,
    Search,
    RefreshCw,
    ExternalLink,
    MapPin,
    Phone,
    Mail,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Eye,
    ShieldAlert,
    Coins,
    Building2,
    Info
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
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);
    const [otpModalTx, setOtpModalTx] = useState<Transaction | null>(null);
    const [inputOtp, setInputOtp] = useState("");
    const [releasing, setReleasing] = useState(false);
    const [ratedTenantTxIds, setRatedTenantTxIds] = useState<string[]>([]);

    // Search, filter & pagination state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ESCROWED" | "RELEASED" | "DISPUTED">("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

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

    const fetchTransactions = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);

            const res = await api.get(`/transactions/landlord/all?clerkId=${user?.id}`);
            setTransactions(res.data.data || []);
            if (isManualRefresh) {
                toast.success("Transactions updated");
            }
        } catch (error) {
            console.error("Failed to fetch landlord transactions:", error);
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
            setRefreshing(false);
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

    // Financial & Metric Calculations
    const stats = useMemo(() => {
        const total = transactions.length;
        let grossVolume = 0;
        let totalNetPayout = 0;
        let inEscrowAmount = 0;
        let inEscrowCount = 0;
        let releasedAmount = 0;
        let releasedCount = 0;
        let disputedCount = 0;

        for (const tx of transactions) {
            grossVolume += tx.totalAmount || 0;
            const net = (tx.rentAmount || 0) + (tx.cautionFee || 0) + (tx.legalFee || 0) + (tx.serviceFee || 0);
            totalNetPayout += net;

            if (tx.disputed) {
                disputedCount++;
            } else if (tx.escrowReleased || tx.status === "RELEASED") {
                releasedCount++;
                releasedAmount += net;
            } else if ((tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased) {
                inEscrowCount++;
                inEscrowAmount += net;
            }
        }

        return {
            total,
            grossVolume,
            totalNetPayout,
            inEscrowAmount,
            inEscrowCount,
            releasedAmount,
            releasedCount,
            disputedCount
        };
    }, [transactions]);

    // Search and filter transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter((tx) => {
            let matchesStatus = true;
            if (statusFilter === "ESCROWED") {
                matchesStatus = (tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased && !tx.disputed;
            } else if (statusFilter === "RELEASED") {
                matchesStatus = (tx.escrowReleased || tx.status === "RELEASED") && !tx.disputed;
            } else if (statusFilter === "DISPUTED") {
                matchesStatus = !!tx.disputed;
            }

            const q = searchQuery.toLowerCase().trim();
            if (!q) return matchesStatus;

            const title = (tx.property?.title || "").toLowerCase();
            const city = (tx.property?.city || "").toLowerCase();
            const address = (tx.property?.address || "").toLowerCase();
            const tenantName = `${tx.tenant?.firstName || ""} ${tx.tenant?.lastName || ""}`.toLowerCase();
            const phone = (tx.tenant?.phone || "").toLowerCase();
            const email = (tx.tenant?.email || "").toLowerCase();
            const txId = (tx.id || "").toLowerCase();

            const matchesSearch =
                title.includes(q) ||
                city.includes(q) ||
                address.includes(q) ||
                tenantName.includes(q) ||
                phone.includes(q) ||
                email.includes(q) ||
                txId.includes(q);

            return matchesStatus && matchesSearch;
        });
    }, [transactions, statusFilter, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredTransactions, currentPage]);

    const getStatusBadge = (status: string, escrowHeld: boolean, escrowReleased: boolean, disputed?: boolean) => {
        if (disputed) {
            return (
                <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 flex items-center gap-1.5 font-bold px-3 py-1 text-xs shadow-2xs">
                    <XCircle className="h-3.5 w-3.5" /> Escrow Disputed / Locked
                </Badge>
            );
        }
        if ((status === "ESCROWED" || status === "SUCCESSFUL") && !escrowReleased) {
            return (
                <Badge className="flex items-center gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold px-3 py-1 text-xs shadow-2xs">
                    <Clock className="h-3.5 w-3.5 animate-pulse" /> Escrow Secured (Awaiting Handover OTP)
                </Badge>
            );
        }
        if (escrowReleased || status === "RELEASED") {
            return (
                <Badge className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-3 py-1 text-xs shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Escrow Released & Disbursed
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="text-[var(--text-secondary)] border-[var(--border-color)] font-bold px-3 py-1 text-xs">
                {status}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-green)]/10 flex items-center justify-center animate-pulse">
                        <Receipt className="h-6 w-6 text-[var(--color-brand-green)]" />
                    </div>
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand-green)] absolute -bottom-1 -right-1" />
                </div>
                <p className="font-bold text-sm text-[var(--text-primary)] mt-4">Loading rental escrow ledger...</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Retrieving incoming payments, releases, and settlement history</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Title & Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-[var(--color-brand-green)]/10 border border-emerald-500/30 flex items-center justify-center text-[var(--color-brand-green)] shadow-xs">
                            <Receipt className="h-4 w-4" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                            Escrow & Rental Transactions
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1">
                        Track verified tenant escrow payments, enter handover OTPs to claim payouts, and manage settlement accounts
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTransactions(true)}
                        disabled={refreshing}
                        className="h-9 px-3.5 rounded-xl border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5 shadow-xs"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[var(--color-brand-green)]" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* AfriExchange Escrow Settlement Status Banner */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl p-4 sm:p-5 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-green)] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-[var(--text-primary)] text-sm">
                                AfriExchange Instant Escrow Settlement
                            </h4>
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                Instant Payout Route
                            </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5 max-w-xl leading-relaxed">
                            When the tenant provides their 6-digit key handover OTP, your released escrow is deposited straight into your verified AfriExchange wallet or linked bank account.
                        </p>
                    </div>
                </div>

                <Link href="/dashboard?tab=payouts" className="shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--color-brand-green)] border-emerald-500/30 text-xs font-bold shadow-xs gap-1.5"
                    >
                        <span>Manage Payout Account</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </Link>
            </div>

            {/* Metric Overview Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div
                    onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "ALL"
                            ? "border-[var(--color-brand-green)] ring-2 ring-[var(--color-brand-green)]/15"
                            : "border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            Total Volume
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                            <Receipt className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                            {formatPrice(stats.grossVolume)}
                        </span>
                        <p className="text-[11px] font-semibold text-[var(--text-muted)] mt-0.5">
                            {stats.total} total transactions
                        </p>
                    </div>
                </div>

                <div
                    onClick={() => { setStatusFilter("ESCROWED"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "ESCROWED"
                            ? "border-amber-500 ring-2 ring-amber-500/15"
                            : "border-[var(--border-color)] hover:border-amber-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Awaiting OTP Handover
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                            {formatPrice(stats.inEscrowAmount)}
                        </span>
                        <p className="text-[11px] font-semibold text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                            {stats.inEscrowCount} locked in escrow
                        </p>
                    </div>
                </div>

                <div
                    onClick={() => { setStatusFilter("RELEASED"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "RELEASED"
                            ? "border-emerald-500 ring-2 ring-emerald-500/15"
                            : "border-[var(--border-color)] hover:border-emerald-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Disbursed Payouts
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {formatPrice(stats.releasedAmount)}
                        </span>
                        <p className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                            {stats.releasedCount} completed releases
                        </p>
                    </div>
                </div>

                <div
                    onClick={() => { setStatusFilter("DISPUTED"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "DISPUTED"
                            ? "border-red-500 ring-2 ring-red-500/15"
                            : "border-[var(--border-color)] hover:border-red-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                            Frozen / Disputed
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <ShieldAlert className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">
                            {stats.disputedCount}
                        </span>
                        <p className="text-[11px] font-semibold text-red-600/80 dark:text-red-400/80 mt-0.5">
                            under investigation
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-xs">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search className="h-4 w-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search transactions by property title, tenant name, phone, city..."
                        className="w-full h-10 pl-10 pr-4 text-xs font-medium bg-[var(--bg-muted)] rounded-xl border border-transparent focus:border-[var(--color-brand-green)] focus:bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold p-1"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Status Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {(
                        [
                            { id: "ALL", label: "All Transactions", count: stats.total },
                            { id: "ESCROWED", label: "Awaiting OTP", count: stats.inEscrowCount },
                            { id: "RELEASED", label: "Disbursed", count: stats.releasedCount },
                            { id: "DISPUTED", label: "Disputed", count: stats.disputedCount }
                        ] as const
                    ).map((filter) => {
                        const isActive = statusFilter === filter.id;
                        return (
                            <button
                                key={filter.id}
                                onClick={() => {
                                    setStatusFilter(filter.id);
                                    setCurrentPage(1);
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
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

            {/* Transactions List */}
            {transactions.length === 0 ? (
                <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-green)]/10 text-[var(--color-brand-green)] flex items-center justify-center mx-auto mb-4 border border-[var(--color-brand-green)]/20 shadow-xs">
                        <Receipt className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">No Rental Payments Received Yet</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto mt-1 leading-relaxed">
                        When prospective tenants complete escrow payments for your approved properties, their payment details and handover claims will appear here.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <Link href="/dashboard?tab=applications">
                            <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white text-xs font-bold rounded-xl h-10 px-5 shadow-xs">
                                Review Tenant Applications
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-14 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 shadow-xs">
                    <Search className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
                    <h3 className="text-base font-bold text-[var(--text-primary)]">No Matching Transactions</h3>
                    <p className="text-xs text-[var(--text-secondary)] font-medium max-w-sm mx-auto mt-1">
                        We couldn't find any escrow records matching your search or active filter.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("ALL");
                            setCurrentPage(1);
                        }}
                        className="mt-4 h-9 px-4 rounded-xl text-xs font-bold border-[var(--border-color)]"
                    >
                        Clear All Filters
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4">
                        {paginatedTransactions.map((tx) => {
                            const primaryImage =
                                tx.property?.images?.find((img) => img.isPrimary)?.url ||
                                tx.property?.images?.[0]?.url;
                            const netPayout = (tx.rentAmount || 0) + (tx.cautionFee || 0) + (tx.legalFee || 0) + (tx.serviceFee || 0);

                            return (
                                <div
                                    key={tx.id}
                                    className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-xs hover:border-[var(--color-brand-green)]/40 transition-all duration-200 space-y-4"
                                >
                                    {/* Top Bar: Property Thumbnail, Title, Address & Status */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="h-14 w-14 rounded-2xl bg-[var(--bg-muted)] overflow-hidden relative shrink-0 border border-[var(--border-color)] shadow-xs">
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
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-extrabold text-[var(--text-primary)] text-sm sm:text-base leading-snug truncate">
                                                        {tx.property?.title}
                                                    </h3>
                                                    <Link
                                                        href={`/properties/${tx.propertyId}`}
                                                        target="_blank"
                                                        className="text-[var(--text-muted)] hover:text-[var(--color-brand-green)] transition-colors shrink-0"
                                                        title="View property listing"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </Link>
                                                </div>
                                                <p className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1 mt-0.5 truncate">
                                                    <MapPin className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                                                    {tx.property?.address}, {tx.property?.city}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
                                                    Transaction Reference: <span className="font-mono font-bold text-[var(--text-secondary)]">{tx.id.slice(0, 12)}...</span> • {new Date(tx.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0 self-start sm:self-center">
                                            {getStatusBadge(tx.status, tx.escrowHeld, tx.escrowReleased, tx.disputed)}
                                        </div>
                                    </div>

                                    {/* Middle: Tenant Contact & Financial Breakdown */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                                        {/* Tenant Card */}
                                        <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/70 border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[var(--color-brand-green)]/20 to-[var(--color-brand-green)]/5 text-[var(--color-brand-green)] flex items-center justify-center font-black text-sm shrink-0 border border-[var(--color-brand-green)]/30 shadow-2xs">
                                                    {tx.tenant?.firstName?.[0]}
                                                    {tx.tenant?.lastName?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-extrabold text-[var(--text-primary)] text-sm truncate">
                                                            {tx.tenant?.firstName} {tx.tenant?.lastName}
                                                        </span>
                                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0.2 font-black">
                                                            Tenant
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-medium mt-1 flex-wrap">
                                                        <a
                                                            href={`tel:${tx.tenant?.phone}`}
                                                            className="flex items-center gap-1 hover:text-[var(--color-brand-green)] transition-colors"
                                                            title="Call tenant"
                                                        >
                                                            <Phone className="h-3 w-3 text-[var(--color-brand-green)]" />
                                                            {tx.tenant?.phone}
                                                        </a>
                                                        {tx.tenant?.email && (
                                                            <a
                                                                href={`mailto:${tx.tenant?.email}`}
                                                                className="flex items-center gap-1 hover:text-[var(--color-brand-green)] transition-colors truncate max-w-[160px]"
                                                                title="Email tenant"
                                                            >
                                                                <Mail className="h-3 w-3 text-[var(--color-brand-green)]" />
                                                                {tx.tenant?.email}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                <a
                                                    href={`tel:${tx.tenant?.phone}`}
                                                    className="h-8 px-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--color-brand-green)] hover:border-[var(--color-brand-green)]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                                                >
                                                    <Phone className="h-3 w-3" /> Call
                                                </a>
                                                {tx.tenant?.email && (
                                                    <a
                                                        href={`mailto:${tx.tenant?.email}`}
                                                        className="h-8 px-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--color-brand-green)] hover:border-[var(--color-brand-green)]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                                                    >
                                                        <Mail className="h-3 w-3" /> Email
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Financial Breakdown Table Card */}
                                        <div className="lg:col-span-2 p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-center space-y-2 text-xs shadow-2xs">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 border-b border-[var(--border-color)]">
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Annual Rent</span>
                                                    <span className="font-extrabold text-[var(--text-primary)] mt-0.5 block">
                                                        {formatPrice(tx.rentAmount)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Caution Fee</span>
                                                    <span className="font-extrabold text-[var(--text-primary)] mt-0.5 block">
                                                        {formatPrice(tx.cautionFee || 0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Legal & Service</span>
                                                    <span className="font-extrabold text-[var(--text-primary)] mt-0.5 block">
                                                        {formatPrice((tx.legalFee || 0) + (tx.serviceFee || 0))}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Tenant Escrow Total</span>
                                                    <span className="font-extrabold text-[var(--text-primary)] mt-0.5 block">
                                                        {formatPrice(tx.totalAmount)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-0.5">
                                                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                                                    <ShieldCheck className="h-4 w-4 text-[var(--color-brand-green)]" />
                                                    <span className="font-medium">Total Landlord Net Payout:</span>
                                                </div>
                                                <span className="text-base sm:text-lg font-black text-[var(--color-brand-green)]">
                                                    {formatPrice(netPayout)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)]">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedTransaction(tx);
                                                    setIsEscrowModalOpen(true);
                                                }}
                                                className="h-9 px-3 rounded-xl border-[var(--border-color)] text-xs font-bold gap-1.5 shadow-2xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                <span>Escrow Vault Details</span>
                                            </Button>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                                            {/* Key Handover Release OTP Button */}
                                            {(tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased && !tx.disputed && (
                                                <Button
                                                    onClick={() => setOtpModalTx(tx)}
                                                    className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold text-xs rounded-xl shrink-0 flex items-center gap-1.5 h-10 px-5 shadow-xs"
                                                >
                                                    <KeyRound className="h-4 w-4" />
                                                    <span>Enter Handover OTP to Claim Funds</span>
                                                </Button>
                                            )}

                                            {/* Rate Tenant Button */}
                                            {(tx.escrowReleased || tx.status === "RELEASED") && (
                                                ratedTenantTxIds.includes(tx.id) ? (
                                                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0 shadow-2xs">
                                                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Tenant Rated 5.0 ⭐
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleRateTenant(tx.id, tx.tenant?.firstName || "Tenant")}
                                                        className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shrink-0 flex items-center gap-1.5 h-10 px-4 shadow-xs"
                                                    >
                                                        <Star className="h-3.5 w-3.5 fill-current" />
                                                        <span>Rate {tx.tenant?.firstName || "Tenant"}</span>
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Strip */}
                    {filteredTransactions.length > ITEMS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-color)]">
                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                Showing{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {filteredTransactions.length}
                                </span>{" "}
                                transactions
                            </p>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-[var(--border-color)]"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                </Button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                                            currentPage === page
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
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-[var(--border-color)]"
                                >
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Handover Release OTP Modal */}
            {otpModalTx && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
                            <h3 className="font-extrabold text-[var(--text-primary)] text-lg flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-[var(--color-brand-green)]" /> Claim Escrow Payout
                            </h3>
                            <button
                                onClick={() => {
                                    setOtpModalTx(null);
                                    setInputOtp("");
                                }}
                                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-3 mb-5">
                            <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/70 border border-[var(--border-color)]">
                                <p className="text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Property & Tenant</p>
                                <p className="font-bold text-sm text-[var(--text-primary)] mt-0.5 truncate">
                                    {otpModalTx.property?.title}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                    Tenant: <strong className="text-[var(--text-primary)]">{otpModalTx.tenant?.firstName} {otpModalTx.tenant?.lastName}</strong> ({otpModalTx.tenant?.phone})
                                </p>
                            </div>

                            {/* Escrow Fee Breakdown */}
                            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-1.5 text-xs">
                                <div className="flex justify-between text-[var(--text-secondary)]">
                                    <span>Gross Annual Rent:</span>
                                    <span className="font-mono font-semibold text-[var(--text-primary)]">
                                        {formatPrice(otpModalTx.rentAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-red-500">
                                    <span>RentHub Escrow Fee (2%):</span>
                                    <span className="font-mono font-semibold">
                                        - {formatPrice(otpModalTx.platformFee || Math.round((otpModalTx.rentAmount || 0) * 0.02))}
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold border-t border-[var(--border-color)]/60 pt-1.5 text-emerald-600 dark:text-emerald-400">
                                    <span>Net Payout to You (98%):</span>
                                    <span className="font-mono font-extrabold text-sm">
                                        {formatPrice((otpModalTx.rentAmount || 0) - (otpModalTx.platformFee || Math.round((otpModalTx.rentAmount || 0) * 0.02)))}
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                                Enter the tenant&apos;s 6-digit Handover OTP code given to you upon physical key exchange. Once verified, your <strong className="text-[var(--color-brand-green)] font-extrabold">98% net payout</strong> is released immediately.
                            </p>
                        </div>

                        <form onSubmit={handleReleaseWithOtp} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                                    Tenant 6-Digit Handover OTP *
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    autoFocus
                                    placeholder="e.g. 849201"
                                    value={inputOtp}
                                    onChange={(e) => setInputOtp(e.target.value.trim())}
                                    className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 border border-[var(--border-color)] bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-xl focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] outline-hidden transition-all font-mono"
                                />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setOtpModalTx(null);
                                        setInputOtp("");
                                    }}
                                    disabled={releasing}
                                    className="h-10 px-4 rounded-xl border-[var(--border-color)] text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={releasing || inputOtp.length !== 6}
                                    className="h-10 px-5 rounded-xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold text-xs shadow-xs gap-1.5"
                                >
                                    {releasing ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Confirm & Disburse Funds
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Escrow Status Modal */}
            {selectedTransaction && isEscrowModalOpen && (
                <EscrowStatusModal
                    isOpen={isEscrowModalOpen}
                    onClose={() => setIsEscrowModalOpen(false)}
                    transaction={selectedTransaction}
                    userRole="LANDLORD"
                    onRelease={() => {
                        setIsEscrowModalOpen(false);
                        setOtpModalTx(selectedTransaction);
                    }}
                />
            )}
        </div>
    );
}
