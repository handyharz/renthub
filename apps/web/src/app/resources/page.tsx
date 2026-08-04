"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { CategorySection } from "@/components/resources/CategorySection";
import Link from "next/link";

export default function ResourcesPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
            {/* Hero Section */}
            <div className="bg-[var(--color-brand-blue)] text-white py-20 relative overflow-hidden">
                <div className="container-wide relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
                            RentHub Resources
                        </h1>
                        <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed font-medium">
                            Everything you need to rent safely, fairly, and transparently in Nigeria.
                            Empowering tenants and landlords to connect directly.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <a href="#landlords">
                                <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-emerald-900/20">
                                    Download Templates
                                </Button>
                            </a>
                            <Link href="/resources/trust-and-safety">
                                <Button className="bg-[var(--bg-card)]/10 hover:bg-[var(--bg-card)]/20 text-white backdrop-blur-md h-12 px-8 font-bold rounded-xl border border-white/20">
                                    Read the Manifesto
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
                {/* Abstract background blobs */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-blue-400 rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-blue-500/150 rounded-full opacity-10 blur-3xl"></div>
            </div>

            <div className="container-wide py-12">
                {/* Navigation Pills */}
                <div className="flex flex-wrap gap-3 mb-12 sticky top-20 bg-[var(--bg-primary)]/80 backdrop-blur-md py-4 z-20 border-b border-[var(--border-color)]/50">
                    <a href="#safety" className="px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--color-brand-green)] hover:text-[var(--text-primary)] transition-colors">Trust & Safety</a>
                    <a href="#tenants" className="px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--color-brand-green)] hover:text-[var(--text-primary)] transition-colors">For Tenants</a>
                    <a href="#landlords" className="px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--color-brand-green)] hover:text-[var(--text-primary)] transition-colors">For Landlords</a>
                    <a href="#manifesto" className="px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--color-brand-green)] hover:text-[var(--text-primary)] transition-colors">Our Manifesto</a>
                </div>

                {/* Trust & Safety */}
                <CategorySection
                    id="safety"
                    title="🛡️ Trust & Safety"
                    description="How we protect your money and ensure every property on RentHub is real and verified."
                >
                    <Link href="/resources/trust-and-safety/escrow">
                        <ResourceCard
                            title="The Escrow System"
                            description="Learn how your rent payment is held securely and only released when you get your keys."
                            icon={Lock}
                            type="GUIDE"
                        />
                    </Link>
                    <Link href="/resources/trust-and-safety/verification">
                        <ResourceCard
                            title="Verification Standards"
                            description="What our field agents look for during physical property inspections."
                            icon={ShieldCheck}
                            type="GUIDE"
                        />
                    </Link>
                    <Link href="/resources/trust-and-safety/common-scams">
                        <ResourceCard
                            title="Common Scams in Nigeria"
                            description="Identify red flags like 'showing fees' and fake property owners to stay safe."
                            icon={Eye}
                            type="ARTICLE"
                        />
                    </Link>
                </CategorySection>

                {/* For Tenants */}
                <CategorySection
                    id="tenants"
                    title="🏠 For Tenants"
                    description="Expert advice to help you find your dream home and understand your rights."
                >
                    <Link href="/resources/tenants/inspection-checklist">
                        <ResourceCard
                            title="Inspection Checklist"
                            description="A comprehensive list of things to check (plumbing, wiring, legality) before you pay."
                            icon={ListChecks}
                            type="TEMPLATE"
                        />
                    </Link>
                    <Link href="/resources/tenants/rights-101">
                        <ResourceCard
                            title="Tenant Rights 101"
                            description="Your legal protections under the Nigerian Tenancy Act (Abuja & Lagos focus)."
                            icon={Scale}
                            type="ARTICLE"
                        />
                    </Link>
                    <Link href="/resources/tenants/moving-guide">
                        <ResourceCard
                            title="The Moving Guide"
                            description="Tips for a smooth transition into your new home, from light bills to security."
                            icon={Key}
                            type="GUIDE"
                        />
                    </Link>
                </CategorySection>

                {/* For Landlords */}
                <CategorySection
                    id="landlords"
                    title="📁 For Landlords"
                    description="Tools and tips to manage your properties and find quality tenants without agents."
                >
                    <Link href="/resources/landlords/vetting-guide">
                        <ResourceCard
                            title="Direct Vetting Guide"
                            description="How to screen potential tenants and verify their identity safely."
                            icon={UserCheck}
                            type="GUIDE"
                        />
                    </Link>
                    <Link href="/resources/landlords/photography-class">
                        <ResourceCard
                            title="Photography Masterclass"
                            description="Pro tips for taking property photos that stand out and attract the best tenants."
                            icon={Camera}
                            type="ARTICLE"
                        />
                    </Link>
                    <Link href="/resources/landlords/legal-templates">
                        <ResourceCard
                            title="Legal Templates"
                            description="Downloadable and customizable Lease Agreement and Rent Receipt templates."
                            icon={Download}
                            type="TEMPLATE"
                        />
                    </Link>
                </CategorySection>

                {/* Manifesto Section */}
                <section id="manifesto" className="mt-20 bg-[var(--bg-card)] rounded-3xl p-8 md:p-16 border border-[var(--border-color)] shadow-sm overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-[var(--color-brand-green)] font-bold mb-6">
                            <Target className="h-6 w-6" />
                            <span className="uppercase tracking-widest text-xs sm:text-sm font-extrabold">The Platform Manifesto</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-8 max-w-2xl tracking-tight">
                            We're on a mission to save Nigerians ₦10 Billion in agent fees.
                        </h2>

                        <div className="grid md:grid-cols-2 gap-12 text-[var(--text-secondary)] font-medium leading-relaxed text-sm sm:text-base">
                            <div>
                                <p className="mb-6">
                                    RentHub exists to eliminate the "agent tax" that extracts billions of naira annually from people who can least afford it. Traditional house hunting in Nigeria is broken—fraught with hidden fees, manufactured urgency, and a lack of accountability.
                                </p>
                                <p>
                                    We believe that in the 21st century, finding a home should be as simple and transparent as booking a flight. No gatekeepers, no fake listings, and no ₦600,000 "legal fees" for a five-minute conversation.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Our Core Principles:</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <ShieldCheck className="h-5 w-5 text-[var(--color-brand-green)] mt-1 shrink-0" />
                                        <span><strong className="text-[var(--text-primary)]">Transparency First:</strong> All prices shown upfront. No hidden charges.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <ShieldCheck className="h-5 w-5 text-[var(--color-brand-green)] mt-1 shrink-0" />
                                        <span><strong className="text-[var(--text-primary)]">Physical Verification:</strong> Every listing is visited and verified by our team.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <ShieldCheck className="h-5 w-5 text-[var(--color-brand-green)] mt-1 shrink-0" />
                                        <span><strong className="text-[var(--text-primary)]">Fair Economics:</strong> Win-win for landlords and tenants.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-12 flex justify-center">
                            <Link href="/resources/trust-and-safety">
                                <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 h-14 px-10 text-base font-extrabold text-white rounded-xl shadow-lg shadow-emerald-900/20">
                                    Read Our Mission
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Background target icon for style */}
                    <Target className="absolute -bottom-10 -right-10 h-64 w-64 text-[var(--border-color)]/20 -z-0" />
                </section>

                {/* FAQ Link */}
                <div className="mt-20 text-center">
                    <div className="inline-flex items-center gap-2 p-1 pr-4 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[var(--color-brand-green)] font-bold text-xs sm:text-sm mb-6">
                        <span className="bg-[var(--color-brand-green)] text-white px-3 py-1 rounded-full uppercase text-xs font-extrabold">New</span>
                        <span>Still have questions? Check our FAQ</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-8 tracking-tight">
                        Need more help? Our support team is here for you.
                    </h3>
                    <div className="flex justify-center gap-4">
                        <Link href="/support">
                            <Button variant="outline" className="border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] h-12 px-8 font-bold rounded-xl">
                                Contact Support
                            </Button>
                        </Link>
                        <Link href="/community">
                            <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 h-12 px-8 font-bold text-white rounded-xl shadow-lg shadow-emerald-900/20">
                                Join Community
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
