"use client";

import { ShieldCheck, MapPin, Wallet, Clock, Sparkles } from "lucide-react";

const METRICS = [
    {
        icon: MapPin,
        value: "36 States + FCT",
        label: "Nationwide Coverage",
        description: "Verified rental properties across every Nigerian state and city.",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
    },
    {
        icon: Wallet,
        value: "₦0 Agent Fees",
        label: "Direct Landlord Connection",
        description: "Save up to ₦1,000,000 in unfair 10% agent and 10% agreement fees.",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
    },
    {
        icon: ShieldCheck,
        value: "100% Escrow Protected",
        label: "Zero Scam Risk",
        description: "Rent is secured in bank escrow until you physically verify and accept keys.",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
    },
    {
        icon: Clock,
        value: "48-Hour Handover",
        label: "Fast Move-In Timeline",
        description: "Instant in-app tour scheduling with 6-digit cryptographic handover OTP.",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
    },
];

export function MarketMetrics() {
    return (
        <section className="relative -mt-12 sm:-mt-16 z-20 container-wide">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {METRICS.map((item, idx) => (
                    <div
                        key={idx}
                        className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${item.bg} ${item.color} ${item.border} border`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                                Verified Metric
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                                {item.value}
                            </h3>
                            <p className="text-xs font-bold text-[var(--color-brand-green)] mt-0.5">
                                {item.label}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
