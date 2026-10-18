import { ReactNode } from "react";

interface CategorySectionProps {
    title: string;
    description: string;
    children: ReactNode;
    id?: string;
    badge?: string;
}

export function CategorySection({ title, description, children, id, badge }: CategorySectionProps) {
    return (
        <section id={id} className="py-12 border-b border-[var(--border-color)] last:border-0 scroll-mt-28">
            <div className="mb-8 space-y-2">
                {badge && (
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] border border-[var(--color-brand-green)]/20">
                        {badge}
                    </span>
                )}
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                    {title}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium max-w-2xl leading-relaxed">
                    {description}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children}
            </div>
        </section>
    );
}
