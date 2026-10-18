"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    ShieldCheck,
    Lock,
    Eye,
    ListChecks,
    Scale,
    Key,
    UserCheck,
    Camera,
    FileText,
    Target,
    BookOpen,
    HelpCircle,
    Download,
    ChevronRight,
    Search,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    Building2,
    FileCheck,
    AlertTriangle,
    BadgePercent,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { CategorySection } from "@/components/resources/CategorySection";

const ALL_RESOURCES = [
    // Trust & Safety
    {
        id: "escrow",
        category: "safety",
        title: "The RentHub Escrow System",
        description: "How your rent is locked safely in bank escrow and only released to the landlord in person upon entering your 6-digit Handover OTP.",
        icon: Lock,
        type: "GUIDE" as const,
        readTime: "5 min read",
        badge: "Escrow Protocol",
        href: "/resources/trust-and-safety/escrow",
    },
    {
        id: "verification",
        category: "safety",
        title: "Physical Verification Standards",
        description: "Inside look into what RentHub field agents verify during in-person property audits: GPS coordinates, power supply, water quality, and ownership papers.",
        icon: ShieldCheck,
        type: "GUIDE" as const,
        readTime: "6 min read",
        badge: "Quality Audit",
        href: "/resources/trust-and-safety/verification",
    },
    {
        id: "common-scams",
        category: "safety",
        title: "Common Nigerian Rental Scams",
        description: "How to identify and avoid illegal 'inspection/showing fee' scams, fake landlords, double-letting tricks, and roadside agent extortion.",
        icon: Eye,
        type: "ARTICLE" as const,
        readTime: "7 min read",
        badge: "Scam Alert",
        href: "/resources/trust-and-safety/common-scams",
    },

    // Tenants
    {
        id: "inspection-checklist",
        category: "tenants",
        title: "Pre-Move-In Inspection Checklist",
        description: "A comprehensive 40-point checklist covering borehole pumps, prepaid meter debts, ceiling dampness, plumbing leaks, and security gates before you pay.",
        icon: ListChecks,
        type: "TEMPLATE" as const,
        readTime: "4 min read",
        badge: "Checklist",
        href: "/resources/tenants/inspection-checklist",
    },
    {
        id: "rights-101",
        category: "tenants",
        title: "Nigerian Tenant Rights 101",
        description: "Your statutory legal protections under the Lagos Tenancy Law 2011 and Abuja Recovery of Premises Act. Notice to quit, rent increases, and privacy rights.",
        icon: Scale,
        type: "LEGAL" as const,
        readTime: "8 min read",
        badge: "Tenancy Law",
        href: "/resources/tenants/rights-101",
    },
    {
        id: "moving-guide",
        category: "tenants",
        title: "The Ultimate Nigerian Moving Guide",
        description: "Step-by-step roadmap for a seamless transition into a new home: resolving PHCN/Disco meter tokens, estate security dues, and moving logistics.",
        icon: Key,
        type: "GUIDE" as const,
        readTime: "6 min read",
        badge: "Moving Tips",
        href: "/resources/tenants/moving-guide",
    },

    // Landlords
    {
        id: "vetting-guide",
        category: "landlords",
        title: "Direct Tenant Vetting & Screening",
        description: "How Nigerian landlords can safely vet prospective tenants with NIN verification, bank income verification, and workplace background checks without agents.",
        icon: UserCheck,
        type: "GUIDE" as const,
        readTime: "7 min read",
        badge: "Tenant Vetting",
        href: "/resources/landlords/vetting-guide",
    },
    {
        id: "photography-class",
        category: "landlords",
        title: "Real Estate Photography Masterclass",
        description: "Capture bright, professional property photos using your smartphone. Master natural lighting, wide angles, and compound curb appeal to lease 3x faster.",
        icon: Camera,
        type: "ARTICLE" as const,
        readTime: "5 min read",
        badge: "Photo Guide",
        href: "/resources/landlords/photography-class",
    },
    {
        id: "legal-templates",
        category: "landlords",
        title: "Legally Vetted Tenancy Agreements",
        description: "Free, customizable Residential Lease Agreements, Rent Receipts, and Condition Inventory Reports drafted by Nigerian real estate barristers.",
        icon: Download,
        type: "TEMPLATE" as const,
        readTime: "Instant Download",
        badge: "Legal Contract",
        href: "/resources/landlords/legal-templates",
    },
];

