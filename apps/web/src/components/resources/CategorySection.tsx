import { ReactNode } from "react";

interface CategorySectionProps {
    title: string;
    description: string;
    children: ReactNode;
    id?: string;
}

export function CategorySection({ title, description, children, id }: CategorySectionProps) {
    return (
        <section id={id} className="py-10 border-b border-[var(--border-color)] last:border-0 scroll-mt-24">
            <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
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
