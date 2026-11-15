"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Map } from "@/components/map/Map";
import { LockedMessageButton } from "@/components/property/LockedMessageButton";
import { TrustScore } from "@/components/profile/TrustScore";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { PROPERTY_CATEGORIES, DETAILED_TYPES_MAP } from "@/lib/constants";
import { NIGERIAN_LOCATIONS, ALL_STATES } from "@/lib/locations";
import { formatPrice } from "@/lib/utils";
import {
    Search,
    MapPin,
    SlidersHorizontal,
    X,
    Map as MapIcon,
    Grid3x3,
    ChevronDown,
    Sparkles,
    CheckCircle2,
    Zap,
    Droplets,
    Car,
    Shield,
    ShieldCheck,
    Home,
    Bed,
    Bath,
    RotateCcw,
    Building2,
    Calendar,
    Phone,
    Share2,
    Check,
    Star,
    MessageSquare,
    ExternalLink,
    Clock,
    Lock,
    Eye,
    ChevronRight,
    ArrowLeft,
    CheckCheck,
} from "lucide-react";

interface LandlordProfile {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    role: string;
    verified: boolean;
    createdAt: string;
    phone?: string;
    landlordAvgRating?: number | null;
    landlordReviewCount?: number;
    trustScore?: number;
    propertiesCount?: number;
}

interface SearchFilters {
    city?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
    furnished?: boolean;
    verified?: boolean;
    state?: string;
    sortBy?: string;
    powerSupply?: string;
    waterSupply?: string;
    parkingSpaces?: number;
    serviced?: boolean;
    q?: string;
    status?: string;
}

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

export default function LandlordProfilePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 border-4 border-[var(--color-brand-green)] border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-extrabold text-[var(--text-secondary)]">Loading landlord profile & properties...</p>
                    </div>
                </div>
            }
        >
            <LandlordProfileContent />
        </Suspense>
    );
}

