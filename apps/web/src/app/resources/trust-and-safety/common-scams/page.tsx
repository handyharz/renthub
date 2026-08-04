"use client";

import {
    Eye,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Info,
    AlertTriangle,
    MessageCircle,
    Navigation,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function CommonScamsPage() {
    const scams = [
        {
            title: "The Showing/Inspection Fee",
            danger: "HIGH",
            text: "Agents demand ₦5,000 - ₦20,000 just to 'show' you a house. Often, the house is already rented or doesn't exist.",
            advice: "RentHub never charges for inspections. If someone asks for money to show you a house, walk away.",
        },
        {
            title: "Fake Listing Injection",
            danger: "MEDIUM",
            text: "Scammers steal high-quality photos from other sites and list them at 'too good to be true' prices.",
            advice: "Check for the RentHub Verified badge. If a price is way below market rate for the area, it's a red flag.",
        },
        {
            title: "The Multiple Landlord Scam",
            danger: "FATAL",
            text: "Multiple 'agents' claim to represent the landlord and collect rent from 10 different people for the same unit.",
            advice: "Our escrow system holds your money until keys are delivered. This makes this scam impossible on RentHub.",
        },
        {
            title: "The Urgency Trap",
            danger: "HIGH",
            text: "'Someone is paying now, pay me to hold it for you.' Pressure tactics to force quick, unverified payments.",
            advice: "Legitimate landlords will wait for a verified transaction. Real urgency doesn't require secret payments.",
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
                    <Link href="/resources/trust-and-safety" className="hover:text-[var(--color-brand-green)]">Trust & Safety</Link>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-[var(--text-primary)] font-bold">Common Scams</span>
                </div>
            </div>

            <section className="py-16 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 text-red-500 font-extrabold text-xs uppercase tracking-widest mb-6">
                            <AlertTriangle className="h-4 w-4" /> Staying Safe
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-6 tracking-tight leading-tight">
                            Common Rental <span className="text-red-500">Scams</span> in Nigeria
                        </h1>
                        <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-12 leading-relaxed font-medium">
                            Knowledge is your best defense. Scammers thrive on darkness and desperation.
                            We've mapped their tactics so you never fall victim.
                        </p>

                        <div className="space-y-8 mb-16">
                            {scams.map((scam) => (
                                <div key={scam.title} className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm hover:border-red-500/40 transition-all group">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                        <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">{scam.title}</h3>
                                        <span className={`px-4 py-1 rounded-full text-xs font-extrabold tracking-widest border ${
                                            scam.danger === "HIGH" || scam.danger === "FATAL"
                                                ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
                                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                        }`}>
                                            DANGER: {scam.danger}
                                        </span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6 text-sm sm:text-base">
                                        {scam.text}
                                    </p>
                                    <div className="bg-[var(--color-brand-green)]/10 p-5 rounded-2xl flex items-start gap-4 border border-[var(--color-brand-green)]/20">
                                        <CheckCircle2 className="h-6 w-6 text-[var(--color-brand-green)] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-extrabold text-[var(--text-primary)] mb-1 text-sm">How to handle it:</p>
                                            <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium">{scam.advice}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Scammer Red Flags */}
                        <div className="bg-red-900/90 rounded-3xl p-8 md:p-14 text-white relative overflow-hidden mb-16 shadow-xl border border-red-700/50">
                            <h2 className="text-3xl font-extrabold mb-8 text-center relative z-10 tracking-tight">Scammer Red Flags</h2>
                            <div className="grid md:grid-cols-3 gap-6 relative z-10">
                                {[
                                    { icon: MessageCircle, text: "Refuses to talk over the phone or meet in person." },
                                    { icon: Navigation, text: "Asks for money before giving the property address." },
                                    { icon: Info, text: "Uses high-pressure tactics or guilt-tripping." }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex flex-col items-center text-center p-6 bg-black/20 rounded-2xl border border-white/10">
                                        <item.icon className="h-8 w-8 text-red-300 mb-4 shrink-0" />
                                        <p className="font-bold text-sm leading-relaxed">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                            <Eye className="absolute -bottom-10 -right-10 h-64 w-64 text-white/5" />
                        </div>

                        {/* Safe Actions */}
                        <div className="bg-[var(--bg-card)] p-8 md:p-12 rounded-3xl border border-[var(--border-color)] shadow-sm text-center">
                            <h3 className="text-2xl text-[var(--text-primary)] font-extrabold mb-4">Your Safety Protocol</h3>
                            <p className="text-[var(--text-secondary)] font-medium mb-8 max-w-2xl mx-auto text-sm sm:text-base">
                                If anything feels off, trust your instincts. RentHub provides the tools to verify,
                                but your attention to detail is the final shield.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link href="/support">
                                    <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold px-8 h-12 rounded-xl">
                                        Report Fraudulent Activity
                                    </Button>
                                </Link>
                                <Link href="/support">
                                    <Button variant="outline" className="border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] font-bold px-8 h-12 rounded-xl">
                                        Contact Security Team
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="mt-16 text-center">
                            <Link href="/resources/trust-and-safety">
                                <Button className="bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold h-12 px-8 rounded-xl inline-flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" /> Back to Trust & Safety
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
