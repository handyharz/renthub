"use client";

import { UserButton } from "@clerk/nextjs";
import { useAuth } from "@/hooks/useAuth";

interface AdminHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function AdminHeader({ title, description, actions }: AdminHeaderProps) {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-card)]/80 backdrop-blur-md px-6">
            <div className="min-w-0">
                <h1 className="text-base font-bold text-[var(--text-primary)] truncate">{title}</h1>
                {description && (
                    <p className="text-xs text-[var(--text-muted)] truncate hidden sm:block">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
                {actions}
                <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-[10px] text-[var(--color-brand-green)] font-bold uppercase tracking-wide">
                        Admin
                    </span>
                </div>
                <UserButton afterSignOutUrl="/" />
            </div>
        </header>
    );
}
