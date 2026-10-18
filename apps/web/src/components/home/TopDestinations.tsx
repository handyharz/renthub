"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight, Building2, Sparkles } from "lucide-react";

const DESTINATIONS = [
    {
        name: "Lagos State",
        subtitle: "Commercial & Tech Capital",
        popularDistricts: "Lekki • Ikoyi • Victoria Island • Ikeja • Yaba",
        image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80",
        href: "/search?state=Lagos",
        featuredCount: "1,200+ Homes",
    },
    {
        name: "Abuja (FCT)",
        subtitle: "Diplomatic & Federal Capital",
        popularDistricts: "Maitama • Wuse 2 • Jabi • Gwarinpa • Guzape",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        href: "/search?state=FCT",
        featuredCount: "850+ Homes",
    },
    {
        name: "Rivers (Port Harcourt)",
        subtitle: "Energy & Marine Hub",
        popularDistricts: "Old GRA • Peter Odili • Woji • Trans-Amadi",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
        href: "/search?state=Rivers",
        featuredCount: "450+ Homes",
    },
    {
        name: "Oyo (Ibadan)",
        subtitle: "Academic & Heritage Metropolis",
        popularDistricts: "Bodija • Oluyole • Ring Road • Jericho",
        image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80",
        href: "/search?state=Oyo",
        featuredCount: "320+ Homes",
    },
    {
        name: "Enugu State",
        subtitle: "Coal City & Regional Cultural Hub",
        popularDistricts: "Independence Layout • New Haven • GRA",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        href: "/search?state=Enugu",
        featuredCount: "210+ Homes",
    },
    {
        name: "Delta & Edo States",
        subtitle: "Asaba, Warri & Benin City",
        popularDistricts: "Asaba GRA • Ugbor GRA • Sapele Road",
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
        href: "/search?state=Delta",
        featuredCount: "190+ Homes",
    },
];

export function TopDestinations() {
    return (
        <section className="py-20 bg-[var(--bg-secondary)]/40 border-t border-[var(--border-color)]">
            <div className="container-wide space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-wider mb-3">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Nationwide Destinations</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                            Explore Top Nigerian Rental Hubs
                        </h2>
                        <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 font-medium max-w-xl">
                            Find vetted homes in Nigeria's most sought-after states and metropolitan centers.
                        </p>
                    </div>

                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 text-sm font-black text-[var(--color-brand-green)] hover:underline self-start md:self-auto"
                    >
                        <span>View All 36 States</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {DESTINATIONS.map((dest, idx) => (
                        <Link
                            key={idx}
                            href={dest.href}
                            className="group relative h-72 sm:h-80 rounded-3xl overflow-hidden border border-[var(--border-color)] shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block"
                        >
                            <Image
                                src={dest.image}
                                alt={dest.name}
                                fill
                                className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-black text-white border border-white/20">
                                {dest.featuredCount}
                            </div>

                            <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                                    {dest.subtitle}
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                                    {dest.name}
                                </h3>
                                <p className="text-xs text-white/80 line-clamp-1 font-medium">
                                    {dest.popularDistricts}
                                </p>
                                <div className="pt-2 flex items-center gap-1.5 text-xs font-black text-emerald-400 group-hover:underline">
                                    <span>Browse Homes</span>
                                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
