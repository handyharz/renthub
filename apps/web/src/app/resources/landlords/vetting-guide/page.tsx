"use client";

import {
    UserCheck,
    ArrowRight,
    CheckCircle2,
    ShieldCheck,
    Search,
    FileText,
    Users,
    ArrowLeft,
    Clock,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function VettingGuidePage() {
    const steps = [
        {
            title: "Identity Verification",
            icon: ShieldCheck,
            items: [
                "Request a valid government ID (NIN, Driver's License, or International Passport).",
                "Verify that the name on the ID matches the person standing in front of you.",
                "Check for the RentHub 'Verified' badge on their tenant profile.",
            ]
        },
        {
            title: "Proof of Income",
            icon: FileText,
            items: [
                "Request the last 3 months of bank statements (looking for stable regular income).",
                "Ask for an employment letter or a business registration document (CAC).",
                "Verify that the rent is not more than 30% of their annual income.",
            ]
        },
        {
            title: "Reference Checks",
            icon: Users,
            items: [
                "Ask for the contact of their previous landlord (not just a friend).",
                "Call the employer to confirm their employment status.",
                "Speak to at least one professional reference.",
            ]
        },
        {
            title: "The Interview",
            icon: Search,
            items: [
                "Ask why they are moving from their current location.",
                "Understand who else will be living in the property.",
                "Observe their communication style and punctuality.",
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header / Nav context */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] py-4">
                <div className="container-wide flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                    <Link href="/resources" className="hover:text-[var(--color-brand-green)] flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" /> Resources
                    </Link>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-[var(--text-primary)] font-bold">Direct Vetting Guide</span>
                </div>
            </div>

            <section className="py-20 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 text-[var(--color-brand-green)] font-black text-xs uppercase tracking-widest mb-6">
                            <UserCheck className="h-4 w-4" /> Professional Vetting
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-8 leading-tight">
                            The <span className="text-[var(--color-brand-green)]">Direct Vetting</span> Guide
                        </h1>
                        <p className="text-xl text-[var(--text-secondary)] mb-12 leading-relaxed font-medium">
                            You don't need an agent to find a great tenant. Follow this systematic approach
                            to verify your potential tenants' identity, income, and reliability.
                        </p>

                        <div className="space-y-10 mb-16">
                            {steps.map((step) => (
                                <div key={step.title} className="bg-[var(--bg-card)] rounded-[2rem] p-8 border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-12 w-12 rounded-2xl bg-[var(--color-brand-green)]/15 flex items-center justify-center">
                                            <step.icon className="h-6 w-6 text-[var(--color-brand-green)]" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)]">{step.title}</h3>
                                    </div>
                                    <div className="grid gap-4">
                                        {step.items.map((item) => (
                                            <div key={item} className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--bg-muted)] border border-transparent">
                                                <CheckCircle2 className="h-5 w-5 text-[var(--color-brand-green)] shrink-0 mt-0.5" />
                                                <p className="text-[var(--text-primary)] font-extrabold">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Critical Reminder - Red Flags */}
                        <div className="bg-red-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 flex gap-6">
                                <AlertCircle className="h-12 w-12 text-red-300 shrink-0" />
                                <div>
                                    <h3 className="text-2xl font-black mb-4 text-red-400">Vetting Red Flags</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-2 text-sm font-bold text-red-100">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                                            Too much cash upfront with no proof of income.
                                        </li>
                                        <li className="flex items-start gap-2 text-sm font-bold text-red-100">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                                            Extreme urgency to move in "today" or "tonight."
                                        </li>
                                        <li className="flex items-start gap-2 text-sm font-bold text-red-100">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                                            Inconsistency between their story and their documents.
                                        </li>
                                        <li className="flex items-start gap-2 text-sm font-bold text-red-100">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                                            Hesitation to let you call their previous landlord.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 text-center">
                            <Link href="/dashboard?tab=properties">
                                <Button className="bg-[var(--color-brand-green)] text-white font-black h-14 px-10 rounded-xl text-lg hover:shadow-xl hover:shadow-green-200 transition-all">
                                    Manage My Listings
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
