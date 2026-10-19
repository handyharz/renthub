import React from "react";
import { Loader2 } from "lucide-react";

interface RevenueCardProps {
    title: string;
    description: string;
    price: string;
    icon?: React.ReactNode;
    buttonText: string;
    onClick: () => void;
    isPopular?: boolean;
    disabled?: boolean;
    loading?: boolean;
}

export const RevenueCard: React.FC<RevenueCardProps> = ({
    title,
    description,
    price,
    icon,
    buttonText,
    onClick,
    isPopular = false,
    disabled = false,
    loading = false,
}) => {
    return (
        <div
            className={`relative p-6 sm:p-7 rounded-2xl border transition-all flex flex-col h-full shadow-xs hover:shadow-md ${
                isPopular
                    ? "border-[var(--color-brand-orange)]/40 bg-gradient-to-b from-[var(--color-brand-orange)]/5 via-[var(--bg-card)] to-[var(--bg-card)] ring-1 ring-[var(--color-brand-orange)]/20"
                    : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-focus)]/50"
            }`}
        >
            {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black tracking-wider px-3.5 py-1 rounded-full uppercase shadow-sm">
                    Most Popular
                </span>
            )}

            <div className="flex items-center gap-3 mb-4">
                {icon && (
                    <div
                        className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                            isPopular
                                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                                : "bg-emerald-500/10 text-[var(--color-brand-green)] border-emerald-500/20"
                        }`}
                    >
                        {icon}
                    </div>
                )}
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 flex-grow leading-relaxed font-medium">
                {description}
            </p>

            <div className="mb-6 pt-4 border-t border-[var(--border-color)] flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tabular-nums">
                    {price}
                </span>
                {price !== "Free" && (
                    <span className="text-xs font-semibold text-[var(--text-muted)]">/ listing</span>
                )}
            </div>

            <button
                onClick={onClick}
                disabled={disabled || loading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] ${
                    isPopular
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm hover:shadow-md"
                        : "bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white shadow-sm hover:shadow-md"
                } ${disabled ? "opacity-50 cursor-not-allowed hover:shadow-none" : ""}`}
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                {buttonText}
            </button>
        </div>
    );
};
