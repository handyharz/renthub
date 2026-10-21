"use client";

import { useState } from "react";
import { Briefcase, ShieldCheck, Key, Star, Flag } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ReportAgentModal } from "./ReportAgentModal";

interface AgentTrustBadgeProps {
    agent: {
        id?: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        verified?: boolean;
    };
    agentProfile: {
        businessName?: string;
        licenseNumber?: string;
        avgRating?: number;
        totalClosed?: number;
    };
    propertyId?: string;
    propertyTitle?: string;
    compact?: boolean; // true = card view, false = detail page view
}

export function AgentTrustBadge({
    agent,
    agentProfile,
    propertyId,
    propertyTitle,
    compact = false,
}: AgentTrustBadgeProps) {
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const agencyName = agentProfile.businessName || `${agent.firstName} ${agent.lastName}`;
    const rating = agentProfile.avgRating;
    const closed = agentProfile.totalClosed ?? 0;

    if (compact) {
        // ─── CARD VIEW: one-line strip ────────────────────────────────────────
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                {agent.avatar ? (
                    <Image
                        src={agent.avatar}
                        alt={agencyName}
                        width={16}
                        height={16}
                        className="rounded-full object-cover shrink-0"
                    />
                ) : (
                    <Briefcase className="h-3 w-3 text-purple-600 dark:text-purple-400 shrink-0" />
                )}
                <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 truncate">
                    {agencyName}
                </span>
                <ShieldCheck className="h-3 w-3 text-purple-600 dark:text-purple-400 shrink-0" />
            </div>
        );
    }

    // ─── DETAIL PAGE VIEW: full badge block ───────────────────────────────────
    return (
        <>
            <div className="rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0 overflow-hidden">
                        {agent.avatar ? (
                            <Image
                                src={agent.avatar}
                                alt={agencyName}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                            Managed by Verified Partner Agent
                        </p>
                        <p className="text-sm font-extrabold text-[var(--text-primary)] truncate">
                            {agencyName}
                        </p>
                        {rating != null && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-bold text-[var(--text-secondary)]">
                                    {rating.toFixed(1)} · {closed} deals closed
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Trust chips */}
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                        <ShieldCheck className="h-3 w-3" />
                        Verified Partner
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <Key className="h-3 w-3" />
                        Keys on Hand
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        <ShieldCheck className="h-3 w-3" />
                        Escrow Protected
                    </span>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-purple-200/60 dark:border-purple-800/60 pt-2">
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">
                        <strong className="text-[var(--text-primary)]">Tenants pay 0% agent fee</strong>. Zero cash tolerance — agents cannot charge inspection or form fees.
                    </p>
                    {agent.id && (
                        <button
                            type="button"
                            onClick={() => setReportModalOpen(true)}
                            className="inline-flex items-center gap-1 text-[11px] font-black text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline shrink-0 cursor-pointer transition-colors"
                        >
                            <Flag className="h-3 w-3" />
                            Report Cash Request
                        </button>
                    )}
                </div>
            </div>

            {agent.id && (
                <ReportAgentModal
                    isOpen={reportModalOpen}
                    onClose={() => setReportModalOpen(false)}
                    agentId={agent.id}
                    agentName={agencyName}
                    propertyId={propertyId}
                    propertyTitle={propertyTitle}
                />
            )}
        </>
    );
}

