"use client";

import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, Shield, Scale, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            {/* Nav context */}
            <div className="border-b border-[var(--border-color)] bg-[var(--bg-card)] py-4">
                <div className="container-wide flex items-center justify-between">
                    <Link
                        href="/policies"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Policies & Legal
                    </Link>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Effective: October 2026
                    </span>
                </div>
            </div>

            <div className="container-wide py-12 md:py-16">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-10 pb-8 border-b border-[var(--border-color)]">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                            <FileText className="h-3.5 w-3.5" />
                            <span>Legal Terms</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-4">
                            Terms of Service
                        </h1>
                        <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                            These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;Tenant&quot;, &quot;Landlord&quot;) and RentHub Technologies Nigeria Ltd (&quot;RentHub&quot;, &quot;we&quot;, &quot;us&quot;). By accessing or using our marketplace platform, you agree to comply with and be bound by these Terms.
                        </p>
                    </div>

                    {/* Notice Box */}
                    <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/10 mb-10 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            <strong className="text-[var(--text-primary)] block mb-1">
                                Strict Zero-Agent Commission Guarantee
                            </strong>
                            RentHub strictly prohibits the charging or solicitation of agency fees, &quot;agreement fees&quot;, or middleman commissions. Any landlord, caretaker, or user attempting to demand illegal agency fees will be permanently banned and reported to the Nigerian Federal Competition and Consumer Protection Commission (FCCPC).
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed">
                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span>1. Acceptance of Terms & Eligibility</span>
                            </h2>
                            <p>
                                By registering an account, listing a property, booking an inspection, or funding escrow on RentHub, you represent that you are at least 18 years of age, have the legal capacity to enter into binding agreements, and reside or operate lawfully in the Federal Republic of Nigeria.
                            </p>
                            <p>
                                All users must complete phone verification and identity KYC in compliance with applicable Nigerian anti-money laundering regulations and tenancy laws.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span>2. Marketplace Structure & Zero-Agent Pledge</span>
                            </h2>
                            <p>
                                RentHub is a direct peer-to-peer property marketplace connecting legitimate property owners (or authorized facility managers) directly with tenants. You agree that:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>No Middlemen:</strong> You will not list properties on behalf of third parties as an unauthorized roadside agent.</li>
                                <li><strong>No Hidden Surcharges:</strong> The rental price published on the listing must represent the true, total annual or monthly rent. No unannounced &quot;inspection gate fees&quot; or &quot;commission fees&quot; may be demanded.</li>
                                <li><strong>Direct Interaction:</strong> RentHub provides in-app messaging and verified tour scheduling to facilitate direct negotiations without intermediaries.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span>3. Landlord Obligations & Title Verification</span>
                            </h2>
                            <p>
                                Property owners listing on RentHub warrant and represent that:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>They hold valid legal title or written power of attorney for the listed real estate.</li>
                                <li>All photos, virtual tours, and descriptions submitted are authentic, recent, and accurately reflect current conditions.</li>
                                <li>They will submit to physical inspection by RentHub field verifiers to qualify for the &quot;Certified&quot; trust badge.</li>
                                <li>They will provide an active AfriExchange wallet or verified Nigerian bank account for automated escrow settlement.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span>4. Escrow Custody & 6-Digit Key Handover Protocol</span>
                            </h2>
                            <p>
                                All rental payments initiated via RentHub are held securely in smart escrow facilitated by AfriExchange.
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Custody:</strong> Rent payments do not disburse directly to the landlord upon payment. Funds are locked in smart escrow custody.</li>
                                <li><strong>6-Digit OTP Release:</strong> Escrow funds are released to the landlord ONLY after the tenant conducts a physical walkthrough, confirms satisfaction, receives the physical keys, and provides the 6-digit handover OTP code.</li>
                                <li><strong>48-Hour Inspection Window:</strong> Tenants have a 48-hour window from the scheduled handover date to verify premises or lodge a dispute.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span>5. Platform Commission & Surcharges</span>
                            </h2>
                            <p>
                                RentHub retains a platform maintenance commission (typically 2.0% or 200 basis points) from the gross rental escrow amount upon successful OTP release to support payment gateway fees, server infrastructure, and field inspections.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span>6. Limitation of Liability</span>
                            </h2>
                            <p>
                                RentHub acts as a digital marketplace, identity verification coordinator, and escrow settlement facilitator. Except to the extent caused by RentHub&apos;s gross negligence or willful misconduct, RentHub shall not be liable for any physical damage to premises, tenant-landlord interpersonal disputes post-move-in, or unforeseen force majeure events.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span>7. Governing Law & Dispute Jurisdiction</span>
                            </h2>
                            <p>
                                These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any legal disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the competent courts of the Federal Capital Territory (Abuja) or Lagos State, Nigeria.
                            </p>
                        </section>

                        <section className="space-y-3 pt-6 border-t border-[var(--border-color)]">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                8. Contact & Legal Inquiries
                            </h2>
                            <p>
                                For inquiries or notices regarding these Terms, please reach out to our legal department at:
                            </p>
                            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] font-mono text-xs space-y-1">
                                <p>RentHub Technologies Nigeria Ltd.</p>
                                <p>Attn: Legal & Compliance Operations</p>
                                <p>Email: legal@renthub.ng / admin@renthub.ng</p>
                                <p>Abuja / Lagos, Federal Republic of Nigeria</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
