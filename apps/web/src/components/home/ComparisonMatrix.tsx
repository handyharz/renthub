"use client";

import { Check, X, ShieldCheck, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

const COMPARISONS = [
    {
        feature: "Agent & Broker Fees",
        traditional: "10% Agent Fee + 10% Agreement Fee (Up to 20% lost upfront)",
        traditionalBad: true,
        renthub: "₦0 Broker Fee. Direct landlord connections save ₦500k - ₦2M.",
        renthubGood: true,
    },
    {
        feature: "Physical Inspection Fees",
        traditional: "₦5,000 to ₦15,000 per viewing charged by roadside agents",
        traditionalBad: true,
        renthub: "100% Free digital tour booking directly on your schedule",
        renthubGood: true,
    },
    {
        feature: "Payment & Scam Safety",
        traditional: "Direct bank transfer with zero refund if the landlord defaults",
        traditionalBad: true,
        renthub: "100% Escrow Protected: Funds held until in-person inspection",
        renthubGood: true,
    },
    {
        feature: "Listing & Photo Legitimacy",
        traditional: "Stolen online photos, fake listings, double-letting scams",
        traditionalBad: true,
        renthub: "Physically audited with verified GPS coordinates and utility audits",
        renthubGood: true,
    },
    {
        feature: "Key Handover Protocol",
        traditional: "Verbal promises; disputes over incomplete repairs and delayed keys",
        traditionalBad: true,
        renthub: "Cryptographic 6-digit Handover OTP unlocks payout only when satisfied",
        renthubGood: true,
    },
];

export function ComparisonMatrix() {
    return (
        <section className="py-20 bg-[var(--bg-primary)]">
            <div className="container-wide space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>The RentHub Advantage</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                        Why Renters Switch to RentHub
                    </h2>
                    <p className="text-sm sm:text-base text-[var(--text-secondary)] font-medium">
                        How we eliminate agent extortion, inspection bribes, and rental fraud in Nigeria.
                    </p>
                </div>

                <div className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)]">
                        {/* Column 1: Traditional Agents (Red/Warning) */}
                        <div className="p-6 sm:p-8 bg-red-500/5 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[var(--text-primary)]">
                                        Traditional Nigerian Agents
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                        Roadside agents, gatekeepers, and middlemen
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {COMPARISONS.map((c, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-2xl bg-[var(--bg-card)]/80 border border-red-500/20 flex items-start gap-3"
                                    >
                                        <div className="p-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 shrink-0 mt-0.5">
                                            <X className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                {c.feature}
                                            </p>
                                            <p className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)] mt-0.5">
                                                {c.traditional}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column 2: RentHub Verified (Green/Verified) */}
                        <div className="p-6 sm:p-8 bg-emerald-500/5 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[var(--text-primary)]">
                                        RentHub Escrow Platform
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                        Direct landlord marketplace with escrow safety
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {COMPARISONS.map((c, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-2xl bg-[var(--bg-card)] border border-emerald-500/30 shadow-xs flex items-start gap-3"
                                    >
                                        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-[var(--color-brand-green)] uppercase tracking-wider">
                                                {c.feature}
                                            </p>
                                            <p className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] mt-0.5">
                                                {c.renthub}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-[var(--bg-muted)]/50 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div>
                            <p className="text-sm font-black text-[var(--text-primary)]">
                                Ready to save hundreds of thousands on your next home?
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                Join thousands of renters who safely secured their homes with zero agent fees.
                            </p>
                        </div>
                        <Link
                            href="/search"
                            className="px-6 py-3 rounded-2xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                        >
                            <span>Browse Verified Homes</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
