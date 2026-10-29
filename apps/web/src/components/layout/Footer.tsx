import Link from "next/link";
import { ShieldCheck, Lock, CheckCircle2, Scale } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <div className="container-wide py-12 md:py-16">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                    {/* Brand & Security */}
                    <div className="col-span-2 md:col-span-3 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-blue)] text-white font-bold text-xl">
                                R
                            </div>
                            <span className="text-xl font-bold text-[var(--text-primary)]">
                                RentHub
                            </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                            Nigeria&apos;s first agent-free rental platform. Find verified homes, connect directly with landlords, and save millions in fees.
                        </p>
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                <Lock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span>Anchor & AfriExchange Multi-Rail Escrow</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <span>NDPR & NDPA 2023 Compliant</span>
                            </div>
                        </div>
                    </div>

                    {/* Rentals */}
                    <div>
                        <h3 className="font-bold mb-4 text-[var(--text-primary)]">Rentals</h3>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><Link href="/search?city=Abuja&propertyType=APARTMENT" className="hover:text-[var(--color-brand-orange)] transition-colors">Apartments in Abuja</Link></li>
                            <li><Link href="/search?city=Lagos&propertyType=HOUSE" className="hover:text-[var(--color-brand-orange)] transition-colors">Houses in Lagos</Link></li>
                            <li><Link href="/search?propertyType=STUDIO" className="hover:text-[var(--color-brand-orange)] transition-colors">Budget Friendly</Link></li>
                            <li><Link href="/search?verified=true" className="hover:text-[var(--color-brand-orange)] font-bold text-[var(--color-brand-green)] transition-colors">Verified Properties</Link></li>
                        </ul>
                    </div>

                    {/* Landlords */}
                    <div>
                        <h3 className="font-bold mb-4 text-[var(--text-primary)]">Landlords</h3>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><Link href="/properties/new" className="hover:text-[var(--color-brand-orange)] transition-colors">List Property</Link></li>
                            <li><Link href="/resources/trust-and-safety/verification" className="hover:text-[var(--color-brand-orange)] transition-colors">Verification Process</Link></li>
                            <li><Link href="/policies/inspection" className="hover:text-[var(--color-brand-orange)] transition-colors">Certified Badge Audit</Link></li>
                            <li><Link href="/resources/manifesto" className="hover:text-[var(--color-brand-orange)] transition-colors">The Mission</Link></li>
                        </ul>
                    </div>

                    {/* Policies & Legal */}
                    <div>
                        <h3 className="font-bold mb-4 text-[var(--text-primary)] flex items-center gap-1.5">
                            <Scale className="h-4 w-4 text-[var(--color-brand-blue)] dark:text-blue-400" />
                            <span>Policies & Legal</span>
                        </h3>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><Link href="/policies" className="hover:text-[var(--color-brand-orange)] font-semibold text-[var(--text-primary)] transition-colors">Legal Overview Hub</Link></li>
                            <li><Link href="/policies/terms" className="hover:text-[var(--color-brand-orange)] transition-colors">Terms of Service</Link></li>
                            <li><Link href="/policies/privacy" className="hover:text-[var(--color-brand-orange)] transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/policies/escrow" className="hover:text-[var(--color-brand-orange)] transition-colors">Escrow & Refund Policy</Link></li>
                            <li><Link href="/policies/disputes" className="hover:text-[var(--color-brand-orange)] transition-colors">Dispute Resolution</Link></li>
                            <li><Link href="/policies/inspection" className="hover:text-[var(--color-brand-orange)] transition-colors">Inspection Standards</Link></li>
                        </ul>
                    </div>

                    {/* Company & Support */}
                    <div>
                        <h3 className="font-bold mb-4 text-[var(--text-primary)]">Company</h3>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><Link href="/transparency" className="hover:text-[var(--color-brand-orange)] font-semibold text-emerald-600 dark:text-emerald-400 transition-colors">Public Transparency Ledger</Link></li>
                            <li><Link href="/resources/manifesto" className="hover:text-[var(--color-brand-orange)] transition-colors">Our Manifesto</Link></li>
                            <li><Link href="/resources" className="hover:text-[var(--color-brand-orange)] transition-colors">Resources & Guides</Link></li>
                            <li><Link href="/resources/tenants/rights-101" className="hover:text-[var(--color-brand-orange)] transition-colors">Tenant Rights 101</Link></li>
                            <li><Link href="/resources/trust-and-safety" className="hover:text-[var(--color-brand-orange)] transition-colors">Trust & Safety</Link></li>
                            <li><Link href="/support" className="hover:text-[var(--color-brand-orange)] transition-colors">Contact & Support</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[var(--text-muted)]">
                    <p>© {new Date().getFullYear()} RentHub Technologies Nigeria Ltd. All rights reserved.</p>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                        <Link href="/transparency" className="hover:text-[var(--text-primary)] transition-colors font-medium text-emerald-600 dark:text-emerald-400">Transparency</Link>
                        <Link href="/policies/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
                        <Link href="/policies/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms</Link>
                        <Link href="/policies/escrow" className="hover:text-[var(--text-primary)] transition-colors">Escrow</Link>
                        <Link href="/policies/disputes" className="hover:text-[var(--text-primary)] transition-colors">Disputes</Link>
                        <Link href="/policies" className="hover:text-[var(--text-primary)] transition-colors font-medium text-[var(--text-secondary)]">Legal Hub</Link>
                        <Link href="/support" className="hover:text-[var(--text-primary)] transition-colors">Support Desk</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
