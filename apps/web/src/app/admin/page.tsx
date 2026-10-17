"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ShieldCheck,
    AlertTriangle,
    Users,
    Building2,
    Lock,
    ArrowRight,
    Banknote,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import api from "@/lib/api";

interface AdminStats {
    pendingVerifications: number;
    activeDisputes: number;
    totalUsers: number;
    totalProperties: number;
    escrowHeld: number;
}

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/admin/stats")
            .then((res) => setStats(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const quickLinks = [
        {
            href: "/admin/payouts",
            label: "Landlord Payouts",
            desc: "Disburse released escrow via AfriExchange",
            icon: Banknote,
            accent: "border-[var(--color-brand-green)]/30 hover:border-[var(--color-brand-green)]/60",
        },
        {
            href: "/admin/verifications",
            label: "Verification Queue",
            desc: "Review paid property inspections",
            icon: ShieldCheck,
            count: stats?.pendingVerifications,
            accent: "border-[var(--color-brand-green)]/30 hover:border-[var(--color-brand-green)]/60",
        },
        {
            href: "/admin/disputes",
            label: "Escrow Disputes",
            desc: "Resolve locked escrow funds",
            icon: AlertTriangle,
            count: stats?.activeDisputes,
            accent: "border-[var(--color-brand-orange)]/30 hover:border-[var(--color-brand-orange)]/60",
        },
        {
            href: "/admin/users",
            label: "User Management",
            desc: "Verify users and manage roles",
            icon: Users,
            count: stats?.totalUsers,
            accent: "border-[var(--color-brand-blue)]/30 hover:border-[var(--color-brand-blue)]/60",
        },
    ];

    return (
        <>
            <AdminHeader
                title="Overview"
                description="Platform health at a glance"
            />
            <div className="flex-1 p-6 space-y-8 overflow-auto">
                {/* Stat cards — Stripe-style KPI row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                        label="Pending Verifications"
                        value={loading ? "—" : stats?.pendingVerifications ?? 0}
                        icon={ShieldCheck}
                        accent="green"
                        trend="Awaiting field inspection"
                    />
                    <StatCard
                        label="Active Disputes"
                        value={loading ? "—" : stats?.activeDisputes ?? 0}
                        icon={AlertTriangle}
                        accent="orange"
                        trend="Escrow locked"
                    />
                    <StatCard
                        label="Escrow Held"
                        value={loading ? "—" : stats?.escrowHeld ?? 0}
                        icon={Lock}
                        accent="blue"
                        trend="Funded transactions"
                    />
                    <StatCard
                        label="Total Properties"
                        value={loading ? "—" : stats?.totalProperties ?? 0}
                        icon={Building2}
                        accent="blue"
                        trend={`${stats?.totalUsers ?? 0} registered users`}
                    />
                </div>

                {/* Quick actions — Linear-style link cards */}
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)] mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickLinks.map(({ href, label, desc, icon: Icon, count, accent }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`group flex items-center justify-between rounded-xl border bg-[var(--bg-card)] p-5 transition-all hover:shadow-[var(--shadow-md)] ${accent}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="rounded-lg bg-[var(--bg-muted)] p-2.5">
                                        <Icon className="h-5 w-5 text-[var(--text-primary)]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--text-primary)]">{label}</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
                                        {count !== undefined && (
                                            <p className="text-lg font-bold text-[var(--text-primary)] mt-2 tabular-nums">
                                                {count}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--color-brand-green)] transition-colors shrink-0" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
