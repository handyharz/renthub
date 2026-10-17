"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Banknote,
    CheckCircle2,
    Clock,
    AlertCircle,
    RefreshCcw,
    Search,
    ExternalLink,
    Copy,
    ChevronDown,
    Loader2,
    Eye,
    RotateCw,
    Send,
    ShieldCheck,
    Wallet,
    Building2,
    ArrowUpRight,
    X,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface LandlordInfo {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    afriExchangeUserId?: string;
    afriExchangeWalletAddress?: string;
    afriExchangeAccountEmail?: string;
}

interface LandlordPayout {
    id: string;
    transactionId: string;
    landlordId: string;
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    currency: string;
    tokenType?: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "SKIPPED";
    idempotencyKey: string;
    afriExchangeTxId?: string;
    failureReason?: string;
    createdAt: string;
    updatedAt: string;
    processedAt?: string;
    landlord: LandlordInfo;
    metadata?: {
        propertyId?: string;
        propertyTitle?: string;
        tenantId?: string;
        [key: string]: any;
    };
    transaction?: {
        id: string;
        property?: {
            id: string;
            title: string;
            address: string;
            city: string;
        };
        tenant?: {
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
        };
    };
}

interface PayoutSummary {
    totalPayouts: number;
    completedPayouts: number;
    pendingPayouts: number;
    failedPayouts: number;
    totalDisbursedAmount: number;
    totalPlatformFees: number;
}

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState<LandlordPayout[]>([]);
    const [summary, setSummary] = useState<PayoutSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isReconciling, setIsReconciling] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [selectedPayout, setSelectedPayout] = useState<LandlordPayout | null>(null);
    const [linkInput, setLinkInput] = useState("");
    const [isLinking, setIsLinking] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchSummary = async () => {
        try {
            const res = await api.get("/payouts/admin/summary");
            if (res.data?.success) {
                setSummary(res.data.data);
            }
        } catch (error) {
            console.error("Failed to load payout summary:", error);
        }
    };

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = { limit: "50" };
            if (statusFilter) params.status = statusFilter;

            const res = await api.get("/payouts/admin/all", { params });
            if (res.data?.success) {
                setPayouts(res.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch payouts:", error);
            toast.error("Failed to load landlord payouts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchPayouts();
    }, [statusFilter]);

    // Filter by search query in memory
    const filteredPayouts = useMemo(() => {
        if (!searchQuery.trim()) return payouts;
        const q = searchQuery.toLowerCase();
        return payouts.filter((p) => {
            const landlordName = `${p.landlord?.firstName || ""} ${p.landlord?.lastName || ""}`.toLowerCase();
            const landlordEmail = (p.landlord?.email || "").toLowerCase();
            const propertyTitle = (p.metadata?.propertyTitle || p.transaction?.property?.title || "").toLowerCase();
            const afriEmail = (p.landlord?.afriExchangeAccountEmail || "").toLowerCase();
            const afriWallet = (p.landlord?.afriExchangeWalletAddress || "").toLowerCase();
            const ref = (p.idempotencyKey || "").toLowerCase();

            return (
                landlordName.includes(q) ||
                landlordEmail.includes(q) ||
                propertyTitle.includes(q) ||
                afriEmail.includes(q) ||
                afriWallet.includes(q) ||
                ref.includes(q)
            );
        });
    }, [payouts, searchQuery]);

    const handleRetry = async (payoutId: string) => {
        try {
            setActionLoadingId(payoutId);
            const res = await api.post(`/payouts/admin/${payoutId}/retry`);
            if (res.data?.success) {
                toast.success("Payout retry triggered successfully", {
                    description: `Status updated to ${res.data.data?.status}`,
                });
                fetchPayouts();
                fetchSummary();
            }
        } catch (error: any) {
            toast.error("Retry failed", {
                description: error.response?.data?.message || "Failed to trigger retry on AfriExchange",
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDisburse = async (transactionId: string) => {
        try {
            setActionLoadingId(transactionId);
            const res = await api.post(`/payouts/admin/disburse/${transactionId}`);
            if (res.data?.success) {
                toast.success("Escrow payout disbursed to landlord!", {
                    description: `Transferred on AfriExchange. Status: ${res.data.data?.status}`,
                });
                fetchPayouts();
                fetchSummary();
            }
        } catch (error: any) {
            toast.error("Disburse failed", {
                description: error.response?.data?.message || "Could not disburse escrow to landlord",
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleLinkLandlord = async (landlordId: string, value: string) => {
        if (!value.trim()) {
            toast.error("Please enter a valid email or wallet address");
            return;
        }
        try {
            setIsLinking(true);
            const isWallet = value.trim().startsWith("0x");
            const payload = isWallet
                ? { afriExchangeWalletAddress: value.trim() }
                : { afriExchangeAccountEmail: value.trim().toLowerCase() };

            const res = await api.put(`/payouts/admin/landlord/${landlordId}/link-afriexchange`, payload);
            if (res.data?.success) {
                toast.success("Landlord AfriExchange settlement account linked!");
                if (selectedPayout) {
                    setSelectedPayout({
                        ...selectedPayout,
                        landlord: {
                            ...selectedPayout.landlord,
                            ...(isWallet
                                ? { afriExchangeWalletAddress: value.trim() }
                                : { afriExchangeAccountEmail: value.trim().toLowerCase() }),
                        },
                    });
                }
                setShowLinkInput(false);
                fetchPayouts();
            }
        } catch (error: any) {
            toast.error("Failed to link account", {
                description: error.response?.data?.message || "Please check details",
            });
        } finally {
            setIsLinking(false);
        }
    };

    const handleReconcile = async () => {
        try {
            setIsReconciling(true);
            await fetchSummary();
            await fetchPayouts();
            toast.success("AfriExchange settlement sync complete", {
                description: "All landlord balances and payout states have been refreshed.",
            });
        } catch (error) {
            toast.error("Reconciliation failed");
        } finally {
            setIsReconciling(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`);
    };

    const getStatusBadge = (status: LandlordPayout["status"]) => {
        switch (status) {
            case "COMPLETED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                    </span>
                );
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Clock className="h-3.5 w-3.5" />
                        Ready / Pending
                    </span>
                );
            case "PROCESSING":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Processing
                    </span>
                );
            case "FAILED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Failed
                    </span>
                );
            case "SKIPPED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/20">
                        Skipped
                    </span>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <>
            <AdminHeader
                title="Landlord Payouts"
                description="Disburse released rent escrow and track settlement payouts via AfriExchange"
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReconcile}
                            disabled={isReconciling}
                            className="gap-2 h-9 border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]"
                        >
                            <RotateCw className={`h-3.5 w-3.5 ${isReconciling ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">
                                {isReconciling ? "Syncing..." : "Sync AfriExchange"}
                            </span>
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 p-6 space-y-6 overflow-auto">
                {/* 5 KPI Cards (Inspired by Kaalis AdminPayouts.vue) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Escrow Disbursed"
                        value={formatPrice(summary?.totalDisbursedAmount || 0)}
                        icon={Banknote}
                        accent="green"
                        trend={`${summary?.completedPayouts || 0} completed transfers`}
                    />
                    <StatCard
                        label="Pending Payouts"
                        value={summary?.pendingPayouts ?? (loading ? "—" : 0)}
                        icon={Clock}
                        accent="orange"
                        trend="Awaiting admin dispatch"
                    />
                    <StatCard
                        label="Platform Revenue (2%)"
                        value={formatPrice(summary?.totalPlatformFees || 0)}
                        icon={ShieldCheck}
                        accent="blue"
                        trend="RentHub commission earned"
                    />
                    <StatCard
                        label="Failed / Attention"
                        value={summary?.failedPayouts ?? (loading ? "—" : 0)}
                        icon={AlertCircle}
                        accent="red"
                        trend="Eligible for retry"
                    />
                </div>

                {/* Filter and Search Bar */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        {/* Status Filter */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Payout Status
                            </label>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="PENDING">Ready / Pending</option>
                                    <option value="PROCESSING">Processing</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="FAILED">Failed</option>
                                    <option value="SKIPPED">Skipped</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Search Landlord or Reference
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by landlord name, email, property, or wallet..."
                                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Clear Button */}
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStatusFilter("");
                                    setSearchQuery("");
                                }}
                                className="w-full border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] text-sm font-semibold h-[38px]"
                            >
                                Reset Filters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Payouts Table */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] overflow-hidden">
                    <div className="border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-[var(--text-primary)]">Disbursement Records</h2>
                            <p className="text-xs text-[var(--text-muted)]">
                                Showing {filteredPayouts.length} landlord payout transactions
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-16 text-[var(--text-muted)]">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-green)] mb-2" />
                            <span className="text-sm font-medium">Loading landlord payouts...</span>
                        </div>
                    ) : filteredPayouts.length === 0 ? (
                        <div className="p-16 text-center text-[var(--text-muted)]">
                            <Banknote className="h-10 w-10 mx-auto text-[var(--text-muted)]/40 mb-3" />
                            <p className="text-sm font-medium text-[var(--text-primary)]">No landlord payouts found</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                Payouts will appear here once rent payments reach escrow release conditions.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--border-color)] text-left">
                                <thead className="bg-[var(--bg-primary)]">
                                    <tr>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Landlord / Recipient
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Property / Lease
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Net Payout
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Fee (2%)
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Status
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Date
                                        </th>
                                        <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                                    {filteredPayouts.map((payout) => {
                                        const landlord = payout.landlord;
                                        const initials = `${landlord?.firstName?.[0] || "L"}${landlord?.lastName?.[0] || ""}`;
                                        const propTitle = payout.metadata?.propertyTitle || payout.transaction?.property?.title || "Residential Property";
                                        const afriAccount = landlord?.afriExchangeAccountEmail || landlord?.afriExchangeWalletAddress;

                                        return (
                                            <tr key={payout.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                                {/* Landlord details */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] flex items-center justify-center font-bold text-xs uppercase border border-[var(--color-brand-blue)]/20">
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                                {landlord?.firstName} {landlord?.lastName}
                                                            </p>
                                                            <p className="text-xs text-[var(--text-muted)]">{landlord?.email}</p>
                                                            {afriAccount && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[var(--color-brand-green)] mt-0.5">
                                                                    <Wallet className="h-2.5 w-2.5" />
                                                                    {afriAccount.length > 22
                                                                        ? `${afriAccount.slice(0, 6)}...${afriAccount.slice(-4)}`
                                                                        : afriAccount}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Property */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                                                        <div className="max-w-[200px]">
                                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                                {propTitle}
                                                            </p>
                                                            <p className="text-xs text-[var(--text-muted)] truncate font-mono">
                                                                ID: {payout.transactionId?.slice(0, 8)}...
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Net Payout Amount */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
                                                        {formatPrice(payout.netAmount)}
                                                    </span>
                                                    <span className="ml-1 text-[10px] uppercase font-bold text-[var(--color-brand-green)]">
                                                        {payout.tokenType || "NT"}
                                                    </span>
                                                </td>

                                                {/* Platform Fee */}
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--text-muted)] font-mono">
                                                    {formatPrice(payout.platformFee)}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(payout.status)}
                                                </td>

                                                {/* Date */}
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--text-muted)]">
                                                    {new Date(payout.createdAt).toLocaleDateString("en-NG", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                                    {/* Disburse Single (if pending) */}
                                                    {payout.status === "PENDING" && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleDisburse(payout.transactionId)}
                                                            disabled={actionLoadingId === payout.transactionId}
                                                            className="h-8 gap-1 text-xs bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-semibold"
                                                        >
                                                            {actionLoadingId === payout.transactionId ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Send className="h-3.5 w-3.5" />
                                                            )}
                                                            <span>Disburse</span>
                                                        </Button>
                                                    )}

                                                    {/* Retry (if failed or skipped) */}
                                                    {(payout.status === "FAILED" || payout.status === "SKIPPED") && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleRetry(payout.id)}
                                                            disabled={actionLoadingId === payout.id}
                                                            className={`h-8 gap-1 text-xs ${
                                                                payout.status === "SKIPPED"
                                                                    ? "text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                                                    : "text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                            }`}
                                                        >
                                                            {actionLoadingId === payout.id ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <RotateCw className="h-3.5 w-3.5" />
                                                            )}
                                                            <span>{payout.status === "SKIPPED" ? "Retry Now" : "Retry"}</span>
                                                        </Button>
                                                    )}

                                                    {/* View Detail Modal */}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setSelectedPayout(payout)}
                                                        className="h-8 gap-1 text-xs border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        <span>Details</span>
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
            </div>

            {/* Slide-Over Payout Detail Drawer (Kaalis Pattern) */}
            {selectedPayout && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
                    <div className="w-full max-w-lg bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">Payout Details</h3>
                                <p className="text-xs text-[var(--text-muted)] font-mono">
                                    ID: {selectedPayout.id}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedPayout(null)}
                                className="h-8 w-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Status banner */}
                        <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                            <span className="text-xs font-semibold text-[var(--text-secondary)]">Current Status</span>
                            {getStatusBadge(selectedPayout.status)}
                        </div>

                        {/* Financial breakdown */}
                        <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4 bg-[var(--bg-primary)]/40">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Settlement Breakdown
                            </h4>
                            <div className="flex justify-between text-sm py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-secondary)]">Gross Rent Escrow:</span>
                                <span className="font-mono font-medium text-[var(--text-primary)]">
                                    {formatPrice(selectedPayout.grossAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-1 border-b border-[var(--border-color)]/60 text-amber-600">
                                <span>Platform Commission (2%):</span>
                                <span className="font-mono font-medium">
                                    - {formatPrice(selectedPayout.platformFee)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-1 font-bold text-[var(--text-primary)]">
                                <span>Net Landlord Payout:</span>
                                <span className="font-mono text-[var(--color-brand-green)]">
                                    {formatPrice(selectedPayout.netAmount)} {selectedPayout.tokenType || "NT"}
                                </span>
                            </div>
                        </div>

                        {/* Landlord information */}
                        <div className="space-y-2 rounded-lg border border-[var(--border-color)] p-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Landlord Settlement Info
                            </h4>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                {selectedPayout.landlord?.firstName} {selectedPayout.landlord?.lastName}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                                Email: {selectedPayout.landlord?.email}
                            </p>
                            {selectedPayout.landlord?.phone && (
                                <p className="text-xs text-[var(--text-muted)]">
                                    Phone: {selectedPayout.landlord?.phone}
                                </p>
                            )}

                            {selectedPayout.landlord?.afriExchangeAccountEmail && (
                                <div className="mt-2 flex items-center justify-between text-xs bg-[var(--bg-primary)] p-2 rounded border border-[var(--border-color)]">
                                    <span className="text-[var(--text-muted)]">AfriX Email:</span>
                                    <span className="font-mono font-semibold text-[var(--text-primary)]">
                                        {selectedPayout.landlord.afriExchangeAccountEmail}
                                    </span>
                                </div>
                            )}

                            {selectedPayout.landlord?.afriExchangeWalletAddress && (
                                <div className="mt-1 flex items-center justify-between text-xs bg-[var(--bg-primary)] p-2 rounded border border-[var(--border-color)]">
                                    <span className="text-[var(--text-muted)]">AfriX Address:</span>
                                    <span className="font-mono text-[10px] text-[var(--text-primary)]">
                                        {selectedPayout.landlord.afriExchangeWalletAddress}
                                    </span>
                                </div>
                            )}

                            {(!selectedPayout.landlord?.afriExchangeAccountEmail && !selectedPayout.landlord?.afriExchangeWalletAddress) || showLinkInput ? (
                                <div className="mt-3 p-3 rounded-lg border border-amber-300/80 bg-amber-500/10 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                            <Wallet className="h-3.5 w-3.5" />
                                            Link AfriExchange Account
                                        </p>
                                        {showLinkInput && (
                                            <button
                                                onClick={() => setShowLinkInput(false)}
                                                className="text-[10px] text-[var(--text-muted)] hover:underline"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        Enter the landlord's AfriExchange account email or wallet address to enable instant settlement.
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={linkInput}
                                            onChange={(e) => setLinkInput(e.target.value)}
                                            placeholder="e.g. user@gmail.com or 0x..."
                                            className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={() => handleLinkLandlord(selectedPayout.landlord.id, linkInput)}
                                            disabled={isLinking || !linkInput.trim()}
                                            className="text-xs h-[30px] bg-[var(--color-brand-blue)] text-white"
                                        >
                                            {isLinking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Link"}
                                        </Button>
                                    </div>
                                    {selectedPayout.landlord?.email && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLinkInput(selectedPayout.landlord.email);
                                                handleLinkLandlord(selectedPayout.landlord.id, selectedPayout.landlord.email);
                                            }}
                                            className="text-[11px] text-[var(--color-brand-green)] hover:underline font-semibold block text-left"
                                        >
                                            👉 Use Landlord Email ({selectedPayout.landlord.email})
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-2 text-right">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLinkInput(selectedPayout.landlord?.afriExchangeAccountEmail || "");
                                            setShowLinkInput(true);
                                        }}
                                        className="text-[11px] text-[var(--color-brand-blue)] hover:underline font-semibold"
                                    >
                                        Edit AfriExchange Account
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Audit & Idempotency */}
                        <div className="space-y-2 text-xs text-[var(--text-muted)] font-mono rounded-lg border border-[var(--border-color)] p-4 bg-[var(--bg-primary)]/20">
                            <div className="flex justify-between items-center">
                                <span>Idempotency Key:</span>
                                <button
                                    onClick={() => copyToClipboard(selectedPayout.idempotencyKey, "Idempotency Key")}
                                    className="hover:text-[var(--text-primary)] flex items-center gap-1"
                                >
                                    <Copy className="h-3 w-3" />
                                </button>
                            </div>
                            <p className="break-all text-[11px] text-[var(--text-secondary)]">{selectedPayout.idempotencyKey}</p>

                            {selectedPayout.afriExchangeTxId && (
                                <div className="pt-2 border-t border-[var(--border-color)]">
                                    <span className="block text-[10px] text-[var(--text-muted)]">AfriExchange Transaction ID:</span>
                                    <p className="text-[11px] text-[var(--color-brand-blue)] font-semibold break-all">
                                        {selectedPayout.afriExchangeTxId}
                                    </p>
                                </div>
                            )}

                            {selectedPayout.failureReason && (
                                <div className="pt-2 text-red-600 border-t border-red-200">
                                    <span className="font-bold">Failure Log:</span> {selectedPayout.failureReason}
                                </div>
                            )}
                        </div>

                        {/* Drawer Actions */}
                        <div className="pt-4 flex gap-3">
                            {selectedPayout.status === "PENDING" && (
                                <Button
                                    onClick={() => {
                                        handleDisburse(selectedPayout.transactionId);
                                        setSelectedPayout(null);
                                    }}
                                    className="flex-1 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-semibold gap-2"
                                >
                                    <Send className="h-4 w-4" />
                                    Disburse Now
                                </Button>
                            )}
                            {(selectedPayout.status === "FAILED" || selectedPayout.status === "SKIPPED") && (
                                <Button
                                    onClick={() => {
                                        handleRetry(selectedPayout.id);
                                        setSelectedPayout(null);
                                    }}
                                    className={`flex-1 font-semibold gap-2 text-white ${
                                        selectedPayout.status === "SKIPPED"
                                            ? "bg-amber-600 hover:bg-amber-700"
                                            : "bg-red-600 hover:bg-red-700"
                                    }`}
                                >
                                    <RotateCw className="h-4 w-4" />
                                    {selectedPayout.status === "SKIPPED" ? "Retry Skipped Payout" : "Retry Payout"}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => setSelectedPayout(null)}
                                className="flex-1 border-[var(--border-color)]"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
