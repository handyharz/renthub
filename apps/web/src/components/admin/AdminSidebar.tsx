"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Banknote,
    Lock,
    Building2,
    ShieldCheck,
    AlertTriangle,
    Users,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeProvider";
import { useState } from "react";

const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/payouts", label: "Landlord Payouts", icon: Banknote },
    { href: "/admin/escrow", label: "Escrow & Payments", icon: Lock },
    { href: "/admin/properties", label: "Properties", icon: Building2 },
    { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
    { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
    { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    return (
        <aside
            className={cn(
                "flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all duration-200 shrink-0",
                collapsed ? "w-[68px]" : "w-[240px]"
            )}
        >
            {/* Brand */}
            <div className="flex h-14 items-center gap-3 border-b border-[var(--border-color)] px-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-blue)] text-white font-bold text-sm">
                    R
                </div>
                {!collapsed && (
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--text-primary)] truncate">RentHub</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            Admin
                        </p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map(({ href, label, icon: Icon, exact }) => {
                    const active = isActive(href, exact);
                    return (
                        <Link
                            key={href}
                            href={href}
                            title={collapsed ? label : undefined}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                                active
                                    ? "bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] border border-[var(--color-brand-green)]/25"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span>{label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer actions */}
            <div className="border-t border-[var(--border-color)] p-3 space-y-1">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-all"
                    title={collapsed ? "Back to app" : undefined}
                >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Back to app</span>}
                </Link>
                <div className="flex items-center justify-between px-3 py-2">
                    {!collapsed && <ThemeToggle />}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </aside>
    );
}
