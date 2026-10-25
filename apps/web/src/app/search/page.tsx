"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Map } from "@/components/map/Map";
import {
    Search,
    MapPin,
    SlidersHorizontal,
    X,
    Map as MapIcon,
    Grid3x3,
    ChevronDown,
    ArrowUpDown,
    Sparkles,
    Check,
    CheckCircle2,
    Zap,
    Droplets,
    Car,
    ShieldCheck,
    Home,
    Bed,
    Bath,
    RotateCcw,
    Building2,
    Flame,
    Calendar,
    ArrowUpRight,
    Heart,
    Filter,
    Layers,
    Share2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { PROPERTY_CATEGORIES, DETAILED_TYPES_MAP } from "@/lib/constants";
import { NIGERIAN_LOCATIONS, ALL_STATES, getCoordinatesForLocation } from "@/lib/locations";
import { formatPrice } from "@/lib/utils";

interface SearchFilters {
    city?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    neLat?: number;
    neLng?: number;
    swLat?: number;
    swLng?: number;
    amenities?: string[];
    furnished?: boolean;
    verified?: boolean;
    state?: string;
    polygon?: string;
    sortBy?: string;
    powerSupply?: string;
    waterSupply?: string;
    parkingSpaces?: number;
    serviced?: boolean;
    q?: string;
}

const POPULAR_STATES = [
    { label: "All Nigeria", state: "" },
    { label: "Lagos", state: "Lagos" },
    { label: "Abuja (FCT)", state: "FCT" },
    { label: "Rivers", state: "Rivers" },
    { label: "Oyo", state: "Oyo" },
    { label: "Enugu", state: "Enugu" },
    { label: "Delta", state: "Delta" },
    { label: "Kano", state: "Kano" },
    { label: "Ogun", state: "Ogun" },
    { label: "Akwa Ibom", state: "Akwa Ibom" },
    { label: "Anambra", state: "Anambra" },
    { label: "Edo", state: "Edo" },
    { label: "Kaduna", state: "Kaduna" },
    { label: "Plateau", state: "Plateau" },
];

const PRICE_PRESETS = [
    { label: "< ₦500k", min: undefined, max: 500000 },
    { label: "₦500k - ₦1.5M", min: 500000, max: 1500000 },
    { label: "₦1.5M - ₦3M", min: 1500000, max: 3000000 },
    { label: "₦3M - ₦6M", min: 3000000, max: 6000000 },
    { label: "₦6M - ₦12M", min: 6000000, max: 12000000 },
    { label: "₦12M+", min: 12000000, max: undefined },
];

const AMENITY_LIST = [
    "24/7 Power",
    "Fiber Internet",
    "Swimming Pool",
    "Gym",
    "Gated Security",
    "CCTV Surveillance",
    "Borehole",
    "Fitted Kitchen",
    "Water Heater",
    "Balcony",
    "Built-in Wardrobe",
    "Prepaid Meter",
];

const parseSmartQuery = (query: string): Partial<SearchFilters> => {
    const filters: Partial<SearchFilters> = {};
    const lowerQuery = query.toLowerCase();

    const bedMatch = lowerQuery.match(/(\d+)\s*(?:bedroom|bed|br)s?/i);
    if (bedMatch) filters.bedrooms = parseInt(bedMatch[1]);

    const underMatch = lowerQuery.match(/(?:under|below|max)\s*(\d+(?:\.\d+)?)\s*(m|k)/i);
    if (underMatch) {
        let value = parseFloat(underMatch[1]);
        if (underMatch[2] === "m") value *= 1000000;
        else if (underMatch[2] === "k") value *= 1000;
        filters.maxPrice = value;
    }

    const overMatch = lowerQuery.match(/(?:above|over|min)\s*(\d+(?:\.\d+)?)\s*(m|k)/i);
    if (overMatch) {
        let value = parseFloat(overMatch[1]);
        if (overMatch[2] === "m") value *= 1000000;
        else if (overMatch[2] === "k") value *= 1000;
        filters.minPrice = value;
    }

    if (lowerQuery.includes("serviced")) filters.serviced = true;
    if (lowerQuery.includes("furnished")) filters.furnished = true;

    // Detect state names
    for (const st of ALL_STATES) {
        if (lowerQuery.includes(st.toLowerCase())) {
            filters.state = st;
            break;
        }
    }

    const abujaAliases = ["abuja", "federal capital territory", "fct", "ftc"];
    if (abujaAliases.some((alias) => lowerQuery.includes(alias))) {
        filters.state = "FCT";
    }

    return filters;
};

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 border-4 border-[var(--color-brand-green)] border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-extrabold text-[var(--text-secondary)]">Loading homes for rent...</p>
                    </div>
                </div>
            }
        >
            <SearchContent />
        </Suspense>
    );
}

