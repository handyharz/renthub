"use client";

import {
    Scale,
    ArrowRight,
    CheckCircle2,
    BookOpen,
    FileText,
    Gavel,
    ShieldAlert,
    ArrowLeft,
    Info,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function TenantRightsPage() {
    const rights = [
        {
            title: "Right to a Written Agreement",
            text: "You are entitled to a formal tenancy agreement. Never pay without a contract that clearly states terms, duration, and rent.",
            detail: "Verbals agreements are difficult to enforce in court."
        },
        {
            title: "Right to a Proper Receipt",
            text: "Even for 'agent fees' (which we help you avoid), you must get a receipt signed by the landlord or authorized person.",
            detail: "The receipt is your proof of legal occupancy."
        },
        {
            title: "Right to Peaceful Enjoyment",
            text: "The landlord cannot enter your premises without your permission, except in an emergency.",
            detail: "Your privacy is protected by law."
        },
        {
            title: "Right to Proper Notice",
            text: "If a landlord wants you to leave, they must give you the statutory notice period as defined by law (usually 6 months for yearly tenants).",
            detail: "You cannot be 'thrown out' overnight."
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
                    <span className="text-[var(--text-primary)] font-bold">Tenant Rights 101</span>
                </div>
            </div>

            <section className="py-20 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 text-[var(--color-brand-green)] font-black text-xs uppercase tracking-widest mb-6">
                            <Scale className="h-4 w-4" /> Legal Education
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-8 leading-tight">
                            Tenant Rights <span className="text-[var(--color-brand-green)]">101</span>
                        </h1>
                        <p className="text-xl text-[var(--text-secondary)] mb-12 leading-relaxed font-medium">
                            The law protects you, but only if you know your rights. In Nigeria, many landlords
                            exploit tenant ignorance. We're here to change that.
                        </p>

                        <div className="grid gap-8 mb-16">
                            {rights.map((right) => (
                                <div key={right.title} className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="h-14 w-14 rounded-2xl bg-[var(--color-brand-green)]/15 flex items-center justify-center shrink-0">
                                            <Gavel className="h-8 w-8 text-[var(--color-brand-green)]" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4">{right.title}</h3>
                                            <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-4">
                                                {right.text}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-green-600 font-bold bg-[var(--color-brand-green)]/15 px-3 py-1 rounded-full w-fit">
                                                <Info className="h-4 w-4" /> {right.detail}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Warning Box */}
                        <div className="bg-red-50 rounded-[2.5rem] p-8 md:p-12 border border-red-100 relative overflow-hidden mb-16">
                            <div className="relative z-10 flex gap-6">
                                <ShieldAlert className="h-12 w-12 text-red-500 shrink-0" />
                                <div>
                                    <h3 className="text-2xl font-black text-red-900 mb-4">Illegal Eviction Alert</h3>
                                    <p className="text-red-800 font-medium leading-relaxed">
                                        A landlord cannot use force, remove your roof, or throw your belongings out
                                        without a court order. These are criminal offenses. If threatened with this,
                                        contact the police or a legal aid organization immediately.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* References */}
                        <div className="bg-[var(--bg-card)] p-8 md:p-12 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
                            <h3 className="text-2xl text-[var(--text-primary)] font-black mb-8">Key Legal References</h3>
                            <div className="space-y-4">
                                {[
                                    { title: "Lagos State Tenancy Law (2011)", icon: FileText },
                                    { title: "Recovery of Premises Act (Abuja)", icon: BookOpen },
                                    { title: "Nigerian Constitution (Right to Property)", icon: Gavel }
                                ].map((item) => (
                                    <div key={item.title} className="flex items-center justify-between p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] group cursor-pointer hover:bg-[var(--bg-card)] transition-all hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <item.icon className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--color-brand-green)]" />
                                            <span className="font-extrabold text-[var(--text-primary)]">{item.title}</span>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[var(--color-brand-green)]" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-16 text-center">
                            <Link href="/resources">
                                <Button className="bg-[var(--color-brand-green)] text-white font-black h-14 px-10 rounded-xl text-lg hover:shadow-xl hover:shadow-green-200 transition-all">
                                    Browse All Resources
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
