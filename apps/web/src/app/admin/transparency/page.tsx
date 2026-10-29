"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ShieldCheck,
    RefreshCcw,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Eye,
    FileSearch,
    ChevronDown,
    Loader2,
    X,
    ExternalLink,
    MessageSquare,
    TrendingUp,
    Database,
    Layers,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AuditSnapshot {
    id: string;
    timestamp: string;
    dbExpectedKobo: string;
    anchorPoolKobo: string;
    afriExchangePoolKobo: string;
    varianceKobo: string;
    status: string;
    railsAudited: string;
}

interface PublicChallenge {
    id: string;
    targetRef: string;
    reason: string;
    evidenceUrl: string;
    status: "PENDING" | "INVESTIGATING" | "UPHELD" | "DISMISSED";
    adminNote?: string | null;
    createdAt: string;
    updatedAt: string;
}

type Tab = "audit" | "challenges";

// ─── Helpers ────────────────────────────────────────────────────────────────

function koboToNaira(koboStr: string): string {
    const n = Number(koboStr) / 100;
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (h === 0) return `${m}m ago`;
    if (h < 24) return `${h}h ${m}m ago`;
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

// ─── Status badges ─────────────────────────────────────────────────────────

function AuditStatusPill({ variance }: { variance: string }) {
    const isZero = variance === "0";
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                isZero
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/25"
            }`}
        >
            {isZero ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {isZero ? "VARIANCE 0 ✓" : `ΔVAR ${koboToNaira(variance)}`}
        </span>
    );
}

function ChallengeBadge({ status }: { status: PublicChallenge["status"] }) {
    const map = {
        PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        INVESTIGATING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        UPHELD: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        DISMISSED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };
    const icons = {
        PENDING: <Clock className="h-3 w-3" />,
        INVESTIGATING: <Eye className="h-3 w-3" />,
        UPHELD: <AlertTriangle className="h-3 w-3" />,
        DISMISSED: <CheckCircle2 className="h-3 w-3" />,
    };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${map[status]}`}>
            {icons[status]}
            {status.replace("_", " ")}
        </span>
    );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function AdminTransparencyPage() {
    const [activeTab, setActiveTab] = useState<Tab>("audit");

    // Audit tab state
    const [snapshots, setSnapshots] = useState<AuditSnapshot[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);

    // Challenges tab state
    const [challenges, setChallenges] = useState<PublicChallenge[]>([]);
    const [challengeCounts, setChallengeCounts] = useState<Record<string, number>>({
        PENDING: 0,
        UNDER_REVIEW: 0,
        UPHELD: 0,
        DISMISSED: 0,
    });
    const [challengeFilter, setChallengeFilter] = useState("ALL");
    const [challengeLoading, setChallengeLoading] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<PublicChallenge | null>(null);
    const [moderateStatus, setModerateStatus] = useState<"INVESTIGATING" | "UPHELD" | "DISMISSED">("INVESTIGATING");
    const [investigatorNotes, setInvestigatorNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchAudit = useCallback(async () => {
        setAuditLoading(true);
        try {
            const res = await api.get("/admin/transparency/audit");
            if (res.data?.success) setSnapshots(res.data.data.snapshots || []);
        } catch {
            toast.error("Failed to load audit snapshots");
        } finally {
            setAuditLoading(false);
        }
    }, []);

    const fetchChallenges = useCallback(async () => {
        setChallengeLoading(true);
        try {
            const params: Record<string, string> = {};
            if (challengeFilter !== "ALL") params.status = challengeFilter;
            const res = await api.get("/admin/transparency/challenges", { params });
            if (res.data?.success) {
                setChallenges(res.data.data.challenges || []);
                setChallengeCounts(res.data.data.counts || {});
            }
        } catch {
            toast.error("Failed to load challenges");
        } finally {
            setChallengeLoading(false);
        }
    }, [challengeFilter]);

    useEffect(() => { fetchAudit(); }, [fetchAudit]);
    useEffect(() => {
        if (activeTab === "challenges") fetchChallenges();
    }, [activeTab, fetchChallenges]);

    const handleModerate = async () => {
        if (!selectedChallenge) return;
        setSubmitting(true);
        try {
            await api.patch(`/admin/transparency/challenges/${selectedChallenge.id}`, {
                status: moderateStatus,
                adminNote: investigatorNotes.trim() || undefined,
            });
            toast.success(`Challenge ${moderateStatus.toLowerCase().replace("_", " ")}`);
            setSelectedChallenge(null);
            setInvestigatorNotes("");
            fetchChallenges();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to update challenge");
        } finally {
            setSubmitting(false);
        }
    };

    const openChallenge = (c: PublicChallenge) => {
        setSelectedChallenge(c);
        setModerateStatus("INVESTIGATING");
        setInvestigatorNotes(c.adminNote || "");
    };

    const latestSnapshot = snapshots[0];
    const cleanCount = snapshots.filter((s) => s.varianceKobo === "0").length;

    return (
        <>
            <AdminHeader
                title="Transparency & Audit"
                description="6-hour multi-rail cron audit log and public challenge moderation console"
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={activeTab === "audit" ? fetchAudit : fetchChallenges}
                        disabled={auditLoading || challengeLoading}
                        className="gap-2 h-9 border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]"
                    >
                        <RefreshCcw className={`h-3.5 w-3.5 ${auditLoading || challengeLoading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                }
            />

            <div className="flex-1 p-6 space-y-6 overflow-auto">
                {/* KPI row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Latest Variance"
                        value={latestSnapshot ? (latestSnapshot.varianceKobo === "0" ? "₦0" : koboToNaira(latestSnapshot.varianceKobo)) : "—"}
                        icon={TrendingUp}
                        accent={latestSnapshot?.varianceKobo === "0" ? "green" : "red"}
                        trend={latestSnapshot ? relativeTime(latestSnapshot.timestamp) : "No data yet"}
                    />
                    <StatCard
                        label="Clean Snapshots"
                        value={`${cleanCount} / ${snapshots.length}`}
                        icon={Database}
                        accent="blue"
                        trend="Variance = 0 audits"
                    />
                    <StatCard
                        label="Pending Challenges"
                        value={challengeCounts.PENDING ?? 0}
                        icon={Clock}
                        accent={challengeCounts.PENDING > 0 ? "orange" : "green"}
                        trend="Awaiting investigator review"
                    />
                    <StatCard
                        label="Upheld / Dismissed"
                        value={`${challengeCounts.UPHELD ?? 0} / ${challengeCounts.DISMISSED ?? 0}`}
                        icon={ShieldCheck}
                        accent="green"
                        trend="Closed challenge decisions"
                    />
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-1.5 w-fit">
                    {(["audit", "challenges"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                                activeTab === tab
                                    ? "bg-[var(--color-brand-blue)] text-white shadow-sm"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                            }`}
                        >
                            {tab === "audit" ? <Layers className="h-3.5 w-3.5" /> : <FileSearch className="h-3.5 w-3.5" />}
                            {tab === "audit"
                                ? "Audit Snapshots"
                                : `Challenge Moderation${challengeCounts.PENDING > 0 ? ` (${challengeCounts.PENDING})` : ""}`}
                        </button>
                    ))}
                </div>

                {/* AUDIT TAB */}
                {activeTab === "audit" && (
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] overflow-hidden">
                        <div className="border-b border-[var(--border-color)] px-6 py-4">
                            <h2 className="text-sm font-bold text-[var(--text-primary)]">6-Hour Cron Audit History</h2>
                            <p className="text-xs text-[var(--text-muted)]">
                                Dual-rail reconciliation — Anchor BaaS Providus + AfriExchange Vault • Last {snapshots.length} runs
                            </p>
                        </div>

                        {auditLoading ? (
                            <div className="flex flex-col items-center justify-center p-16 text-[var(--text-muted)]">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-blue)] mb-2" />
                                <span className="text-sm font-medium">Loading audit snapshots...</span>
                            </div>
                        ) : snapshots.length === 0 ? (
                            <div className="p-16 text-center">
                                <Database className="h-10 w-10 mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
                                <p className="text-sm font-medium text-[var(--text-primary)]">No audit snapshots yet</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">The 6-hour cron will persist the first snapshot automatically.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[var(--border-color)] text-left">
                                    <thead className="bg-[var(--bg-primary)]">
                                        <tr>
                                            {["Timestamp", "DB Expected", "Anchor Pool", "AfriX Pool", "Variance", "Status"].map((h) => (
                                                <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                                        {snapshots.map((snap) => (
                                            <tr key={snap.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                                                        {new Date(snap.timestamp).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--text-muted)]">{relativeTime(snap.timestamp)}</p>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-[var(--text-primary)]">{koboToNaira(snap.dbExpectedKobo)}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-blue-400">{koboToNaira(snap.anchorPoolKobo)}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-purple-400">{koboToNaira(snap.afriExchangePoolKobo)}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs">
                                                    <span className={snap.varianceKobo === "0" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                                        {snap.varianceKobo === "0" ? "₦0" : koboToNaira(snap.varianceKobo)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap"><AuditStatusPill variance={snap.varianceKobo} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* CHALLENGES TAB */}
                {activeTab === "challenges" && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)]">
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mr-2">Filter:</span>
                                {(["ALL", "PENDING", "INVESTIGATING", "UPHELD", "DISMISSED"] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setChallengeFilter(f)}
                                        className={`rounded-full px-3 py-1 text-xs font-bold border transition-all ${
                                            challengeFilter === f
                                                ? "bg-[var(--color-brand-blue)] text-white border-[var(--color-brand-blue)]"
                                                : "bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-muted)]"
                                        }`}
                                    >
                                        {f.replace("_", " ")}
                                        {f !== "ALL" && challengeCounts[f] != null && <span className="ml-1.5 opacity-70">({challengeCounts[f]})</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] overflow-hidden">
                            <div className="border-b border-[var(--border-color)] px-6 py-4">
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">Public Challenges</h2>
                                <p className="text-xs text-[var(--text-muted)]">Submitted by public users questioning transparency proof integrity</p>
                            </div>

                            {challengeLoading ? (
                                <div className="flex flex-col items-center justify-center p-16 text-[var(--text-muted)]">
                                    <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-blue)] mb-2" />
                                    <span className="text-sm font-medium">Loading challenges...</span>
                                </div>
                            ) : challenges.length === 0 ? (
                                <div className="p-16 text-center">
                                    <FileSearch className="h-10 w-10 mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
                                    <p className="text-sm font-medium text-[var(--text-primary)]">No challenges found</p>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">Public challenge submissions will appear here for moderation.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[var(--border-color)] text-left">
                                        <thead className="bg-[var(--bg-primary)]">
                                            <tr>
                                                {["Submitted By", "Description", "Evidence", "Status", "Filed", ""].map((h, i) => (
                                                    <th key={i} className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] ${i === 5 ? "text-right" : ""}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                                            {challenges.map((c) => (
                                                <tr key={c.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors cursor-pointer" onClick={() => openChallenge(c)}>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <p className="text-xs font-semibold text-[var(--text-primary)] font-mono">{c.targetRef}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-xs text-[var(--text-secondary)] max-w-[260px] line-clamp-2">{c.reason}</p>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <a href={c.evidenceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-blue)] hover:underline">
                                                            <ExternalLink className="h-3 w-3" /> View
                                                        </a>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap"><ChallengeBadge status={c.status} /></td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-xs text-[var(--text-muted)]">{relativeTime(c.createdAt)}</td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-right">
                                                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openChallenge(c); }}
                                                            className="h-8 text-xs border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]">
                                                            Moderate
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
                )}
            </div>

            {/* Challenge Moderation Slide-Over */}
            {selectedChallenge && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-lg bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">Moderate Challenge</h3>
                                <p className="text-xs font-mono text-[var(--text-muted)]">{selectedChallenge.id}</p>
                            </div>
                            <button onClick={() => setSelectedChallenge(null)}
                                className="h-8 w-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-muted)]">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                            <span className="text-xs font-semibold text-[var(--text-secondary)]">Current Status</span>
                            <ChallengeBadge status={selectedChallenge.status} />
                        </div>

                        <div className="rounded-lg border border-[var(--border-color)] p-4 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Submission Details</h4>
                            <div>
                                <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Target Reference</p>
                                <p className="text-sm font-mono font-semibold text-[var(--text-primary)] mt-0.5">{selectedChallenge.targetRef}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">Reason</p>
                                <p className="text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">{selectedChallenge.reason}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase text-[var(--text-muted)] mb-1">Evidence URL</p>
                                <a href={selectedChallenge.evidenceUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-blue)] hover:underline break-all">
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                    {selectedChallenge.evidenceUrl}
                                </a>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)]">
                                Filed {relativeTime(selectedChallenge.createdAt)} • Updated {relativeTime(selectedChallenge.updatedAt)}
                            </p>
                        </div>

                        {selectedChallenge.adminNote && (
                            <div className="rounded-lg border border-[var(--border-color)] p-4 bg-[var(--bg-primary)]/50">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5 mb-2">
                                    <MessageSquare className="h-3.5 w-3.5" /> Existing Investigator Notes
                                </h4>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{selectedChallenge.adminNote}</p>
                            </div>
                        )}

                        <div className="rounded-lg border border-[var(--border-color)] p-4 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Investigator Decision</h4>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Update Status</label>
                                <div className="relative">
                                    <select value={moderateStatus} onChange={(e) => setModerateStatus(e.target.value as typeof moderateStatus)}
                                        className="w-full appearance-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none">
                                        <option value="INVESTIGATING">🔍 Investigating — assigning investigator</option>
                                        <option value="UPHELD">⚠️ Upheld — proof inconsistency confirmed</option>
                                        <option value="DISMISSED">✅ Dismissed — challenge rejected, proof valid</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                                    Investigator Notes <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                                </label>
                                <textarea value={investigatorNotes} onChange={(e) => setInvestigatorNotes(e.target.value)} rows={4}
                                    placeholder="Summarise findings, reference snapshot IDs, Anchor TX refs, AfriExchange vault refs, or KPMG report section..."
                                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:border-[var(--color-brand-blue)] focus:outline-none resize-none" />
                            </div>
                            {moderateStatus === "UPHELD" && (
                                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
                                    <p className="font-bold mb-1">⚠️ Upheld — High-severity action</p>
                                    <p>Marking as UPHELD signals a confirmed proof inconsistency. Ensure your investigator notes reference the exact snapshot ID, kobo variance, and supporting evidence before submitting.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setSelectedChallenge(null)}
                                className="flex-1 border-[var(--border-color)] text-[var(--text-secondary)]" disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleModerate} disabled={submitting}
                                className={`flex-1 font-bold gap-2 ${
                                    moderateStatus === "UPHELD" ? "bg-rose-600 hover:bg-rose-700 text-white"
                                    : moderateStatus === "DISMISSED" ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90 text-white"
                                }`}>
                                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Save Decision
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
