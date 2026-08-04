"use client";

import { useState } from "react";
import {
    Users,
    ArrowRight,
    CheckCircle2,
    MessageCircle,
    Trophy,
    ShieldCheck,
    Zap,
    Heart,
    Star,
    ArrowLeft,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { toast } from "sonner";

export default function CommunityPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSubscribed(true);
            toast.success("Subscribed to Manifesto Daily! 🎉", {
                description: `We sent a confirmation link to ${email}. You will get weekly verified property updates.`
            });
        }, 800);
    };

    const benefits = [
        {
            title: "Early Access",
            text: "Get notified about verified properties 12 hours before they go public.",
            icon: Zap,
            color: "text-blue-500",
            bg: "bg-blue-500/15 border-blue-500/30"
        },
        {
            title: "Legal Advice",
            text: "Ask questions and get answers from our legal partners about tenancy rights.",
            icon: ShieldCheck,
            color: "text-[var(--color-brand-green)]",
            bg: "bg-emerald-500/15 border-emerald-500/30"
        },
        {
            title: "Reputation Points",
            text: "Higher points mean lower platform fees and faster property verification.",
            icon: Trophy,
            color: "text-amber-500",
            bg: "bg-amber-500/15 border-amber-500/30"
        },
        {
            title: "Member Events",
            text: "Monthly meetups in Abuja for landlords and tenants to share experiences.",
            icon: Heart,
            color: "text-red-500",
            bg: "bg-red-500/15 border-red-500/30"
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
            {/* Header / Nav context */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] py-4">
                <div className="container-wide flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                    <Link href="/resources" className="hover:text-[var(--color-brand-green)] flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" /> Resources
                    </Link>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-[var(--text-primary)] font-bold">Community Hub</span>
                </div>
            </div>

            {/* Hero */}
            <section className="py-20 bg-[var(--bg-primary)] overflow-hidden relative">
                <div className="container-wide relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-500 text-xs font-extrabold uppercase tracking-widest mb-8">
                        🌍 Stronger Together
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[var(--text-primary)] mb-6 tracking-tight leading-tight">
                        Power to the <br className="hidden sm:inline" />
                        <span className="text-[var(--color-brand-green)]">Community</span>.
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg sm:text-xl text-[var(--text-secondary)] mb-10 font-medium leading-relaxed">
                        Join 2,500+ verified landlords and tenants in Nigeria's largest agent-free
                        community. Transparency is a team sport.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold h-14 px-10 text-lg rounded-2xl shadow-lg shadow-emerald-900/20">
                            Join Discord
                        </Button>
                        <Button variant="outline" className="border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-bold h-14 px-10 text-lg rounded-2xl">
                            WhatsApp Group
                        </Button>
                    </div>
                </div>
                {/* Decorative backgrounds */}
                <Users className="absolute -bottom-10 -left-10 h-64 w-64 text-[var(--border-color)]/20" />
                <MessageCircle className="absolute top-10 -right-10 h-48 w-48 text-[var(--border-color)]/20" />
            </section>

            {/* Benefits Grid */}
            <section className="py-16 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] mb-3 tracking-tight">Why Join?</h2>
                        <p className="text-[var(--text-secondary)] font-medium text-sm sm:text-base">Being a part of the movement comes with its perks.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        {benefits.map((benefit) => (
                            <div key={benefit.title} className="p-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40 hover:shadow-md transition-all group">
                                <div className={`h-14 w-14 ${benefit.bg} ${benefit.color} rounded-2xl border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shrink-0`}>
                                    <benefit.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-3">{benefit.title}</h3>
                                <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium leading-relaxed">{benefit.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Community Reviews / Social Proof */}
                    <div className="bg-[var(--bg-card)] rounded-3xl p-8 md:p-14 border border-[var(--border-color)] relative overflow-hidden shadow-sm">
                        <div className="flex flex-col items-center text-center max-w-3xl mx-auto relative z-10">
                            <div className="flex gap-1.5 mb-6">
                                {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-6 w-6 fill-amber-400 text-amber-400" />)}
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] italic mb-8 leading-relaxed">
                                "The RentHub community saved me ₦450k in agent fees this year.
                                The legal templates in the community folder alone were worth joining for!"
                            </p>
                            <div className="flex gap-4 items-center">
                                <div className="h-12 w-12 rounded-full bg-[var(--color-brand-green)]/15 border-2 border-[var(--color-brand-green)] flex items-center justify-center text-[var(--color-brand-green)] font-extrabold">
                                    CO
                                </div>
                                <div className="text-left">
                                    <p className="font-extrabold text-[var(--text-primary)] text-base">Chioma O.</p>
                                    <p className="text-[10px] text-[var(--text-secondary)] font-extrabold uppercase tracking-widest">Verified Member • Abuja</p>
                                </div>
                            </div>
                        </div>
                        <CheckCircle2 className="absolute -top-10 -left-10 h-48 w-48 text-[var(--border-color)]/20" />
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="py-12 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="bg-[var(--color-brand-blue)] rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden shadow-xl">
                        <h2 className="text-3xl font-extrabold mb-4 tracking-tight">Manifesto Daily</h2>
                        <p className="text-blue-100 font-medium mb-8 text-sm sm:text-base">Get weekly updates on our mission and new verified properties.</p>
                        
                        {subscribed ? (
                            <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-6 max-w-lg mx-auto flex items-center justify-center gap-3 text-white font-extrabold text-base">
                                <CheckCircle2 className="h-6 w-6 text-[var(--color-brand-green)] shrink-0" />
                                <span>You are subscribed to Manifesto Daily! Check your inbox.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="flex-1 h-14 rounded-xl px-5 bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:border-[var(--color-brand-green)] font-semibold text-sm transition-colors"
                                />
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold h-14 px-8 rounded-xl shrink-0"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Subscribe"}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
