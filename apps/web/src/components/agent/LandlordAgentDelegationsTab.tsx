"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Users, MapPin, Star, CheckCircle2, Clock, XCircle,
    Phone, AlertCircle, Building2, ShieldCheck, Home
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface AgentDelegation {
    id: string;
    status: "PENDING_LANDLORD" | "AUTHORIZED" | "REVOKED" | "COMPLETED";
    commissionPct: number;
    agentNote?: string;
    landlordNote?: string;
    requestedAt: string;
    authorizedAt?: string;
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        pricePerYear: number;
        status: string;
        images: { url: string }[];
    };
    agent: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        phone?: string;
        agentProfile?: {
            businessName?: string;
            avgRating?: number;
            reviewCount: number;
            totalClosed: number;
            status: string;
        };
    };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING_LANDLORD: { label: "Awaiting Your Decision", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800", icon: Clock },
    AUTHORIZED: { label: "Authorized", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
    REVOKED: { label: "Revoked", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800", icon: XCircle },
    COMPLETED: { label: "Completed", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800", icon: ShieldCheck },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] || { label: status, color: "bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-color)]", icon: AlertCircle };
    const Icon = cfg.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold", cfg.color)}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    );
}

export function LandlordAgentDelegationsTab() {
    const { user } = useUser();
    const [delegations, setDelegations] = useState<AgentDelegation[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [landlordNotes, setLandlordNotes] = useState<Record<string, string>>({});
    const [activeFilter, setActiveFilter] = useState("ALL");

    const fetchDelegations = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/agents/landlord/delegations?clerkId=${user?.id}`);
            setDelegations(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchDelegations();
    }, [user]);

    const handleAuthorize = async (delegationId: string) => {
        setActionLoading(delegationId + "_auth");
        try {
            await api.patch(`/agents/delegations/${delegationId}/authorize?clerkId=${user?.id}`, {
                landlordNote: landlordNotes[delegationId] || undefined
            });
            toast.success("Agent authorized! They can now manage this listing.");
            fetchDelegations();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to authorize");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevoke = async (delegationId: string) => {
        if (!confirm("Are you sure you want to revoke this agent's access?")) return;
        setActionLoading(delegationId + "_rev");
        try {
            await api.patch(`/agents/delegations/${delegationId}/revoke?clerkId=${user?.id}`);
            toast.success("Agent access revoked");
            fetchDelegations();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to revoke");
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = delegations.filter(d =>
        activeFilter === "ALL" || d.status === activeFilter
    );

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-[var(--bg-muted)] rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                <strong>🤝 Agent Delegation</strong> — Agents on RentHub are verified professionals. When you authorize an
                agent for a listing, they can help market and manage it. Their commission (up to 5%) is deducted from your
                rental income through escrow — tenants pay zero agent fee.
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {["ALL", "PENDING_LANDLORD", "AUTHORIZED", "COMPLETED", "REVOKED"].map(f => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border",
                            activeFilter === f
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border-[var(--border-color)]"
                        )}
                    >
                        {f === "ALL" ? `All (${delegations.length})` : (statusConfig[f]?.label || f) + ` (${delegations.filter(d => d.status === f).length})`}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl">
                    <Users className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-secondary)] font-medium">No agent requests</p>
                    <p className="text-[var(--text-muted)] text-sm mt-1">
                        Verified agents can request to list your properties. You stay in full control.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(d => {
                        const img = d.property.images?.[0]?.url;
                        const agentProfile = d.agent.agentProfile;
                        const isAuthLoading = actionLoading === d.id + "_auth";
                        const isRevLoading = actionLoading === d.id + "_rev";

                        return (
                            <div key={d.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-5">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Property thumbnail */}
                                        <div className="relative h-24 w-32 shrink-0 rounded-xl overflow-hidden bg-[var(--bg-muted)]">
                                            {img ? (
                                                <Image src={img} alt={d.property.title} fill className="object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Home className="h-8 w-8 text-[var(--text-muted)]" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                                <div>
                                                    <Link href={`/properties/${d.property.id}`} className="font-bold text-[var(--text-primary)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                                                        {d.property.title}
                                                    </Link>
                                                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                                        <MapPin className="h-3 w-3" />
                                                        {d.property.city} · {formatPrice(d.property.pricePerYear)}/yr
                                                    </p>
                                                </div>
                                                <StatusBadge status={d.status} />
                                            </div>

                                            {/* Agent info */}
                                            <div className="mt-3 flex items-center gap-3 p-3 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {d.agent.avatar ? (
                                                        <Image src={d.agent.avatar} alt="" width={40} height={40} className="object-cover rounded-full" />
                                                    ) : (
                                                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                            {d.agent.firstName[0]}{d.agent.lastName[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-[var(--text-primary)] text-sm">
                                                        {d.agent.firstName} {d.agent.lastName}
                                                    </p>
                                                    {agentProfile?.businessName && (
                                                        <p className="text-xs text-[var(--text-muted)]">{agentProfile.businessName}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        {agentProfile?.avgRating && (
                                                            <span className="text-xs flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                                                                <Star className="h-3 w-3 fill-current" />
                                                                {agentProfile.avgRating.toFixed(1)} ({agentProfile.reviewCount})
                                                            </span>
                                                        )}
                                                        {agentProfile?.totalClosed ? (
                                                            <span className="text-xs text-[var(--text-muted)]">
                                                                {agentProfile.totalClosed} deals closed
                                                            </span>
                                                        ) : null}
                                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                            {d.commissionPct}% commission
                                                        </span>
                                                    </div>
                                                </div>
                                                {d.agent.phone && (
                                                    <a href={`tel:${d.agent.phone}`} className="text-[var(--text-muted)] hover:text-blue-600 dark:hover:text-blue-400 shrink-0">
                                                        <Phone className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>

                                            {/* Agent note */}
                                            {d.agentNote && (
                                                <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                                                    <span className="font-semibold">Agent's message:</span> "{d.agentNote}"
                                                </div>
                                            )}

                                            {/* Actions for pending */}
                                            {d.status === "PENDING_LANDLORD" && (
                                                <div className="mt-4 space-y-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Optional: Add a note for the agent..."
                                                        value={landlordNotes[d.id] || ""}
                                                        onChange={e => setLandlordNotes(n => ({ ...n, [d.id]: e.target.value }))}
                                                        className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleAuthorize(d.id)}
                                                            disabled={isAuthLoading || isRevLoading}
                                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs font-semibold"
                                                        >
                                                            {isAuthLoading ? "Authorizing..." : "✓ Authorize Agent"}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleRevoke(d.id)}
                                                            disabled={isAuthLoading || isRevLoading}
                                                            variant="outline"
                                                            className="flex-1 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-9 text-xs font-semibold bg-transparent"
                                                        >
                                                            {isRevLoading ? "Declining..." : "✗ Decline"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Revoke authorized */}
                                            {d.status === "AUTHORIZED" && (
                                                <div className="mt-3 flex items-center justify-between">
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                        ✓ Authorized {d.authorizedAt ? new Date(d.authorizedAt).toLocaleDateString("en-NG") : ""}
                                                    </p>
                                                    <Button
                                                        onClick={() => handleRevoke(d.id)}
                                                        disabled={isRevLoading}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 text-xs bg-transparent"
                                                    >
                                                        {isRevLoading ? "..." : "Revoke Access"}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
