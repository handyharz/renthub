"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
    Lock,
    Unlock,
    CheckCircle2,
    AlertTriangle,
    RefreshCcw,
    Search,
    ChevronDown,
    Loader2,
    Building2,
    User,
    ArrowUpRight,
    ShieldAlert,
    Clock,
    X,
    Banknote,
    ExternalLink,
    Wallet,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface LandlordPayoutSummary {
    id: string;
    transactionId: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "SKIPPED";
    grossAmount: number;
    netAmount: number;
    platformFee: number;
    failureReason?: string;
    idempotencyKey: string;
    processedAt?: string;
    createdAt: string;
}

interface EscrowTransaction {
    id: string;
    totalAmount: number;
    rentAmount: number;
    platformFee: number;
    cautionDeposit: number;
    serviceFee: number;
    status: "PENDING" | "ESCROWED" | "RELEASED" | "REFUNDED" | "CANCELLED";
    paymentGateway?: string;
    paymentMethod?: string;
    afriExchangeRef?: string;
    paystackRef?: string;
    flutterwaveRef?: string;
    escrowHeld: boolean;
    escrowReleased: boolean;
    disputed: boolean;
    disputeReason?: string;
    createdAt: string;
    updatedAt: string;
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        landlord?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
            afriExchangeAccountEmail?: string;
            afriExchangeWalletAddress?: string;
        };
    };
    tenant: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
    payout?: LandlordPayoutSummary | null;
}

interface EscrowStats {
    totalLockedAmount: number;
    totalReleasedAmount: number;
    totalVolume: number;
    lockedCount: number;
    releasedCount: number;
    pendingCount: number;
    disputedCount: number;
    refundedCount: number;
}