const DOWNLOADABLE_TEMPLATES = [
    {
        title: "Standard Residential Tenancy Agreement",
        desc: "Legally binding 1-year tenancy contract drafted under Nigerian tenancy laws with clear covenants, repair clauses, and deposit terms.",
        format: "DOCX & PDF",
        size: "245 KB",
        href: "/resources/landlords/legal-templates",
    },
    {
        title: "Official Rent Payment Receipt Form",
        desc: "Statutory proof of rent payment complying with Nigerian state tax and legal tenancy requirements with caution deposit accounting.",
        format: "DOCX & PDF",
        size: "180 KB",
        href: "/resources/landlords/legal-templates",
    },
    {
        title: "Physical Property Condition Report",
        desc: "Pre-occupancy walkthrough form documenting the initial condition of fittings, tiles, electrical switches, and plumbing.",
        format: "PDF",
        size: "310 KB",
        href: "/resources/tenants/inspection-checklist",
    },
    {
        title: "Statutory Notice to Quit Template",
        desc: "Legally accurate 6-month and 3-month Notice to Quit templates compliant with the Lagos & Abuja tenancy dispute frameworks.",
        format: "DOCX",
        size: "195 KB",
        href: "/resources/landlords/legal-templates",
    },
];

const FAQS = [
    {
        q: "Why does RentHub not charge the traditional 10% agent and 10% legal fee?",
        a: "Traditional agents act as opaque middlemen who charge up to 20% markups without legal accountability. RentHub connects verified landlords directly with tenants and uses automated contracts and escrow verification, completely eliminating the middleman extortion tax.",
    },
    {
        q: "How does the 100% Escrow Protection guarantee work?",
        a: "When a tenant pays rent, funds are held securely in a regulated escrow account. The landlord is only paid after the tenant conducts an in-person physical handover and submits the 6-digit Handover OTP. If the property differs from the listing or the landlord defaults, your funds are refunded in full.",
    },
    {
        q: "Can I download and customize the legal lease agreement for my own property?",
        a: "Yes. All our tenancy templates have been prepared by qualified Nigerian real estate barristers. They can be freely customized for Lagos, Abuja, Rivers, Oyo, and all 36 states.",
    },
    {
        q: "Are physical inspections on RentHub really 100% free?",
        a: "Absolutely. Never pay an inspection or 'showing fee' on RentHub. All tour bookings are scheduled digitally and confirmed directly with the property owner.",
    },
];

