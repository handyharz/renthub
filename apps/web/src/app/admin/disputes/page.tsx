"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Lock,
    Scale,
    ShieldCheck,
    RefreshCcw,
    ExternalLink,
    Wallet,
    X,
    Building2,
    User,
} from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface DisputeTransaction {
    id: string;
    totalAmount: number;
    status: string;
    disputeReason: string | null;
    createdAt: string;
    updatedAt: string;
    tenant: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        landlord: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            afriExchangeAccountEmail?: string;
            afriExchangeWalletAddress?: string;
        };
    };
}

interface ResolvedHistoryItem {
    id: string;
    totalAmount: number;
    status: string;
    releaseReason?: string | null;
    refundReason?: string | null;
    refunded: boolean;
    updatedAt: string;
    tenant: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
    };
}

interface DisputeStats {
    activeDisputes: number;
    disputedAmount: number;
    resolvedCount: number;
    totalTransactions: number;
    disputeRate: string;
}

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState<DisputeTransaction[]>([]);
    const [resolvedHistory, setResolvedHistory] = useState<ResolvedHistoryItem[]>([]);
    const [stats, setStats] = useState<DisputeStats>({
        activeDisputes: 0,
        disputedAmount: 0,
        resolvedCount: 0,
        totalTransactions: 0,
        disputeRate: "0%",
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"active" | "history">("active");
    const [actionId, setActionId] = useState<string | null>(null);

    // Modal state for arbitration
    const [modalDispute, setModalDispute] = useState<DisputeTransaction | null>(null);
    const [modalAction, setModalAction] = useState<"release" | "refund">("release");
    const [adminNote, setAdminNote] = useState("");

    const fetchDisputes = () => {
        setLoading(true);
        api.get("/admin/disputes")
            .then((res) => {
                const data = res.data.data;
                if (Array.isArray(data)) {
                    setDisputes(data);
                } else if (data?.disputes) {
                    setDisputes(data.disputes);
                    if (data.resolvedHistory) setResolvedHistory(data.resolvedHistory);
                    if (data.stats) setStats(data.stats);
                }
            })
            .catch(() => toast.error("Failed to load disputes"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDisputes();
    }, []);

    const executeResolution = async () => {
        if (!modalDispute) return;
        const id = modalDispute.id;
        setActionId(id);
        const label = modalAction === "refund" ? "refund to tenant" : "release to landlord";

        try {
            await api.post(`/admin/disputes/${id}/resolve`, {
                action: modalAction,
                note: adminNote.trim() || undefined,
            });
            toast.success(`Dispute resolved — ${label}`);
            setModalDispute(null);
            setAdminNote("");
            fetchDisputes();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Resolution failed");
        } finally {
            setActionId(null);
        }
    };

    return (
        <>
            <AdminHeader
                title="Escrow Disputes"
                description="Arbitrate contested lease transactions, mediate tenant-landlord claims, and manage locked escrow balances"
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchDisputes}
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
                        label="Active Disputes"
                        value={stats.activeDisputes}
                        icon={AlertTriangle}
                        accent={stats.activeDisputes > 0 ? "orange" : "green"}
                        trend={
                            stats.activeDisputes > 0
                                ? "Contested transactions requiring mediation"
                                : "Zero active disputes — all clean"
                        }
                    />
                    <StatCard
                        label="Disputed Escrow Volume"
                        value={`${formatPrice(stats.disputedAmount)} NT`}
                        icon={Lock}
                        accent="blue"
                        trend="Frozen pending arbitration"
                    />
                    <StatCard
                        label="Arbitrated & Resolved"
                        value={stats.resolvedCount}
                        icon={CheckCircle2}
                        accent="green"
                        trend="Historical settled dispute cases"
                    />
                    <StatCard
                        label="Platform Dispute Rate"
                        value={stats.disputeRate}
                        icon={Scale}
                        accent="green"
                        trend={`Across ${stats.totalTransactions} lease transactions`}
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                    <button
                        onClick={() => setActiveTab("active")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                            activeTab === "active"
                                ? "bg-[var(--color-brand-blue)] text-white shadow-xs"
                                : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
                        }`}
                    >
                        Active Disputes ({disputes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                            activeTab === "history"
                                ? "bg-[var(--color-brand-blue)] text-white shadow-xs"
                                : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
                        }`}
                    >
                        Resolution History ({resolvedHistory.length})
                    </button>
                </div>

                {/* Tab 1: Active Disputes */}
                {activeTab === "active" && (
                    <>
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-green)] border-t-transparent" />
                            </div>
                        ) : disputes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8">
                                <ShieldCheck className="h-12 w-12 text-[var(--color-brand-green)] mb-3" />
                                <h2 className="text-base font-bold text-[var(--text-primary)]">No Active Disputes</h2>
                                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
                                    All escrow deposits and lease handovers are proceeding normally with zero contested holds.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-[var(--shadow-sm)]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                    Property
                                                </th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                    Held Amount (NT)
                                                </th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                    Tenant (Claimant)
                                                </th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                    Landlord (Beneficiary)
                                                </th>
                                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                    Dispute Reason
                                                </th>
                                                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                    Arbitration Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)]">
                                            {disputes.map((d) => (
                                                <tr key={d.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <p className="font-semibold text-[var(--text-primary)]">{d.property.title}</p>
                                                        <p className="text-xs text-[var(--text-muted)]">{d.property.city}</p>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <p className="font-mono font-bold text-[var(--text-primary)]">
                                                            <span>{formatPrice(d.totalAmount)}</span>
                                                            <span className="ml-1 text-xs text-[var(--color-brand-green)]">NT</span>
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className="mt-1 text-[10px] border-amber-500/40 text-amber-400"
                                                        >
                                                            {d.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                                                            {d.tenant.firstName} {d.tenant.lastName}
                                                        </p>
                                                        <p className="text-[11px] text-[var(--text-muted)]">{d.tenant.email}</p>
                                                        <p className="text-[11px] text-[var(--text-muted)]">{d.tenant.phone || "No phone"}</p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                                                            {d.property.landlord.firstName} {d.property.landlord.lastName}
                                                        </p>
                                                        <p className="text-[11px] text-[var(--text-muted)]">{d.property.landlord.email}</p>
                                                        {d.property.landlord.afriExchangeAccountEmail && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-0.5">
                                                                <Wallet className="h-2.5 w-2.5" />
                                                                {d.property.landlord.afriExchangeAccountEmail}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 max-w-[220px]">
                                                        <p className="text-xs text-[var(--text-secondary)] line-clamp-3 bg-[var(--bg-muted)] p-2 rounded border border-[var(--border-color)]">
                                                            {d.disputeReason || "No details provided"}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setModalDispute(d);
                                                                    setModalAction("refund");
                                                                    setAdminNote("");
                                                                }}
                                                                className="gap-1 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                                            >
                                                                <ArrowDownLeft className="h-3.5 w-3.5" />
                                                                Refund Tenant
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    setModalDispute(d);
                                                                    setModalAction("release");
                                                                    setAdminNote("");
                                                                }}
                                                                className="gap-1 text-xs bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white"
                                                            >
                                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                                                Release Landlord
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Tab 2: Resolution History */}
                {activeTab === "history" && (
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] overflow-hidden">
                        <div className="border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">Dispute Resolution History</h2>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Showing {resolvedHistory.length} arbitrated cases and escrow releases
                                </p>
                            </div>
                        </div>

                        {resolvedHistory.length === 0 ? (
                            <div className="p-16 text-center text-[var(--text-muted)]">
                                <CheckCircle2 className="h-10 w-10 mx-auto text-[var(--text-muted)]/40 mb-3" />
                                <p className="text-sm font-medium text-[var(--text-primary)]">No historical dispute resolutions</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    Resolved disputes and refunds will appear here for audit compliance.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[var(--border-color)] text-left">
                                    <thead className="bg-[var(--bg-primary)]">
                                        <tr>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                Property
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                Tenant
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                Amount (NT)
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                Outcome
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                Audit Log
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                                        {resolvedHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                        {item.property.title}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)]">{item.property.city}</p>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                                                        {item.tenant.firstName} {item.tenant.lastName}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--text-muted)]">{item.tenant.email}</p>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-[var(--text-primary)]">
                                                    {formatPrice(item.totalAmount)} NT
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {item.refunded ? (
                                                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                            Refunded to Tenant
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            Released to Landlord
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 max-w-[260px]">
                                                    <p className="text-xs text-[var(--text-secondary)] truncate">
                                                        {item.releaseReason || item.refundReason || "Resolution logged"}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Resolution Execution Modal */}
            {modalDispute && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                            <h3 className="text-base font-bold text-[var(--text-primary)]">
                                Execute Dispute Arbitration
                            </h3>
                            <button
                                onClick={() => setModalDispute(null)}
                                className="h-7 w-7 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Dispute Summary */}
                        <div className="space-y-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] p-3.5 text-xs">
                            <div className="flex justify-between py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-muted)]">Property:</span>
                                <span className="font-semibold text-[var(--text-primary)]">{modalDispute.property.title}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-muted)]">Held Escrow Balance:</span>
                                <span className="font-mono font-bold text-emerald-400">
                                    {formatPrice(modalDispute.totalAmount)} NT
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-muted)]">Tenant (Claimant):</span>
                                <span className="text-[var(--text-primary)]">
                                    {modalDispute.tenant.firstName} {modalDispute.tenant.lastName}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-[var(--text-muted)]">Landlord (Beneficiary):</span>
                                <span className="text-[var(--text-primary)]">
                                    {modalDispute.property.landlord.firstName} {modalDispute.property.landlord.lastName}
                                </span>
                            </div>
                        </div>

                        {/* Action Selection */}
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                                Arbitration Decision:
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalAction("release")}
                                    className={`p-3 rounded-lg border text-left transition-all ${
                                        modalAction === "release"
                                            ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 ring-1 ring-[var(--color-brand-green)]"
                                            : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-muted)]"
                                    }`}
                                >
                                    <p className="text-xs font-bold text-[var(--color-brand-green)]">Release to Landlord</p>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                        Escrow released, lease marked RENTED, and AfriExchange landlord payout dispatched automatically.
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalAction("refund")}
                                    className={`p-3 rounded-lg border text-left transition-all ${
                                        modalAction === "refund"
                                            ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500"
                                            : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-muted)]"
                                    }`}
                                >
                                    <p className="text-xs font-bold text-amber-400">Refund to Tenant</p>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                        Full escrow refunded to tenant, lease cancelled, property returned to market.
                                    </p>
                                </button>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                Arbitration Audit Notes / Resolution Summary:
                            </label>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                rows={3}
                                placeholder="E.g., Inspection completed, tenant accepted keys, releasing escrow to landlord..."
                                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setModalDispute(null)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                disabled={actionId === modalDispute.id}
                                onClick={executeResolution}
                                className={`text-xs ${
                                    modalAction === "release"
                                        ? "bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white"
                                        : "bg-amber-600 hover:bg-amber-700 text-white"
                                }`}
                            >
                                {actionId === modalDispute.id ? "Executing..." : `Confirm & ${modalAction === "release" ? "Release" : "Refund"}`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
