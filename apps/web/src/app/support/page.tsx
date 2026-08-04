"use client";

import { useState, useRef } from "react";
import {
    LifeBuoy,
    MessageCircle,
    Mail,
    Phone,
    ArrowRight,
    Search,
    Clock,
    CheckCircle2,
    BookOpen,
    ArrowLeft,
    X,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("ALL");
    const faqSectionRef = useRef<HTMLDivElement>(null);

    const scrollToFaqs = () => {
        if (faqSectionRef.current) {
            faqSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            scrollToFaqs();
        }
    };

    const handleCategoryClick = (catId: string) => {
        setActiveCategory(catId);

        // If current text search is a category label, clear text search so user sees category items smoothly
        const categoryLabels = ["all topics", "escrow", "escrow & payments", "verification", "landlord", "landlords", "tenant", "tenants"];
        if (categoryLabels.includes(searchQuery.trim().toLowerCase())) {
            setSearchQuery("");
        }

        scrollToFaqs();
    };

    const contactMethods = [
        {
            title: "WhatsApp",
            value: "+234 800 RENT HUB",
            desc: "Fastest response via direct chat.",
            icon: MessageCircle,
            color: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
            action: "Chat Now",
            href: "https://wa.me/2348007368482"
        },
        {
            title: "Email Support",
            value: "help@renthub.ng",
            desc: "For detailed inquiries and docs.",
            icon: Mail,
            color: "bg-blue-500/15 text-blue-500 border border-blue-500/30",
            action: "Email Us",
            href: "mailto:help@renthub.ng"
        },
        {
            title: "Support Hours",
            value: "9 AM - 6 PM",
            desc: "Mon - Sat (Abuja Time)",
            icon: Clock,
            color: "bg-purple-500/15 text-purple-500 border border-purple-500/30",
            action: "View Schedule",
            href: "#faqs"
        }
    ];

    const categories = [
        { id: "ALL", label: "All Topics" },
        { id: "ESCROW", label: "Escrow & Payments" },
        { id: "VERIFICATION", label: "Verification" },
        { id: "LANDLORD", label: "Landlords" },
        { id: "TENANT", label: "Tenants" }
    ];

    const faqs = [
        {
            category: "VERIFICATION",
            q: "How do I verify my identity?",
            a: "You can verify your identity through your Dashboard profile by uploading your NIN, Driver's License, or International Passport."
        },
        {
            category: "ESCROW",
            q: "How does RentHub Escrow work?",
            a: "When your application is approved, your annual rent and fees are safely locked in RentHub Escrow. Funds are only paid out to the landlord when you receive the keys and provide the 6-digit Handover OTP code."
        },
        {
            category: "TENANT",
            q: "What should I do if a landlord asks for inspection cash?",
            a: "Report them immediately via Support. RentHub properties have zero inspection/showing fees. Never pay cash before inspection."
        },
        {
            category: "VERIFICATION",
            q: "How long does physical property verification take?",
            a: "Our field agents in Abuja & Lagos inspect and verify properties within 24 to 48 hours after a landlord submits a listing."
        },
        {
            category: "LANDLORD",
            q: "How do landlords receive escrow payouts?",
            a: "During physical key handover, the tenant shares a 6-digit Handover OTP code with you. Enter this OTP in your Landlord Dashboard to instantly release funds to your bank account."
        },
        {
            category: "TENANT",
            q: "Can I dispute an escrow transaction?",
            a: "Yes! If the property condition does not match the verified listing or keys do not work, click 'Raise Dispute' in your Dashboard. Escrow funds will remain locked while support investigates."
        },
        {
            category: "LANDLORD",
            q: "Is listing a property on RentHub free?",
            a: "Yes! Listing properties on RentHub is 100% free for landlords. We connect you directly with verified tenants with no middleman agent commissions."
        },
        {
            category: "ESCROW",
            q: "What payment gateways are supported?",
            a: "We integrate directly with Paystack, allowing secure payments via Debit/Credit Cards, Bank Transfers, and USSD."
        }
    ];

    const filteredFaqs = faqs.filter((faq) => {
        // 1. Category Filter Check
        const matchesCategory = activeCategory === "ALL" || faq.category === activeCategory;

        // 2. Smart Search Query Check
        const qClean = searchQuery.trim().toLowerCase();
        if (!qClean) return matchesCategory;

        // Synonyms / Category Keywords Check
        let matchesSearch =
            faq.q.toLowerCase().includes(qClean) ||
            faq.a.toLowerCase().includes(qClean) ||
            faq.category.toLowerCase().includes(qClean);

        // Smart Category Keyword Alias matching:
        if (qClean === "landlords" || qClean === "landlord") {
            matchesSearch = matchesSearch || faq.category === "LANDLORD";
        } else if (qClean === "tenants" || qClean === "tenant") {
            matchesSearch = matchesSearch || faq.category === "TENANT";
        } else if (qClean === "escrow" || qClean === "payments" || qClean === "escrow & payments") {
            matchesSearch = matchesSearch || faq.category === "ESCROW";
        } else if (qClean === "verification" || qClean === "verify") {
            matchesSearch = matchesSearch || faq.category === "VERIFICATION";
        } else if (qClean === "all topics" || qClean === "all") {
            matchesSearch = true;
        }

        return matchesCategory && matchesSearch;
    });

    const highlightText = (text: string, highlight: string) => {
        const cleanHighlight = highlight.trim();
        if (!cleanHighlight) return text;

        // Prevent regex syntax crash if user types special characters
        try {
            const regex = new RegExp(`(${cleanHighlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})`, "gi");
            const parts = text.split(regex);
            return parts.map((part, i) =>
                part.toLowerCase() === cleanHighlight.toLowerCase() ? (
                    <mark key={i} className="bg-[var(--color-brand-green)]/20 text-[var(--color-brand-green)] font-extrabold px-1 rounded">
                        {part}
                    </mark>
                ) : (
                    part
                )
            );
        } catch (e) {
            return text;
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
            {/* Header / Nav context */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] py-4">
                <div className="container-wide flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                    <Link href="/resources" className="hover:text-[var(--color-brand-green)] flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" /> Resources
                    </Link>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-[var(--text-primary)] font-bold">Support Center</span>
                </div>
            </div>

            <section className="py-16 bg-[var(--bg-primary)]">
                <div className="container-wide text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-500 text-xs font-extrabold uppercase tracking-widest mb-6">
                        <LifeBuoy className="h-4 w-4" /> Help Desk
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[var(--text-primary)] mb-6 tracking-tight leading-tight">
                        How can we <span className="text-[var(--color-brand-green)]">help</span>?
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-[var(--text-secondary)] mb-10 font-medium leading-relaxed">
                        Whether you're a tenant looking for a home or a landlord listing a property,
                        our team in Abuja is here to support you every step of the way.
                    </p>

                    {/* Interactive Search Field */}
                    <div className="max-w-xl mx-auto relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)] group-focus-within:text-[var(--color-brand-green)] transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search help articles (e.g., Landlords, Escrow, Verification)"
                            className="w-full h-14 pl-12 pr-28 rounded-2xl text-[var(--text-primary)] bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[var(--color-brand-green)] focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:outline-none font-medium transition-all group-hover:shadow-md text-sm sm:text-base placeholder:text-[var(--text-placeholder)]"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            {searchQuery.trim() && (
                                <button
                                    onClick={scrollToFaqs}
                                    className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    View
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.id)}
                                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all border ${
                                    activeCategory === cat.id
                                        ? "bg-[var(--color-brand-green)] text-white border-[var(--color-brand-green)] shadow-md"
                                        : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40 hover:text-[var(--text-primary)]"
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Grid */}
            <section className="py-8 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        {contactMethods.map((method) => (
                            <div key={method.title} className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center text-center hover:shadow-lg transition-all group">
                                <div className={`h-16 w-16 ${method.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shrink-0`}>
                                    <method.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl text-[var(--text-primary)] font-extrabold mb-2">{method.title}</h3>
                                <p className="text-lg font-bold text-[var(--text-primary)] mb-2">{method.value}</p>
                                <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium mb-8">{method.desc}</p>
                                <a href={method.href} target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button variant="outline" className="w-full font-bold h-12 rounded-xl border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]">
                                        {method.action}
                                    </Button>
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Common FAQs Section with Scroll Anchor */}
                    <div id="faqs" ref={faqSectionRef} className="max-w-3xl mx-auto scroll-mt-24">
                        <div className="flex items-center justify-between mb-8 pb-3 border-b border-[var(--border-color)]">
                            <h2 className="text-2xl sm:text-3xl text-[var(--text-primary)] font-extrabold tracking-tight flex items-center gap-2">
                                <HelpCircle className="h-7 w-7 text-[var(--color-brand-green)]" />
                                Quick Help & FAQs
                            </h2>
                            <span className="text-xs font-bold text-[var(--color-brand-green)] bg-[var(--color-brand-green)]/15 border border-[var(--color-brand-green)]/30 px-3 py-1 rounded-full">
                                {filteredFaqs.length} {filteredFaqs.length === 1 ? "article" : "articles"} found
                            </span>
                        </div>

                        <div className="space-y-4">
                            {filteredFaqs.length === 0 ? (
                                <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-8">
                                    <HelpCircle className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
                                    <p className="text-[var(--text-primary)] font-bold text-base mb-1">No articles match your search</p>
                                    <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium mb-4">
                                        Try searching for words like "escrow", "verification", "landlord", or "dispute".
                                    </p>
                                    <Button
                                        onClick={() => { setSearchQuery(""); setActiveCategory("ALL"); }}
                                        className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs rounded-xl px-5 py-2.5"
                                    >
                                        Reset Search & Show All Topics
                                    </Button>
                                </div>
                            ) : (
                                filteredFaqs.map((faq, idx) => (
                                    <div key={idx} className="p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40 transition-all">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h4 className="font-extrabold text-[var(--text-primary)] flex items-center gap-2.5 text-base sm:text-lg">
                                                <BookOpen className="h-5 w-5 text-[var(--color-brand-green)] shrink-0" />
                                                {highlightText(faq.q, searchQuery)}
                                            </h4>
                                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/20 shrink-0">
                                                {faq.category}
                                            </span>
                                        </div>
                                        <p className="text-[var(--text-secondary)] font-medium text-xs sm:text-sm leading-relaxed pl-7.5">
                                            {highlightText(faq.a, searchQuery)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-12 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-10 md:p-14 text-center text-[var(--text-primary)] shadow-xl">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">Didn't find what you need?</h2>
                        <p className="text-[var(--text-secondary)] text-base md:text-lg mb-8 font-medium max-w-xl mx-auto">Our community members often have the quickest answers based on local experience.</p>
                        <Link href="/community">
                            <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold h-14 px-10 rounded-xl text-base shadow-lg shadow-emerald-900/20">
                                Join the Community
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
