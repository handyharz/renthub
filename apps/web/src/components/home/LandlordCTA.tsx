"use client";

import Link from "next/link";
import { Plus, ShieldCheck, ArrowRight, Wallet, Users, CheckCircle2, Building2 } from "lucide-react";

export function LandlordCTA() {
    return (
        <section className="py-20 bg-[var(--bg-secondary)]/60 border-t border-[var(--border-color)]">
            <div className="container-wide">
                <div className="relative rounded-4xl overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-8 sm:p-12 lg:p-16 border border-emerald-500/20 shadow-2xl">
                    {/* Ambient Glows */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-brand-green)]/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        <div className="lg:col-span-7 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs uppercase tracking-wider border border-emerald-500/30">
                                <Building2 className="w-4 h-4" />
                                <span>For Property Owners & Real Estate Developers</span>
                            </div>

                            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                                Maximize Rental Yield. <br />
                                <span className="text-[var(--color-brand-green)]">Zero Broker Extortion.</span>
                            </h2>

                            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-xl">
                                List your flats, duplexes, or commercial buildings directly to verified tenants across Nigeria. Enjoy 100% upfront rent escrow and automatic tenant background checks.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-bold">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span>Zero Listing & Management Fees</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-bold">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span>Instant 98% Escrow Payout</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-bold">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span>Pre-Vetted ID & Trust-Scored Renters</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-bold">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span>Key Handover OTP Security</span>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                                <Link
                                    href="/properties/new"
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>List a Property for Free</span>
                                </Link>

                                <Link
                                    href="/dashboard"
                                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base border border-white/20 flex items-center justify-center gap-2 backdrop-blur-md transition-all cursor-pointer"
                                >
                                    <span>Landlord Dashboard</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Right Preview Card */}
                        <div className="lg:col-span-5 bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <div>
                                    <p className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                                        Landlord Security
                                    </p>
                                    <h4 className="text-base font-black text-white mt-0.5">
                                        Direct Net Rent Settlement
                                    </h4>
                                </div>
                                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                                    <Wallet className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <span className="text-slate-300 font-semibold">Annual Rent Sample:</span>
                                    <span className="text-white font-black text-sm">₦5,000,000</span>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <span className="text-slate-300 font-semibold">Broker Deduction:</span>
                                    <span className="text-emerald-400 font-black text-sm">₦0 (0% Agency)</span>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                                    <span className="text-emerald-300 font-bold">Net Landlord Payout:</span>
                                    <span className="text-emerald-400 font-black text-base">₦4,900,000 (98%)</span>
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                Funds are credited automatically into your Nigerian bank account once you enter the tenant's 6-digit Handover OTP during physical key exchange.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
