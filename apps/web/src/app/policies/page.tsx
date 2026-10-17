"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Shield,
    Lock,
    FileText,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    Scale,
    ShieldCheck,
    HelpCircle,
    Building2,
    Calendar,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function PoliciesHubPage() {
    const [selectedTab, setSelectedTab] = useState<string>("all");

    const policies = [
        {
            id: "terms",
            title: "Terms of Service",
            slug: "/policies/terms",
            category: "General Legal",
            updated: "October 2026",
            summary: "Comprehensive governing terms for using RentHub, user accounts, listing obligations, and prohibition of unauthorized agency fees.",
            icon: FileText,
            color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
            highlights: [
                "Strict zero-agent commission enforcement",
                "Landlord ownership and identity verification obligations",
                "Tenant and landlord conduct standards",
                "Limitation of platform liability and warranty disclaimers"
            ]
        },
        {
            id: "privacy",
            title: "Privacy Policy",
            slug: "/policies/privacy",
            category: "Data & Privacy",
            updated: "October 2026",
            summary: "Our commitment to data privacy under the Nigeria Data Protection Act (NDPA) and NDPR, detailing how your KYC and rental data is secured.",
            icon: Shield,
            color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
            highlights: [
                "Full NDPA & NDPR compliance framework",
                "Encrypted storage for government IDs and phone verification",
                "No selling or sharing of personal data with third-party advertisers",
                "Right to data access, portability, and deletion"
            ]
        },
        {
            id: "escrow",
            title: "Escrow & Refund Policy",
            slug: "/policies/escrow",
            category: "Payments & Escrow",
            updated: "October 2026",
            summary: "How RentHub's AfriExchange smart escrow protects your rent deposits, the 6-digit key handover OTP protocol, and full refund terms.",
            icon: Lock,
            color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
            highlights: [
                "AfriExchange stablecoin custody (NT Naira Tokens)",
                "Funds released only upon tenant 6-digit key handover code",
                "48-hour physical inspection window before payout trigger",
                "100% refund guarantee if keys are not delivered or listing is fraudulent"
            ]
        },
        {
            id: "disputes",
            title: "Dispute Resolution & Arbitration Policy",
            slug: "/policies/disputes",
            category: "Safety & Arbitration",
            updated: "October 2026",
            summary: "Rules and timelines for filing rental disputes, submitting evidence, administrative mediation, and binding escrow fund disposition.",
            icon: Scale,
            color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            highlights: [
                "Grounds for freezing escrow (misrepresentation, severe structural defects)",
                "7-day investigation and evidence examination window",
                "Neutral RentHub arbitration committee decision process",
                "Final escrow release or tenant restitution execution"
            ]
        },
        {
            id: "inspection",
            title: "Inspection & Certified Badge Policy",
            slug: "/policies/inspection",
            category: "Verification & Quality",
            updated: "October 2026",
            summary: "Rigorous physical audit criteria for properties to earn the verified green badge, title deed verification, and badge revocation rules.",
            icon: ShieldCheck,
            color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
            highlights: [
                "Mandatory in-person field verification checklist",
                "Proof of ownership (C of O, Governor's Consent, or Deed of Assignment)",
                "Structural, electrical, plumbing, and security standard checks",
                "Immediate revocation policy for falsified listings"
            ]
        }
    ];

    const filteredPolicies = selectedTab === "all"
        ? policies
        : policies.filter(p => p.id === selectedTab);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            {/* Header Banner */}
            <div className="border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="container-wide py-14 md:py-20">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                            <Scale className="h-3.5 w-3.5" />
                            <span>Legal & Trust Center</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-4">
                            Platform Policies & Governance
                        </h1>
                        <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
                            RentHub is built on absolute transparency, zero-agent exploitation, and bank-grade escrow security. Explore our governing policies, terms of service, and consumer protections.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="h-4 w-4" /> NDPR & NDPA Compliant
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                                <Lock className="h-4 w-4" /> AfriExchange Escrow Protected
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                                <Calendar className="h-4 w-4" /> Last Updated: October 2026
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container-wide py-12">
                {/* Policy Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                    <button
                        onClick={() => setSelectedTab("all")}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                            selectedTab === "all"
                                ? "bg-[var(--color-brand-blue)] text-white shadow-sm"
                                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                        }`}
                    >
                        All Policies ({policies.length})
                    </button>
                    {policies.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedTab(p.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                selectedTab === p.id
                                    ? "bg-[var(--color-brand-blue)] text-white shadow-sm"
                                    : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                            }`}
                        >
                            {p.title}
                        </button>
                    ))}
                </div>

                {/* Policies Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPolicies.map((policy) => {
                        const Icon = policy.icon;
                        return (
                            <div
                                key={policy.id}
                                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 md:p-8 flex flex-col justify-between hover:shadow-md transition-shadow group"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${policy.color}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <Badge variant="outline" className="text-[11px] font-medium border-[var(--border-color)]">
                                            {policy.category}
                                        </Badge>
                                    </div>

                                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--color-brand-orange)] transition-colors">
                                        {policy.title}
                                    </h2>

                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                                        {policy.summary}
                                    </p>

                                    <div className="space-y-2 mb-6 pt-4 border-t border-[var(--border-color)]">
                                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                            Key Protections
                                        </p>
                                        <ul className="space-y-1.5">
                                            {policy.highlights.map((h, i) => (
                                                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>{h}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                                    <span className="text-xs text-[var(--text-muted)]">
                                        Effective: {policy.updated}
                                    </span>
                                    <Link
                                        href={policy.slug}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand-blue)] dark:text-blue-400 group-hover:text-[var(--color-brand-orange)] transition-colors"
                                    >
                                        <span>Read Full Policy</span>
                                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Need Support Box */}
                <div className="mt-12 p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-[var(--color-brand-blue)] text-white flex items-center justify-center shrink-0">
                            <HelpCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-[var(--text-primary)]">
                                Have questions about our policies or dispute arbitration?
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                Our legal and trust operations team is available 24/7 to resolve inquiries.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <Link href="/support">
                            <Button variant="outline" size="sm" className="border-[var(--border-color)]">
                                Contact Legal Desk
                            </Button>
                        </Link>
                        <Link href="/resources/trust-and-safety">
                            <Button size="sm" className="bg-[var(--color-brand-blue)] text-white hover:bg-[var(--color-brand-blue)]/90">
                                Trust & Safety Center
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
