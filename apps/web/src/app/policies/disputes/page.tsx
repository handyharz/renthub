"use client";

import Link from "next/link";
import { ArrowLeft, Scale, AlertTriangle, CheckCircle2, Shield, Clock, FileText, Calendar } from "lucide-react";

export default function DisputesPolicyPage() {
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
                            <Scale className="h-3.5 w-3.5" />
                            <span>Arbitration & Fairness</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-4">
                            Dispute Resolution & Arbitration Policy
                        </h1>
                        <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                            RentHub provides an independent, neutral dispute arbitration framework designed to protect both tenants and landlords from unfair treatment, breach of contract, or rental fraud. This policy outlines how disputes are reported, investigated, and conclusively resolved.
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed">
                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                1. Grounds for Filing an Escrow Dispute
                            </h2>
                            <p>
                                Either party to a rental transaction may lodge a formal dispute before escrow release under the following verified grounds:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Severe Property Misrepresentation:</strong> The property physical condition substantially diverges from the listing photos, layout, or amenities promised.</li>
                                <li><strong>Inaccessibility or Lockout:</strong> The landlord is uncontactable, fails to meet for the move-in inspection, or withholds the physical keys.</li>
                                <li><strong>Habitability Hazards:</strong> Critical deficiencies that threaten health or safety (e.g. collapsed sewage, structural instability, lack of electricity or running water).</li>
                                <li><strong>Unauthorized Fee Extortion:</strong> The landlord or an associated caretaker demands illegal roadside agency fees or unadvertised gate fees.</li>
                                <li><strong>Tenant Bad-Faith Refusal:</strong> The tenant occupies the premises, moves belongings in, or changes locks, but maliciously withholds the key handover OTP code.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                2. Immediate Escrow Freeze
                            </h2>
                            <p>
                                The moment a dispute is lodged via the RentHub app or web portal:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>The escrow transaction is immediately locked in <code>DISPUTED</code> state.</li>
                                <li>All automatic payout releases and OTP verifications are suspended.</li>
                                <li>Funds remain securely preserved in smart escrow custody until an official arbitration decision is reached.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                3. The 7-Day Arbitration Process
                            </h2>
                            <p>
                                RentHub adheres to a structured 7-day arbitration timeline:
                            </p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li><strong>Notice of Dispute (Day 1):</strong> Both landlord and tenant are notified via SMS and email with a formal case reference ID.</li>
                                <li><strong>Evidence Submission (Days 1–3):</strong> Both parties submit dated photographs, walkthrough videos, in-app chat transcripts, and receipts through the dispute portal.</li>
                                <li><strong>Independent Field Audit (Days 4–5):</strong> If necessary, a RentHub field compliance inspector is dispatched to the physical property to conduct an objective physical audit.</li>
                                <li><strong>Arbitration Ruling (Days 6–7):</strong> RentHub&apos;s Senior Arbitration Committee reviews all evidence and delivers a binding resolution.</li>
                            </ol>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                4. Decision Outcomes & Escrow Disposition
                            </h2>
                            <p>
                                RentHub Arbitration decisions are limited to the following outcomes:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Full Refund to Tenant:</strong> 100% of escrow funds are returned to the tenant&apos;s source wallet or bank account if the landlord breached the agreement or committed fraud.</li>
                                <li><strong>Release to Landlord:</strong> Escrow funds are disbursed via AfriExchange to the landlord (minus platform commission) if the tenant is found to have occupied the premises or filed a frivolous claim.</li>
                                <li><strong>Mutual Compromise / Repair Deduction:</strong> Where minor deficiencies exist that the landlord agrees to rectify within 48 hours, a portion of the funds may be held until repairs are completed.</li>
                            </ul>
                        </section>

                        <section className="space-y-3 pt-6 border-t border-[var(--border-color)]">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                5. Escalation & External Legal Recourse
                            </h2>
                            <p>
                                While RentHub arbitration provides fast, zero-cost commercial resolution of escrow funds, nothing in this policy prevents either party from seeking statutory legal relief through the Lagos State Multi-Door Courthouse (LMDC) or Abuja Rental Tribunals under Nigerian tenancy statutes.
                            </p>
                            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] font-mono text-xs space-y-1">
                                <p>RentHub Dispute Arbitration Committee</p>
                                <p>Email: disputes@renthub.ng</p>
                                <p>Case Escalation Hotline: +234 (0) 800-RENTHUB (Ext. 4)</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
