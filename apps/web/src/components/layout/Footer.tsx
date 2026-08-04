import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <div className="container-wide py-12 md:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-blue)] text-white font-bold text-xl">
                                R
                            </div>
                            <span className="text-xl font-bold text-[var(--text-primary)]">
                                RentHub
                            </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            Nigeria's first agent-free rental platform. Find verified homes, connect directly with landlords, and save millions in fees.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-[var(--text-primary)]">Rentals</h3>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><Link href="/search?city=Abuja&propertyType=APARTMENT" className="hover:text-[var(--color-brand-orange)] transition-colors">Apartments in Abuja</Link></li>
                            <li><Link href="/search?city=Lagos&propertyType=HOUSE" className="hover:text-[var(--color-brand-orange)] transition-colors">Houses in Lagos</Link></li>
                            <li><Link href="/search?propertyType=STUDIO" className="hover:text-[var(--color-brand-orange)] transition-colors">Budget Friendly</Link></li>
                            <li><Link href="/search?verified=true" className="hover:text-[var(--color-brand-orange)] font-bold text-[var(--color-brand-green)] transition-colors">Verified Properties</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-[var(--text-primary)]">Landlords</h3>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><Link href="/properties/new" className="hover:text-[var(--color-brand-orange)] transition-colors">List Property</Link></li>
                            <li><Link href="/resources/trust-and-safety/verification" className="hover:text-[var(--color-brand-orange)] transition-colors">Verification Process</Link></li>
                            <li><Link href="/resources/manifesto" className="hover:text-[var(--color-brand-orange)] transition-colors">The Mission</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold mb-4 text-[var(--text-primary)]">Company</h3>
                        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <li><Link href="/resources/manifesto" className="hover:text-[var(--color-brand-orange)] transition-colors">Our Manifesto</Link></li>
                            <li><Link href="/resources" className="hover:text-[var(--color-brand-orange)] transition-colors">Resources & Guides</Link></li>
                            <li><Link href="/support" className="hover:text-[var(--color-brand-orange)] transition-colors">Contact & Support</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--text-secondary)]">
                    <p>© {new Date().getFullYear()} RentHub Nigeria. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/resources/tenants/rights-101" className="hover:text-[var(--text-primary)] transition-colors">Tenant Rights</Link>
                        <Link href="/resources/trust-and-safety/escrow" className="hover:text-[var(--text-primary)] transition-colors">Escrow Policy</Link>
                        <Link href="/resources" className="hover:text-[var(--text-primary)] transition-colors">Help Center</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
