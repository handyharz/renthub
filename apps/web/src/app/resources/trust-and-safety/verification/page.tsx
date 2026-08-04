"use client";

import {
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    Eye,
    Home,
    FileText,
    Camera,
    Check,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function VerificationStandardsPage() {
    const categories = [
        {
            title: "Physical Infrastructure",
            icon: Home,
            items: [
                "Structural integrity (no major cracks)",
                "Plumbing check (no leaks, good pressure)",
                "Electrical safety (no exposed wiring)",
                "Water supply verification (borehole/grid)",
            ]
        },
        {
            title: "Safety & Security",
            icon: ShieldCheck,
            items: [
                "Gate and door locks verification",
                "Neighboring environment assessment",
                "Fire safety check (in managed flats)",
                "Power supply reliability (Grid/Gen/Solar)",
            ]
        },
        {
            title: "Document Verification",
            icon: FileText,
            items: [
                "Proof of ownership (C of O/Deed)",
                "Landlord identity verification (NIN/Voters)",
                "Utility bill reconciliation",
                "Lien & legal encumbrance check",
            ]
        },
        {
            title: "Media Integrity",
            icon: Camera,
            items: [
                "Photos taken by RentHub agents",
                "360° virtual tour capture",
                "Current state timestamping",
                "Misleading feature filtering",
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header / Nav context */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] py-4">
                <div className="container-wide flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                    <Link href="/resources" className="hover:text-[var(--color-brand-blue)] flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" /> Resources
                    </Link>
                    <ArrowRight className="h-3 w-3" />
                    <Link href="/resources/trust-and-safety" className="hover:text-[var(--color-brand-blue)]">Trust & Safety</Link>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-[var(--text-primary)] font-bold">Verification Standards</span>
                </div>
            </div>

            <section className="py-20 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 text-[var(--color-brand-green)] font-black text-xs uppercase tracking-widest mb-6 transition-all hover:scale-105">
                            <ShieldCheck className="h-4 w-4" /> The Gold Standard
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-8 leading-tight">
                            Our <span className="text-[var(--color-brand-green)]">Verification</span> Standards
                        </h1>
                        <p className="text-xl text-[var(--text-secondary)] mb-12 leading-relaxed font-medium">
                            When you see the "Verified" badge on RentHub, it means a human being from our team
                            has physically walked through that property and checked every detail.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 mb-16">
                            {categories.map((cat) => (
                                <div key={cat.title} className="bg-[var(--bg-card)] text-[var(--text-secondary)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm hover:shadow-lg transition-all">
                                    <div className="h-12 w-12 rounded-2xl bg-[var(--color-brand-green)]/15 flex items-center justify-center mb-6">
                                        <cat.icon className="h-6 w-6 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-black mb-6">{cat.title}</h3>
                                    <ul className="space-y-4">
                                        {cat.items.map((item) => (
                                            <li key={item} className="flex items-start gap-3 text-sm font-bold text-[var(--text-secondary)]">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Why We Do This */}
                        <div className="bg-gray-900 rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden mb-16 shadow-2xl">
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                                <div className="md:w-1/2">
                                    <h2 className="text-3xl font-black mb-6 leading-tight">We're your eyes on the ground.</h2>
                                    <p className="text-[var(--text-muted)] font-medium mb-0 leading-relaxed">
                                        In Nigeria, photos are often stolen from other listings or taken 10 years ago.
                                        Our agents take fresh photos with a specific RentHub timestamp to ensure what you
                                        see is what you get.
                                    </p>
                                </div>
                                <div className="md:w-1/2 flex justify-center">
                                    <div className="relative">
                                        <div className="h-48 w-48 rounded-full border-4 border-dashed border-green-500/50 flex items-center justify-center animate-spin-slow">
                                            <Eye className="h-20 w-20 text-green-400 opacity-50" />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ShieldCheck className="h-12 w-12 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--bg-card)] p-8 md:p-12 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
                            <h3 className="text-2xl text-[var(--text-secondary)] font-black mb-8">What "Unverified" Means</h3>
                            <p className="text-[var(--text-secondary)] font-medium mb-8 leading-relaxed">
                                Some listings on our platform may not have the green badge yet. This usually means:
                            </p>
                            <div className="grid gap-4">
                                {[
                                    "The property was just listed and is in the verification queue.",
                                    "The landlord opted out of our verification service (caution advised).",
                                    "The property is in a region where we don't yet have field agents."
                                ].map((reason) => (
                                    <div key={reason} className="flex items-center gap-4 p-4 bg-[var(--bg-card)] rounded-2xl text-[var(--text-secondary)] font-bold border border-[var(--border-color)]">
                                        <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                                        {reason}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-16 text-center">
                            <Link href="/search">
                                <Button className="bg-[var(--color-brand-green)] text-white font-black h-14 px-10 rounded-xl text-lg hover:shadow-xl hover:shadow-green-200 transition-all">
                                    View Verified Properties
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
