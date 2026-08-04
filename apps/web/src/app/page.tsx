import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Search, MapPin } from "lucide-react";
import { ValueProps } from "@/components/home/ValueProps";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { OnboardingBanner } from "@/components/home/OnboardingBanner";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <OnboardingBanner />
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] flex items-center justify-center bg-[var(--color-brand-blue)]">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <Image
          src="/backgroundImageOverlay.jpg"
          alt="Luxury Home in Nigeria"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-20 w-full max-w-4xl px-4 text-center">
          <h1 className="text-3xl md:text-6xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg leading-tight">
            Find your home. <span className="text-[var(--color-brand-green)]">Skip the agent.</span>
          </h1>
          <p className="text-base md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto drop-shadow-md">
            Directly connect with verified landlords in Nigeria. No agency fees, 100% transparent.
          </p>
          <div className="bg-[var(--bg-card)] p-3 md:p-4 rounded-xl shadow-2xl flex flex-col md:flex-row gap-3 md:gap-4 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="City, Neighborhood, or Address"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:border-[var(--color-brand-blue)] focus:ring-2 focus:ring-[var(--color-brand-blue)]/20 outline-none text-sm md:text-base"
              />
            </div>
            <Link href="/search" className="w-full md:w-auto">
              <Button size="lg" className="w-full md:w-auto h-auto py-3 px-8 text-base md:text-lg font-semibold bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <ValueProps />
      <FeaturedProperties />
    </div>
  );
}
