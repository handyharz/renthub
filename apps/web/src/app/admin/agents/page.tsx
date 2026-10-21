"use client";

import { useState, useEffect } from "react";
import {
    Briefcase, MapPin, Star, CheckCircle2, Clock, XCircle,
    ShieldCheck, Phone, Mail, Building2, Users, AlertCircle,
    ShieldAlert, AlertTriangle, Flag, DollarSign, Fuel, FileText,
    Ban, Check, ThumbsUp, ThumbsDown
} from "lucide-react";
import Image from "next/image";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface AgentProfile {
    id: string;
    status: string;
    businessName?: string;
    businessAddress?: string;
    licenseNumber?: string;
    yearsOfExperience: number;
    operatingCities: string[];
    bio?: string;
    defaultCommissionPct: number;
    totalListings: number;
    totalClosed: number;
    strikeCount?: number;
    createdAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        email?: string;
        phone?: string;
        verified: boolean;
    };
}

interface AgentStrikeItem {
    id: string;
    agentId: string;
    reporterId: string;
    propertyId?: string;
    reason: "INSPECTION_FEE" | "FUEL_MONEY" | "REGISTRATION_FORM_FEE" | "OFF_PLATFORM_CASH" | "OTHER";
    description: string;
    strikeApplied: boolean;
    status: "PENDING" | "UPHELD" | "DISMISSED";
    adminNote?: string;
    createdAt: string;
    agent: {
        id: string;
        firstName: string;
        lastName: string;
        phone?: string;
        email?: string;
        agentProfile?: {
            businessName?: string;
            strikeCount: number;
            status: string;
        };
    };
    reporter: {
        id: string;
        firstName: string;
        lastName: string;
        phone?: string;
        email?: string;
    };
    property?: {
        id: string;
        title: string;
        address: string;
        city: string;
    };
}

