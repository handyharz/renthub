"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Wallet,
    Building2,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowUpRight,
    Search,
    ShieldCheck,
    RotateCw,
    FileText,
    Receipt,
    Home,
    X,
    ShieldAlert,
    Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AfriExchangeLinkingCard } from "@/components/payouts/AfriExchangeLinkingCard";

export interface AgentPayoutItem {
    id: string;
    propertyId: string;
    propertyTitle: string;
    propertyAddress: string;
    propertyImage?: string;
    annualRent: number;
    commissionPct: number;
    commissionAmount: number;
    platformGuaranteeFee?: number;
    netLandlordProceeds?: number;
    transactionId?: string;
    afriExchangeRef?: string;
    tokenType?: string;
    status: "PENDING_LANDLORD" | "AUTHORIZED" | "REVOKED" | "COMPLETED";
    landlordName: string;
    landlordPhone?: string;
    authorizedAt?: string;
    completedAt?: string;
    createdAt: string;
}

interface AgentPayoutData {
    settlement: {
        isLinked: boolean;
        accountEmail?: string;
        walletAddress?: string;
        linkedAt?: string;
    };
    summary: {
        totalEarned: number;
        pendingCommission: number;
        completedDeals: number;
        activeDeals: number;
    };
    items: AgentPayoutItem[];
}

