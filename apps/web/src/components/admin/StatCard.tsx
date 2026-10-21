import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    trend?: string;
    accent?: "green" | "orange" | "blue" | "red" | "purple";
}

const accentMap = {
    green: "text-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 border-[var(--color-brand-green)]/20",
    orange: "text-[var(--color-brand-orange)] bg-[var(--color-brand-orange)]/10 border-[var(--color-brand-orange)]/20",
    blue: "text-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/10 border-[var(--color-brand-blue)]/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export function StatCard({ label, value, icon: Icon, trend, accent = "green" }: StatCardProps) {
    return (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                        {value}
                    </p>
                    {trend && (
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{trend}</p>
                    )}
                </div>
                <div className={cn("rounded-lg border p-2.5", accentMap[accent])}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}