const REASON_LABELS: Record<string, { label: string; icon: any; color: string }> = {
    INSPECTION_FEE: { label: "Inspection / Viewing Fee", icon: DollarSign, color: "text-red-600 bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800" },
    FUEL_MONEY: { label: "Fuel / Transport Fare", icon: Fuel, color: "text-amber-600 bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
    REGISTRATION_FORM_FEE: { label: "Paper Registration Form", icon: FileText, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
    OFF_PLATFORM_CASH: { label: "Direct Cash Demand", icon: Ban, color: "text-purple-600 bg-purple-100 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800" },
    OTHER: { label: "Other Side-Payment", icon: AlertTriangle, color: "text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" },
};

export default function AdminAgentsPage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<"APPLICATIONS" | "STRIKES">("APPLICATIONS");
    const [agents, setAgents] = useState<AgentProfile[]>([]);
    const [strikes, setStrikes] = useState<AgentStrikeItem[]>([]);
    const [strikeFilter, setStrikeFilter] = useState<string>("ALL");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
    const [strikeNotes, setStrikeNotes] = useState<Record<string, string>>({});

    const fetchAgents = async () => {
        try {
            const res = await api.get(`/agents/admin/pending?clerkId=${user?.id}`);
            setAgents(res.data.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchStrikes = async () => {
        try {
            const res = await api.get(`/agents/admin/strikes?clerkId=${user?.id}`);
            setStrikes(res.data.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const loadAll = async () => {
        setLoading(true);
        await Promise.allSettled([fetchAgents(), fetchStrikes()]);
        setLoading(false);
    };

    useEffect(() => {
        if (user) loadAll();
    }, [user]);

    const handleApprove = async (agentProfileId: string) => {
        setActionLoading(agentProfileId + "_approve");
        try {
            await api.post(`/agents/admin/${agentProfileId}/approve?clerkId=${user?.id}`);
            toast.success("Agent approved! Their account is now active.");
            fetchAgents();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (agentProfileId: string) => {
        const reason = rejectionReasons[agentProfileId];
        if (!reason?.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }
        setActionLoading(agentProfileId + "_reject");
        try {
            await api.post(`/agents/admin/${agentProfileId}/reject?clerkId=${user?.id}`, { reason });
            toast.success("Agent application rejected");
            fetchAgents();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReviewStrike = async (strikeId: string, action: "UPHOLD" | "DISMISS") => {
        const note = strikeNotes[strikeId] || "";
        setActionLoading(strikeId + "_" + action);
        try {
            const res = await api.post(`/agents/admin/strikes/${strikeId}/review?clerkId=${user?.id}`, {
                action,
                adminNote: note.trim() || undefined,
            });

            if (action === "UPHOLD") {
                const strikeData = res.data.data;
                if (strikeData?.suspended) {
                    toast.error(`⚠️ Strike applied! Agent has accumulated 3 strikes and has been automatically suspended.`);
                } else {
                    toast.warning(`Strike upheld. Agent now has ${strikeData?.strikeCount || "1"}/3 strikes.`);
                }
            } else {
                toast.success("Report dismissed.");
            }
            fetchStrikes();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to adjudicate report");
        } finally {
            setActionLoading(null);
        }
    };

    const pendingStrikesCount = strikes.filter(s => s.status === "PENDING").length;
    const filteredStrikes = strikes.filter(s => strikeFilter === "ALL" || s.status === strikeFilter);

    return (
        <>
            <AdminHeader
                title="Agent Partners & Compliance"
                description="Review applications, manage partner credentials, and enforce Zero Side-Payment strikes"
            />

            <div className="p-6 space-y-6">
                {/* Policy banner */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                        <strong className="font-extrabold text-sm block mb-0.5">Strict Zero Side-Payment Standard:</strong>
                        Partner agents earn up to 5% commission, landlord-paid via escrow. Charging tenants viewing/inspection fees, fuel money, or registration form fees is strictly prohibited. Every upheld report registers a strike. <strong>3 strikes trigger automatic, permanent account suspension.</strong>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-[var(--border-color)] pb-3">
                    <button
                        onClick={() => setActiveTab("APPLICATIONS")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                            activeTab === "APPLICATIONS"
                                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                        )}
                    >
                        <Users className="h-4 w-4" />
                        Pending Applications
                        {agents.length > 0 && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black",
                                activeTab === "APPLICATIONS" ? "bg-white text-purple-700" : "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                            )}>
                                {agents.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab("STRIKES")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                            activeTab === "STRIKES"
                                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                        )}
                    >
                        <Flag className="h-4 w-4" />
                        Side-Fee Reports & Strikes
                        {pendingStrikesCount > 0 && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black",
                                activeTab === "STRIKES" ? "bg-white text-red-700" : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400"
                            )}>
                                {pendingStrikesCount} pending
                            </span>
                        )}
                    </button>
                </div>

                {/* TAB 1: APPLICATIONS */}
                {activeTab === "APPLICATIONS" && (
                    <>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-40 bg-[var(--bg-muted)] rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : agents.length === 0 ? (
                            <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
                                <Users className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
                                <p className="text-[var(--text-secondary)] font-bold">No pending agent applications</p>
                                <p className="text-[var(--text-muted)] text-xs mt-1">New applications will appear here for review</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                                    {agents.length} application{agents.length !== 1 ? "s" : ""} awaiting decision
                                </p>
                                {agents.map(agent => {
                                    const isApproving = actionLoading === agent.id + "_approve";
                                    const isRejecting = actionLoading === agent.id + "_reject";

                                    return (
                                        <div key={agent.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
                                            <div className="flex flex-col md:flex-row gap-5">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {agent.user.avatar ? (
                                                            <Image src={agent.user.avatar} alt="" width={56} height={56} className="object-cover rounded-2xl" />
                                                        ) : (
                                                            <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">
                                                                {agent.user.firstName[0]}{agent.user.lastName[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-extrabold text-[var(--text-primary)] text-lg">
                                                                {agent.user.firstName} {agent.user.lastName}
                                                            </h3>
                                                            {agent.user.verified && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                                                    <ShieldCheck className="h-3 w-3" /> ID Verified
                                                                </span>
                                                            )}
                                                        </div>
                                                        {agent.businessName && (
                                                            <p className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5 flex items-center gap-1">
                                                                <Building2 className="h-3.5 w-3.5" />
                                                                {agent.businessName}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-[var(--text-muted)]">
                                                            {agent.user.email && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mail className="h-3 w-3" /> {agent.user.email}
                                                                </span>
                                                            )}
                                                            {agent.user.phone && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="h-3 w-3" /> {agent.user.phone}
                                                                </span>
                                                            )}
                                                            {agent.operatingCities?.length > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" /> {agent.operatingCities.join(", ")}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                                            <span className="bg-[var(--bg-muted)] text-[var(--text-secondary)] px-2.5 py-0.5 rounded-full border border-[var(--border-color)]">
                                                                {agent.yearsOfExperience} yrs experience
                                                            </span>
                                                            <span className="bg-[var(--bg-muted)] text-[var(--text-secondary)] px-2.5 py-0.5 rounded-full border border-[var(--border-color)]">
                                                                {agent.defaultCommissionPct}% default commission
                                                            </span>
                                                            {agent.licenseNumber && (
                                                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-mono border border-blue-200 dark:border-blue-800">
                                                                    License: {agent.licenseNumber}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {agent.bio && (
                                                            <p className="text-xs text-[var(--text-muted)] mt-2 italic">"{agent.bio}"</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="md:w-64 shrink-0 space-y-3">
                                                    <Button
                                                        onClick={() => handleApprove(agent.id)}
                                                        disabled={isApproving || isRejecting}
                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-xs font-bold"
                                                    >
                                                        {isApproving ? "Approving..." : "✓ Approve Partner"}
                                                    </Button>

                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Rejection reason..."
                                                            value={rejectionReasons[agent.id] || ""}
                                                            onChange={e => setRejectionReasons(r => ({ ...r, [agent.id]: e.target.value }))}
                                                            className="w-full bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                                                        />
                                                        <Button
                                                            onClick={() => handleReject(agent.id)}
                                                            disabled={isApproving || isRejecting}
                                                            variant="outline"
                                                            className="w-full border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-9 text-xs font-semibold bg-transparent"
                                                        >
                                                            {isRejecting ? "Rejecting..." : "✗ Reject"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* TAB 2: STRIKES & REPORTS */}
                {activeTab === "STRIKES" && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="flex gap-2 pb-1 overflow-x-auto">
                            {["ALL", "PENDING", "UPHELD", "DISMISSED"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStrikeFilter(status)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                                        strikeFilter === status
                                            ? "bg-[var(--text-primary)] text-[var(--card-bg)] border-transparent"
                                            : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-32 bg-[var(--bg-muted)] rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredStrikes.length === 0 ? (
                            <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-60" />
                                <p className="text-[var(--text-primary)] font-bold">No violation reports found</p>
                                <p className="text-[var(--text-muted)] text-xs mt-1">Tenant complaints about off-platform cash will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredStrikes.map((s) => {
                                    const meta = REASON_LABELS[s.reason] || REASON_LABELS.OTHER;
                                    const Icon = meta.icon;
                                    const agentStrikes = s.agent.agentProfile?.strikeCount ?? 0;
                                    const isSuspended = s.agent.agentProfile?.status === "SUSPENDED" || agentStrikes >= 3;
                                    const isUpholding = actionLoading === s.id + "_UPHOLD";
                                    const isDismissing = actionLoading === s.id + "_DISMISS";

                                    return (
                                        <div
                                            key={s.id}
                                            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm space-y-4"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                {/* Left Column: Violation Header & Reason */}
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border uppercase tracking-wider",
                                                            meta.color
                                                        )}>
                                                            <Icon className="h-3.5 w-3.5" />
                                                            {meta.label}
                                                        </span>

                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                            s.status === "PENDING" && "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800",
                                                            s.status === "UPHELD" && "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800",
                                                            s.status === "DISMISSED" && "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                                                        )}>
                                                            {s.status === "UPHELD" ? "Strike Upheld" : s.status}
                                                        </span>

                                                        <span className="text-[11px] text-[var(--text-muted)]">
                                                            {new Date(s.createdAt).toLocaleDateString("en-NG", {
                                                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                                            })}
                                                        </span>
                                                    </div>

                                                    {/* Incident Statement */}
                                                    <div className="p-3.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                                                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1">
                                                            Tenant Statement
                                                        </p>
                                                        "{s.description}"
                                                    </div>

                                                    {/* Property context if any */}
                                                    {s.property && (
                                                        <p className="text-xs text-[var(--text-muted)]">
                                                            Property: <strong className="text-[var(--text-primary)]">{s.property.title}</strong> ({s.property.address}, {s.property.city})
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Right Column: People Involved */}
                                                <div className="md:w-80 shrink-0 p-4 rounded-xl bg-[var(--bg-muted)]/60 border border-[var(--border-color)] space-y-3 text-xs">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                                                            Reported Agent
                                                        </p>
                                                        <p className="font-extrabold text-[var(--text-primary)] text-sm">
                                                            {s.agent.firstName} {s.agent.lastName}
                                                        </p>
                                                        {s.agent.agentProfile?.businessName && (
                                                            <p className="text-[var(--text-secondary)] font-medium">
                                                                {s.agent.agentProfile.businessName}
                                                            </p>
                                                        )}
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-md text-[10px] font-black",
                                                                agentStrikes === 0 && "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
                                                                agentStrikes > 0 && agentStrikes < 3 && "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
                                                                agentStrikes >= 3 && "bg-red-600 text-white"
                                                            )}>
                                                                {agentStrikes} / 3 Strikes
                                                            </span>
                                                            {isSuspended && (
                                                                <span className="text-[10px] font-black text-red-600 dark:text-red-400">
                                                                    ⛔ SUSPENDED
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-[var(--border-color)] pt-2">
                                                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                                                            Reporting Tenant
                                                        </p>
                                                        <p className="font-bold text-[var(--text-primary)]">
                                                            {s.reporter.firstName} {s.reporter.lastName}
                                                        </p>
                                                        <p className="text-[var(--text-muted)] text-[11px]">
                                                            {s.reporter.phone || s.reporter.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Adjudication Box */}
                                            {s.status === "PENDING" && (
                                                <div className="pt-3 border-t border-[var(--border-color)] flex flex-col md:flex-row items-stretch md:items-center gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Admin adjudication note (optional)..."
                                                        value={strikeNotes[s.id] || ""}
                                                        onChange={(e) => setStrikeNotes({ ...strikeNotes, [s.id]: e.target.value })}
                                                        className="flex-1 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-600"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            onClick={() => handleReviewStrike(s.id, "DISMISS")}
                                                            disabled={isUpholding || isDismissing}
                                                            variant="outline"
                                                            className="text-xs h-9 font-bold border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                                                        >
                                                            {isDismissing ? "Dismissing..." : "Dismiss"}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleReviewStrike(s.id, "UPHOLD")}
                                                            disabled={isUpholding || isDismissing}
                                                            className="text-xs h-9 font-bold bg-red-600 hover:bg-red-700 text-white"
                                                        >
                                                            {isUpholding ? "Applying Strike..." : "Uphold (+1 Strike)"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {s.status !== "PENDING" && s.adminNote && (
                                                <div className="pt-2 border-t border-[var(--border-color)] text-[11px] text-[var(--text-muted)]">
                                                    <strong>Admin Note:</strong> {s.adminNote}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
