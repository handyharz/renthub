"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, Building2, Eye, Calendar, Award } from "lucide-react";

export default function InspectionPolicyPage() {
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Verification Standards</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-4">
                            Property Inspection & Certified Badge Policy
                        </h1>
                        <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                            RentHub maintains strict verification standards across our property marketplace. The green &quot;Certified&quot; trust badge is granted only after an exhaustive physical on-site audit and title deed verification. This policy outlines our verification criteria, fee schedules, and badge revocation protocols.
                        </p>
                    </div>

                    {/* Certified Badge Guarantee Box */}
                    <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 mb-10 flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Award className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                                <span>The RentHub &quot;Certified&quot; Guarantee</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                                    <CheckCircle2 className="h-3 w-3" /> Certified
                                </span>
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                When a property displays the green Certified badge, it means a trained RentHub field verifier has physically stood inside the apartment, inspected electricity and plumbing, confirmed the landlord&apos;s title deed, and verified that the property is vacant and ready for immediate occupancy.
                            </p>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed">
                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                1. Multi-Point Physical Audit Checklist
                            </h2>
                            <p>
                                Every inspection includes a comprehensive 20-point verification checklist covering:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Structural Integrity:</strong> Ceilings, flooring, windows, doors, and exterior drainage.</li>
                                <li><strong>Utilities & Power:</strong> Functional borehole / municipal running water, electrical wiring, dedicated pre-paid meter or generator infrastructure.</li>
                                <li><strong>Safety & Access:</strong> Perimeter fencing, gate security, fire exit routes, and access road motorability.</li>
                                <li><strong>Listing Authenticity:</strong> High-definition GPS-tagged photographs taken by the verifier matching the photos uploaded by the landlord.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                2. Landlord Proof of Ownership (KYC & Title)
                            </h2>
                            <p>
                                To qualify for Certified status, landlords must submit proof of ownership:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Certificate of Occupancy (C of O), Governor&apos;s Consent, or registered Deed of Assignment.</li>
                                <li>Government-issued National Identification Number (NIN) or International Passport matching the title document.</li>
                                <li>Recent utility bill (NEPA/PHCN electricity bill or land use charge receipt) in the landlord&apos;s name.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                3. Inspection Fee Schedule
                            </h2>
                            <p>
                                Field inspections require dedicated physical deployment of verifiers:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Standard Inspection Fee:</strong> ₦20,000 NT (or Naira equivalent) per residential unit audit.</li>
                                <li><strong>Fee Coverage:</strong> Covers physical on-site inspection, high-resolution photography, title verification search, and badge issuance for 12 months.</li>
                                <li><strong>Multi-Unit Landlords:</strong> Discounted tiered schedules apply to multi-unit apartment complexes.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                4. Certified Badge Revocation Protocols
                            </h2>
                            <p>
                                RentHub maintains zero tolerance for post-inspection tampering. The Certified badge will be immediately revoked if:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>The landlord rents out the unit offline without updating listing availability.</li>
                                <li>A tenant arrives and discovers that condition, fixtures, or furnishings have been substantially altered or degraded.</li>
                                <li>The landlord or their associates demand roadside agency commissions or gate fees.</li>
                                <li>A verified dispute reveals structural defects concealed from our field verifier.</li>
                            </ul>
                        </section>

                        <section className="space-y-3 pt-6 border-t border-[var(--border-color)]">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                5. Request an Inspection Audit
                            </h2>
                            <p>
                                Landlords ready to certify their properties can book a verification audit directly from their Landlord Dashboard or contact:
                            </p>
                            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] font-mono text-xs space-y-1">
                                <p>RentHub Verification & Quality Operations</p>
                                <p>Email: verification@renthub.ng</p>
                                <p>Field Audit Desk: +234 (0) 800-RENTHUB (Ext. 2)</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
