"use client";

import { ShieldCheck, CheckCircle2, Circle, Sparkles, TrendingUp } from "lucide-react";

interface TrustScoreProps {
    user?: {
        avatar?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        phone?: string | null;
        phoneVerified?: boolean;
        idDocumentUrl?: string | null;
        verified?: boolean;
        role?: string;
    } | null;
    className?: string;
}

export function TrustScore({ user, className = "" }: TrustScoreProps) {
    const calculateScore = () => {
        if (!user) return 10;
        let score = 10; // Base score for signing up
        if (user.avatar) score += 10;
        if (user.phone) score += 15;
        if (user.phoneVerified) score += 25;
        if (user.idDocumentUrl) score += 40; // Government ID
        return Math.min(score, 100);
    };

    const score = calculateScore();

    const getTier = () => {
        if (score < 40) {
            return {
                label: "Basic Profile",
                badgeBg: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
                strokeColor: "#f43f5e",
                hint: "Complete your phone & ID verification to become trusted.",
            };
        }
        if (score < 80) {
            return {
                label: "Partially Verified",
                badgeBg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
                strokeColor: "#f59e0b",
                hint: "Upload a valid government ID to unlock the 100% Verified badge.",
            };
        }
        return {
            label: user?.role === "LANDLORD" ? "Verified Landlord" : "Trusted Tenant",
            badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            strokeColor: "#10b981",
            hint: "Your profile has maximum credibility across all rental applications.",
        };
    };

    const tier = getTier();
    const circumference = 2 * Math.PI * 34; // r=34 -> ~213.6
    const strokeDashoffset = circumference - (circumference * score) / 100;

    const checklist = [
        { label: "Account Created", completed: true, points: "+10%" },
        { label: "Profile Photo", completed: Boolean(user?.avatar), points: "+10%" },
        { label: "Phone Verified", completed: Boolean(user?.phoneVerified), points: "+40%" },
        { label: "Government ID", completed: Boolean(user?.idDocumentUrl), points: "+40%" },
    ];

    return (
        <div
            className={`bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 shadow-xs relative overflow-hidden ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-[var(--color-brand-green)]/10 text-[var(--color-brand-green)] flex items-center justify-center border border-[var(--color-brand-green)]/20">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm text-[var(--text-primary)]">RentHub Trust Score</h3>
                        <p className="text-[11px] text-[var(--text-secondary)] font-medium">Reputation & Safety Rating</p>
                    </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${tier.badgeBg}`}>
                    {tier.label}
                </span>
            </div>

            {/* Circular Gauge Card */}
            <div className="flex items-center gap-5 p-4 rounded-2xl bg-[var(--bg-muted)]/60 border border-[var(--border-color)] mb-5">
                <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-[var(--border-color)]"
                        />
                        <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke={tier.strokeColor}
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-[var(--text-primary)] tabular-nums">{score}%</span>
                    </div>
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                        <TrendingUp className="h-3.5 w-3.5 text-[var(--color-brand-green)]" />
                        <span>Profile Strength</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                        {tier.hint}
                    </p>
                </div>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-2.5 pt-1">
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Verification Milestones
                </p>
                {checklist.map((item, idx) => (
                    <div
                        key={idx}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            item.completed
                                ? "bg-emerald-500/5 border-emerald-500/15 text-[var(--text-primary)]"
                                : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {item.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                            ) : (
                                <Circle className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                            )}
                            <span className={item.completed ? "font-bold text-[var(--text-primary)]" : ""}>
                                {item.label}
                            </span>
                        </div>
                        <span
                            className={`text-[10px] font-mono font-bold ${
                                item.completed ? "text-[var(--color-brand-green)]" : "text-[var(--text-muted)]"
                            }`}
                        >
                            {item.points}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
