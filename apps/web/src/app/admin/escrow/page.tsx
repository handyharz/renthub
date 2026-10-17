"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface EscrowTransaction {
    id: string;
    totalAmount: number;
    rentAmount: number;
    platformFee: number;
    cautionDeposit: number;
    serviceFee: number;
    status: "PENDING" | "ESCROWED" | "RELEASED" | "REFUNDED" | "CANCELLED";
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
    };
    tenant: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
}

interface EscrowStats {
    totalLockedAmount: number;
    lockedCount: number;
    releasedCount: number;
    disputedCount: number;
}

export default function AdminEscrowPage() {
    const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
    const [stats, setStats] = useState<EscrowStats>({
        totalLockedAmount: 0,
        lockedCount: 0,
        releasedCount: 0,
        disputedCount: 0,
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
                setStats(res.data.data.stats || {
                    totalLockedAmount: 0,
                    lockedCount: 0,
                    releasedCount: 0,
                    disputedCount: 0,
                });
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
            const tenant = `${t.tenant?.firstName || ""} ${t.tenant?.lastName || ""}`.toLowerCase();
            const email = (t.tenant?.email || "").toLowerCase();
            const id = (t.id || "").toLowerCase();
            return prop.includes(q) || tenant.includes(q) || email.includes(q) || id.includes(q);
        });
    }, [transactions, searchQuery]);

    const getStatusBadge = (tx: EscrowTransaction) => {
        if (tx.disputed) {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Disputed
                </span>
            );
        }
        switch (tx.status) {
            case "ESCROWED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        <Lock className="h-3.5 w-3.5" />
                        Locked in Escrow
                    </span>
                );
            case "RELEASED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Released
                    </span>
                );
            case "REFUNDED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-500/10 text-gray-600 border border-gray-500/20">
                        Refunded
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Clock className="h-3.5 w-3.5" />
                        {tx.status}
                    </span>
                );
        }
    };

    return (
        <>
            <AdminHeader
                title="Escrow & Payments"
                description="Monitor tenant rent payments held in platform escrow before lease handover"
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
                        label="Total Active Escrow"
                        value={formatPrice(stats.totalLockedAmount)}
                        icon={Lock}
                        accent="blue"
                        trend={`${stats.lockedCount} funded leases locked`}
                    />
                    <StatCard
                        label="Locked Leases"
                        value={stats.lockedCount}
                        icon={Clock}
                        accent="orange"
                        trend="Awaiting handover OTP"
                    />
                    <StatCard
                        label="Released Escrows"
                        value={stats.releasedCount}
                        icon={Unlock}
                        accent="green"
                        trend="Handover verified & disbursed"
                    />
                    <StatCard
                        label="Disputed Escrows"
                        value={stats.disputedCount}
                        icon={AlertTriangle}
                        accent="red"
                        trend="Frozen pending arbitration"
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
                                    <option value="ESCROWED">Locked in Escrow</option>
                                    <option value="RELEASED">Released</option>
                                    <option value="REFUNDED">Refunded</option>
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
                                    placeholder="Search by property, tenant name, email, or transaction ID..."
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
                    <div className="border-b border-[var(--border-color)] px-6 py-4">
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">Escrow Transactions</h2>
                        <p className="text-xs text-[var(--text-muted)]">
                            Showing {filteredTransactions.length} records
                        </p>
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
                                            Tenant
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Total Escrow
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Status
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
                                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                                    {tx.tenant?.firstName} {tx.tenant?.lastName}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">{tx.tenant?.email}</p>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-[var(--text-primary)]">
                                                {formatPrice(tx.totalAmount)}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(tx)}
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
                                <h3 className="text-base font-bold text-[var(--text-primary)]">Escrow Details</h3>
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

                        {/* Breakdown */}
                        <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4 bg-[var(--bg-primary)]/40">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Financial Hold Breakdown
                            </h4>
                            <div className="flex justify-between text-sm py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-secondary)]">Rent Amount:</span>
                                <span className="font-mono font-medium text-[var(--text-primary)]">
                                    {formatPrice(selectedTx.rentAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-secondary)]">Caution Deposit:</span>
                                <span className="font-mono font-medium text-[var(--text-primary)]">
                                    {formatPrice(selectedTx.cautionDeposit || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-1 border-b border-[var(--border-color)]/60 text-amber-600">
                                <span>Platform Fee (2%):</span>
                                <span className="font-mono font-medium">
                                    {formatPrice(selectedTx.platformFee || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-1 font-bold text-[var(--text-primary)]">
                                <span>Total Held in Escrow:</span>
                                <span className="font-mono text-[var(--color-brand-blue)]">
                                    {formatPrice(selectedTx.totalAmount)}
                                </span>
                            </div>
                        </div>

                        {/* Property & Tenant info */}
                        <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Property & Tenant
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
                                <p className="text-xs text-[var(--text-muted)]">Tenant:</p>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {selectedTx.tenant?.firstName} {selectedTx.tenant?.lastName}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {selectedTx.tenant?.email} • {selectedTx.tenant?.phone || "No phone"}
                                </p>
                            </div>
                        </div>

                        {selectedTx.disputed && (
                            <div className="p-3.5 rounded-lg border border-red-300 bg-red-50 text-red-700 text-xs">
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
