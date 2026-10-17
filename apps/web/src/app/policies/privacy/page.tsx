"use client";

import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle2, Lock, Eye, Server, Calendar } from "lucide-react";

export default function PrivacyPolicyPage() {
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                            <Shield className="h-3.5 w-3.5" />
                            <span>Data Protection & NDPA</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                            RentHub Technologies Nigeria Ltd (&quot;RentHub&quot;, &quot;we&quot;, &quot;our&quot;) is dedicated to protecting the privacy, confidentiality, and security of all personal data entrusted to us. This Privacy Policy details our data collection practices, security standards, and your rights under the Nigeria Data Protection Act (NDPA 2023) and the Nigeria Data Protection Regulation (NDPR).
                        </p>
                    </div>

                    {/* NDPR Badge Box */}
                    <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 mb-10 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            <strong className="text-[var(--text-primary)] block mb-1">
                                NDPA & NDPR Compliant Operations
                            </strong>
                            RentHub processes all personal, identification, and payment records strictly on lawful bases: consent, contractual necessity for rental escrow execution, and legitimate anti-fraud verification under Nigerian law. We never sell your personal contact information to third-party marketing companies.
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed">
                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                1. Personal Information We Collect
                            </h2>
                            <p>
                                To maintain a safe, fraud-free rental community, we collect:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Account & Contact Data:</strong> Full legal name, verified email address, and Nigerian mobile telephone number.</li>
                                <li><strong>Identity & KYC Documents:</strong> Government-issued ID (National Identity Card / NIN, International Passport, or Voter&apos;s Card) for landlord titleholder verification and tenant fraud prevention.</li>
                                <li><strong>Property & Ownership Records:</strong> Title deeds, Governor&apos;s Consent, Certificate of Occupancy (C of O), and property utility bills submitted by landlords for Certified Badge audit.</li>
                                <li><strong>Financial & Settlement Data:</strong> AfriExchange wallet public addresses, bank account numbers, and transaction IDs for escrow and landlord payouts. Credit card numbers are tokenized by PCI-DSS Level 1 compliant processors (Paystack/Flutterwave) and never stored on our servers.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                2. How We Use Your Data
                            </h2>
                            <p>
                                Your information is processed exclusively for legitimate platform purposes:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Verifying user identities to prevent phantom listings and scam attempts.</li>
                                <li>Executing rental escrow custody and disbursing funds via AfriExchange upon 6-digit key handover verification.</li>
                                <li>Dispatching 6-digit OTP codes and critical security SMS alerts via Termii.</li>
                                <li>Resolving disputes and arbitrating rental claims between landlords and tenants.</li>
                                <li>Complying with statutory reporting requirements of Nigerian regulatory authorities.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                3. Information Sharing & Third-Party Processors
                            </h2>
                            <p>
                                We share data strictly with vetted, high-security infrastructure partners necessary to deliver the service:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>AfriExchange:</strong> Encrypted settlement instructions and wallet identifiers for escrow custody and payout execution.</li>
                                <li><strong>Clerk Auth:</strong> Encrypted identity authentication and session management.</li>
                                <li><strong>Paystack & Flutterwave:</strong> Direct fiat processing conforming to PCI-DSS Level 1 standards.</li>
                                <li><strong>Termii:</strong> Telecommunications gateway for transactional SMS delivery of OTP key handover codes.</li>
                                <li><strong>Law Enforcement & Courts:</strong> Where mandated by a valid court subpoena or formal directive from Nigerian law enforcement agencies (e.g. EFCC, Police).</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                4. Data Security & Storage Architecture
                            </h2>
                            <p>
                                RentHub employs modern security defenses:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>All network communications are encrypted with TLS 1.3 / SSL 256-bit encryption.</li>
                                <li>Sensitive KYC documents and photos are stored in private, access-controlled cloud buckets.</li>
                                <li>Database connections (Neon PostgreSQL) use strictly enforced SSL encryption and role-based access controls.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                5. Your Data Rights Under NDPA 2023
                            </h2>
                            <p>
                                Under the Nigeria Data Protection Act 2023, you have the right to:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Access:</strong> Request a copy of all personal records we hold about you.</li>
                                <li><strong>Rectification:</strong> Correct inaccurate or outdated phone numbers, names, or documentation.</li>
                                <li><strong>Erasure:</strong> Request the deletion of your account and personal records, subject to statutory audit retention periods for financial escrow records.</li>
                                <li><strong>Withdrawal of Consent:</strong> Opt out of non-essential marketing communications at any time.</li>
                            </ul>
                        </section>

                        <section className="space-y-3 pt-6 border-t border-[var(--border-color)]">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                6. Data Protection Officer (DPO) Contact
                            </h2>
                            <p>
                                To exercise your data rights or lodge a privacy inquiry, please contact our designated Data Protection Officer at:
                            </p>
                            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] font-mono text-xs space-y-1">
                                <p>RentHub Technologies Nigeria Ltd.</p>
                                <p>Data Protection Officer (DPO)</p>
                                <p>Email: privacy@renthub.ng / dpo@renthub.ng</p>
                                <p>Federal Republic of Nigeria</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
