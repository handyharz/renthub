"use client";

import {
    ListChecks,
    ArrowRight,
    CheckCircle2,
    Home,
    Droplets,
    Zap,
    Shield,
    ArrowLeft,
    Download,
    Printer
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function InspectionChecklistPage() {
    const sections = [
        {
            title: "Plumbing & Water",
            icon: Droplets,
            items: [
                "Test every tap (kitchen, bathroom, toilets) for pressure.",
                "Flush all toilets; look for leaks at the base.",
                "Check under sinks for dampness or mold.",
                "Ask about the water source (Borehole vs Grid) and treatment.",
            ]
        },
        {
            title: "Electrical & Power",
            icon: Zap,
            items: [
                "Test all light switches and power sockets.",
                "Check the distribution board (DB) for burnt fuses or messy wiring.",
                "Verify the inverter/generator changeover switch works.",
                "Ask about the average daily power supply (NEPA/PHCN hours).",
            ]
        },
        {
            title: "Structure & Security",
            icon: Shield,
            items: [
                "Scan walls for deep structural cracks (ignore minor paint peeling).",
                "Check that all windows open and lock properly.",
                "Test the main entrance door and gate security.",
                "Look for signs of roof leakage on the ceiling (brown patches).",
            ]
        },
        {
            title: "The Neighborhood",
            icon: Home,
            items: [
                "Check for noise levels (clubs, churches, mosques, workshops).",
                "Observe the drainage system on the street (flooding risk).",
                "Ask about the security of the street (vigilante, gate hours).",
                "Check the proximity to your workplace or kids' school.",
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
                    <span className="text-[var(--text-primary)] font-bold">Inspection Checklist</span>
                </div>
            </div>

            <section className="py-20 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3 text-[var(--color-brand-green)] font-black text-xs uppercase tracking-widest">
                                <ListChecks className="h-4 w-4" /> Property Inspection
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="font-bold border-[var(--border-color)]">
                                    <Printer className="h-4 w-4 mr-2" /> Print
                                </Button>
                                <Button variant="outline" size="sm" className="font-bold border-[var(--border-color)]">
                                    <Download className="h-4 w-4 mr-2" /> PDF
                                </Button>
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-8 leading-tight">
                            The Ultimate <span className="text-[var(--color-brand-green)]">Inspection Checklist</span>
                        </h1>
                        <p className="text-xl text-[var(--text-secondary)] mb-12 leading-relaxed font-medium">
                            Don't let excitement cloud your judgment. Use this checklist during your physical
                            tour to ensure the house is actually worth your hard-earned money.
                        </p>

                        <div className="space-y-10">
                            {sections.map((section) => (
                                <div key={section.title} className="bg-[var(--bg-card)] rounded-[2rem] p-8 border border-[var(--border-color)] shadow-sm">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-12 w-12 rounded-2xl bg-[var(--color-brand-green)]/15 flex items-center justify-center">
                                            <section.icon className="h-6 w-6 text-[var(--color-brand-green)]" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)]">{section.title}</h3>
                                    </div>
                                    <div className="grid gap-4">
                                        {section.items.map((item) => (
                                            <div key={item} className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--bg-muted)] hover:bg-[var(--bg-card)] hover:shadow-md transition-all border border-transparent hover:border-green-100 group cursor-pointer">
                                                <div className="h-6 w-6 rounded border-2 border-[var(--border-color)] group-hover:border-[var(--color-brand-green)] group-hover:bg-[var(--color-brand-green)]/15 flex items-center justify-center shrink-0 mt-0.5">
                                                    <CheckCircle2 className="h-4 w-4 text-white group-hover:text-[var(--color-brand-green)]" />
                                                </div>
                                                <p className="text-[var(--text-primary)] font-extrabold">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pro Tip Box */}
                        <div className="mt-16 bg-[var(--color-brand-green)] rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-6">Pro Tip: The Night Visit</h3>
                                <p className="text-green-50 text-lg leading-relaxed font-medium">
                                    A house can look perfect at 1 PM. Try to visit the area again around 7 PM or 8 PM.
                                    This is when you'll truly know about the power supply, street lighting, neighborhood
                                    noise levels, and overall security vibe.
                                </p>
                            </div>
                            <Home className="absolute -bottom-10 -right-10 h-64 w-64 text-white/5" />
                        </div>

                        <div className="mt-16 text-center">
                            <Link href="/search">
                                <Button className="bg-[var(--color-brand-green)] text-white font-black h-14 px-10 rounded-xl text-lg hover:shadow-xl hover:shadow-green-200 transition-all">
                                    Start Your Search
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
