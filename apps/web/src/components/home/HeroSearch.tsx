"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Building2, DollarSign, Sparkles, ChevronDown, Check, ArrowRight } from "lucide-react";
import { ALL_STATES, NIGERIAN_LOCATIONS } from "@/lib/locations";

const PROPERTY_TYPES = [
    { label: "All Property Types", value: "" },
    { label: "Flat / Apartment", value: "FLAT" },
    { label: "Duplex (Semi/Detached)", value: "DUPLEX" },
    { label: "Bungalow", value: "BUNGALOW" },
    { label: "Self-Contain / Studio", value: "SELF_CONTAIN" },
    { label: "Luxury Penthouse", value: "PENTHOUSE" },
    { label: "Serviced Apartment", value: "SERVICED_APARTMENT" },
    { label: "Terraced House", value: "TERRACE" },
];

const PRICE_PRESETS = [
    { label: "Any Budget", value: "" },
    { label: "Up to ₦1,000,000 / yr", value: "1000000" },
    { label: "Up to ₦2,500,000 / yr", value: "2500000" },
    { label: "Up to ₦5,000,000 / yr", value: "5000000" },
    { label: "Up to ₦10,000,000 / yr", value: "10000000" },
    { label: "₦20,000,000+ Luxury", value: "20000000" },
];

const POPULAR_HUBS = [
    { label: "Lekki Phase 1", state: "Lagos", city: "Lekki" },
    { label: "Maitama, Abuja", state: "FCT", city: "Maitama" },
    { label: "Ikeja GRA", state: "Lagos", city: "Ikeja" },
    { label: "Victoria Island", state: "Lagos", city: "Victoria Island" },
    { label: "Gwarinpa Estate", state: "FCT", city: "Gwarinpa" },
    { label: "Old GRA, Port Harcourt", state: "Rivers", city: "Port Harcourt" },
    { label: "Bodija, Ibadan", state: "Oyo", city: "Ibadan North" },
    { label: "Independence Layout", state: "Enugu", city: "Enugu North" },
];

export function HeroSearch() {
    const router = useRouter();
    const [selectedState, setSelectedState] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [selectedMaxPrice, setSelectedMaxPrice] = useState("");

    const citiesForState = selectedState ? NIGERIAN_LOCATIONS[selectedState] || [] : [];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (selectedState) params.set("state", selectedState);
        if (selectedCity) params.set("city", selectedCity);
        if (selectedType) params.set("propertyType", selectedType);
        if (selectedMaxPrice) params.set("maxPrice", selectedMaxPrice);

        router.push(`/search?${params.toString()}`);
    };

    const handleQuickHub = (hub: { state: string; city: string }) => {
        const params = new URLSearchParams();
        params.set("state", hub.state);
        params.set("city", hub.city);
        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-5">
            {/* Main Interactive Glass Console */}
            <form
                onSubmit={handleSearch}
                className="bg-[var(--bg-card)]/95 backdrop-blur-xl p-3 sm:p-4 rounded-3xl sm:rounded-4xl shadow-2xl border border-white/20 dark:border-white/10 text-left transition-all"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 items-center">
                    {/* 1. State Selector */}
                    <div className="relative group p-2.5 rounded-2xl bg-[var(--bg-muted)]/50 hover:bg-[var(--bg-muted)] border border-[var(--border-color)] transition-all">
                        <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-muted)] block mb-1">
                            State (36 + FCT)
                        </label>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[var(--color-brand-green)] shrink-0" />
                            <select
                                value={selectedState}
                                onChange={(e) => {
                                    setSelectedState(e.target.value);
                                    setSelectedCity(""); // Reset city when state changes
                                }}
                                className="w-full bg-transparent text-xs sm:text-sm font-black text-[var(--text-primary)] outline-none cursor-pointer appearance-none truncate"
                            >
                                <option value="" className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                                    All Nigeria
                                </option>
                                {ALL_STATES.map((state) => (
                                    <option key={state} value={state} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                                        {state}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 pointer-events-none" />
                        </div>
                    </div>

                    {/* 2. City / LGA Selector */}
                    <div className="relative group p-2.5 rounded-2xl bg-[var(--bg-muted)]/50 hover:bg-[var(--bg-muted)] border border-[var(--border-color)] transition-all">
                        <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-muted)] block mb-1">
                            City / District
                        </label>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[var(--color-brand-orange)] shrink-0" />
                            {selectedState && citiesForState.length > 0 ? (
                                <select
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-black text-[var(--text-primary)] outline-none cursor-pointer appearance-none truncate"
                                >
                                    <option value="" className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                                        All Cities in {selectedState}
                                    </option>
                                    {citiesForState.map((city) => (
                                        <option key={city} value={city} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder={selectedState ? "Select a city" : "Lekki, Maitama..."}
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-black text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none truncate"
                                />
                            )}
                            {selectedState && citiesForState.length > 0 && (
                                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 pointer-events-none" />
                            )}
                        </div>
                    </div>

                    {/* 3. Property Type */}
                    <div className="relative group p-2.5 rounded-2xl bg-[var(--bg-muted)]/50 hover:bg-[var(--bg-muted)] border border-[var(--border-color)] transition-all">
                        <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-muted)] block mb-1">
                            Property Type
                        </label>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full bg-transparent text-xs sm:text-sm font-black text-[var(--text-primary)] outline-none cursor-pointer appearance-none truncate"
                            >
                                {PROPERTY_TYPES.map((pt) => (
                                    <option key={pt.value} value={pt.value} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                                        {pt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 pointer-events-none" />
                        </div>
                    </div>

                    {/* 4. Budget & Search Button */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 p-2.5 rounded-2xl bg-[var(--bg-muted)]/50 hover:bg-[var(--bg-muted)] border border-[var(--border-color)] transition-all">
                            <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-muted)] block mb-1">
                                Max Rent / Year
                            </label>
                            <div className="flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                                <select
                                    value={selectedMaxPrice}
                                    onChange={(e) => setSelectedMaxPrice(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm font-black text-[var(--text-primary)] outline-none cursor-pointer appearance-none truncate"
                                >
                                    {PRICE_PRESETS.map((pr) => (
                                        <option key={pr.value} value={pr.value} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                                            {pr.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 pointer-events-none" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="h-14 px-5 sm:px-6 rounded-2xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-black flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
                        >
                            <Search className="w-5 h-5" />
                            <span className="hidden sm:inline">Find Homes</span>
                        </button>
                    </div>
                </div>
            </form>

            {/* Popular Rental Hubs Pills */}
            <div className="flex items-center justify-center flex-wrap gap-2 text-xs">
                <span className="text-white/80 font-bold hidden sm:inline mr-1">Trending Hubs:</span>
                {POPULAR_HUBS.map((hub) => (
                    <button
                        key={hub.label}
                        type="button"
                        onClick={() => handleQuickHub(hub)}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md border border-white/15 transition-all hover:scale-105 active:scale-95"
                    >
                        {hub.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
