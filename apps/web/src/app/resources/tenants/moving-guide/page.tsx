"use client";

import {
    Key,
    ArrowRight,
    CheckCircle2,
    Truck,
    Lightbulb,
    ShieldCheck,
    Box,
    ArrowLeft,
    Clock,
    MapPin
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function MovingGuidePage() {
    const phases = [
        {
            title: "2 Weeks Before",
            icon: Clock,
            items: [
                "Finalize your lease agreement.",
                "Hire a reliable moving company (or book a truck).",
                "Start decluttering and selling things you don't need.",
                "Notity your current landlord of your move-out date.",
            ]
        },
        {
            title: "Packing Day",
            icon: Box,
            items: [
                "Pack an 'Essentials Bag' (toiletries, change of clothes, basic tools).",
                "Label every box with the room name and its contents.",
                "Take photos of fragile items for insurance purposes.",
                "Ensure all bills are settled at your old place.",
            ]
        },
        {
            title: "Move-In Day",
            icon: Truck,
            items: [
                "Take final meter readings (EDC/Light) at the new place.",
                "Do a final walkthrough before the furniture goes in.",
                "Update your address with banks and delivery services.",
                "Introduce yourself to the security guard/facility manager.",
            ]
        },
        {
            title: "First Week",
            icon: Key,
            items: [
                "Change the locks (unless it's a new, managed development).",
                "Test all appliances and power supplies one more time.",
                "Explore the local neighborhood (market, pharmacy, hospital).",
                "Setup your internet and local bill payments.",
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
                    <span className="text-[var(--text-primary)] font-bold">The Moving Guide</span>
                </div>
            </div>

            <section className="py-20 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 text-[var(--color-brand-green)] font-black text-xs uppercase tracking-widest mb-6 transition-colors">
                            <Truck className="h-4 w-4" /> Relocation Guide
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-8 leading-tight">
                            The Complete <span className="text-[var(--color-brand-green)]">Moving Guide</span>
                        </h1>
                        <p className="text-xl text-[var(--text-secondary)] mb-12 leading-relaxed font-medium">
                            Moving is stressful, especially in Nigeria. From light bills to security guards,
                            we've mapped out the perfect move-in sequence so you don't miss a beat.
                        </p>

                        <div className="relative border-l-2 border-green-100 ml-4 md:ml-6 space-y-16 py-8">
                            {phases.map((phase, idx) => (
                                <div key={phase.title} className="relative pl-10 md:pl-16">
                                    {/* Timeline dot */}
                                    <div className="absolute top-0 left-[-11px] h-5 w-5 rounded-full bg-[var(--color-brand-green)] border-4 border-white shadow-sm"></div>

                                    <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="h-12 w-12 rounded-2xl bg-[var(--color-brand-green)]/15 flex items-center justify-center">
                                                <phase.icon className="h-6 w-6 text-[var(--color-brand-green)]" />
                                            </div>
                                            <h3 className="text-2xl font-black text-[var(--text-primary)]">{phase.title}</h3>
                                        </div>
                                        <ul className="space-y-4">
                                            {phase.items.map((item) => (
                                                <li key={item} className="flex items-start gap-3 font-extrabold text-[var(--text-primary)]">
                                                    <CheckCircle2 className="h-5 w-5 text-[var(--color-brand-green)] mt-0.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Critical Reminder */}
                        <div className="mt-16 bg-[var(--color-brand-green)] rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 flex gap-6">
                                <Lightbulb className="h-12 w-12 text-green-300 shrink-0" />
                                <div>
                                    <h3 className="text-2xl font-black mb-4 text-white">The "Utility Split" Rule</h3>
                                    <p className="text-green-50 font-medium leading-relaxed">
                                        In Nigeria, many properties share light and water meters. Ensure you get
                                        a formal handover of current bill readings and a signed agreement on how
                                        future bills will be split between neighbors.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 text-center">
                            <Link href="/search">
                                <Button className="bg-[var(--color-brand-green)] text-white font-black h-14 px-10 rounded-xl text-lg hover:shadow-xl hover:shadow-green-200 transition-all">
                                    Find Your Next Home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