function FilterPanel({
    filters,
    updateFilter,
    clearFilters,
}: {
    filters: SearchFilters;
    updateFilter: (key: keyof SearchFilters, value: any) => void;
    clearFilters: () => void;
}) {
    const selectedStateCities = filters.state && NIGERIAN_LOCATIONS[filters.state] ? NIGERIAN_LOCATIONS[filters.state] : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[var(--color-brand-green)]" />
                    <h3 className="text-base font-black text-[var(--text-primary)]">Filters</h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-2.5 text-xs font-bold text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Reset
                </Button>
            </div>

            {/* State & City (36 States + FCT) */}
            <div className="space-y-3.5">
                <div>
                    <label className="block text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        State (36 States & FCT)
                    </label>
                    <div className="relative">
                        <select
                            value={filters.state || ""}
                            onChange={(e) => {
                                const val = e.target.value || undefined;
                                updateFilter("state", val);
                                updateFilter("city", undefined);
                            }}
                            className="w-full text-[var(--text-primary)] bg-[var(--bg-muted)]/70 h-11 px-3.5 pr-8 rounded-xl border border-[var(--border-color)] focus:border-[var(--color-brand-green)] focus:bg-[var(--bg-card)] focus:outline-hidden font-bold text-xs sm:text-sm transition-all appearance-none cursor-pointer"
                        >
                            <option value="">All 36 States & FCT</option>
                            {ALL_STATES.map((state) => (
                                <option key={state} value={state}>
                                    {state === "FCT" ? "Abuja (FCT)" : state}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        {filters.state ? `LGA / Area in ${filters.state === "FCT" ? "Abuja" : filters.state}` : "City / LGA / Area"}
                    </label>
                    {selectedStateCities.length > 0 ? (
                        <div className="relative">
                            <select
                                value={filters.city || ""}
                                onChange={(e) => updateFilter("city", e.target.value || undefined)}
                                className="w-full text-[var(--text-primary)] bg-[var(--bg-muted)]/70 h-11 px-3.5 pr-8 rounded-xl border border-[var(--border-color)] focus:border-[var(--color-brand-green)] focus:bg-[var(--bg-card)] focus:outline-hidden font-bold text-xs sm:text-sm transition-all appearance-none cursor-pointer"
                            >
                                <option value="">All Areas in {filters.state === "FCT" ? "Abuja" : filters.state}</option>
                                {selectedStateCities.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                        </div>
                    ) : (
                        <Input
                            placeholder="e.g. Lekki, Maitama, Ikeja, Yaba..."
                            value={filters.city || ""}
                            onChange={(e) => updateFilter("city", e.target.value || undefined)}
                            className="h-11 rounded-xl text-xs sm:text-sm bg-[var(--bg-muted)]/70 border-[var(--border-color)]"
                        />
                    )}
                </div>
            </div>

            {/* Price Range & Quick Presets */}
            <div className="space-y-3">
                <label className="block text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                    Budget Range (₦/year)
                </label>
                {/* Presets */}
                <div className="grid grid-cols-2 gap-1.5">
                    {PRICE_PRESETS.map((preset) => {
                        const isSelected = filters.minPrice === preset.min && filters.maxPrice === preset.max;
                        return (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                    if (isSelected) {
                                        updateFilter("minPrice", undefined);
                                        updateFilter("maxPrice", undefined);
                                    } else {
                                        updateFilter("minPrice", preset.min);
                                        updateFilter("maxPrice", preset.max);
                                    }
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all text-center ${
                                    isSelected
                                        ? "bg-[var(--color-brand-green)] text-white border-[var(--color-brand-green)] shadow-2xs"
                                        : "bg-[var(--bg-muted)]/60 text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40 hover:text-[var(--text-primary)]"
                                }`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>

                {/* Min / Max Inputs */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <Input
                        type="number"
                        placeholder="Min Price (₦)"
                        value={filters.minPrice || ""}
                        onChange={(e) => updateFilter("minPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                        className="h-10 text-xs rounded-xl bg-[var(--bg-muted)]/60 border-[var(--border-color)]"
                    />
                    <Input
                        type="number"
                        placeholder="Max Price (₦)"
                        value={filters.maxPrice || ""}
                        onChange={(e) => updateFilter("maxPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                        className="h-10 text-xs rounded-xl bg-[var(--bg-muted)]/60 border-[var(--border-color)]"
                    />
                </div>
            </div>

            {/* Property Categories */}
            <div className="space-y-2.5">
                <label className="block text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                    Property Category
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                    {PROPERTY_CATEGORIES.map((cat) => {
                        const isSelected = filters.propertyType === cat.value;
                        return (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => updateFilter("propertyType", isSelected ? undefined : cat.value)}
                                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                                    isSelected
                                        ? "bg-[var(--color-brand-green)] text-white border-[var(--color-brand-green)] shadow-2xs"
                                        : "bg-[var(--bg-muted)]/60 text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40 hover:text-[var(--text-primary)]"
                                }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* Specific Types Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {(filters.propertyType && DETAILED_TYPES_MAP[filters.propertyType]
                        ? DETAILED_TYPES_MAP[filters.propertyType]
                        : Object.values(DETAILED_TYPES_MAP).flat()
                    ).slice(0, 8).map((typeValue) => {
                        const isSelected = filters.propertyType === typeValue;
                        return (
                            <button
                                key={typeValue}
                                type="button"
                                onClick={() => updateFilter("propertyType", isSelected ? undefined : typeValue)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                    isSelected
                                        ? "bg-[var(--color-brand-green)] text-white border-[var(--color-brand-green)]"
                                        : "bg-[var(--bg-muted)]/40 text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--color-brand-green)]/30 hover:text-[var(--text-primary)]"
                                }`}
                            >
                                {typeValue.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
                <label className="block text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                    Bedrooms
                </label>
                <div className="flex gap-1.5">
                    {[{ label: "Any", val: undefined }, { label: "1+", val: 1 }, { label: "2+", val: 2 }, { label: "3+", val: 3 }, { label: "4+", val: 4 }, { label: "5+", val: 5 }].map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => updateFilter("bedrooms", item.val)}
                            className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                                filters.bedrooms === item.val
                                    ? "bg-[var(--color-brand-green)] text-white border-[var(--color-brand-green)] shadow-2xs"
                                    : "bg-[var(--bg-muted)]/60 text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
                <label className="block text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                    Bathrooms
                </label>
                <div className="flex gap-1.5">
                    {[{ label: "Any", val: undefined }, { label: "1+", val: 1 }, { label: "2+", val: 2 }, { label: "3+", val: 3 }, { label: "4+", val: 4 }].map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => updateFilter("bathrooms", item.val)}
                            className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                                filters.bathrooms === item.val
                                    ? "bg-[var(--color-brand-green)] text-white border-[var(--color-brand-green)] shadow-2xs"
                                    : "bg-[var(--bg-muted)]/60 text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Infrastructure & Utilities (Rich Nigerian Search Fields) */}
            <div className="space-y-3.5 pt-2 border-t border-[var(--border-color)]">
                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <label className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                            Power Supply
                        </label>
                    </div>
                    <div className="relative">
                        <select
                            value={filters.powerSupply || ""}
                            onChange={(e) => updateFilter("powerSupply", e.target.value || undefined)}
                            className="w-full text-[var(--text-primary)] bg-[var(--bg-muted)]/70 h-10 px-3 pr-8 rounded-xl border border-[var(--border-color)] focus:border-[var(--color-brand-green)] focus:outline-hidden font-bold text-xs transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Any Power Setup</option>
                            <option value="GRID_AND_SOLAR">⚡ Grid + Solar / Inverter</option>
                            <option value="GRID_AND_GENERATOR">⚡ Grid + Standby Generator</option>
                            <option value="SOLAR_ONLY">☀️ 100% Solar Powered (Off-grid)</option>
                            <option value="GRID_ONLY">🔌 NEPA / Grid Only</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Droplets className="h-3.5 w-3.5 text-blue-500" />
                        <label className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                            Water Supply
                        </label>
                    </div>
                    <div className="relative">
                        <select
                            value={filters.waterSupply || ""}
                            onChange={(e) => updateFilter("waterSupply", e.target.value || undefined)}
                            className="w-full text-[var(--text-primary)] bg-[var(--bg-muted)]/70 h-10 px-3 pr-8 rounded-xl border border-[var(--border-color)] focus:border-[var(--color-brand-green)] focus:outline-hidden font-bold text-xs transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Any Water Source</option>
                            <option value="BOREHOLE">💧 Borehole Water</option>
                            <option value="TREATED_WATER">🚰 Treated Water</option>
                            <option value="BOTH">💧 Both (Borehole + Treated)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Car className="h-3.5 w-3.5 text-indigo-500" />
                        <label className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                            Parking Spaces
                        </label>
                    </div>
                    <div className="flex gap-1.5">
                        {[{ label: "Any", val: undefined }, { label: "1+", val: 1 }, { label: "2+", val: 2 }, { label: "3+", val: 3 }].map((item) => (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => updateFilter("parkingSpaces", item.val)}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    filters.parkingSpaces === item.val
                                        ? "bg-[var(--color-brand-green)] text-white border-[var(--color-brand-green)]"
                                        : "bg-[var(--bg-muted)]/60 text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Management & Verification Toggles */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[var(--color-brand-green)]" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Serviced Property</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={filters.serviced === true}
                        onChange={(e) => updateFilter("serviced", e.target.checked ? true : undefined)}
                        className="w-4 h-4 rounded text-[var(--color-brand-green)] accent-[var(--color-brand-green)] cursor-pointer"
                    />
                </label>
                <div className="h-px bg-[var(--border-color)]/60" />
                <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Verified Listings Only</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={filters.verified === true}
                        onChange={(e) => updateFilter("verified", e.target.checked ? true : undefined)}
                        className="w-4 h-4 rounded text-[var(--color-brand-green)] accent-[var(--color-brand-green)] cursor-pointer"
                    />
                </label>
                <div className="h-px bg-[var(--border-color)]/60" />
                <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-purple-500" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Furnished Homes Only</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={filters.furnished === true}
                        onChange={(e) => updateFilter("furnished", e.target.checked ? true : undefined)}
                        className="w-4 h-4 rounded text-[var(--color-brand-green)] accent-[var(--color-brand-green)] cursor-pointer"
                    />
                </label>
            </div>

            {/* Amenities Multi-Select */}
            <div className="space-y-2.5">
                <label className="block text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                    Amenities & Features
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {AMENITY_LIST.map((amenity) => {
                        const isSelected = filters.amenities?.includes(amenity);
                        return (
                            <button
                                key={amenity}
                                type="button"
                                onClick={() => {
                                    const current = filters.amenities || [];
                                    const next = isSelected ? current.filter((a) => a !== amenity) : [...current, amenity];
                                    updateFilter("amenities", next.length > 0 ? next : undefined);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                                    isSelected
                                        ? "bg-[var(--color-brand-green)] text-white border-[var(--color-brand-green)] shadow-2xs"
                                        : "bg-[var(--bg-muted)]/50 text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--color-brand-green)]/30 hover:text-[var(--text-primary)]"
                                }`}
                            >
                                {amenity}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function SearchContent() {
    const searchParams = useSearchParams();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
    const [filters, setFilters] = useState<SearchFilters>({});
    const [searchOnMove, setSearchOnMove] = useState(false);
    const [shouldAutoFit, setShouldAutoFit] = useState(true);
    const [mapKey, setMapKey] = useState(0);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    const placeholders = [
        'Try "3 bedroom flat in Lekki"',
        'Try "Serviced apartment in Maitama under 5M"',
        'Try "Solar powered duplex in Port Harcourt"',
        'Try "Self-contain in Yaba under 500k"',
        'Try "2 bedroom in Ikeja with 24/7 power"',
        'Try "Mini flat in Ibadan under 1M"',
        'Try "Luxury penthouse in Victoria Island"',
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [placeholders.length]);

    // Parse initial URL query parameters
    useEffect(() => {
        const initialFilters: SearchFilters = {};
        const city = searchParams.get("city");
        const type = searchParams.get("propertyType");
        const verified = searchParams.get("verified");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const bedrooms = searchParams.get("bedrooms");
        const state = searchParams.get("state");
        const sortBy = searchParams.get("sortBy");
        const q = searchParams.get("q");

        if (city) initialFilters.city = city;
        if (type) initialFilters.propertyType = type;
        if (verified) initialFilters.verified = verified === "true";
        if (minPrice) initialFilters.minPrice = parseInt(minPrice);
        if (maxPrice) initialFilters.maxPrice = parseInt(maxPrice);
        if (bedrooms) initialFilters.bedrooms = parseInt(bedrooms);
        if (state) initialFilters.state = state;
        if (sortBy) initialFilters.sortBy = sortBy;
        if (q) initialFilters.q = q;

        setFilters(initialFilters);
    }, [searchParams]);

    // Fetch properties whenever filters change
    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filters.city) params.append("city", filters.city);
                if (filters.state) params.append("state", filters.state);
                if (filters.propertyType) params.append("propertyType", filters.propertyType);
                if (filters.minPrice) params.append("minPrice", filters.minPrice.toString());
                if (filters.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
                if (filters.bedrooms) params.append("bedrooms", filters.bedrooms.toString());
                if (filters.bathrooms) params.append("bathrooms", filters.bathrooms.toString());
                if (filters.sortBy) params.append("sortBy", filters.sortBy);
                if (filters.powerSupply) params.append("powerSupply", filters.powerSupply);
                if (filters.waterSupply) params.append("waterSupply", filters.waterSupply);
                if (filters.parkingSpaces) params.append("parkingSpaces", filters.parkingSpaces.toString());
                if (filters.serviced !== undefined) params.append("serviced", filters.serviced.toString());
                if (filters.furnished !== undefined) params.append("furnished", filters.furnished.toString());
                if (filters.verified !== undefined) params.append("verified", filters.verified.toString());
                if (filters.q) params.append("q", filters.q);
                if (filters.neLat) params.append("neLat", filters.neLat.toString());
                if (filters.neLng) params.append("neLng", filters.neLng.toString());
                if (filters.swLat) params.append("swLat", filters.swLat.toString());
                if (filters.swLng) params.append("swLng", filters.swLng.toString());
                if (filters.amenities && filters.amenities.length > 0) params.append("amenities", filters.amenities.join(","));
                if (filters.polygon) params.append("polygon", filters.polygon);

                const res = await api.get(`/properties?${params.toString()}`);
                setProperties(res.data.data.properties || []);
            } catch (error) {
                console.error("Failed to fetch properties:", error);
                setProperties([]);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchProperties, 250);
        return () => clearTimeout(timer);
    }, [filters]);

    const updateFilter = (key: keyof SearchFilters, value: any) => {
        setShouldAutoFit(true);
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setShouldAutoFit(true);
        setSearchOnMove(false);
        setMapKey((prev) => prev + 1);
        setFilters({});
    };

    const activeFilterCount = Object.entries(filters).filter(
        ([key, val]) => val !== undefined && val !== "" && key !== "sortBy"
    ).length;

    // Location label for display
    const locationDisplay = useMemo(() => {
        if (filters.city && filters.state) {
            return `${filters.city}, ${filters.state === "FCT" ? "Abuja (FCT)" : filters.state}`;
        }
        if (filters.state) {
            return filters.state === "FCT" ? "Abuja (FCT)" : `${filters.state} State`;
        }
        if (filters.city) {
            return filters.city;
        }
        return "Nigeria";
    }, [filters.city, filters.state]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Top Bar: Search Controls */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-16 z-30 shadow-xs">
                <div className="container-wide py-3">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
                        {/* Search Input with Icon */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-brand-green)]" />
                            <input
                                type="text"
                                value={filters.q || ""}
                                placeholder={placeholders[placeholderIndex]}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const detected = parseSmartQuery(val);
                                    setFilters((prev) => ({ ...prev, q: val, ...detected }));
                                }}
                                className="w-full h-11 pl-10 pr-9 text-xs sm:text-sm font-medium bg-[var(--bg-muted)]/70 rounded-2xl border border-[var(--border-color)] focus:border-[var(--color-brand-green)] focus:bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden transition-all shadow-2xs"
                            />
                            {filters.q && (
                                <button
                                    onClick={() => updateFilter("q", undefined)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* State Quick Dropdown (All 36 States + FCT) */}
                        <div className="hidden lg:block w-48 shrink-0 relative">
                            <select
                                value={filters.state || ""}
                                onChange={(e) => {
                                    updateFilter("state", e.target.value || undefined);
                                    updateFilter("city", undefined);
                                }}
                                className="w-full h-11 px-3.5 pr-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-muted)]/70 text-[var(--text-primary)] font-bold text-xs focus:border-[var(--color-brand-green)] outline-hidden transition-all appearance-none cursor-pointer"
                            >
                                <option value="">All 36 States & FCT</option>
                                {ALL_STATES.map((st) => (
                                    <option key={st} value={st}>
                                        {st === "FCT" ? "Abuja (FCT)" : st}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                        </div>

                        {/* Category Quick Dropdown */}
                        <div className="hidden xl:block w-44 shrink-0 relative">
                            <select
                                value={filters.propertyType || ""}
                                onChange={(e) => updateFilter("propertyType", e.target.value || undefined)}
                                className="w-full h-11 px-3.5 pr-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-muted)]/70 text-[var(--text-primary)] font-bold text-xs focus:border-[var(--color-brand-green)] outline-hidden transition-all appearance-none cursor-pointer"
                            >
                                <option value="">All Types</option>
                                {PROPERTY_CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                        </div>

                        {/* Filter Toggle (Desktop & Mobile) */}
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (window.innerWidth < 768) {
                                        setShowMobileFilters(true);
                                    } else {
                                        setShowFilters(!showFilters);
                                    }
                                }}
                                className={`h-11 px-3.5 sm:px-4 rounded-2xl border-[var(--border-color)] font-extrabold text-xs gap-2 ${
                                    activeFilterCount > 0
                                        ? "bg-[var(--color-brand-green)]/10 border-[var(--color-brand-green)] text-[var(--color-brand-green)]"
                                        : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                }`}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                <span>Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className="h-5 w-5 rounded-full bg-[var(--color-brand-green)] text-white text-[10px] font-black flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>

                            {/* View Switch: Grid vs Map */}
                            <div className="flex items-center p-1 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border-color)]">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-xl transition-all ${
                                        viewMode === "grid"
                                            ? "bg-[var(--bg-card)] text-[var(--color-brand-green)] shadow-2xs"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    }`}
                                    title="Grid View"
                                >
                                    <Grid3x3 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("map")}
                                    className={`p-2 rounded-xl transition-all ${
                                        viewMode === "map"
                                            ? "bg-[var(--bg-card)] text-[var(--color-brand-green)] shadow-2xs"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    }`}
                                    title="Map View"
                                >
                                    <MapIcon className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative">
                                <select
                                    value={filters.sortBy || "newest"}
                                    onChange={(e) => updateFilter("sortBy", e.target.value)}
                                    className="h-11 px-3 pr-7 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] font-bold text-xs focus:border-[var(--color-brand-green)] outline-hidden transition-all appearance-none cursor-pointer"
                                >
                                    <option value="newest">Latest</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Regional Quick Navigation Ribbon */}
                    <div className="flex items-center gap-1.5 pt-2.5 overflow-x-auto scrollbar-none">
                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                            <MapPin className="h-3 w-3 text-[var(--color-brand-green)]" /> States:
                        </span>
                        {POPULAR_STATES.map((item) => {
                            const isSelected = (filters.state || "") === item.state;
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        updateFilter("state", item.state || undefined);
                                        updateFilter("city", undefined);
                                    }}
                                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                                        isSelected
                                            ? "bg-[var(--color-brand-green)] text-white shadow-2xs"
                                            : "bg-[var(--bg-muted)]/70 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-transparent hover:border-[var(--border-color)]"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container-wide py-6">
                <div className="flex gap-6 items-start">
                    {/* Desktop Filters Sidebar */}
                    {showFilters && (
                        <aside className="hidden md:block w-72 lg:w-80 shrink-0 sticky top-40 max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-thin">
                            <div className="bg-[var(--bg-card)] rounded-3xl p-5 border border-[var(--border-color)] shadow-xs">
                                <FilterPanel
                                    filters={filters}
                                    updateFilter={updateFilter}
                                    clearFilters={clearFilters}
                                />
                            </div>
                        </aside>
                    )}

                    {/* Results Grid / Map */}
                    <main className="flex-1 min-w-0">
                        {/* Results Header Strip */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                                    {loading ? (
                                        "Searching homes..."
                                    ) : (
                                        <>
                                            {properties.length} {properties.length === 1 ? "Home" : "Homes"} For Rent in {locationDisplay}
                                        </>
                                    )}
                                </h1>
                                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                    Verified Nigerian listings with instant tour scheduling & escrow rent guarantee
                                </p>
                            </div>

                            {/* Active Filter Badges */}
                            {activeFilterCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-8 px-3 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl shrink-0"
                                >
                                    <RotateCcw className="h-3 w-3 mr-1" /> Clear All Filters ({activeFilterCount})
                                </Button>
                            )}
                        </div>

                        {/* Active Filters Pill Bar */}
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mb-5">
                                {filters.state && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-2xs">
                                        <span>State: {filters.state === "FCT" ? "Abuja (FCT)" : filters.state}</span>
                                        <button onClick={() => updateFilter("state", undefined)} className="text-[var(--text-muted)] hover:text-rose-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.city && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-2xs">
                                        <span>Area: {filters.city}</span>
                                        <button onClick={() => updateFilter("city", undefined)} className="text-[var(--text-muted)] hover:text-rose-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.bedrooms && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-2xs">
                                        <span>{filters.bedrooms}+ Beds</span>
                                        <button onClick={() => updateFilter("bedrooms", undefined)} className="text-[var(--text-muted)] hover:text-rose-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.propertyType && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-2xs">
                                        <span>{filters.propertyType.replace(/_/g, " ")}</span>
                                        <button onClick={() => updateFilter("propertyType", undefined)} className="text-[var(--text-muted)] hover:text-rose-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.serviced && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                                        <span>Serviced</span>
                                        <button onClick={() => updateFilter("serviced", undefined)} className="text-emerald-600 dark:text-emerald-400 hover:text-rose-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.powerSupply && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
                                        <span>Power: {filters.powerSupply.replace(/_/g, " ")}</span>
                                        <button onClick={() => updateFilter("powerSupply", undefined)} className="text-amber-600 dark:text-amber-400 hover:text-rose-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.waterSupply && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-2xs">
                                        <span>Water: {filters.waterSupply.replace(/_/g, " ")}</span>
                                        <button onClick={() => updateFilter("waterSupply", undefined)} className="text-cyan-600 dark:text-cyan-400 hover:text-rose-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* View Content: Map vs Grid */}
                        {viewMode === "map" ? (
                            <div className="h-[calc(100vh-280px)] min-h-[450px] relative rounded-3xl overflow-hidden border border-[var(--border-color)] shadow-sm">
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-[var(--bg-card)]/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md border border-[var(--border-color)] flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="searchOnMove"
                                        checked={searchOnMove}
                                        onChange={(e) => setSearchOnMove(e.target.checked)}
                                        className="w-4 h-4 text-[var(--color-brand-green)] accent-[var(--color-brand-green)] rounded"
                                    />
                                    <label htmlFor="searchOnMove" className="text-xs font-extrabold text-[var(--text-secondary)] cursor-pointer">
                                        Search as I pan map
                                    </label>
                                </div>
                                <Map
                                    key={mapKey}
                                    properties={properties.map((p, idx) => {
                                        const coords = (p.latitude != null && p.longitude != null && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude)))
                                            ? { lat: Number(p.latitude), lng: Number(p.longitude) }
                                            : getCoordinatesForLocation(p.state, p.city, idx);
                                        return {
                                            id: p.id,
                                            title: p.title,
                                            latitude: coords.lat,
                                            longitude: coords.lng,
                                            pricePerYear: p.pricePerYear,
                                            city: p.city,
                                            image: p.images?.[0]?.url,
                                        };
                                    })}
                                    onPropertyClick={(id) => {
                                        window.location.href = `/properties/${id}`;
                                    }}
                                    onBoundsChange={(bounds) => {
                                        if (searchOnMove && !loading) {
                                            setShouldAutoFit(false);
                                            setFilters((prev) => ({ ...prev, ...bounds }));
                                        }
                                    }}
                                    onPolygonChange={(polygon) => {
                                        setShouldAutoFit(true);
                                        setFilters((prev) => ({
                                            ...prev,
                                            polygon: polygon ? JSON.stringify(polygon) : undefined,
                                        }));
                                    }}
                                    autoFit={shouldAutoFit}
                                />
                            </div>
                        ) : loading ? (
                            <div className={`grid gap-5 ${showFilters ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-[var(--bg-card)] rounded-3xl h-88 animate-pulse border border-[var(--border-color)]" />
                                ))}
                            </div>
                        ) : properties.length > 0 ? (
                            <div className={`grid gap-5 ${showFilters ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
                                {properties.map((property) => (
                                    <PropertyCard
                                        key={property.id}
                                        property={{
                                            id: property.id,
                                            title: property.title,
                                            address: property.address,
                                            price: property.pricePerYear,
                                            bedrooms: property.bedrooms,
                                            bathrooms: property.bathrooms,
                                            image: property.images?.[0]?.url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                                            verified: property.verified,
                                            featured: property.featured,
                                            landlordVerified: property.landlord?.verified,
                                            type: property.propertyType.replace(/_/g, " "),
                                            status: property.status,
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6 bg-[var(--bg-card)] rounded-3xl border border-dashed border-[var(--border-color)]">
                                <div className="h-16 w-16 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
                                    <Search className="h-8 w-8 opacity-40" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] mb-1">
                                    No properties match your current search
                                </h3>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6 font-medium">
                                    We couldn't find listings matching all your selected criteria in {locationDisplay}. Try clearing some filters or searching a nearby LGA.
                                </p>
                                <Button
                                    onClick={clearFilters}
                                    className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold rounded-2xl px-6 h-11"
                                >
                                    Reset All Filters
                                </Button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Sheet */}
            {showMobileFilters && (
                <>
                    <div
                        className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
                        onClick={() => setShowMobileFilters(false)}
                    />
                    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-card)] rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col border-t border-[var(--border-color)] animate-in slide-in-from-bottom duration-250">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] shrink-0">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4 text-[var(--color-brand-green)]" />
                                <h3 className="font-black text-[var(--text-primary)] text-base">Search Filters</h3>
                            </div>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="p-1.5 rounded-full hover:bg-[var(--bg-muted)] text-[var(--text-muted)]"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-5 py-4 scrollbar-thin">
                            <FilterPanel
                                filters={filters}
                                updateFilter={updateFilter}
                                clearFilters={clearFilters}
                            />
                        </div>
                        <div className="p-4 border-t border-[var(--border-color)] shrink-0 bg-[var(--bg-card)]">
                            <Button
                                className="w-full bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 h-12 font-extrabold text-white rounded-2xl shadow-xs"
                                onClick={() => setShowMobileFilters(false)}
                            >
                                Show {properties.length} Properties
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
