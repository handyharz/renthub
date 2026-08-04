"use client";

import {
    Download,
    ArrowRight,
    CheckCircle2,
    FileText,
    Gavel,
    ShieldCheck,
    FileCheck,
    ArrowLeft,
    Clock,
    Printer
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function LegalTemplatesPage() {
    const templates = [
        {
            title: "Standard Lease Agreement",
            description: "A comprehensive, lawyer-vetted rental agreement covering all key terms, including rent duration, repair responsibilities, and termination clauses.",
            type: "PDF / DOC",
            pages: 4
        },
        {
            title: "Short-Term Rental Agreement",
            description: "Optimized for 6-month or monthly rentals. Includes specific clauses for flexible payment terms and security deposits.",
            type: "PDF / DOC",
            pages: 2
        },
        {
            title: "Rent Payment Receipt",
            description: "A professional receipt template to confirm rent collection. Essential for legal proof of payment in Nigeria.",
            type: "PDF / EXCEL",
            pages: 1
        },
        {
            title: "Property Handover Form",
            description: "A checklist to document the property's state upon move-in/move-out. Prevents disputes over security deposits.",
            type: "PDF",
            pages: 2
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
                    <span className="text-[var(--text-primary)] font-bold">Legal Templates</span>
                </div>
            </div>

            <section className="py-20 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 text-[var(--color-brand-green)] font-black text-xs uppercase tracking-widest mb-6">
                            <Gavel className="h-4 w-4" /> Legal Protection
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-8 leading-tight">
                            Free <span className="text-[var(--color-brand-green)]">Legal Templates</span>
                        </h1>
                        <p className="text-xl text-[var(--text-secondary)] mb-12 leading-relaxed font-medium">
                            Protect your investment with professional documentation. These templates are
                            vetted by legal experts to comply with Nigerian Tenancy Laws.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 mb-16">
                            {templates.map((template) => (
                                <div key={template.title} className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="h-12 w-12 rounded-2xl bg-[var(--color-brand-green)]/15 flex items-center justify-center">
                                                <FileText className="h-6 w-6 text-[var(--color-brand-green)]" />
                                            </div>
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border border-[var(--border-color)] px-2 py-1 rounded-md">
                                                {template.type}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-[var(--text-primary)] mb-4">{template.title}</h3>
                                        <p className="text-[var(--text-primary)] text-sm font-medium leading-relaxed mb-6">
                                            {template.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                        <span className="text-xs text-[var(--text-muted)] font-bold">{template.pages} Page{template.pages > 1 ? 's' : ''}</span>
                                        <Button size="sm" className="bg-[var(--color-brand-green)] font-bold rounded-lg h-10 px-6">
                                            <Download className="h-4 w-4 mr-2" /> Download
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legal Note */}
                        <div className="bg-green-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 flex gap-6">
                                <ShieldCheck className="h-12 w-12 text-green-400 shrink-0" />
                                <div>
                                    <h3 className="text-2xl font-black mb-4">A Note on Legality</h3>
                                    <p className="text-green-100 font-medium leading-relaxed mb-6 font-bold">
                                        While these templates provide a strong foundation, laws vary by state (e.g., Lagos Tenancy Law vs. Abuja recovery rules).
                                        We recommend having a final draft reviewed by a qualified legal professional for complex multi-property holdings.
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-[var(--color-brand-green)] font-black uppercase tracking-widest">
                                        <Printer className="h-4 w-4" /> Ready for Print
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20 border-t border-[var(--border-color)] pt-16 text-center">
                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-6">Need a custom contract?</h3>
                            <p className="text-[var(--text-secondary)] font-medium mb-10 max-w-2xl mx-auto">
                                Our legal partners can draft tailored agreements for your specific needs,
                                including corporate leases and commercial property terms.
                            </p>
                            <Link href="/support">
                                <Button variant="outline" className="border-[var(--border-color)] text-[var(--text-secondary)] font-bold h-14 px-10 rounded-xl text-lg hover:bg-[var(--bg-card)]">
                                    Connect with Legal Partners
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
