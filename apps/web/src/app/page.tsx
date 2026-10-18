import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Sparkles, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { OnboardingBanner } from "@/components/home/OnboardingBanner";
import { HeroSearch } from "@/components/home/HeroSearch";
import { MarketMetrics } from "@/components/home/MarketMetrics";
import { CategoryExplorer } from "@/components/home/CategoryExplorer";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { ComparisonMatrix } from "@/components/home/ComparisonMatrix";
import { TopDestinations } from "@/components/home/TopDestinations";
import { HowItWorks } from "@/components/home/HowItWorks";
import { LandlordCTA } from "@/components/home/LandlordCTA";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
            <OnboardingBanner />

            {/* 1. Executive Modern Hero Section */}
            <section className="relative min-h-[640px] md:min-h-[720px] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
                {/* Background Image with Ambient Gradient Overlays */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/backgroundImageOverlay.jpg"
                        alt="Luxury Nigerian Architecture & Residential Living"
                        fill
                        className="object-cover opacity-45 scale-102"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-slate-950/70 to-slate-950/80" />
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--color-brand-green)]/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                </div>

                <div className="container-wide relative z-10 py-16 sm:py-24 text-center space-y-8">
                    {/* Trust Pill */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md text-xs sm:text-sm font-black text-white shadow-xl transition-all">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Nigeria's Verified Direct Landlord Rental Marketplace</span>
                    </div>

                    {/* Main Headline */}
                    <div className="max-w-4xl mx-auto space-y-4">
                        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
                            Rent Your Next Home. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                                Skip Roadside Agent Fees.
                            </span>
                        </h1>
                        <p className="text-sm sm:text-lg md:text-xl text-slate-200 font-medium max-w-2xl mx-auto leading-relaxed">
                            Connect directly with verified property owners across all 36 states and the FCT. Zero agency fees, physically audited homes, and 100% escrow protection.
                        </p>
                    </div>

                    {/* Interactive Hero Search Console */}
                    <div className="pt-2">
                        <HeroSearch />
                    </div>
                </div>
            </section>

            {/* 2. Floating Market Trust Indicators */}
            <MarketMetrics />

            {/* 3. Lifestyle Category Explorer */}
            <CategoryExplorer />

            {/* 4. Fresh & Featured Properties with Live State Tabs */}
            <FeaturedProperties />

            {/* 5. Why RentHub: Comparison Matrix */}
            <ComparisonMatrix />

            {/* 6. Nationwide Prime Rental Hubs */}
            <TopDestinations />

            {/* 7. How It Works (Renters & Landlords) */}
            <HowItWorks />

            {/* 8. Executive Landlord Acquisition Banner */}
            <LandlordCTA />
        </div>
    );
}
