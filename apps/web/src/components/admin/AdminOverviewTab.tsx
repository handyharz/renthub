"use client";

import {
    ShieldCheck,
    AlertCircle,
    Users,
    Home,
    Lock,
    TrendingUp,
    DollarSign,
    CheckCircle2,
    Clock,
    FileText
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface AdminStats {
    pendingVerifications: number;
    activeDisputes: number;
    totalUsers: number;
    totalProperties: number;
    escrowHeld: number;
}

interface AdminOverviewTabProps {
    stats: AdminStats;
    onNavigateTab: (tab: string) => void;
}

export function AdminOverviewTab({ stats, onNavigateTab }: AdminOverviewTabProps) {
    return (
        <div className="space-y-8">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[var(--color-brand-blue)] to-[var(--color-brand-green)] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                        RentHub Command Center
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold mt-4 mb-2 tracking-tight">
                        Platform Operations & Trust Engine
                    </h1>
                    <p className="text-blue-100 text-sm font-medium leading-relaxed">
                        Monitor live verification queues, resolve escrow dispute claims, and maintain platform integrity across Nigeria.
                    </p>
                </div>
                <ShieldCheck className="absolute -bottom-8 -right-8 h-56 w-56 text-white/10" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div
                    onClick={() => onNavigateTab("verifications")}
                    className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-[var(--shadow-sm)] hover:border-[var(--color-brand-green)]/40 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
                            <Clock className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            Action Needed
                        </span>
                    </div>
                    <div className="text-3xl font-extrabold text-[var(--text-primary)] mb-1">
                        {stats.pendingVerifications}
                    </div>
                    <div className="text-xs font-bold text-[var(--text-secondary)]">
                        Properties Pending Inspection
                    </div>
                </div>

                <div
                    onClick={() => onNavigateTab("disputes")}
                    className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-[var(--shadow-sm)] hover:border-red-500/40 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-red-500/15 text-red-500 border border-red-500/30 flex items-center justify-center font-bold shrink-0">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-extrabold text-red-500 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                            Disputes
                        </span>
                    </div>
                    <div className="text-3xl font-extrabold text-[var(--text-primary)] mb-1">
                        {stats.activeDisputes}
                    </div>
                    <div className="text-xs font-bold text-[var(--text-secondary)]">
                        Locked Escrow Disputes
                    </div>
                </div>

                <div
                    onClick={() => onNavigateTab("users")}
                    className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-[var(--shadow-sm)] hover:border-blue-500/40 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center justify-center font-bold shrink-0">
                            <Users className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-extrabold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                            Verified
                        </span>
                    </div>
                    <div className="text-3xl font-extrabold text-[var(--text-primary)] mb-1">
                        {stats.totalUsers}
                    </div>
                    <div className="text-xs font-bold text-[var(--text-secondary)]">
                        Total Registered Users
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/15 text-[var(--color-brand-green)] border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                            <Lock className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-extrabold text-[var(--color-brand-green)] bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            Secured
                        </span>
                    </div>
                    <div className="text-3xl font-extrabold text-[var(--text-primary)] mb-1">
                        {stats.escrowHeld}
                    </div>
                    <div className="text-xs font-bold text-[var(--text-secondary)]">
                        Active Escrow Vault Payments
                    </div>
                </div>
            </div>

            {/* Platform Quick Checklist */}
            <div className="bg-[var(--bg-card)] rounded-3xl p-6 sm:p-8 border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-[var(--color-brand-green)]" /> Admin Operational Protocol
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-xs sm:text-sm">
                    <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-color)] space-y-2">
                        <div className="font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                            1. Property Inspection SLA
                        </div>
                        <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                            Field agents must physically inspect listed properties within 24-48 hours of submission.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-color)] space-y-2">
                        <div className="font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                            2. Dispute Resolution
                        </div>
                        <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                            Disputes must be reviewed within 24 hours. Verify tenant keys and property condition before overriding escrow.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-color)] space-y-2">
                        <div className="font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                            3. Fraud Prevention
                        </div>
                        <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                            Zero tolerance for fake agents. Instantly flag and suspend accounts attempting showing fee extortion.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
