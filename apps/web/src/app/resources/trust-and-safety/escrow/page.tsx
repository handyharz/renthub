"use client";

import {
    Lock,
    ArrowRight,
    ShieldCheck,
    CheckCircle2,
    Clock,
    CreditCard,
    ArrowLeft,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function EscrowGuidePage() {
    const steps = [
        {
            title: "Tenant Finds a Home",
            description: "Browse verified properties and contact landlords directly. No agent gatekeepers.",
            icon: CheckCircle2,
        },
        {
            title: "Payment to Escrow",
            description: "Pay securely via Paystack. Funds are held in RentHub's secure escrow account.",
            icon: Lock,
        },
        {
            title: "Physical Inspection & Handover",
            description: "Meet the landlord and inspect the property. Get your keys and documents.",
            icon: ShieldCheck,
        },
        {
            title: "Confirmation & Release",
            description: "Confirm receipt on the app. Only then is money released to the landlord.",
            icon: CreditCard,
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
                    <Link href="/resources/trust-and-safety" className="hover:text-[var(--color-brand-green)]">Trust & Safety</Link>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-[var(--text-primary)] font-bold">Escrow System</span>
                </div>
            </div>

            <section className="py-20 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 text-[var(--color-brand-green)] font-black text-xs uppercase tracking-widest mb-6">
                            <Lock className="h-4 w-4" /> Secure Payments
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-8 leading-tight">
                            The RentHub <span className="text-[var(--color-brand-green)]">Escrow System</span>
                        </h1>
                        <p className="text-xl text-[var(--text-secondary)] mb-12 leading-relaxed font-medium">
                            Protecting your money is our highest priority. Our escrow system ensures that
                            landlords only get paid when you've successfully moved into your new home.
                        </p>

                        <div className="grid gap-12">
                            {/* Visual Flow */}
                            <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 md:p-12 border border-[var(--border-color)] shadow-xl">
                                <h2 className="text-2xl text-[var(--text-secondary)] font-black mb-10 text-center">How It Works</h2>
                                <div className="grid md:grid-cols-4 gap-8 relative">
                                    {/* Line connecting steps (Desktop) */}
                                    <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-[var(--bg-muted)] -z-0"></div>

                                    {steps.map((step, idx) => (
                                        <div key={step.title} className="relative z-10 flex flex-col items-center text-center">
                                            <div className="h-16 w-16 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--color-brand-green)] flex items-center justify-center mb-6 shadow-lg shadow-green-100">
                                                <step.icon className="h-8 w-8 text-[var(--color-brand-green)]" />
                                                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[var(--color-brand-green)] text-white text-xs flex items-center justify-center font-black">
                                                    {idx + 1}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-[var(--text-primary)] mb-2">{step.title}</h3>
                                            <p className="text-sm text-[var(--text-secondary)] font-medium">{step.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Explanation */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)]">
                                    <h3 className="text-xl text-[var(--text-secondary)] font-black mb-6 flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-[var(--color-brand-green)]" />
                                        Timing is Everything
                                    </h3>
                                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
                                        When you pay on RentHub, your money isn't sent to the landlord immediately.
                                        Instead, it's held by our payment partners (Paystack or Flutterwave) in a secure
                                        escrow account.
                                    </p>
                                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                                        This gives you the leverage to ensure the property is exactly as described
                                        before the transaction is finalized.
                                    </p>
                                </div>
                                <div className="bg-neutral-900 p-8 rounded-3xl text-white">
                                    <h3 className="text-xl text-gray-100 font-black mb-6 flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-[var(--color-brand-green)]" />
                                        Dispute Resolution
                                    </h3>
                                    <p className="text-gray-300 font-medium leading-relaxed mb-6">
                                        If there's a problem—the property is unavailable, the keys aren't handed over,
                                        or it's a scam—our resolution team intervenes.
                                    </p>
                                    <ul className="space-y-3">
                                        {[
                                            "100% Refund for verified scams",
                                            "Mediation for property disputes",
                                            "Secure, traceable digital trail",
                                            "24/7 Support during handover"
                                        ].map((item) => (
                                            <li key={item} className="flex items-center gap-3 text-sm font-bold">
                                                <Check className="h-4 w-4 text-[var(--color-brand-green)]" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* FAQ Snippet */}
                            <div className="bg-[var(--bg-card)] p-8 md:p-12 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
                                <h3 className="text-2xl text-[var(--text-secondary)] font-black mb-8">Frequently Asked Questions</h3>
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-[var(--text-secondary)] font-black text-lg mb-2">Is my card info safe?</h4>
                                        <p className="text-[var(--text-secondary)] font-medium">RentHub never stores your card details. All transactions are handled by PCI-compliant partners like Paystack.</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[var(--text-secondary)] font-black text-lg mb-2">How long are funds held?</h4>
                                        <p className="text-[var(--text-secondary)] font-medium">Funds are typically released 24 hours after you confirm receipt of the property keys, or as stipulated in your specific lease agreement.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 text-center">
                            <Link href="/search">
                                <Button className="bg-[var(--color-brand-green)] text-white font-black h-14 px-10 rounded-xl text-lg hover:shadow-xl hover:shadow-green-200 transition-all">
                                    Find a Home Safely
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
