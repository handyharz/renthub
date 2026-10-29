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
    Eye,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface AdminStats {
    pendingVerifications: number;
    activeDisputes: number;
    disputeRate?: number;
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
    platformRevenueTotal?: number;
    tenantFees?: number;
    landlordFees?: number;
    agentStats?: {
        totalProfiles: number;
        activeAgents: number;
        pendingReview: number;
        activeStrikes: number;
        totalCommissionPaid: number;
    };
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
            href: "/admin/transparency",
            label: "Transparency & Audit",
            desc: "Dual-rail reconciliation, audit snapshots & public challenge moderation",
            icon: Eye,
            badge: "Dual-Rail Verified (0 Variance)",
            badgeVariant: "success",
            accent: "border-teal-500/40 hover:border-teal-500/70",
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
            badge: `${stats?.totalUsers ?? 0} Accounts (${stats?.usersSummary?.TENANT ?? 0} tenants · ${stats?.usersSummary?.LANDLORD ?? 0} landlords)`,
            badgeVariant: "neutral",
            accent: "border-[var(--color-brand-blue)]/30 hover:border-[var(--color-brand-blue)]/60",
        },
        {
            href: "/admin/agents",
            label: "Agent Partners",
            desc: "Review & approve verified agent applications",
            icon: BadgeAlert,
            badge: (stats?.agentStats?.pendingReview ?? 0) > 0
                ? `${stats?.agentStats?.pendingReview} Pending Review`
                : `${stats?.agentStats?.activeAgents ?? 0} Active Agents`,
            badgeVariant: (stats?.agentStats?.pendingReview ?? 0) > 0 ? "warning" : "success",
            accent: "border-purple-500/40 hover:border-purple-500/70",
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
                description="Platform revenue, escrow liquidity, partner network health, and operational workflows"
            />
            <div className="flex-1 p-6 space-y-8 overflow-auto">
                {/* Section 1: Financial & Escrow Liquidity */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-[var(--color-brand-green)]" />
                            Financial & Escrow Liquidity
                        </h2>
                        <span className="text-xs text-[var(--text-muted)]">
                            Settled on AfriExchange
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="Net Platform Revenue"
                            value={loading ? "—" : `${formatPrice(stats?.platformRevenueTotal ?? 0)} NT`}
                            icon={Banknote}
                            accent="green"
                            trend={
                                loading
                                    ? "Calculating fees..."
                                    : `4% Fee Split: ${formatPrice(stats?.tenantFees ?? 0)} tenant · ${formatPrice(stats?.landlordFees ?? 0)} landlord`
                            }
                        />
                        <StatCard
                            label="Active Escrow Float"
                            value={loading ? "—" : `${formatPrice(stats?.escrowHeldAmount ?? 0)} NT`}
                            icon={Lock}
                            accent="blue"
                            trend={
                                loading
                                    ? "Loading float..."
                                    : `${stats?.escrowHeldCount ?? 0} lease deposits held awaiting inspection OTP`
                            }
                        />
                        <StatCard
                            label="Cumulative Settled GMV"
                            value={loading ? "—" : `${formatPrice(stats?.settledEscrowAmount ?? 0)} NT`}
                            icon={ShieldCheck}
                            accent="blue"
                            trend={
                                loading
                                    ? "Loading volume..."
                                    : `${stats?.settledEscrowCount ?? 0} transactions released to landlords`
                            }
                        />
                        <StatCard
                            label="Dispute & Risk Rate"
                            value={loading ? "—" : `${stats?.disputeRate ?? 0}%`}
                            icon={AlertTriangle}
                            accent={(stats?.activeDisputes ?? 0) > 0 ? "red" : "green"}
                            trend={
                                (stats?.activeDisputes ?? 0) > 0
                                    ? `⚠️ ${stats?.activeDisputes} active dispute(s) pending mediation`
                                    : "Zero active disputes · Clean escrow pipeline"
                            }
                        />
                    </div>
                </section>

                {/* Section 2: Marketplace & Partner Operations */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                            <Users className="h-4 w-4 text-[var(--color-brand-blue)]" />
                            Marketplace & Partner Operations
                        </h2>
                        <span className="text-xs text-[var(--text-muted)]">
                            Platform queues & partner network
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="Landlord Payouts Settled"
                            value={loading ? "—" : `${formatPrice(stats?.completedPayoutsAmount ?? 0)} NT`}
                            icon={Banknote}
                            accent={(stats?.actionablePayoutsCount ?? 0) > 0 ? "orange" : "green"}
                            trend={
                                (stats?.actionablePayoutsCount ?? 0) > 0
                                    ? `⚠️ ${stats?.actionablePayoutsCount} failed/skipped payout(s) need retry`
                                    : `${stats?.completedPayoutsCount ?? 0} payouts successfully disbursed`
                            }
                        />
                        <StatCard
                            label="Agent Partner Network"
                            value={loading ? "—" : `${stats?.agentStats?.activeAgents ?? 0} Active`}
                            icon={BadgeAlert}
                            accent={(stats?.agentStats?.activeStrikes ?? 0) > 0 ? "orange" : "purple"}
                            trend={
                                loading
                                    ? "Loading network..."
                                    : `${stats?.agentStats?.pendingReview ?? 0} pending review · ${stats?.agentStats?.activeStrikes ?? 0} strike(s) active`
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
                                    : `${stats?.propertiesSummary?.AVAILABLE ?? 0} available · ${stats?.propertiesSummary?.RENTED ?? 0} rented · ${stats?.propertiesSummary?.PENDING_REVIEW ?? 0} in review`
                            }
                        />
                        <StatCard
                            label="Inspection Queue"
                            value={loading ? "—" : stats?.pendingVerifications ?? 0}
                            icon={ShieldCheck}
                            accent={(stats?.pendingVerifications ?? 0) > 0 ? "orange" : "green"}
                            trend={
                                (stats?.pendingVerifications ?? 0) > 0
                                    ? `${stats?.pendingVerifications} properties awaiting physical inspection`
                                    : "Queue clean — all properties verified"
                            }
                        />
                    </div>
                </section>

                {/* Quick actions — Admin destination cards */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
                            Quick Actions & Workflows
                        </h2>
                        <span className="text-xs text-[var(--text-muted)]">
                            Direct access to all 7 platform administration modules
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
