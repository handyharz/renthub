"use client";

import {
    ShieldCheck,
    Lock,
    Eye,
    Target,
    Zap,
    Scale,
    Users,
    CheckCircle2,
    XCircle,
    Info,
    ArrowRight,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function TrustAndSafetyPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
            {/* Header / Nav context */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] py-4">
                <div className="container-wide flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                    <Link href="/resources" className="hover:text-[var(--color-brand-blue)]">Resources</Link>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-[var(--text-primary)] font-bold">Trust & Safety</span>
                </div>
            </div>

            {/* Hero Section - The Moat */}
            <section className="relative py-20 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
                <div className="container-wide relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[var(--color-brand-blue)] text-xs font-black uppercase tracking-widest mb-6 transition-transform hover:scale-105">
                        🛡️ Our Commitment
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
                        Built on <span className="text-[var(--color-brand-blue)]">Trust</span>. <br />
                        Protected by <span className="text-[var(--color-brand-green)]">Code</span>.
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-[var(--text-secondary)] mb-10 leading-relaxed font-medium">
                        We're dismantling the broken agent system to save Nigerians billions.
                        Here's how we protect your money and your peace of mind.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/onboarding">
                            <Button className="bg-[var(--color-brand-green)] hover:shadow-lg hover:shadow-green-200 transition-all font-bold h-14 px-8 rounded-xl text-lg">
                                Get Verified
                            </Button>
                        </Link>
                        <Link href="/search">
                            <Button variant="outline" className="border-[var(--border-color)] hover:bg-[var(--bg-card)] font-bold h-14 px-8 rounded-xl text-lg w-full sm:w-auto">
                                <Search className="mr-2 h-5 w-5" /> Browse Properties
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-0 pointer-events-none opacity-20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-100 rounded-full blur-3xl"></div>
                </div>
            </section>

            {/* The "Why" - The Agent Tax */}
            <section className="py-20 bg-[var(--bg-card)]">
                <div className="container-wide">
                    <div className="bg-gray-900 rounded-[2.5rem] p-8 md:p-16 text-white overflow-hidden relative shadow-2xl transition-all hover:shadow-blue-900/10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black mb-8 leading-tight">
                                    The <span className="text-red-500">₦600,000</span> Identity Crisis.
                                </h2>
                                <p className="text-[var(--text-muted)] text-lg mb-8 font-medium italic">
                                    "My Dad paid ₦600,000 to an agent for a ₦2.5M apartment.
                                    24% of his rent—for opening a door and making a phone call."
                                </p>
                                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                                    This exploitation is the norm in Nigeria, but it's not inevitable.
                                    Agents hoard listings and manufactured urgency to force payments.
                                    RentHub exists to kill the "Agent Tax."
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-[var(--bg-card)]/5 rounded-2xl border border-white/10">
                                        <div className="h-10 w-10 bg-red-500/10 flex items-center justify-center rounded-full">
                                            <XCircle className="h-6 w-6 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Traditional Fees: 10% - 30%</p>
                                            <p className="text-xs text-[var(--text-secondary)]">Extracted by middlemen with zero accountability.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-[var(--color-brand-green)]/10 rounded-2xl border border-[var(--color-brand-green)]/20">
                                        <div className="h-10 w-10 bg-[var(--color-brand-green)]/20 flex items-center justify-center rounded-full">
                                            <CheckCircle2 className="h-6 w-6 text-[var(--color-brand-green)]" />
                                        </div>
                                        <div>
                                            <p className="font-bold">RentHub Fee: 2%</p>
                                            <p className="text-xs text-green-500/80 font-bold">Reinvested into verification and your protection.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                {/* Visualizing the savings */}
                                <div className="bg-[var(--bg-card)] rounded-3xl p-8 border border-[var(--border-color)] shadow-xl text-[var(--text-primary)]">
                                    <h3 className="text-2xl font-black mb-6">Price Transparency</h3>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-sm text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1 text-[10px]">Annual Rent</p>
                                                <p className="text-3xl font-black">₦2,500,000</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-red-500 font-black mb-1">Agent: ₦250k+</p>
                                                <p className="text-sm text-[var(--color-brand-green)] font-black">RentHub: ₦50k</p>
                                            </div>
                                        </div>
                                        <div className="h-6 w-full bg-[var(--bg-muted)] rounded-full overflow-hidden flex font-bold text-white text-[10px]">
                                            <div className="w-[80%] bg-[var(--color-brand-blue)] h-full flex items-center justify-center">RENT</div>
                                            <div className="w-[18%] bg-red-400 h-full flex items-center justify-center">AGENT</div>
                                            <div className="w-[2%] bg-[var(--color-brand-green)]/150 h-full"></div>
                                        </div>
                                        <div className="pt-6 border-t border-[var(--border-color)]">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="font-bold text-[var(--text-secondary)]">Total Saved</p>
                                                <p className="text-2xl font-black text-[var(--color-brand-green)]">₦200,000+</p>
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)] font-medium font-bold">
                                                Enough to pay for a year of electricity or a decent generator.
                                            </p>
                                        </div>
                                        <Link href="/search">
                                            <Button className="w-full bg-[var(--color-brand-green)] font-bold rounded-xl h-12">
                                                Save with RentHub
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                                <Zap className="absolute -top-10 -right-10 h-32 w-32 text-[var(--color-brand-green)] animate-pulse hidden lg:block" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Pillars */}
            <section className="py-24 bg-[var(--bg-muted)]">
                <div className="container-wide">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-4">
                            How We Make It <span className="text-[var(--color-brand-blue)]">Safe</span>.
                        </h2>
                        <p className="text-[var(--text-secondary)] font-medium text-lg">
                            We've built a multi-layered trust system from the ground up.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Physical Verification */}
                        <Link href="/resources/trust-and-safety/verification" className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all group">
                            <div className="h-16 w-16 bg-blue-500/15 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="h-8 w-8 text-[var(--color-brand-blue)]" />
                            </div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4">Physical Verification</h3>
                            <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
                                We don't just host ads. Every "Verified" property on RentHub has been physically visited by our field agents.
                                We check the plumbing, the wiring, and verify the owner's legal claim.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    "Physical field inspections",
                                    "Live property walkthroughs",
                                    "Document veracity checks",
                                    "Owner ID verification"
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-bold">
                                        <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-[var(--color-brand-blue)] font-black text-sm uppercase tracking-widest">
                                Learn Standards <ArrowRight className="h-4 w-4" />
                            </div>
                        </Link>

                        {/* Escrow System */}
                        <Link href="/resources/trust-and-safety/escrow" className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all group">
                            <div className="h-16 w-16 bg-[var(--color-brand-green)]/15 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <Lock className="h-8 w-8 text-[var(--color-brand-green)]" />
                            </div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4">Escrow Protection</h3>
                            <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
                                Your money doesn't go straight to the unknown. We hold funds in escrow via Paystack/Flutterwave.
                                Money is only released once you confirm receipt of keys and entry.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    "Paystack Secure Checkout",
                                    "Automated Refund Policy",
                                    "Dispute mediation team",
                                    "No cash, no gray areas"
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-bold">
                                        <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-[var(--color-brand-green)] font-black text-sm uppercase tracking-widest">
                                How it Works <ArrowRight className="h-4 w-4" />
                            </div>
                        </Link>

                        {/* Transparent Communication */}
                        <Link href="/resources/trust-and-safety/common-scams" className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all group">
                            <div className="h-16 w-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <Users className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4">Direct Connection</h3>
                            <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
                                We believe in the power of direct connection. No gatekeepers, no "inspection fee" to see a room.
                                Talk directly to landlords and verified property managers.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    "In-app secure messaging",
                                    "No showing fees, ever",
                                    "Review history access",
                                    "Clear communication logs"
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-bold">
                                        <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-purple-600 font-black text-sm uppercase tracking-widest">
                                Avoid Scams <ArrowRight className="h-4 w-4" />
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Red Flags Section */}
            <section className="py-24 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
                <div className="container-wide">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <div className="h-12 w-12 bg-red-50 flex items-center justify-center rounded-2xl mb-8">
                                <Eye className="h-6 w-6 text-red-500" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-8 leading-tight">
                                Spotting the <span className="text-red-500">Red Flags</span>.
                            </h2>
                            <p className="text-lg text-[var(--text-secondary)] font-medium mb-10 leading-relaxed">
                                Don't get caught in the "manufacturing of urgency." The agent system relies on pressure.
                                Here is what to watch out for in the wild.
                            </p>
                            <div className="space-y-6">
                                {[
                                    { title: "Showing Fees", text: "Never pay to simply 'view' a property. It's a hallmark of agent scams.", icon: XCircle },
                                    { title: "Cash-Only Requests", text: "Untraceable cash is the enemy of safety. Always pay through a traceable digital channel.", icon: XCircle },
                                    { title: "False Urgency", text: "'Pay now or someone else will.' Take your time. Inspect thoroughly.", icon: XCircle },
                                    { title: "Missing Owners", text: "If the 'owner' is too busy to be identified or verified, walk away.", icon: XCircle }
                                ].map((flag) => (
                                    <div key={flag.title} className="flex gap-4">
                                        <flag.icon className="h-6 w-6 text-red-400 shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-black text-[var(--text-primary)]">{flag.title}</h4>
                                            <p className="text-[var(--text-secondary)] text-sm font-medium font-bold">{flag.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-red-50 rounded-[3rem] p-12 aspect-square flex flex-col items-center justify-center text-center">
                                <Scale className="h-20 w-20 text-red-100 mb-8" />
                                <h3 className="text-2xl font-black text-red-900 mb-4 leading-tight">Your Rights Matter.</h3>
                                <p className="text-red-800 font-medium mb-8 font-bold">
                                    Under the Nigerian Tenancy Act, you are entitled to receipts, notices, and fair treatment.
                                    Don't let agents bully you out of your legal protections.
                                </p>
                                <Link href="/resources/tenants/rights-101">
                                    <Button className="bg-red-500 hover:bg-red-600 font-bold px-8 h-12 rounded-xl">
                                        Read Tenant Rights
                                    </Button>
                                </Link>
                            </div>
                            {/* Artistic info badge */}
                            <div className="absolute -bottom-8 -left-8 bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-3xl shadow-2xl max-w-[240px] hidden sm:block">
                                <div className="flex items-center gap-2 text-[var(--color-brand-blue)] font-black text-xs uppercase tracking-widest mb-2 font-bold">
                                    <Info className="h-4 w-4" /> Pro Tip
                                </div>
                                <p className="text-[var(--text-primary)] text-sm font-bold mb-0 italic">
                                    "A house that looks too good for its price is usually a scam."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-[var(--bg-card)]">
                <div className="container-wide">
                    <div className="bg-[var(--color-brand-blue)] rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                                Ready to Rent <span className="text-[var(--color-brand-green)]">Safely</span>?
                            </h2>
                            <p className="text-xl text-blue-100 mb-12 font-medium">
                                Join the thousands of Nigerians who have reclaimed their finances and their peace of mind.
                            </p>
                            <div className="flex flex-col md:flex-row justify-center gap-4">
                                <Link href="/search" className="w-full md:w-auto">
                                    <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 h-16 px-10 text-xl font-black rounded-2xl w-full">
                                        Find Your New Home
                                    </Button>
                                </Link>
                                <Link href="/support">
                                    <Button className="bg-[var(--bg-card)] text-[var(--color-brand-blue)] hover:bg-[var(--bg-card)]/90 h-16 px-10 text-xl font-bold rounded-2xl w-full md:w-auto">
                                        Contact Verify Team
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        {/* Abstract background */}
                        <Target className="absolute -top-20 -left-20 h-80 w-80 text-white/5" />
                        <ShieldCheck className="absolute -bottom-20 -right-20 h-96 w-96 text-white/5" />
                    </div>
                </div>
            </section>
        </div>
    );
}
