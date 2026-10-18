"use client";

import { useState } from "react";
import { Search, Calendar, Key, ShieldCheck, Plus, Users, Wallet, ArrowRight } from "lucide-react";
import Link from "next/link";

const RENTER_STEPS = [
    {
        step: "01",
        title: "Search & Filter Verified Homes",
        description: "Browse 36 states with filter by 24/7 power, borehole water, serviced estate status, and budget presets.",
        icon: Search,
        tag: "100% Free Browsing",
    },
    {
        step: "02",
        title: "Book Free Inspection Tours",
        description: "Directly chat with verified landlords and schedule physical or virtual tours with zero roadside inspection bribes.",
        icon: Calendar,
        tag: "No Viewing Fees",
    },
    {
        step: "03",
        title: "Escrow Pay & Handover OTP",
        description: "Rent is locked in bank escrow. Release funds to the landlord in person only after entering your 6-digit Handover OTP.",
        icon: Key,
        tag: "Bank-Grade Escrow",
    },
];

const LANDLORD_STEPS = [
    {
        step: "01",
        title: "List for Free in 3 Minutes",
        description: "Upload verified photos, define power and water infrastructure, and set your annual rent and payment terms.",
        icon: Plus,
        tag: "Zero Listing Fee",
    },
    {
        step: "02",
        title: "Vetted Tenant Applications",
        description: "Receive pre-screened applications with credit and identity trust scores. Chat directly with serious prospects.",
        icon: Users,
        tag: "Pre-Screened Renters",
    },
    {
        step: "03",
        title: "Instant 98% Escrow Payout",
        description: "Input the tenant's 6-digit Handover OTP in person on key exchange. Payout is disbursed straight to your Nigerian bank account.",
        icon: Wallet,
        tag: "Guaranteed Payout",
    },
];

export function HowItWorks() {
    const [mode, setMode] = useState<"renter" | "landlord">("renter");

    const steps = mode === "renter" ? RENTER_STEPS : LANDLORD_STEPS;

    return (
        <section className="py-20 bg-[var(--bg-primary)]">
            <div className="container-wide space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider mb-3">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Transparent Process</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                            How RentHub Protects Your Move
                        </h2>
                        <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 font-medium max-w-xl">
                            From search to key handover, every step is protected by verified escrow and digital safety protocols.
                        </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center p-1.5 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border-color)] self-start md:self-auto">
                        <button
                            type="button"
                            onClick={() => setMode("renter")}
                            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                                mode === "renter"
                                    ? "bg-[var(--color-brand-green)] text-white shadow-md"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            For Renters
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("landlord")}
                            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                                mode === "landlord"
                                    ? "bg-[var(--color-brand-green)] text-white shadow-md"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            For Landlords
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {steps.map((s, idx) => (
                        <div
                            key={idx}
                            className="relative p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all duration-300 space-y-5 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl sm:text-4xl font-black text-[var(--color-brand-green)]/30">
                                        {s.step}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] border border-[var(--color-brand-green)]/20">
                                        {s.tag}
                                    </span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/60 text-[var(--color-brand-green)] w-fit border border-[var(--border-color)]">
                                    <s.icon className="w-6 h-6" />
                                </div>

                                <div>
                                    <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
                                        {s.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 font-medium leading-relaxed">
                                        {s.description}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)]">
                                Step {idx + 1} of 3
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center pt-4">
                    {mode === "renter" ? (
                        <Link
                            href="/search"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            <span>Start Searching Verified Homes</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <Link
                            href="/properties/new"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-black text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            <span>List Your Property for Free</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
