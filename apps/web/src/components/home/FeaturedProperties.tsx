"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Building2, ShieldCheck, Filter } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import api from "@/lib/api";

const TABS = [
    { label: "All Properties", key: "all", filter: {} },
    { label: "Lagos", key: "lagos", filter: { state: "Lagos" } },
    { label: "Abuja (FCT)", key: "fct", filter: { state: "FCT" } },
    { label: "Rivers (PH)", key: "rivers", filter: { state: "Rivers" } },
    { label: "Oyo (Ibadan)", key: "oyo", filter: { state: "Oyo" } },
    { label: "Featured Only", key: "featured", filter: { featured: true } },
];

export function FeaturedProperties() {
    const [activeTab, setActiveTab] = useState("all");
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProperties();
    }, [activeTab]);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const currentTab = TABS.find((t) => t.key === activeTab);
            const params = new URLSearchParams();
            params.set("limit", "6");

            if (currentTab?.filter.state) params.set("state", currentTab.filter.state);
            if (currentTab?.filter.featured) params.set("featured", "true");

            const res = await api.get(`/properties?${params.toString()}`);
            const data = res.data?.data?.properties || res.data?.properties || [];
            setProperties(data);
        } catch (error) {
            console.error("Failed to fetch featured properties:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-20 bg-[var(--bg-secondary)]/50 border-y border-[var(--border-color)]">
            <div className="container-wide space-y-10">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider mb-3">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verified Inventory</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                            Fresh on RentHub Nigeria
                        </h2>
                        <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 font-medium max-w-xl">
                            Direct landlord listings physically audited with verified GPS coordinates and utility checks.
                        </p>
                    </div>

                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 text-sm font-black text-[var(--color-brand-green)] hover:underline self-start md:self-auto"
                    >
                        <span>View All Listings Nationwide</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Region Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                    isActive
                                        ? "bg-[var(--color-brand-green)] text-white shadow-md scale-102"
                                        : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Properties Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-96 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] animate-pulse"
                            />
                        ))}
                    </div>
                ) : properties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-black text-[var(--text-primary)]">
                            No listings in this category yet
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Try switching to another state or search all 36 states across Nigeria.
                        </p>
                        <button
                            onClick={() => setActiveTab("all")}
                            className="mt-4 px-4 py-2 rounded-xl bg-[var(--color-brand-green)] text-white text-xs font-bold"
                        >
                            Reset to All Properties
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