export default function AdminEscrowPage() {
    const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
    const [stats, setStats] = useState<EscrowStats>({
        totalLockedAmount: 0,
        totalReleasedAmount: 0,
        totalVolume: 0,
        lockedCount: 0,
        releasedCount: 0,
        pendingCount: 0,
        disputedCount: 0,
        refundedCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTx, setSelectedTx] = useState<EscrowTransaction | null>(null);

    const fetchEscrow = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (statusFilter !== "ALL") params.status = statusFilter;

            const res = await api.get("/admin/escrow", { params });
            if (res.data?.success) {
                setTransactions(res.data.data.transactions || []);
                setStats(
                    res.data.data.stats || {
                        totalLockedAmount: 0,
                        totalReleasedAmount: 0,
                        totalVolume: 0,
                        lockedCount: 0,
                        releasedCount: 0,
                        pendingCount: 0,
                        disputedCount: 0,
                        refundedCount: 0,
                    }
                );
            }
        } catch (error) {
            console.error("Failed to load escrow transactions:", error);
            toast.error("Failed to fetch escrow records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEscrow();
    }, [statusFilter]);

    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions;
        const q = searchQuery.toLowerCase();
        return transactions.filter((t) => {
            const prop = (t.property?.title || "").toLowerCase();
            const landlord = `${t.property?.landlord?.firstName || ""} ${t.property?.landlord?.lastName || ""}`.toLowerCase();
            const landlordEmail = (t.property?.landlord?.email || "").toLowerCase();
            const tenant = `${t.tenant?.firstName || ""} ${t.tenant?.lastName || ""}`.toLowerCase();
            const email = (t.tenant?.email || "").toLowerCase();
            const id = (t.id || "").toLowerCase();
            return (
                prop.includes(q) ||
                landlord.includes(q) ||
                landlordEmail.includes(q) ||
                tenant.includes(q) ||
                email.includes(q) ||
                id.includes(q)
            );
        });
    }, [transactions, searchQuery]);

    const getStatusBadge = (tx: EscrowTransaction) => {
        if (tx.disputed) {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Disputed
                </span>
            );
        }
        switch (tx.status) {
            case "ESCROWED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <Lock className="h-3.5 w-3.5" />
                        Locked in Escrow
                    </span>
                );
            case "RELEASED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Released & Settled
                    </span>
                );
            case "REFUNDED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                        Refunded
                    </span>
                );
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="h-3.5 w-3.5" />
                        Pending Checkout
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                        {tx.status}
                    </span>
                );
        }
    };

    const getPayoutBadge = (payout?: LandlordPayoutSummary | null) => {
        if (!payout) return null;
        switch (payout.status) {
            case "COMPLETED":
                return (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Banknote className="h-3 w-3" /> Payout Settled
                    </span>
                );
            case "FAILED":
                return (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="h-3 w-3" /> Payout Failed (Retry)
                    </span>
                );
            case "SKIPPED":
                return (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Wallet className="h-3 w-3" /> Wallet Link Needed
                    </span>
                );
            case "PROCESSING":
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        <Clock className="h-3 w-3" /> Payout Pending
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <AdminHeader
                title="Escrow & Payments"
                description="Monitor tenant rent payments held in platform escrow, token settlements, and release life-cycles"
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchEscrow}
                        disabled={loading}
                        className="gap-2 h-9 border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]"
                    >
                        <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                }
            />

            <div className="flex-1 p-6 space-y-6 overflow-auto">
                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Active Escrow Locked"
                        value={`${formatPrice(stats.totalLockedAmount)} NT`}
                        icon={Lock}
                        accent="blue"
                        trend={`${stats.lockedCount} funded leases locked`}
                    />
                    <StatCard
                        label="Total Escrow Settled"
                        value={`${formatPrice(stats.totalReleasedAmount ?? 0)} NT`}
                        icon={Unlock}
                        accent="green"
                        trend={`${stats.releasedCount} leases released & paid to landlords`}
                    />
                    <StatCard
                        label="Pending Checkouts"
                        value={stats.pendingCount ?? 0}
                        icon={Clock}
                        accent="orange"
                        trend="Awaiting payment confirmation"
                    />
                    <StatCard
                        label="Disputed Escrows"
                        value={stats.disputedCount}
                        icon={AlertTriangle}
                        accent={stats.disputedCount > 0 ? "red" : "green"}
                        trend={
                            stats.disputedCount > 0
                                ? "Frozen pending arbitration"
                                : "Zero active dispute holds"
                        }
                    />
                </div>

                {/* Filter and Search Bar */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Status Filter
                            </label>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                                >
                                    <option value="ALL">All Transactions</option>
                                    <option value="ESCROWED">Locked in Escrow ({stats.lockedCount})</option>
                                    <option value="RELEASED">Released & Settled ({stats.releasedCount})</option>
                                    <option value="PENDING">Pending Checkout ({stats.pendingCount ?? 0})</option>
                                    <option value="DISPUTED">Disputed Escrows ({stats.disputedCount})</option>
                                    <option value="REFUNDED">Refunded ({stats.refundedCount ?? 0})</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Search Escrow
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by property, landlord, tenant, email, or TX ID..."
                                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStatusFilter("ALL");
                                    setSearchQuery("");
                                }}
                                className="w-full border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] text-sm font-semibold h-[38px]"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] overflow-hidden">
                    <div className="border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-[var(--text-primary)]">Escrow Transactions</h2>
                            <p className="text-xs text-[var(--text-muted)]">
                                Showing {filteredTransactions.length} records • All monetary amounts denominated in AfriExchange Naira Token (NT)
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-16 text-[var(--text-muted)]">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-blue)] mb-2" />
                            <span className="text-sm font-medium">Loading escrow records...</span>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="p-16 text-center text-[var(--text-muted)]">
                            <Lock className="h-10 w-10 mx-auto text-[var(--text-muted)]/40 mb-3" />
                            <p className="text-sm font-medium text-[var(--text-primary)]">No escrow transactions found</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                Tenant payments will appear here upon checkout.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--border-color)] text-left">
                                <thead className="bg-[var(--bg-primary)]">
                                    <tr>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Property / Address
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Tenant & Landlord
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Total Escrow
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Escrow & Payout State
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Payment Date
                                        </th>
                                        <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                                    {filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                                                    <div className="max-w-[220px]">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                                            {tx.property?.title || "Property"}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-muted)] truncate">
                                                            {tx.property?.address}, {tx.property?.city}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                                                        Tenant: {tx.tenant?.firstName} {tx.tenant?.lastName}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">
                                                        {tx.tenant?.email}
                                                    </p>
                                                    {tx.property?.landlord && (
                                                        <p className="text-[11px] text-[var(--color-brand-blue)] font-medium mt-1">
                                                            Landlord: {tx.property.landlord.firstName} {tx.property.landlord.lastName}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-[var(--text-primary)]">
                                                <span>{formatPrice(tx.totalAmount)}</span>
                                                <span className="ml-1 text-xs font-semibold text-[var(--color-brand-green)]">NT</span>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div>{getStatusBadge(tx)}</div>
                                                    {tx.payout && <div>{getPayoutBadge(tx.payout)}</div>}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--text-muted)]">
                                                {new Date(tx.createdAt).toLocaleDateString("en-NG", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="h-8 text-xs border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Slide-Over Drawer */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-lg bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">Escrow & Settlement Details</h3>
                                <p className="text-xs text-[var(--text-muted)] font-mono">
                                    TX: {selectedTx.id}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="h-8 w-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                            <span className="text-xs font-semibold text-[var(--text-secondary)]">Escrow State</span>
                            {getStatusBadge(selectedTx)}
                        </div>

                        {/* Financial Breakdown */}
                        <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4 bg-[var(--bg-primary)]/40">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Financial Hold Breakdown (NT Token)
                            </h4>
                            <div className="flex justify-between text-sm py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-secondary)]">Gross Rent:</span>
                                <span className="font-mono font-medium text-[var(--text-primary)]">
                                    {formatPrice(selectedTx.rentAmount)} NT
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-secondary)]">Caution Deposit:</span>
                                <span className="font-mono font-medium text-[var(--text-primary)]">
                                    {formatPrice(selectedTx.cautionDeposit || 0)} NT
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-1 border-b border-[var(--border-color)]/60 text-amber-500">
                                <span>Platform Commission (2%):</span>
                                <span className="font-mono font-medium">
                                    - {formatPrice(selectedTx.platformFee || 0)} NT
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-1 font-bold text-[var(--text-primary)] border-t border-[var(--border-color)]">
                                <span>Total Held in Escrow:</span>
                                <span className="font-mono text-[var(--color-brand-blue)]">
                                    {formatPrice(selectedTx.totalAmount)} NT
                                </span>
                            </div>
                            <div className="flex justify-between text-xs py-1 text-emerald-500 font-semibold">
                                <span>Net Landlord Payout (Rent - 2%):</span>
                                <span className="font-mono">
                                    {formatPrice(selectedTx.rentAmount - (selectedTx.platformFee || 0))} NT
                                </span>
                            </div>
                        </div>

                        {/* Associated Landlord Payout Section */}
                        <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                    Landlord Disbursement
                                </h4>
                                {getPayoutBadge(selectedTx.payout)}
                            </div>

                            {selectedTx.payout ? (
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]/40">
                                        <span className="text-[var(--text-muted)]">Payout Status:</span>
                                        <span className="font-semibold text-[var(--text-primary)]">{selectedTx.payout.status}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]/40">
                                        <span className="text-[var(--text-muted)]">Disbursed Amount:</span>
                                        <span className="font-mono font-bold text-emerald-400">
                                            {formatPrice(selectedTx.payout.netAmount)} NT
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]/40">
                                        <span className="text-[var(--text-muted)]">Idempotency Key:</span>
                                        <span className="font-mono text-[10px] text-[var(--text-secondary)] truncate max-w-[200px]">
                                            {selectedTx.payout.idempotencyKey}
                                        </span>
                                    </div>
                                    {selectedTx.payout.failureReason && selectedTx.payout.status !== "COMPLETED" && (
                                        <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mt-2">
                                            <p className="font-semibold">Notice / Error:</p>
                                            <p className="mt-0.5">{selectedTx.payout.failureReason}</p>
                                        </div>
                                    )}
                                    <div className="pt-2">
                                        <Link
                                            href="/admin/payouts"
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-blue)] hover:underline"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Manage in Landlord Payouts Console
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-[var(--text-muted)]">
                                    {selectedTx.status === "RELEASED"
                                        ? "No automated payout record was generated for this release."
                                        : "Landlord payout will be automatically triggered via AfriExchange upon tenant escrow release."}
                                </p>
                            )}
                        </div>

                        {/* Property & Tenant info */}
                        <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Property, Tenant & Landlord
                            </h4>
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Property:</p>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {selectedTx.property?.title}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {selectedTx.property?.address}, {selectedTx.property?.city}
                                </p>
                            </div>
                            <div className="pt-2 border-t border-[var(--border-color)]">
                                <p className="text-xs text-[var(--text-muted)]">Tenant (Depositor):</p>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {selectedTx.tenant?.firstName} {selectedTx.tenant?.lastName}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {selectedTx.tenant?.email} • {selectedTx.tenant?.phone || "No phone"}
                                </p>
                            </div>
                            {selectedTx.property?.landlord && (
                                <div className="pt-2 border-t border-[var(--border-color)]">
                                    <p className="text-xs text-[var(--text-muted)]">Landlord (Beneficiary):</p>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                        {selectedTx.property.landlord.firstName} {selectedTx.property.landlord.lastName}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Email: {selectedTx.property.landlord.email} • {selectedTx.property.landlord.phone || "No phone"}
                                    </p>
                                    {selectedTx.property.landlord.afriExchangeAccountEmail && (
                                        <p className="text-xs text-emerald-400 mt-0.5">
                                            AfriX: {selectedTx.property.landlord.afriExchangeAccountEmail}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedTx.disputed && (
                            <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
                                <p className="font-bold flex items-center gap-1.5 mb-1">
                                    <AlertTriangle className="h-4 w-4" /> Disputed Transaction
                                </p>
                                <p>{selectedTx.disputeReason || "Dispute under review by admin team."}</p>
                            </div>
                        )}

                        <div className="pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedTx(null)}
                                className="w-full border-[var(--border-color)]"
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
