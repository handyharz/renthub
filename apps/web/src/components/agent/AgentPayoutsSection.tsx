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
    ExternalLink,
    FileText,
    Receipt,
    Home,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AfriExchangeLinkingCard } from "@/components/payouts/AfriExchangeLinkingCard";

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
    items: Array<{
        id: string;
        propertyId: string;
        propertyTitle: string;
        propertyAddress: string;
        propertyImage?: string;
        annualRent: number;
        commissionPct: number;
        commissionAmount: number;
        status: "PENDING_LANDLORD" | "AUTHORIZED" | "REVOKED" | "COMPLETED";
        landlordName: string;
        authorizedAt?: string;
        completedAt?: string;
        createdAt: string;
    }>;
}

export function AgentPayoutsSection({ dbUser, onRefreshUser }: { dbUser: any; onRefreshUser?: () => void }) {
    const { user } = useUser();
    const [data, setData] = useState<AgentPayoutData | null>(null);
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

                                    <Link href={`/properties/${item.propertyId}`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2.5 text-xs font-semibold border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                                        >
                                            View <ExternalLink className="h-3 w-3 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
