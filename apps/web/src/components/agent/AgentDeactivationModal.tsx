"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Loader2,
    Clock,
    X,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface DeactivationEligibility {
    canDeactivate: boolean;
    blockers: string[];
    details: {
        activeDelegationsCount: number;
        withheldTransactionsCount: number;
        pendingStrikesCount: number;
    };
    retentionPolicy: {
        retentionYears: number;
        notice: string;
    };
}

interface AgentDeactivationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    clerkId: string;
}

export function AgentDeactivationModal({
    isOpen,
    onClose,
    onSuccess,
    clerkId,
}: AgentDeactivationModalProps) {
    const [loading, setLoading] = useState(true);
    const [eligibility, setEligibility] = useState<DeactivationEligibility | null>(null);
    const [confirmText, setConfirmText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && clerkId) {
            fetchEligibility();
        } else {
            setConfirmText("");
        }
    }, [isOpen, clerkId]);

    const fetchEligibility = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/agents/me/deactivation-check?clerkId=${clerkId}`);
            if (res.data?.success) {
                setEligibility(res.data.data);
            }
        } catch (err: any) {
            console.error("Failed to check deactivation eligibility:", err);
            toast.error("Could not verify account activity. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async () => {
        if (confirmText.trim().toUpperCase() !== "DELETE") {
            toast.error('Please type "DELETE" to confirm.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post(`/agents/me/deactivate?clerkId=${clerkId}`, {
                confirmation: "DELETE",
            });
            if (res.data?.success) {
                toast.success("Agent role relinquished! Switched back to Tenant account.");
                onSuccess();
                onClose();
                setTimeout(() => {
                    window.location.href = "/dashboard/profile";
                }, 1000);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to deactivate agent account.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const canSubmit =
        !loading &&
        eligibility?.canDeactivate &&
        confirmText.trim() === "DELETE" &&
        !submitting;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget && !submitting) onClose();
            }}
        >
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-[var(--text-primary)]">
                                Relinquish Agent Role?
                            </h2>
                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                Close your agent profile and switch back to a Tenant account
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        <p className="text-xs text-[var(--text-secondary)] font-medium">
                            Verifying active listings, escrow transactions & dispute status...
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Pre-flight Activity Checks */}
                        <div className="space-y-2.5">
                            <p className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                                Pre-Deactivation Checklist
                            </p>

                            <div className="space-y-2">
                                {/* Check 1: Delegations */}
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-muted)]/60 border border-[var(--border-color)] text-xs">
                                    <div className="flex items-center gap-2.5">
                                        {eligibility?.details.activeDelegationsCount === 0 ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                        )}
                                        <span className="font-medium text-[var(--text-primary)]">
                                            Active Property Delegations
                                        </span>
                                    </div>
                                    <span
                                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                            eligibility?.details.activeDelegationsCount === 0
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                        }`}
                                    >
                                        {eligibility?.details.activeDelegationsCount === 0
                                            ? "0 Active"
                                            : `${eligibility?.details.activeDelegationsCount} Active`}
                                    </span>
                                </div>

                                {/* Check 2: Escrow / Withheld Funds */}
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-muted)]/60 border border-[var(--border-color)] text-xs">
                                    <div className="flex items-center gap-2.5">
                                        {eligibility?.details.withheldTransactionsCount === 0 ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                        )}
                                        <span className="font-medium text-[var(--text-primary)]">
                                            Withheld / In-Flight Escrow Funds
                                        </span>
                                    </div>
                                    <span
                                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                            eligibility?.details.withheldTransactionsCount === 0
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                        }`}
                                    >
                                        {eligibility?.details.withheldTransactionsCount === 0
                                            ? "₦0 Withheld"
                                            : `${eligibility?.details.withheldTransactionsCount} Pending`}
                                    </span>
                                </div>

                                {/* Check 3: Disputes / Strikes */}
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-muted)]/60 border border-[var(--border-color)] text-xs">
                                    <div className="flex items-center gap-2.5">
                                        {eligibility?.details.pendingStrikesCount === 0 ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                        )}
                                        <span className="font-medium text-[var(--text-primary)]">
                                            Unresolved Complaints & Disputes
                                        </span>
                                    </div>
                                    <span
                                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                            eligibility?.details.pendingStrikesCount === 0
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                        }`}
                                    >
                                        {eligibility?.details.pendingStrikesCount === 0
                                            ? "0 Open"
                                            : `${eligibility?.details.pendingStrikesCount} Open`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Blockers Alert if not eligible */}
                        {!eligibility?.canDeactivate && (
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/60 space-y-2">
                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <span>Account Deactivation Locked</span>
                                </div>
                                <ul className="list-disc list-inside space-y-1 text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                                    {eligibility?.blockers.map((blocker, i) => (
                                        <li key={i}>{blocker}</li>
                                    ))}
                                </ul>
                                <p className="text-[11px] text-amber-800/70 dark:text-amber-300/70 pt-1">
                                    Please resolve or relinquish these active items before your agent profile can be closed.
                                </p>
                            </div>
                        )}

                        {/* 2-Year Retention Policy Notice */}
                        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/60 flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <p className="font-bold text-[var(--text-primary)]">
                                    2-Year Statutory Data Retention
                                </p>
                                <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                                    In compliance with NDPR and financial escrow audit rules, your past completed transactions, KYC documents, and delegation records are retained securely for <strong>2 years</strong> before permanent deletion. Your role will immediately switch to <strong>Tenant</strong>.
                                </p>
                            </div>
                        </div>

                        {/* Confirmation Input Guard */}
                        {eligibility?.canDeactivate && (
                            <div className="space-y-2 pt-1">
                                <label className="block text-xs font-bold text-[var(--text-secondary)]">
                                    To confirm deactivation, type <span className="text-red-600 dark:text-red-400 font-mono font-black">DELETE</span> below:
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder='Type "DELETE"'
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500 uppercase"
                                />
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-11 font-bold border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                                onClick={onClose}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 h-11 font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                disabled={!canSubmit}
                                onClick={handleDeactivate}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deactivating...
                                    </>
                                ) : (
                                    <>Revert to Tenant Account</>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
