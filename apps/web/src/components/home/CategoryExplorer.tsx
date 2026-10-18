"use client";

import Link from "next/link";
import { Building2, Home, Zap, ShieldCheck, Armchair, GraduationCap, ArrowRight } from "lucide-react";

const CATEGORIES = [
    {
        title: "Modern City Apartments",
        tagline: "1 to 3 Bedroom Flats in Prime Urban Corridors",
        description: "Perfect for young professionals and families in Lagos, Abuja, and Port Harcourt.",
        icon: Building2,
        href: "/search?propertyType=FLAT",
        badge: "Most Popular",
        badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
        bgGradient: "from-blue-500/5 via-blue-500/10 to-transparent",
    },
    {
        title: "Executive Duplexes & Villas",
        tagline: "Spacious Multi-Level Luxury Residences",
        description: "Private compounds, dedicated parking, security guardhouses, and serene living.",
        icon: Home,
        href: "/search?propertyType=DUPLEX",
        badge: "Family Living",
        badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        bgGradient: "from-emerald-500/5 via-emerald-500/10 to-transparent",
    },
    {
        title: "24/7 Guaranteed Power Homes",
        tagline: "Hybrid Grid + Solar & Dedicated Generators",
        description: "Zero blackouts. Homes with reliable backup infrastructure verified by our field agents.",
        icon: Zap,
        href: "/search?amenities=24/7%20Power",
        badge: "Power Verified",
        badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
        bgGradient: "from-amber-500/5 via-amber-500/10 to-transparent",
    },
    {
        title: "Serviced Living & Facilities",
        tagline: "All-Inclusive Estate Facility Management",
        description: "Covers central security, estate waste disposal, compound lighting, and facility maintenance.",
        icon: ShieldCheck,
        href: "/search?serviced=true",
        badge: "Zero Hassle",
        badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
        bgGradient: "from-purple-500/5 via-purple-500/10 to-transparent",
    },
    {
        title: "Furnished Turn-Key Residences",
        tagline: "Designer Furniture & Modern Fitted Kitchens",
        description: "Move in immediately with luxury mattresses, appliances, air conditioners, and TVs.",
        icon: Armchair,
        href: "/search?furnished=true",
        badge: "Ready Move-In",
        badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
        bgGradient: "from-rose-500/5 via-rose-500/10 to-transparent",
    },
    {
        title: "Young Pro & Student Studios",
        tagline: "Self-Contains with High-Speed Internet",
        description: "Affordable, secure mini-flats near tech hubs and universities with zero broker markup.",
        icon: GraduationCap,
        href: "/search?propertyType=SELF_CONTAIN",
        badge: "Budget Friendly",
        badgeColor: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
        bgGradient: "from-teal-500/5 via-teal-500/10 to-transparent",
    },
];

export function CategoryExplorer() {
    return (
        <section className="py-20 bg-[var(--bg-primary)]">
            <div className="container-wide space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] font-black text-xs uppercase tracking-wider mb-3">
                            <span>Tailored Living</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                            Explore Rentals by Lifestyle
                        </h2>
                        <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 font-medium max-w-xl">
                            Whether you need uninterrupted 24/7 solar power, fully serviced facilities, or an executive family compound.
                        </p>
                    </div>

                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 text-sm font-black text-[var(--color-brand-green)] hover:underline self-start md:self-auto"
                    >
                        <span>Browse All Rental Collections</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CATEGORIES.map((cat, idx) => (
                        <Link
                            key={idx}
                            href={cat.href}
                            className={`group relative p-6 sm:p-7 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--color-brand-green)]/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${cat.bgGradient}`}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-primary)] group-hover:scale-110 group-hover:border-[var(--color-brand-green)]/50 transition-all">
                                        <cat.icon className="w-6 h-6 text-[var(--color-brand-green)]" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${cat.badgeColor}`}>
                                        {cat.badge}
                                    </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] group-hover:text-[var(--color-brand-green)] transition-colors">
                                    {cat.title}
                                </h3>
                                <p className="text-xs font-bold text-[var(--text-muted)] mt-1">
                                    {cat.tagline}
                                </p>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2.5 font-medium leading-relaxed">
                                    {cat.description}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-black text-[var(--color-brand-green)]">
                                <span>View Available Homes</span>
                                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
