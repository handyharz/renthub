"use client";

import { useEffect, useState } from "react";
import {
    Target,
    ShieldCheck,
    Zap,
    TrendingUp,
    Users,
    Building2,
    ArrowRight,
    CheckCircle2,
    Heart,
    MessageSquare,
    Globe,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import api from "@/lib/api";

export default function ManifestoPage() {
    const [stats, setStats] = useState({
        verifiedProperties: 0,
        communityMembers: 0,
        totalSavings: 0,
        impactCities: 1
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get("/stats/public");
                if (response.data.success) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching mission stats:", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white selection:bg-[var(--color-brand-green)] selection:text-black">
            {/* Header / Nav context */}
            <div className="border-b border-white/5 py-4 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container-wide flex items-center justify-between">
                    <Link href="/resources" className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Resources
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[var(--color-brand-green)]/150 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Live Impact Mode</span>
                    </div>
                </div>
            </div>

            {/* Impact Hero */}
            <section className="relative py-24 md:py-32 overflow-hidden border-b border-white/5">
                <div className="container-wide relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-card)]/5 border border-white/10 text-[var(--color-brand-green)] text-xs font-black uppercase tracking-widest mb-8">
                        🚀 The Mission
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tight leading-[0.9]">
                        Our North Star: <br />
                        <span className="text-[var(--color-brand-green)]">₦10 Billion</span> Saved.
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-[var(--text-muted)] mb-12 font-medium leading-relaxed">
                        RentHub exists to eliminate the agent tax and return money to the pockets
                        of hard-working Nigerians. We're not just building an app; we're fixing a market.
                    </p>

                    {/* Live Stats Ticker */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto">
                        <div className="bg-[var(--bg-card)]/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
                            <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest mb-2">Total Savings</p>
                            <p className="text-2xl md:text-4xl font-black text-[var(--color-brand-green)]">₦{stats.totalSavings.toLocaleString()}</p>
                        </div>
                        <div className="bg-[var(--bg-card)]/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
                            <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest mb-2">Verified Homes</p>
                            <p className="text-2xl md:text-4xl font-black">{stats.verifiedProperties}</p>
                        </div>
                        <div className="bg-[var(--bg-card)]/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
                            <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest mb-2">Community</p>
                            <p className="text-2xl md:text-4xl font-black">{stats.communityMembers}+</p>
                        </div>
                        <div className="bg-[var(--bg-card)]/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
                            <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest mb-2">Impact Cities</p>
                            <p className="text-2xl md:text-4xl font-black text-blue-400">{stats.impactCities}</p>
                        </div>
                    </div>
                </div>

                {/* Abstract Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[var(--color-brand-blue)]/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[var(--color-brand-green)]/10 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4"></div>
                </div>
            </section>

            {/* The Story */}
            <section className="py-24 bg-gray-900">
                <div className="container-wide">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="h-14 w-14 rounded-2xl bg-[var(--color-brand-green)]/10 flex items-center justify-center border border-[var(--color-brand-green)]/20">
                                <Heart className="h-8 w-8 text-[var(--color-brand-green)]" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black">Born from Frustration.</h2>
                        </div>

                        <div className="space-y-8 text-lg md:text-xl text-[var(--text-muted)] font-medium leading-[1.6]">
                            <p>
                                Every year, millions of Nigerians pay between <span className="text-white font-black">₦300,000 to ₦600,000</span> in agent fees. For what? Opening a door? Making a phone call?
                            </p>
                            <p className="p-8 bg-[var(--bg-card)]/[0.02] border-l-4 border-[var(--color-brand-green)] rounded-r-3xl italic text-gray-300">
                                "My dad paid ₦600,000 to an agent for a ₦2.5M apartment. He had 'no choice' because the alternatives were worse. I watched him accepted that exploitation, and I knew I had to build a way out."
                            </p>
                            <p>
                                RentHub is the answer. We're a trusted platform where <span className="text-white font-black">landlords list directly</span> and <span className="text-white font-black">tenants search freely</span>. No gatekeepers. No fake listings. No surprise charges.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-24 border-y border-white/5 bg-black/20">
                <div className="container-wide">
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                title: "Transparency First",
                                text: "All prices shown upfront. No hidden fees. No manufactured urgency.",
                                icon: Zap,
                                color: "text-yellow-400"
                            },
                            {
                                title: "Trust Through Code",
                                text: "Physical verification of every property and an escrow system that protects your rent.",
                                icon: ShieldCheck,
                                color: "text-blue-400"
                            },
                            {
                                title: "Fair Economics",
                                text: "A balanced 2% escrow fee model replaces the predatory 10-20% street agent commission, protecting both tenant and landlord.",
                                icon: TrendingUp,
                                color: "text-[var(--color-brand-green)]"
                            }
                        ].map((value) => (
                            <div key={value.title} className="group">
                                <value.icon className={`h-10 w-10 ${value.color} mb-6 transition-transform group-hover:scale-110`} />
                                <h3 className="text-2xl font-black mb-4">{value.title}</h3>
                                <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{value.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Vision */}
            <section className="py-24 bg-gray-900 overflow-hidden relative">
                <div className="container-wide relative z-10">
                    <div className="bg-gradient-to-br from-[var(--color-brand-blue)] to-blue-900 rounded-[3rem] p-8 md:p-20 relative overflow-hidden">
                        <div className="max-w-3xl">
                            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">
                                We're Building the <br />
                                <span className="text-[var(--color-brand-green)]">Market of the Future</span>.
                            </h2>
                            <p className="text-blue-100 text-lg md:text-xl font-medium mb-12 leading-relaxed">
                                Our goal is to save Nigerians ₦10 Billion in agent fees over the next 5 years.
                                Starting in Abuja, we're expanding nationally to bring transparency to every rental transaction.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/search">
                                    <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-black font-black h-16 px-10 text-xl rounded-2xl w-full sm:w-auto">
                                        Join the Movement
                                    </Button>
                                </Link>
                                <Link href="/community">
                                    <Button className="bg-[var(--bg-card)] text-[var(--color-brand-blue)] hover:bg-[var(--bg-card)]/90 h-16 px-10 text-xl font-bold rounded-2xl w-full sm:w-auto">
                                        Join Community
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Decorative Icons */}
                        <Globe className="absolute -bottom-20 -right-20 h-96 w-96 text-white/5" />
                        <Building2 className="absolute top-10 right-10 h-32 w-32 text-white/5" />
                    </div>
                </div>
            </section>

            {/* Footer / CTA */}
            <section className="py-24 bg-black/40 text-center">
                <div className="container-wide">
                    <div className="inline-flex items-center gap-2 mb-8 text-[var(--text-secondary)]">
                        <MessageSquare className="h-5 w-5" />
                        <span className="font-black text-sm uppercase tracking-widest">Talk to us</span>
                    </div>
                    <h3 className="text-2xl md:text-4xl font-black mb-12">
                        Transparent. Direct. Agent-Free. <br />
                        <span className="text-[var(--text-secondary)] font-medium italic">Welcome to RentHub.</span>
                    </h3>
                </div>
            </section>
        </div>
    );
}