function LandlordFilterPanel({
    filters,
    updateFilter,
    clearFilters,
    landlordStates,
}: {
    filters: SearchFilters;
    updateFilter: (key: keyof SearchFilters, value: any) => void;
    clearFilters: () => void;
    landlordStates?: string[];
}) {
    const selectedStateCities = filters.state && NIGERIAN_LOCATIONS[filters.state] ? NIGERIAN_LOCATIONS[filters.state] : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[var(--color-brand-green)]" />
                    <h3 className="text-base font-black text-[var(--text-primary)]">Filter Listings</h3>
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
                            <option value="">All States</option>
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

            {/* Infrastructure & Utilities */}
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
                        <span className="text-xs font-bold text-[var(--text-primary)]">Escrow Verified Only</span>
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

function LandlordProfileContent() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user: dbUser, clerkUser } = useAuth();

    const [landlord, setLandlord] = useState<LandlordProfile | null>(null);
    const [properties, setProperties] = useState<any[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingProperties, setLoadingProperties] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
    const [filters, setFilters] = useState<SearchFilters>({ status: "AVAILABLE" });
    const [showPhone, setShowPhone] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [searchInput, setSearchInput] = useState("");

    const isOwner = Boolean(
        landlord && (
            (dbUser && landlord.id === dbUser.id) ||
            (clerkUser && (landlord as any).clerkId === clerkUser.id)
        )
    );

    // Fetch Landlord Info
    useEffect(() => {
        if (!id) return;

        const fetchLandlord = async () => {
            try {
                setLoadingProfile(true);
                const res = await api.get(`/users/${id}`);
                setLandlord(res.data.data);
            } catch (err) {
                console.error("Failed to fetch landlord profile:", err);
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchLandlord();
    }, [id]);

    // Parse initial URL query params
    useEffect(() => {
        const initialFilters: SearchFilters = { status: "AVAILABLE" };
        const city = searchParams.get("city");
        const type = searchParams.get("propertyType");
        const verified = searchParams.get("verified");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const bedrooms = searchParams.get("bedrooms");
        const state = searchParams.get("state");
        const sortBy = searchParams.get("sortBy");
        const q = searchParams.get("q");
        const status = searchParams.get("status");

        if (city) initialFilters.city = city;
        if (type) initialFilters.propertyType = type;
        if (verified) initialFilters.verified = verified === "true";
        if (minPrice) initialFilters.minPrice = parseInt(minPrice);
        if (maxPrice) initialFilters.maxPrice = parseInt(maxPrice);
        if (bedrooms) initialFilters.bedrooms = parseInt(bedrooms);
        if (state) initialFilters.state = state;
        if (sortBy) initialFilters.sortBy = sortBy;
        if (q) {
            initialFilters.q = q;
            setSearchInput(q);
        }
        if (status) initialFilters.status = status;

        setFilters(initialFilters);
    }, [searchParams]);

    // Fetch properties whenever filters or landlord ID changes
    useEffect(() => {
        if (!id) return;

        const fetchProperties = async () => {
            setLoadingProperties(true);
            try {
                const params = new URLSearchParams();
                params.append("landlordId", id);

                if (filters.status && filters.status !== "ALL") {
                    params.append("status", filters.status);
                }
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
                if (filters.amenities && filters.amenities.length > 0) {
                    params.append("amenities", filters.amenities.join(","));
                }

                const res = await api.get(`/properties?${params.toString()}`);
                const data = res.data?.data;
                const list = data?.properties || (Array.isArray(data) ? data : []);
                setProperties(list);
            } catch (error) {
                console.error("Failed to fetch landlord properties:", error);
                setProperties([]);
            } finally {
                setLoadingProperties(false);
            }
        };

        const timer = setTimeout(fetchProperties, 250);
        return () => clearTimeout(timer);
    }, [id, filters]);

    const updateFilter = (key: keyof SearchFilters, value: any) => {
        setFilters((prev) => {
            const updated = { ...prev, [key]: value };
            if (value === undefined || value === "") delete updated[key];
            return updated;
        });
    };

    const clearFilters = () => {
        setFilters({ status: "AVAILABLE" });
        setSearchInput("");
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchInput.trim()) {
            updateFilter("q", undefined);
            return;
        }

        const smart = parseSmartQuery(searchInput);
        setFilters((prev) => ({
            ...prev,
            ...smart,
            q: searchInput.trim(),
        }));
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${landlord?.firstName || "Verified Landlord"}'s Rentals on RentHub`,
                    text: `View all verified rental properties listed by ${landlord?.firstName || "this landlord"} on RentHub.`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 3000);
            }
        } catch (err) {
            console.error("Failed to share:", err);
        }
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.city) count++;
        if (filters.state) count++;
        if (filters.propertyType) count++;
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
        if (filters.bedrooms) count++;
        if (filters.bathrooms) count++;
        if (filters.amenities && filters.amenities.length > 0) count += filters.amenities.length;
        if (filters.furnished) count++;
        if (filters.verified) count++;
        if (filters.serviced) count++;
        if (filters.powerSupply) count++;
        if (filters.waterSupply) count++;
        if (filters.parkingSpaces) count++;
        if (filters.q) count++;
        return count;
    }, [filters]);

    const availableCount = useMemo(() => {
        return properties.filter((p) => p.status === "AVAILABLE" || !p.status).length;
    }, [properties]);

    const rentedCount = useMemo(() => {
        return properties.filter((p) => p.status === "RENTED").length;
    }, [properties]);

    if (loadingProfile && !landlord) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-[var(--color-brand-green)] border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-extrabold text-[var(--text-secondary)]">Loading landlord profile...</p>
                </div>
            </div>
        );
    }

    if (!landlord && !loadingProfile) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)] text-center space-y-4 shadow-xl">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-[var(--text-primary)]">Landlord Not Found</h1>
                    <p className="text-sm text-[var(--text-secondary)] font-medium">
                        The landlord profile you are looking for does not exist or may have been removed.
                    </p>
                    <Button asChild className="w-full bg-[var(--color-brand-green)] text-white rounded-2xl">
                        <Link href="/search">Explore Available Homes</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const landlordName = `${landlord?.firstName || "Verified"} ${landlord?.lastName || "Landlord"}`;
    const memberSinceYear = landlord?.createdAt ? new Date(landlord.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Jan 2026";
    const ratingValue = landlord?.landlordAvgRating ? Number(landlord.landlordAvgRating).toFixed(1) : null;
    const reviewCount = landlord?.landlordReviewCount || 0;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20">
            {/* Top Breadcrumb / Return */}
            <div className="border-b border-[var(--border-color)] bg-[var(--bg-card)]/50 backdrop-blur-xs">
                <div className="container-wide py-3 flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2">
                        <Link href="/search" className="hover:text-[var(--color-brand-green)] transition-colors flex items-center gap-1">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>All Properties</span>
                        </Link>
                        <span>/</span>
                        <span className="text-[var(--text-primary)] font-extrabold truncate max-w-[200px] sm:max-w-none">
                            {landlordName}&apos;s Portfolio
                        </span>
                    </div>

                    <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] hover:border-[var(--color-brand-green)] hover:text-[var(--color-brand-green)] transition-all cursor-pointer font-extrabold"
                    >
                        {copiedLink ? (
                            <>
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500">Link Copied</span>
                            </>
                        ) : (
                            <>
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Share Profile</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Owner Preview Banner */}
            {isOwner && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 py-2.5 px-4">
                    <div className="container-wide flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>This is your public Landlord Profile as prospective tenants see it.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button asChild size="sm" variant="outline" className="h-7 text-xs font-bold border-emerald-500/30 rounded-xl">
                                <Link href="/dashboard?tab=properties">Manage Listings in Dashboard</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Landlord Hero Profile Header */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] py-8 sm:py-12 relative overflow-hidden">
                <div className="container-wide">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
                        {/* Avatar & Main Info */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 min-w-0">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-[var(--bg-muted)] overflow-hidden relative border-2 border-[var(--border-color)] shadow-md shrink-0">
                                    {landlord?.avatar ? (
                                        <Image
                                            src={landlord.avatar}
                                            alt={landlordName}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] text-3xl font-black">
                                            {landlord?.firstName?.[0] || "L"}
                                            {landlord?.lastName?.[0] || ""}
                                        </div>
                                    )}
                                </div>
                                {landlord?.verified && (
                                    <div
                                        title="Government ID & NIN Verified"
                                        className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-emerald-500 text-white shadow-md border-2 border-[var(--bg-card)]"
                                    >
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                )}
                            </div>

                            {/* Bio & Badges */}
                            <div className="space-y-2 min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                                        {landlordName}
                                    </h1>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black rounded-xl px-2.5 py-0.5">
                                        Verified Landlord
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)] font-semibold">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                        <span>Member since {memberSinceYear}</span>
                                    </span>

                                    {ratingValue && (
                                        <>
                                            <span className="text-[var(--text-muted)]">•</span>
                                            <span className="flex items-center gap-1 text-amber-500 font-extrabold">
                                                <Star className="w-3.5 h-3.5 fill-amber-500" />
                                                <span>{ratingValue}</span>
                                                <span className="text-[var(--text-muted)]">({reviewCount} reviews)</span>
                                            </span>
                                        </>
                                    )}

                                    {landlord?.verified && (
                                        <>
                                            <span className="text-[var(--text-muted)]">•</span>
                                            <span className="flex items-center gap-1 text-[var(--color-brand-green)] font-extrabold">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>NIN & Govt ID Verified</span>
                                            </span>
                                        </>
                                    )}
                                </div>

                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium max-w-xl">
                                    Direct property owner on RentHub Nigeria. All rental transactions backed by RentHub 100% Escrow Protection with zero agent markups.
                                </p>
                            </div>
                        </div>

                        {/* Direct Contact Actions Box */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:w-72 shrink-0 pt-2 lg:pt-0">
                            {/* Phone Reveal Button */}
                            <Button
                                variant="outline"
                                onClick={() => setShowPhone(!showPhone)}
                                className="w-full justify-center gap-2 h-11 text-xs font-black border-[var(--border-color)] bg-[var(--bg-muted)]/50 hover:bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-2xl"
                            >
                                <Phone className="w-4 h-4 text-[var(--color-brand-green)]" />
                                <span>
                                    {showPhone
                                        ? landlord?.phone && !landlord.phone.startsWith("no-phone")
                                            ? landlord.phone
                                            : "+234 (0) 800-RENTHUB"
                                        : "Reveal Landlord Phone"}
                                </span>
                            </Button>

                            {/* Message Landlord Action */}
                            {landlord && properties.length > 0 && properties[0]?.id && !isOwner ? (
                                <LockedMessageButton
                                    landlordId={landlord.id}
                                    propertyId={properties[0].id}
                                    propertyTitle={properties[0].title}
                                    className="w-full justify-center gap-2 h-11 text-xs font-black border-[var(--border-color)] bg-[var(--bg-muted)]/50 hover:bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-2xl"
                                />
                            ) : isOwner ? (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full justify-center gap-2 h-11 text-xs font-black border-[var(--border-color)] rounded-2xl"
                                >
                                    <Link href="/dashboard?tab=inbox">
                                        <MessageSquare className="w-4 h-4 text-[var(--color-brand-green)]" />
                                        <span>View Tenant Messages</span>
                                    </Link>
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    {/* Quick Metric Pills Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-[var(--border-color)]">
                        <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Portfolio Size</p>
                                <p className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                                    {landlord?.propertiesCount || properties.length} Listings
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Available Now</p>
                                <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                                    {availableCount} Ready
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
                                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Trust Score</p>
                                <p className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                                    {landlord?.trustScore || 85} / 100
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">RentHub Escrow</p>
                                <p className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                                    100% Protected
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Search & View Controls Bar */}
            <div className="sticky top-0 z-30 bg-[var(--bg-card)]/95 backdrop-blur-md border-b border-[var(--border-color)] shadow-xs">
                <div className="container-wide py-3">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                            <Input
                                type="text"
                                placeholder={`Search properties by ${landlord?.firstName || "landlord"}... (e.g. 2 bed Lekki, serviced, solar)`}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="h-11 pl-10 pr-9 rounded-2xl text-xs sm:text-sm bg-[var(--bg-muted)]/60 border-[var(--border-color)] focus:border-[var(--color-brand-green)] focus:bg-[var(--bg-card)] transition-all font-semibold"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchInput("");
                                        updateFilter("q", undefined);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </form>

                        {/* Portfolio Status Tabs & View Modes */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto scrollbar-none">
                            {/* Status Tabs */}
                            <div className="flex items-center p-1 bg-[var(--bg-muted)]/70 rounded-2xl border border-[var(--border-color)] shrink-0">
                                <button
                                    type="button"
                                    onClick={() => updateFilter("status", "AVAILABLE")}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                        filters.status === "AVAILABLE"
                                            ? "bg-[var(--bg-card)] text-[var(--color-brand-green)] shadow-2xs"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    }`}
                                >
                                    Available
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateFilter("status", "ALL")}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                        filters.status === "ALL"
                                            ? "bg-[var(--bg-card)] text-[var(--color-brand-green)] shadow-2xs"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    }`}
                                >
                                    All Listings
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateFilter("status", "RENTED")}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                        filters.status === "RENTED"
                                            ? "bg-[var(--bg-card)] text-[var(--color-brand-green)] shadow-2xs"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    }`}
                                >
                                    Rented ({rentedCount})
                                </button>
                            </div>

                            {/* Mobile Filters Toggle Button */}
                            <Button
                                variant="outline"
                                onClick={() => setShowMobileFilters(true)}
                                className="md:hidden h-11 px-3 rounded-2xl border-[var(--border-color)] font-bold text-xs shrink-0"
                            >
                                <SlidersHorizontal className="h-4 w-4 mr-1.5 text-[var(--color-brand-green)]" />
                                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                            </Button>

                            {/* Desktop Filters Toggle Button */}
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="hidden md:inline-flex h-11 px-3.5 rounded-2xl border-[var(--border-color)] font-bold text-xs shrink-0"
                            >
                                <SlidersHorizontal className="h-4 w-4 mr-1.5 text-[var(--color-brand-green)]" />
                                {showFilters ? "Hide Filters" : `Filters ${activeFilterCount > 0 ? `(${activeFilterCount})` : ""}`}
                            </Button>

                            {/* Grid vs Map Switcher */}
                            <div className="flex items-center p-1 bg-[var(--bg-muted)]/70 rounded-2xl border border-[var(--border-color)] shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-xl transition-all ${
                                        viewMode === "grid"
                                            ? "bg-[var(--bg-card)] text-[var(--color-brand-green)] shadow-2xs"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    }`}
                                    title="Grid View"
                                >
                                    <Grid3x3 className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("map")}
                                    className={`p-2 rounded-xl transition-all ${
                                        viewMode === "map"
                                            ? "bg-[var(--bg-card)] text-[var(--color-brand-green)] shadow-2xs"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    }`}
                                    title="Map View"
                                >
                                    <MapIcon className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative shrink-0">
                                <select
                                    value={filters.sortBy || "newest"}
                                    onChange={(e) => updateFilter("sortBy", e.target.value)}
                                    className="h-11 px-3 pr-7 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] font-bold text-xs focus:border-[var(--color-brand-green)] outline-hidden transition-all appearance-none cursor-pointer"
                                >
                                    <option value="newest">Latest Added</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Portfolio Content Area */}
            <div className="container-wide py-8">
                <div className="flex gap-8 items-start">
                    {/* Desktop Filters Sidebar */}
                    {showFilters && (
                        <aside className="hidden md:block w-72 lg:w-80 shrink-0 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin">
                            <div className="bg-[var(--bg-card)] rounded-3xl p-5 border border-[var(--border-color)] shadow-xs">
                                <LandlordFilterPanel
                                    filters={filters}
                                    updateFilter={updateFilter}
                                    clearFilters={clearFilters}
                                />
                            </div>
                        </aside>
                    )}

                    {/* Results Container */}
                    <main className="flex-1 min-w-0">
                        {/* Results Count & Active Filter Pills */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                                    {loadingProperties ? (
                                        "Searching landlord listings..."
                                    ) : (
                                        <>
                                            {properties.length} {properties.length === 1 ? "Property" : "Properties"} Listed
                                        </>
                                    )}
                                </h2>
                                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                    Verified direct listings by {landlordName} • 100% Escrow protected
                                </p>
                            </div>

                            {activeFilterCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-8 px-3 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl shrink-0 self-start sm:self-auto"
                                >
                                    <RotateCcw className="h-3 w-3 mr-1" /> Clear All Filters ({activeFilterCount})
                                </Button>
                            )}
                        </div>

                        {/* Active Filter Badges */}
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mb-6">
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
                                        <button onClick={() => updateFilter("serviced", undefined)} className="text-emerald-600 hover:text-rose-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.furnished && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-2xs">
                                        <span>Furnished</span>
                                        <button onClick={() => updateFilter("furnished", undefined)} className="text-purple-600 hover:text-rose-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Loading Skeleton */}
                        {loadingProperties ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div
                                        key={i}
                                        className="h-80 rounded-3xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : viewMode === "map" ? (
                            /* Map View Mode */
                            <div className="h-[650px] rounded-3xl overflow-hidden border border-[var(--border-color)] shadow-md relative">
                                <Map
                                    properties={properties.map((p) => ({
                                        id: p.id,
                                        title: p.title,
                                        pricePerYear: p.pricePerYear,
                                        latitude: p.latitude,
                                        longitude: p.longitude,
                                        city: p.city,
                                        state: p.state,
                                        image: p.images?.[0]?.url,
                                    }))}
                                    zoom={filters.city ? 13 : filters.state ? 11 : 7}
                                    autoFit={true}
                                />
                            </div>
                        ) : properties.length > 0 ? (
                            /* Grid View Mode */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {properties.map((prop) => (
                                    <PropertyCard key={prop.id} property={prop} />
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="text-center py-16 px-4 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] space-y-4">
                                <div className="h-16 w-16 mx-auto rounded-3xl bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)]">
                                    <Home className="h-8 w-8 text-[var(--color-brand-green)]" />
                                </div>
                                <h3 className="text-lg font-black text-[var(--text-primary)]">
                                    No Properties Found
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto font-medium">
                                    {activeFilterCount > 0
                                        ? "No properties match your current filter combination for this landlord. Try resetting some filters."
                                        : `${landlordName} does not have any listings matching this status right now.`}
                                </p>
                                {activeFilterCount > 0 && (
                                    <Button
                                        onClick={clearFilters}
                                        className="bg-[var(--color-brand-green)] text-white text-xs font-bold rounded-2xl"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                        Reset All Filters
                                    </Button>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Sheet / Modal */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
                    <div className="w-full max-w-md bg-[var(--bg-card)] h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center pb-4 border-b border-[var(--border-color)]">
                                <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                                    <SlidersHorizontal className="h-5 w-5 text-[var(--color-brand-green)]" />
                                    Filter Listings
                                </h3>
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="py-4">
                                <LandlordFilterPanel
                                    filters={filters}
                                    updateFilter={updateFilter}
                                    clearFilters={clearFilters}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[var(--border-color)] sticky bottom-0 bg-[var(--bg-card)] pb-2 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="flex-1 h-12 rounded-2xl font-bold text-xs"
                            >
                                Reset
                            </Button>
                            <Button
                                onClick={() => setShowMobileFilters(false)}
                                className="flex-1 h-12 bg-[var(--color-brand-green)] text-white rounded-2xl font-black text-xs shadow-lg"
                            >
                                Show {properties.length} Results
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
