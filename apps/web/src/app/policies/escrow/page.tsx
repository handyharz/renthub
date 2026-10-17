"use client";

import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle2, Shield, AlertTriangle, Clock, Zap, DollarSign, Calendar } from "lucide-react";

export default function EscrowPolicyPage() {
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Escrow & Refund Protocol</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-4">
                            Escrow & Refund Policy
                        </h1>
                        <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                            RentHub operates a zero-risk rental payment model powered by AfriExchange smart settlement rails. This Escrow & Refund Policy explains how your rental funds are secured in custody, the conditions under which money is released to landlords, and our guaranteed refund mechanisms.
                        </p>
                    </div>

                    {/* Core Escrow Guarantee Box */}
                    <div className="p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 mb-10 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                            <Zap className="h-4 w-4" />
                            <span>The Golden Rule: No Keys = No Landlord Payout</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            When you make a payment for a property on RentHub, your funds are NOT sent to the landlord. They are held safely in RentHub&apos;s AfriExchange-backed escrow account. The landlord only receives their payment after you physically walk through the apartment, verify its condition, receive the keys, and give them your 6-digit Key Handover OTP code.
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed">
                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                1. Escrow Architecture & Token Custody
                            </h2>
                            <p>
                                All payments made through RentHub are tokenized and deposited into smart escrow via AfriExchange:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Pegged Currency:</strong> Escrow deposits are accounted in Naira Tokens (NT) at a 1:1 parity with the Nigerian Naira (₦1.00 = 1 NT).</li>
                                <li><strong>Isolation:</strong> Escrow funds are kept completely separate from RentHub&apos;s operational capital in dedicated merchant settlement vaults.</li>
                                <li><strong>Immutable Audit Trail:</strong> Every state change (DEPOSITED, ESCROWED, DISPUTED, RELEASED, REFUNDED) is cryptographically recorded.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                2. The 6-Digit Key Handover OTP Release Mechanism
                            </h2>
                            <p>
                                Payout release to the property owner is governed exclusively by cryptographic verification:
                            </p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Upon escrow payment confirmation, a unique, encrypted 6-digit Key Handover OTP is generated on the tenant&apos;s RentHub dashboard and sent via Termii SMS.</li>
                                <li>The tenant attends the scheduled move-in inspection at the physical property.</li>
                                <li>The tenant inspects running water, electricity, doors, windows, security, and general readiness.</li>
                                <li>If fully satisfied, the tenant receives physical possession of all unit keys and tenancy agreements.</li>
                                <li>The tenant releases the 6-digit OTP code to the landlord.</li>
                                <li>The landlord enters the code in their RentHub app, which triggers instant automated disbursement via AfriExchange into the landlord&apos;s verified wallet or Nigerian bank account.</li>
                            </ol>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                3. The 48-Hour Inspection Window
                            </h2>
                            <p>
                                Tenants have an active 48-hour inspection window starting from the agreed handover date:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>During this 48-hour window, the tenant may inspect the premises and raise any concerns directly with the landlord.</li>
                                <li>If the landlord fails to show up, cancels the booking, or cannot deliver possession, the tenant can click &quot;Raise Escrow Dispute&quot; or request an immediate refund.</li>
                                <li>If neither an OTP code is submitted nor a dispute is filed within 48 hours following the handover date, RentHub&apos;s operations team contacts both parties to confirm handover status before any action is taken. Funds are never released without tenant confirmation or formal dispute review.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                4. Guaranteed 100% Refund Scenarios
                            </h2>
                            <p>
                                Tenants are entitled to a full 100% refund of all escrowed rental funds under the following conditions:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong>Property Does Not Exist / Fraud:</strong> The property was non-existent, already occupied by a third party, or misrepresented.</li>
                                <li><strong>Landlord Failure to Deliver Keys:</strong> The landlord fails to appear or refuses to deliver vacant possession.</li>
                                <li><strong>Severe Undisclosed Defects:</strong> The property suffers from critical structural or utility failures (e.g. collapsed ceiling, toxic mold, lack of promised roof/plumbing) that make habitation impossible and were concealed in the listing.</li>
                                <li><strong>Pre-Handover Cancellation:</strong> The tenant cancels the booking in accordance with the listing&apos;s cancellation window prior to key handover.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                5. Landlord Protection & Non-Circumvention
                            </h2>
                            <p>
                                To protect landlords against bad-faith tenant lockouts:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Tenants who physically take possession, move personal belongings into the premises, or change the door locks cannot withhold the OTP code maliciously.</li>
                                <li>In such cases, landlords may file an eviction proof notice with video timestamp evidence to RentHub Arbitration, which will authorize escrow release following verified inspection.</li>
                            </ul>
                        </section>

                        <section className="space-y-3 pt-6 border-t border-[var(--border-color)]">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                6. Escrow Support & Emergency Refund Desk
                            </h2>
                            <p>
                                If you experience any issues with a key handover code or require urgent escrow intervention:
                            </p>
                            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] font-mono text-xs space-y-1">
                                <p>RentHub Escrow & Settlement Desk</p>
                                <p>Email: escrow@renthub.ng / disputes@renthub.ng</p>
                                <p>Hotline: +234 (0) 800-RENTHUB</p>
                                <p>Hours: 24/7 Escrow Monitoring & Support</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