export function AgentPayoutsSection({ dbUser, onRefreshUser }: { dbUser: any; onRefreshUser?: () => void }) {
    const { user } = useUser();
    const [data, setData] = useState<AgentPayoutData | null>(null);
    const [selectedItem, setSelectedItem] = useState<AgentPayoutItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/agents/me/payouts?clerkId=${user?.id}`);
            if (res.data?.success) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch agent payouts:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchPayouts();
    }, [user]);

    const isLinked = Boolean(
        data?.settlement?.isLinked ||
        (dbUser?.settlementLinkedAt && (dbUser?.afriExchangeAccountEmail || dbUser?.afriExchangeWalletAddress))
    );

    const filteredItems = useMemo(() => {
        if (!data?.items) return [];
        return data.items.filter((item) => {
            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "COMPLETED" && item.status === "COMPLETED") ||
                (statusFilter === "ACTIVE" && item.status === "AUTHORIZED") ||
                (statusFilter === "PENDING" && item.status === "PENDING_LANDLORD");

            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                item.propertyTitle.toLowerCase().includes(q) ||
                item.propertyAddress.toLowerCase().includes(q) ||
                item.landlordName.toLowerCase().includes(q);

            return matchesStatus && matchesSearch;
        });
    }, [data?.items, statusFilter, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        Commission Payouts & Settlements
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                        Automated commission disbursement directly to your linked AfriExchange wallet upon escrow release.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchPayouts}
                        disabled={loading}
                        className="h-9 px-3 text-xs font-bold border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                    >
                        <RotateCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Unlinked Settlement Banner Warning */}
            {!isLinked && (
                <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-amber-900 dark:text-amber-200">
                                AfriExchange Settlement Account Required
                            </h4>
                            <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                                Link your AfriExchange wallet or verified email below to receive instant commission payouts when leases are funded and inspected.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-4 shadow-sm">
                    <p className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Total Commission Earned
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mt-1.5">
                        {data?.summary?.totalEarned ? formatPrice(data.summary.totalEarned) : "₦0"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        From {data?.summary?.completedDeals ?? 0} completed deal{(data?.summary?.completedDeals ?? 0) !== 1 ? "s" : ""}
                    </p>
                </div>

                <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-4 shadow-sm">
                    <p className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        Active Pipeline Commission
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1.5">
                        {data?.summary?.pendingCommission ? formatPrice(data.summary.pendingCommission) : "₦0"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        Across {data?.summary?.activeDeals ?? 0} authorized listing{(data?.summary?.activeDeals ?? 0) !== 1 ? "s" : ""}
                    </p>
                </div>

                <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-4 shadow-sm">
                    <p className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-purple-500" />
                        Authorized Listings
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mt-1.5">
                        {data?.summary?.activeDeals ?? 0}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        Delegated by landlords
                    </p>
                </div>

                <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-4 shadow-sm">
                    <p className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        Settlement Wallet
                    </p>
                    <p className="text-sm font-black text-[var(--text-primary)] mt-2 flex items-center gap-1.5">
                        {isLinked ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Connected & Ready
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                Setup Required
                            </span>
                        )}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 truncate">
                        {dbUser?.afriExchangeAccountEmail || dbUser?.afriExchangeWalletAddress || "No wallet linked"}
                    </p>
                </div>
            </div>

            {/* AfriExchange Settlement Link Card */}
            <AfriExchangeLinkingCard
                dbUser={dbUser}
                onRefresh={() => {
                    fetchPayouts();
                    onRefreshUser?.();
                }}
                title="AfriExchange Commission Payout Settlement"
                subtitle="Your earned agent commissions are automatically settled directly into your linked AfriX mobile wallet or Nigerian bank account."
            />

            {/* Fee Transparency Banner */}
            <div className="rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 text-xs text-purple-800 dark:text-purple-300 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5 text-sm">
                    <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Transparent 0% Tenant Fee Promise
                </p>
                <p className="leading-relaxed">
                    Tenants pay <strong>0% agent fee</strong>. Your agreed commission rate (up to 5%) is paid directly by the landlord from rent proceeds held in escrow. Commission is automatically released to your AfriExchange account once the tenant completes physical inspection and signs off on the keys.
                </p>
            </div>

            {/* Commission Settlements Table & History */}
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="font-black text-sm text-[var(--text-primary)] uppercase tracking-wider">
                            Commission Deals & Disbursements
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Status and history of listing commissions for your managed properties
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <div className="flex bg-[var(--bg-muted)] p-1 rounded-xl border border-[var(--border-color)]">
                            {[
                                { id: "ALL", label: "All" },
                                { id: "COMPLETED", label: "Completed" },
                                { id: "ACTIVE", label: "Active" },
                                { id: "PENDING", label: "Pending" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                                        statusFilter === tab.id
                                            ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search input */}
                        <div className="relative">
                            <Search className="h-3.5 w-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search property or landlord..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 w-44 sm:w-56"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-[var(--bg-muted)] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-12 text-center">
                        <Receipt className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-bold text-[var(--text-secondary)]">No commission deals found</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            {data?.items?.length === 0
                                ? "When you request delegations and close leases, your commission records will show here."
                                : "Try clearing your search query or filter."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border-color)]">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-card-hover)] transition-colors"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="relative h-12 w-12 rounded-xl bg-[var(--bg-muted)] shrink-0 overflow-hidden border border-[var(--border-color)]">
                                        {item.propertyImage ? (
                                            <Image
                                                src={item.propertyImage}
                                                alt={item.propertyTitle}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Home className="h-5 w-5 text-[var(--text-muted)]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link
                                                href={`/properties/${item.propertyId}`}
                                                className="font-bold text-sm text-[var(--text-primary)] hover:text-purple-600 dark:hover:text-purple-400 transition-colors truncate"
                                            >
                                                {item.propertyTitle}
                                            </Link>
                                            {item.status === "COMPLETED" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Disbursed
                                                </span>
                                            )}
                                            {item.status === "AUTHORIZED" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                    <Clock className="h-3 w-3" />
                                                    Active Deal
                                                </span>
                                            )}
                                            {item.status === "PENDING_LANDLORD" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                    <Clock className="h-3 w-3" />
                                                    Pending Auth
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                                            Landlord: {item.landlordName} · {item.propertyAddress}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-color)]">
                                    <div className="text-left sm:text-right">
                                        <p className="text-[11px] text-[var(--text-muted)]">
                                            Rent: {formatPrice(item.annualRent)}
                                        </p>
                                        <p className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                                            {formatPrice(item.commissionAmount)}{" "}
                                            <span className="text-xs font-semibold text-[var(--text-muted)]">
                                                ({item.commissionPct}%)
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedItem(item)}
                                            className="h-8 px-3 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl cursor-pointer"
                                        >
                                            Breakdown
                                        </Button>

                                        <Link href={`/properties/${item.propertyId}`}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-2.5 text-xs font-semibold border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] rounded-xl"
                                            >
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detailed Commission Settlement Breakdown Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="relative bg-[var(--bg-card)] w-full max-w-lg rounded-3xl shadow-2xl border border-[var(--border-color)] p-6 space-y-5 animate-in zoom-in-95 duration-200 text-[var(--text-primary)] max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                    Agent Commission Breakdown
                                </span>
                                <h3 className="text-lg font-black text-[var(--text-primary)] mt-0.5">
                                    {selectedItem.propertyTitle}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                    {selectedItem.propertyAddress}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="h-8 w-8 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Status Overview */}
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border-color)]">
                            <span className="text-xs font-bold text-[var(--text-secondary)]">
                                Disbursement Status
                            </span>
                            {selectedItem.status === "COMPLETED" && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Disbursed to AfriExchange
                                </span>
                            )}
                            {selectedItem.status === "AUTHORIZED" && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                    <Clock className="h-3.5 w-3.5" />
                                    Active In Pipeline
                                </span>
                            )}
                            {selectedItem.status === "PENDING_LANDLORD" && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                    <Clock className="h-3.5 w-3.5" />
                                    Awaiting Landlord Auth
                                </span>
                            )}
                            {selectedItem.status === "REVOKED" && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Delegation Revoked
                                </span>
                            )}
                        </div>

                        {/* Escrow Financial Calculation Box */}
                        <div className="space-y-3 rounded-2xl border border-[var(--border-color)] p-4 bg-[var(--bg-muted)]/50">
                            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                                Escrow Accounting & Commission Math
                            </h4>

                            {/* Gross Annual Rent */}
                            <div className="flex justify-between items-center text-xs py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-secondary)]">Gross Rent Paid by Tenant:</span>
                                <span className="font-mono font-bold text-[var(--text-primary)]">
                                    {formatPrice(selectedItem.annualRent)}
                                </span>
                            </div>

                            {/* Agreed Commission Rate */}
                            <div className="flex justify-between items-center text-xs py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-secondary)]">Agreed Landlord Commission:</span>
                                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                                    {selectedItem.commissionPct.toFixed(1)}%
                                </span>
                            </div>

                            {/* Net Agent Payout */}
                            <div className="flex justify-between items-center text-sm py-1 font-extrabold text-[var(--text-primary)]">
                                <span className="text-purple-700 dark:text-purple-300">
                                    Net Commission Payout:
                                </span>
                                <span className="font-mono text-base text-purple-600 dark:text-purple-400">
                                    {formatPrice(selectedItem.commissionAmount)} {selectedItem.tokenType || "NT"}
                                </span>
                            </div>

                            {/* Landlord Context */}
                            <div className="rounded-xl p-3 bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] space-y-1.5 text-[var(--text-secondary)] mt-2">
                                <div className="flex justify-between">
                                    <span>Landlord Escrow Guarantee (2%):</span>
                                    <span className="font-mono text-red-500">
                                        - {formatPrice(selectedItem.platformGuaranteeFee || Math.round(selectedItem.annualRent * 0.02))}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Net Landlord Proceeds:</span>
                                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                        {formatPrice(selectedItem.netLandlordProceeds || (selectedItem.annualRent - selectedItem.commissionAmount - Math.round(selectedItem.annualRent * 0.02)))}
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold text-[var(--text-primary)] pt-1 border-t border-[var(--border-color)]/60">
                                    <span>Tenant Agent Fee:</span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                        ₦0 (100% Free Guarantee)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Settlement Destination Details */}
                        <div className="space-y-2 rounded-2xl border border-[var(--border-color)] p-4 text-xs">
                            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                                AfriExchange Settlement Destination
                            </h4>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between py-1 border-b border-[var(--border-color)]/60">
                                    <span className="text-[var(--text-secondary)]">Settlement Wallet / Email:</span>
                                    <span className="font-mono font-bold text-[var(--text-primary)] truncate max-w-[200px]">
                                        {data?.settlement?.accountEmail || data?.settlement?.walletAddress || "AfriExchange Linked"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-1 border-b border-[var(--border-color)]/60">
                                    <span className="text-[var(--text-secondary)]">Landlord:</span>
                                    <span className="font-bold text-[var(--text-primary)]">
                                        {selectedItem.landlordName}
                                    </span>
                                </div>
                                {selectedItem.afriExchangeRef && (
                                    <div className="flex items-center justify-between py-1 border-b border-[var(--border-color)]/60">
                                        <span className="text-[var(--text-secondary)]">AfriExchange Ref:</span>
                                        <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                                            {selectedItem.afriExchangeRef}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-[var(--text-secondary)]">Effective Settlement Date:</span>
                                    <span className="font-medium text-[var(--text-primary)]">
                                        {new Date(selectedItem.completedAt || selectedItem.authorizedAt || selectedItem.createdAt).toLocaleDateString("en-NG", {
                                            day: "numeric", month: "short", year: "numeric"
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Zero Side-Payment Notice */}
                        <div className="rounded-2xl p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-[11px] text-purple-800 dark:text-purple-300 leading-relaxed space-y-1">
                            <p className="font-extrabold flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                                Direct Platform Settlement Guarantee
                            </p>
                            <p className="opacity-90">
                                Your commission is paid automatically upon escrow release. Demanding cash inspection fees, registration fees, or fuel money from tenants violates RentHub policy and results in strikes under our 90-day rolling rule.
                            </p>
                        </div>

                        <div className="pt-1">
                            <Button
                                onClick={() => setSelectedItem(null)}
                                className="w-full h-11 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                            >
                                Close Breakdown
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
