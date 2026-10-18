"use client";

import { LucideIcon, ArrowRight, Download, BookOpen, FileText } from "lucide-react";

interface ResourceCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    type: "GUIDE" | "TEMPLATE" | "ARTICLE" | "LEGAL";
    readTime?: string;
    badge?: string;
    onClick?: () => void;
}

export function ResourceCard({
    title,
    description,
    icon: Icon,
    type,
    readTime = "4 min read",
    badge,
    onClick,
}: ResourceCardProps) {
    const typeBadgeStyles = {
        TEMPLATE: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
        GUIDE: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
        ARTICLE: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
        LEGAL: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30",
    };

    return (
        <div
            onClick={onClick}
            className="group relative bg-[var(--bg-card)] rounded-3xl p-6 sm:p-7 border border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
        >
            <div>
                {/* Header with Type & Read Time */}
                <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            typeBadgeStyles[type] || typeBadgeStyles.ARTICLE
                        }`}
                    >
                        {badge || type}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--text-muted)]">
                        {readTime}
                    </span>
                </div>

                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-3">
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--color-brand-green)] group-hover:scale-105 group-hover:bg-[var(--color-brand-green)] group-hover:text-white transition-all shrink-0">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)] group-hover:text-[var(--color-brand-green)] transition-colors leading-snug">
                            {title}
                        </h3>
                    </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed line-clamp-3">
                    {description}
                </p>
            </div>

            {/* Footer Action */}
            <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-black text-[var(--color-brand-green)]">
                <span>{type === "TEMPLATE" ? "Download Template" : "Read Full Resource"}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </div>
        </div>
    );
}
