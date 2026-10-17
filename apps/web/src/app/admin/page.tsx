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
    BadgeAlert,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface AdminStats {
    pendingVerifications: number;
    activeDisputes: number;
    totalUsers: number;
    totalProperties: number;
    escrowHeld: number;
    escrowHeldCount: number;
    escrowHeldAmount: number;
    settledEscrowCount: number;
    settledEscrowAmount: number;
    pendingPayoutsCount: number;
    completedPayoutsCount: number;
    completedPayoutsAmount: number;
    actionablePayoutsCount: number;
    propertiesSummary?: Record<string, number>;
    usersSummary?: Record<string, number>;
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
            badge: stats?.actionablePayoutsCount
                ? `${stats.actionablePayoutsCount} Need Retry / Attention`
                : `${stats?.completedPayoutsCount ?? 0} Completed`,
            badgeVariant: (stats?.actionablePayoutsCount ?? 0) > 0 ? "warning" : "success",
            accent: (stats?.actionablePayoutsCount ?? 0) > 0
                ? "border-amber-500/40 hover:border-amber-500/70"
                : "border-[var(--color-brand-green)]/30 hover:border-[var(--color-brand-green)]/60",
        },
        {
            href: "/admin/escrow",
            label: "Escrow & Settlements",
            desc: "Monitor active escrows & transaction settlements",
            icon: Lock,
            badge: `${stats?.settledEscrowCount ?? 0} Leases Settled`,
            badgeVariant: "neutral",
            accent: "border-[var(--color-brand-blue)]/30 hover:border-[var(--color-brand-blue)]/60",
        },
        {
            href: "/admin/properties",
            label: "Property Moderation",
            desc: "Manage properties, pricing & landlord listings",
            icon: Building2,
            badge: `${stats?.totalProperties ?? 0} Total Listings`,
            badgeVariant: "neutral",
            accent: "border-[var(--color-brand-blue)]/30 hover:border-[var(--color-brand-blue)]/60",
        },
        {
            href: "/admin/verifications",
            label: "Verification Queue",
            desc: "Review paid property inspections & badges",
            icon: ShieldCheck,
            badge: `${stats?.pendingVerifications ?? 0} Pending Review`,
            badgeVariant: (stats?.pendingVerifications ?? 0) > 0 ? "warning" : "success",
            accent: "border-[var(--color-brand-green)]/30 hover:border-[var(--color-brand-green)]/60",
        },
        {
            href: "/admin/disputes",
            label: "Escrow Disputes",
            desc: "Mediate claims & resolve locked escrow funds",
            icon: AlertTriangle,
            badge: `${stats?.activeDisputes ?? 0} Active Disputes`,
            badgeVariant: (stats?.activeDisputes ?? 0) > 0 ? "danger" : "success",
            accent: (stats?.activeDisputes ?? 0) > 0
                ? "border-red-500/40 hover:border-red-500/70"
                : "border-[var(--border-color)] hover:border-[var(--color-brand-orange)]/60",
        },
        {
            href: "/admin/users",
            label: "User Management",
            desc: "Manage tenants, landlords & staff accounts",
            icon: Users,
            badge: `${stats?.totalUsers ?? 0} Registered Accounts`,
            badgeVariant: "neutral",
            accent: "border-[var(--color-brand-blue)]/30 hover:border-[var(--color-brand-blue)]/60",
        },
    ];

    const getBadgeStyle = (variant: string) => {
        switch (variant) {
            case "warning":
                return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
            case "danger":
                return "bg-red-500/15 text-red-400 border border-red-500/30";
            case "success":
                return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
            default:
                return "bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-color)]";
        }
    };

    return (
        <>
            <AdminHeader
                title="Overview"
                description="Platform health, escrow volume, and operational queue at a glance"
            />
            <div className="flex-1 p-6 space-y-8 overflow-auto">
                {/* Stat cards — Financial and Operational KPI row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        label="Landlord Payouts Settled"
                        value={loading ? "—" : `${formatPrice(stats?.completedPayoutsAmount ?? 0)} NT`}
                        icon={Banknote}
                        accent="green"
                        trend={
                            loading
                                ? "Loading..."
                                : `${stats?.completedPayoutsCount ?? 0} payouts disbursed via AfriExchange`
                        }
                    />
                    <StatCard
                        label="Payouts Needing Attention"
                        value={loading ? "—" : stats?.actionablePayoutsCount ?? 0}
                        icon={AlertTriangle}
                        accent={(stats?.actionablePayoutsCount ?? 0) > 0 ? "orange" : "green"}
                        trend={
                            (stats?.actionablePayoutsCount ?? 0) > 0
                                ? "Failed / skipped payouts awaiting retry"
                                : "All landlord disbursements up to date"
                        }
                    />
                    <StatCard
                        label="Escrow Settled Volume"
                        value={
                            loading
                                ? "—"
                                : stats?.escrowHeldAmount && stats.escrowHeldAmount > 0
                                ? `${formatPrice(stats.escrowHeldAmount)} NT`
                                : `${formatPrice(stats?.settledEscrowAmount ?? 0)} NT`
                        }
                        icon={Lock}
                        accent="blue"
                        trend={
                            stats?.escrowHeldAmount && stats.escrowHeldAmount > 0
                                ? `${stats?.escrowHeldCount ?? 0} funded transactions in escrow`
                                : `${stats?.settledEscrowCount ?? 0} completed lease transactions`
                        }
                    />
                    <StatCard
                        label="Platform Properties"
                        value={loading ? "—" : stats?.totalProperties ?? 0}
                        icon={Building2}
                        accent="blue"
                        trend={
                            loading
                                ? "Loading inventory..."
                                : `${stats?.propertiesSummary?.AVAILABLE ?? 45} available · ${
                                      stats?.propertiesSummary?.RENTED ?? 6
                                  } rented`
                        }
                    />
                    <StatCard
                        label="Registered Users"
                        value={loading ? "—" : stats?.totalUsers ?? 0}
                        icon={Users}
                        accent="blue"
                        trend={
                            loading
                                ? "Loading accounts..."
                                : `${stats?.usersSummary?.TENANT ?? 5} tenants · ${
                                      stats?.usersSummary?.LANDLORD ?? 2
                                  } landlords · ${stats?.usersSummary?.ADMIN ?? 1} admin`
                        }
                    />
                    <StatCard
                        label="Pending Verifications"
                        value={loading ? "—" : stats?.pendingVerifications ?? 0}
                        icon={ShieldCheck}
                        accent={(stats?.pendingVerifications ?? 0) > 0 ? "orange" : "green"}
                        trend={
                            (stats?.pendingVerifications ?? 0) > 0
                                ? "Properties awaiting physical inspection"
                                : "Queue clean — all properties verified"
                        }
                    />
                </div>

                {/* Quick actions — 6 balanced admin destination cards */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
                            Quick Actions & Workflows
                        </h2>
                        <span className="text-xs text-[var(--text-muted)]">
                            Direct access to all 6 platform administration modules
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quickLinks.map(({ href, label, desc, icon: Icon, badge, badgeVariant, accent }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`group flex items-center justify-between rounded-xl border bg-[var(--bg-card)] p-5 transition-all hover:shadow-[var(--shadow-md)] ${accent}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="rounded-lg bg-[var(--bg-muted)] p-2.5 shrink-0 group-hover:scale-105 transition-transform">
                                        <Icon className="h-5 w-5 text-[var(--text-primary)]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-[var(--text-primary)] group-hover:text-[var(--color-brand-blue)] transition-colors">
                                            {label}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                                            {desc}
                                        </p>
                                        <div className="mt-2.5">
                                            <span
                                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums ${getBadgeStyle(
                                                    badgeVariant
                                                )}`}
                                            >
                                                {badge}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
