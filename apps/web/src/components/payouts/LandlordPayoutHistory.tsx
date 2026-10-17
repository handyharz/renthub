"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import {
    Banknote,
    Clock,
    CheckCircle2,
    AlertCircle,
    RotateCw,
    Search,
    ShieldCheck,
    ArrowUpRight,
    Building2,
    Calendar,
    Copy,
    ExternalLink,
    FileText,
    Loader2,
    X,
    Receipt,
    Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export interface LandlordPayoutItem {
    id: string;
    transactionId: string;
    landlordId: string;
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    currency?: string;
    tokenType?: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "SKIPPED";
    idempotencyKey: string;
    afriExchangePayoutId?: string;
    afriExchangeRef?: string;
    failureReason?: string;
    createdAt: string;
    processedAt?: string;
    metadata?: {
        propertyId?: string;
        propertyTitle?: string;
        tenantId?: string;
        [key: string]: any;
    };
    transaction?: {
        property?: {
            title?: string;
            address?: string;
            city?: string;
        };
        tenant?: {
            firstName?: string;
            lastName?: string;
            email?: string;
        };
        createdAt?: string;
    };
}

export function LandlordPayoutHistory() {
    const [payouts, setPayouts] = useState<LandlordPayoutItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayout, setSelectedPayout] = useState<LandlordPayoutItem | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [linkStatus, setLinkStatus] = useState<{
        linked: boolean;
        afriExchangeUserId?: string;
        afriExchangeWalletAddress?: string;
        afriExchangeAccountEmail?: string;
    } | null>(null);

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/payouts/my-payouts");
            if (res.data?.success) {
                setPayouts(res.data.data || []);
            }
        } catch (error) {
            console.error("Failed to load landlord payouts:", error);
            toast.error("Could not load payout records");
        } finally {
            setLoading(false);
        }
    };

    const fetchLinkStatus = async () => {
        try {
            const res = await api.get("/payouts/link-status");
            if (res.data?.success) {
                setLinkStatus(res.data.data);
            }
        } catch {
            // Silently ignore
        }
    };

    useEffect(() => {
        fetchPayouts();
        fetchLinkStatus();
    }, []);

    // Summary calculations
    const stats = useMemo(() => {
        let totalDisbursed = 0;
        let pendingInEscrow = 0;
        let platformFees = 0;
        let completedCount = 0;

        payouts.forEach((p) => {
            if (p.status === "COMPLETED") {
                totalDisbursed += p.netAmount || 0;
                platformFees += p.platformFee || 0;
                completedCount++;
            } else if (p.status === "PENDING" || p.status === "PROCESSING" || p.status === "SKIPPED") {
                pendingInEscrow += p.netAmount || 0;
            }
        });

        return {
            totalDisbursed,
            pendingInEscrow,
            platformFees,
            completedCount,
            totalCount: payouts.length,
        };
    }, [payouts]);

    // Filtering
    const filteredPayouts = useMemo(() => {
        return payouts.filter((p) => {
            // Status match
            if (statusFilter !== "ALL") {
                if (statusFilter === "PENDING" && !["PENDING", "PROCESSING"].includes(p.status)) {
                    return false;
                }
                if (statusFilter !== "PENDING" && p.status !== statusFilter) {
                    return false;
                }
            }

            // Search query match
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const propertyTitle = (
                    p.transaction?.property?.title ||
                    p.metadata?.propertyTitle ||
                    ""
                ).toLowerCase();
                const city = (p.transaction?.property?.city || "").toLowerCase();
                const tenantName = `${p.transaction?.tenant?.firstName || ""} ${
                    p.transaction?.tenant?.lastName || ""
                }`.toLowerCase();
                const ref = (p.idempotencyKey || p.afriExchangeRef || p.id).toLowerCase();

                if (!propertyTitle.includes(q) && !city.includes(q) && !tenantName.includes(q) && !ref.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [payouts, statusFilter, searchQuery]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (_) {
            return dateStr;
        }
    };

    const getStatusBadge = (status: LandlordPayoutItem["status"]) => {
        switch (status) {
            case "COMPLETED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Settled to Wallet
                    </span>
                );
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock className="h-3.5 w-3.5" />
                        In Escrow / Ready
                    </span>
                );
            case "PROCESSING":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Disbursing
                    </span>
                );
            case "SKIPPED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                        <Clock className="h-3.5 w-3.5" />
                        Deferred / Retry Ready
                    </span>
                );
            case "FAILED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Attention Needed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-zinc-500/10 text-zinc-600 border border-zinc-500/20">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Overview Earnings KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Disbursed */}
                <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Total Settled to Wallet
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    {formatPrice(stats.totalDisbursed)}
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    NT
                                </span>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                {stats.completedCount} completed escrow releases • Settled in Naira Tokens (NT)
                            </p>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                            <Banknote className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Pending In Escrow */}
                <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                In Escrow / Pending
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                    {formatPrice(stats.pendingInEscrow)}
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                    NT
                                </span>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                Released upon key handover verification • Secured in Naira Tokens (NT)
                            </p>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Platform Fee & Net Ratio */}
                <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Net Escrow Ratio
                            </p>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] mt-1">
                                98% Net to You
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                2% RentHub escrow guarantee commission
                            </p>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Payout Records Section */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[var(--border-color)] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-[var(--color-brand-green)]" />
                                Escrow Settlement Records
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                Transparent audit of your tenant rent escrows, platform commission, and wallet releases.
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchPayouts}
                            disabled={loading}
                            className="gap-2 text-xs border-[var(--border-color)] self-start sm:self-auto"
                        >
                            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* Filter Pills and Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        {/* Status Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            {[
                                { key: "ALL", label: "All Payouts" },
                                { key: "COMPLETED", label: "Settled" },
                                { key: "PENDING", label: "In Escrow" },
                                { key: "SKIPPED", label: "Deferred" },
                                { key: "FAILED", label: "Attention" },
                            ].map((pill) => (
                                <button
                                    key={pill.key}
                                    onClick={() => setStatusFilter(pill.key)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                                        statusFilter === pill.key
                                            ? "bg-[var(--color-brand-green)] text-white shadow-sm"
                                            : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
                                    }`}
                                >
                                    {pill.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[220px]">
                            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search property, tenant, ref..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-brand-green)]"
                            />
                        </div>
                    </div>
                </div>

                {/* Table or Empty State */}
                {loading ? (
                    <div className="p-12 text-center text-[var(--text-muted)] space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[var(--color-brand-green)]" />
                        <p className="text-xs">Loading escrow settlement records...</p>
                    </div>
                ) : filteredPayouts.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="h-12 w-12 rounded-2xl bg-[var(--bg-primary)] text-[var(--text-muted)] mx-auto flex items-center justify-center border border-[var(--border-color)]">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                            No settlement records found
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                            When tenants rent your properties via RentHub escrow and payments are released upon key handover, settlement records will be listed here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Property & Tenant</th>
                                    <th className="py-3 px-4">Gross Rent</th>
                                    <th className="py-3 px-4">Commission (2%)</th>
                                    <th className="py-3 px-4">Net Payout</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {filteredPayouts.map((payout) => {
                                    const propertyTitle =
                                        payout.transaction?.property?.title ||
                                        payout.metadata?.propertyTitle ||
                                        "Property Escrow";
                                    const tenantName =
                                        payout.transaction?.tenant?.firstName && payout.transaction?.tenant?.lastName
                                            ? `${payout.transaction.tenant.firstName} ${payout.transaction.tenant.lastName}`
                                            : "Verified Tenant";

                                    return (
                                        <tr
                                            key={payout.id}
                                            onClick={() => setSelectedPayout(payout)}
                                            className="hover:bg-[var(--bg-muted)]/50 cursor-pointer transition-colors"
                                        >
                                            {/* Date */}
                                            <td className="py-3.5 px-4 whitespace-nowrap text-[var(--text-secondary)]">
                                                {formatDate(payout.createdAt)}
                                            </td>

                                            {/* Property & Tenant */}
                                            <td className="py-3.5 px-4 max-w-[220px]">
                                                <p className="font-semibold text-[var(--text-primary)] truncate">
                                                    {propertyTitle}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-muted)] truncate">
                                                    Tenant: {tenantName}
                                                </p>
                                            </td>

                                            {/* Gross Rent */}
                                            <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[var(--text-secondary)]">
                                                {formatPrice(payout.grossAmount)}
                                            </td>

                                            {/* Platform Fee */}
                                            <td className="py-3.5 px-4 whitespace-nowrap font-mono text-red-500/80">
                                                - {formatPrice(payout.platformFee)}
                                            </td>

                                            {/* Net Payout */}
                                            <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatPrice(payout.netAmount)} {payout.tokenType || "NT"}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {getStatusBadge(payout.status)}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedPayout(payout);
                                                    }}
                                                    className="h-7 text-xs text-[var(--color-brand-green)] hover:text-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/10"
                                                >
                                                    Breakdown
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detailed Settlement Breakdown Modal */}
            {selectedPayout && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedPayout(null)}
                >
                    <div
                        className="relative bg-[var(--bg-card)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--border-color)] p-6 space-y-5 animate-in zoom-in-95 duration-200 text-[var(--text-primary)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                    Escrow Settlement Breakdown
                                </span>
                                <h3 className="text-lg font-extrabold text-[var(--text-primary)] mt-0.5">
                                    {selectedPayout.transaction?.property?.title ||
                                        selectedPayout.metadata?.propertyTitle ||
                                        "Property Escrow Release"}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                    Release Date: {formatDate(selectedPayout.createdAt)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedPayout(null)}
                                className="h-8 w-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] flex items-center justify-center transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Status Overview */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                            <span className="text-xs font-semibold text-[var(--text-secondary)]">
                                Settlement Status
                            </span>
                            {getStatusBadge(selectedPayout.status)}
                        </div>

                        {/* Financial Calculation Box */}
                        <div className="space-y-2.5 rounded-xl border border-[var(--border-color)] p-4 bg-[var(--bg-primary)]/40">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Escrow Accounting
                            </h4>

                            {/* Gross Escrow */}
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-[var(--text-secondary)]">Gross Rent Paid by Tenant:</span>
                                <span className="font-mono font-semibold text-[var(--text-primary)]">
                                    {formatPrice(selectedPayout.grossAmount)}
                                </span>
                            </div>

                            {/* Platform Commission */}
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5 text-red-500">
                                    <span>RentHub Escrow Guarantee Fee (2%):</span>
                                </div>
                                <span className="font-mono font-semibold text-red-500">
                                    - {formatPrice(selectedPayout.platformFee)}
                                </span>
                            </div>

                            <div className="border-t border-[var(--border-color)] pt-2.5 flex justify-between items-center">
                                <span className="text-xs font-bold text-[var(--text-primary)]">
                                    Net Landlord Payout:
                                </span>
                                <span className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {formatPrice(selectedPayout.netAmount)} {selectedPayout.tokenType || "NT"}
                                </span>
                            </div>

                            {/* Proportion Bar */}
                            <div className="mt-2 overflow-hidden rounded-full bg-[var(--bg-muted)] h-1.5">
                                <div className="h-1.5 rounded-full bg-emerald-500 w-[98%]"></div>
                            </div>
                            <p className="text-[10px] text-right text-[var(--text-muted)]">
                                98% deposited directly to your AfriExchange wallet
                            </p>
                        </div>

                        {/* Settlement Route & Audit */}
                        <div className="space-y-2 text-xs rounded-xl border border-[var(--border-color)] p-4 bg-[var(--bg-primary)]/20 font-mono">
                            <div className="flex justify-between items-center">
                                <span className="text-[var(--text-muted)]">Payout Route:</span>
                                <span className="font-semibold text-[var(--text-primary)]">
                                    AfriExchange Mobile Rail
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-1 border-t border-[var(--border-color)]">
                                <span className="text-[var(--text-muted)]">Idempotency Reference:</span>
                                <button
                                    onClick={() => copyToClipboard(selectedPayout.idempotencyKey, "Idempotency Reference")}
                                    className="hover:text-[var(--color-brand-green)] flex items-center gap-1 text-[11px] text-[var(--text-secondary)]"
                                >
                                    <span className="truncate max-w-[180px]">{selectedPayout.idempotencyKey}</span>
                                    <Copy className="h-3 w-3" />
                                </button>
                            </div>

                            {selectedPayout.afriExchangeRef && (
                                <div className="flex justify-between items-center pt-1 border-t border-[var(--border-color)]">
                                    <span className="text-[var(--text-muted)]">AfriX Tx ID:</span>
                                    <span className="font-bold text-emerald-600 truncate max-w-[180px]">
                                        {selectedPayout.afriExchangeRef}
                                    </span>
                                </div>
                            )}

                            {selectedPayout.failureReason && (
                                <>
                                    {selectedPayout.failureReason.toLowerCase().includes("not linked") ? (
                                        linkStatus?.linked ? (
                                            <div className="pt-2 text-emerald-600 dark:text-emerald-400 text-[11px] border-t border-emerald-500/20 flex items-center gap-1.5">
                                                <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>AfriExchange account linked ({linkStatus.afriExchangeWalletAddress ? `${linkStatus.afriExchangeWalletAddress.slice(0, 8)}...` : linkStatus.afriExchangeAccountEmail}). Payout queued for escrow release.</span>
                                            </div>
                                        ) : (
                                            <div className="pt-2 text-amber-600 text-[11px] border-t border-amber-500/20 flex items-center gap-1.5">
                                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>Link your AfriExchange settlement account above to receive this payout.</span>
                                            </div>
                                        )
                                    ) : (
                                        <div className="pt-2 text-amber-600 text-[11px] border-t border-amber-500/20">
                                            <span className="font-bold">Settlement Status:</span> {selectedPayout.failureReason}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="pt-1 flex justify-end">
                            <Button
                                onClick={() => setSelectedPayout(null)}
                                className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-semibold text-xs rounded-xl px-5"
                            >
                                Close Details
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