export default function ResourcesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Filter resources based on query and category
    const filteredResources = useMemo(() => {
        return ALL_RESOURCES.filter((item) => {
            const matchesCategory =
                selectedCategory === "all" || item.category === selectedCategory;
            const matchesQuery =
                !searchQuery ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.badge.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesCategory && matchesQuery;
        });
    }, [searchQuery, selectedCategory]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-24">
            {/* 1. Executive Hero Header */}
            <div className="relative overflow-hidden bg-slate-950 text-white py-16 sm:py-24 border-b border-[var(--border-color)]">
                {/* Ambient glow backgrounds */}
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--color-brand-green)]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="container-wide relative z-10 max-w-4xl mx-auto text-center space-y-6">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-black text-emerald-400">
                        <BookOpen className="w-4 h-4" />
                        <span>RentHub Knowledge Base & Legal Center</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white">
                        Rent Safely. Understand Your Rights. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                            Zero Roadside Agent Tax.
                        </span>
                    </h1>

                    <p className="text-sm sm:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
                        Everything Nigerian tenants and landlords need to navigate tenancy laws, download verified lease agreements, and safeguard rent money in escrow.
                    </p>

                    {/* Live Search Console */}
                    <div className="pt-4 max-w-2xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search tenancy laws, inspection checklists, notice to quit, escrow..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder:text-slate-400 border border-white/20 outline-none backdrop-blur-md text-sm sm:text-base font-semibold transition-all shadow-xl"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Quick Category Tabs */}
                    <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
                        {[
                            { id: "all", label: "All Resources" },
                            { id: "safety", label: "🛡️ Trust & Escrow" },
                            { id: "tenants", label: "🏠 For Tenants" },
                            { id: "landlords", label: "📁 For Landlords" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedCategory(tab.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                    selectedCategory === tab.id
                                        ? "bg-[var(--color-brand-green)] text-white shadow-md scale-105"
                                        : "bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/15"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container-wide py-12 sm:py-16 space-y-16">
                {/* 2. Downloadable Legal Templates Banner */}
                <div className="p-6 sm:p-10 rounded-4xl bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[var(--bg-muted)] border border-[var(--border-color)] shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider mb-2 border border-amber-500/20">
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Free Legal Toolkit</span>
                            </div>
                            <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)]">
                                Downloadable Nigerian Tenancy Contracts
                            </h2>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1">
                                Verified by Nigerian real estate barristers. Save up to ₦300,000 in legal drafting fees.
                            </p>
                        </div>

                        <Link
                            href="/resources/landlords/legal-templates"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-black text-xs sm:text-sm shadow-md hover:scale-105 transition-all self-start sm:self-auto"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download Full Pack</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {DOWNLOADABLE_TEMPLATES.map((tmpl, idx) => (
                            <Link
                                key={idx}
                                href={tmpl.href}
                                className="group p-5 rounded-2xl bg-[var(--bg-muted)]/40 hover:bg-[var(--bg-muted)] border border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40 transition-all flex flex-col justify-between"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                                            {tmpl.format}
                                        </span>
                                        <span className="text-[10px] font-bold text-[var(--text-muted)]">
                                            {tmpl.size}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--color-brand-green)] transition-colors leading-snug">
                                        {tmpl.title}
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                                        {tmpl.desc}
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-black text-[var(--color-brand-green)]">
                                    <span>Download</span>
                                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 3. Filtered Resource Articles Grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                                {selectedCategory === "all"
                                    ? "Comprehensive Resource Library"
                                    : selectedCategory === "safety"
                                    ? "Trust, Safety & Escrow Protocols"
                                    : selectedCategory === "tenants"
                                    ? "Tenant Rights & Moving Blueprints"
                                    : "Landlord Direct Management Guides"}
                            </h2>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1">
                                Showing {filteredResources.length} expert resources for the Nigerian rental ecosystem.
                            </p>
                        </div>
                    </div>

                    {filteredResources.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredResources.map((res) => (
                                <Link key={res.id} href={res.href}>
                                    <ResourceCard
                                        title={res.title}
                                        description={res.description}
                                        icon={res.icon}
                                        type={res.type}
                                        readTime={res.readTime}
                                        badge={res.badge}
                                    />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]">
                            <BookOpen className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                            <h3 className="text-base font-black text-[var(--text-primary)]">
                                No resources matched "{searchQuery}"
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                Try searching for "escrow", "checklist", "inspection", or "rights".
                            </p>
                            <Button
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedCategory("all");
                                }}
                                className="mt-4 bg-[var(--color-brand-green)] text-white text-xs font-black rounded-xl"
                            >
                                Reset Search
                            </Button>
                        </div>
                    )}
                </div>

                {/* 4. Anti-Agent Tax Manifesto */}
                <section
                    id="manifesto"
                    className="relative rounded-4xl p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white border border-emerald-500/20 shadow-2xl overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-brand-green)]/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-8">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs uppercase tracking-wider border border-emerald-500/30">
                            <Target className="w-4 h-4" />
                            <span>The Platform Manifesto</span>
                        </div>

                        <div className="max-w-3xl space-y-4">
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                We Are On A Mission To Save Nigerians <br />
                                <span className="text-[var(--color-brand-green)]">
                                    ₦10 Billion In Roadside Agent Fees.
                                </span>
                            </h2>
                            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                                RentHub was founded to dismantle the broken gatekeeping model that extracts billions of naira annually from hard-working tenants. Finding a verified home should be as transparent and seamless as booking an airline seat.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 w-fit">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-black text-white">Radical Transparency</h3>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                    All rents and caution deposits are published upfront. Zero roadside inspection bribes or surprise agency invoices.
                                </p>
                            </div>

                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                                <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 w-fit">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-black text-white">Bank-Grade Escrow</h3>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                    Rent payments are held in escrow. Landlords receive payouts only after in-person inspection and 6-digit OTP verification.
                                </p>
                            </div>

                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 w-fit">
                                    <BadgePercent className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-black text-white">Fair Economics</h3>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                    Zero agent commission for tenants. 98% net rent instant disbursement for property owners upon key handover.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-wrap gap-4">
                            <Link
                                href="/search"
                                className="px-8 py-4 rounded-2xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-black text-sm shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                            >
                                <span>Explore Verified Homes</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <Link
                                href="/resources/manifesto"
                                className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 flex items-center gap-2 backdrop-blur-md transition-all"
                            >
                                <span>Read Full Manifesto</span>
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* 5. Frequently Asked Questions */}
                <div className="space-y-8">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Common Questions</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                            Clear answers regarding Nigerian tenancy law, escrow disbursements, and free inspections.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                        {FAQS.map((faq, idx) => (
                            <div
                                key={idx}
                                className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-2.5"
                            >
                                <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
                                    {faq.q}
                                </h3>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. Support & Community CTA */}
                <div className="p-8 sm:p-12 rounded-4xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-6 max-w-3xl mx-auto shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] flex items-center justify-center mx-auto">
                        <HelpCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                            Need Personalized Legal or Tenancy Assistance?
                        </h3>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1.5 max-w-lg mx-auto leading-relaxed">
                            Our verified support agents and community legal counsel are available 24/7 to review contracts or assist with escrow settlements.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/support"
                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-black text-xs sm:text-sm transition-all"
                        >
                            Contact Legal Support
                        </Link>
                        <Link
                            href="/community"
                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-black text-xs sm:text-sm shadow-md transition-all"
                        >
                            Join Renter Community
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
