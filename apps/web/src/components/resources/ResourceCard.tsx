import { LucideIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ResourceCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    type: "GUIDE" | "TEMPLATE" | "ARTICLE";
    onClick?: () => void;
}

export function ResourceCard({ title, description, icon: Icon, type, onClick }: ResourceCardProps) {
    return (
        <div
            className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40 hover:shadow-md transition-all group cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-[var(--color-brand-green)] group-hover:text-white transition-colors shrink-0">
                    <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            type === "TEMPLATE"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : type === "GUIDE"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        }`}>
                            {type}
                        </span>
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-2 group-hover:text-[var(--color-brand-green)] transition-colors">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium line-clamp-2 leading-relaxed">
                        {description}
                    </p>
                    <div className="mt-4 flex items-center text-xs font-bold text-[var(--color-brand-green)] gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Read resource</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                </div>
            </div>
        </div>
    );
}
