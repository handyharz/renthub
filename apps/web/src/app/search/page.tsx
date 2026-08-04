"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Map } from "@/components/map/Map";
import { Search, MapPin, SlidersHorizontal, X, Map as MapIcon, Grid3x3, ChevronDown, ArrowUpDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import api from "@/lib/api";
import { PROPERTY_CATEGORIES, DETAILED_TYPES_MAP } from "@/lib/constants";

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

const parseSmartQuery = (query: string): Partial<SearchFilters> => {
    const filters: Partial<SearchFilters> = {};
    const lowerQuery = query.toLowerCase();

    const bedMatch = lowerQuery.match(/(\d+)\s*(?:bedroom|bed|br)s?/i);
    if (bedMatch) filters.bedrooms = parseInt(bedMatch[1]);

    const underMatch = lowerQuery.match(/(?:under|below|max)\s*(\d+(?:\.\d+)?)\s*(m|k)/i);
    if (underMatch) {
        let value = parseFloat(underMatch[1]);
        if (underMatch[2] === 'm') value *= 1000000;
        else if (underMatch[2] === 'k') value *= 1000;
        filters.maxPrice = value;
    }

    const overMatch = lowerQuery.match(/(?:above|over|min)\s*(\d+(?:\.\d+)?)\s*(m|k)/i);
    if (overMatch) {
        let value = parseFloat(overMatch[1]);
        if (overMatch[2] === 'm') value *= 1000000;
        else if (overMatch[2] === 'k') value *= 1000;
        filters.minPrice = value;
    }

    if (lowerQuery.includes('serviced')) filters.serviced = true;
    if (lowerQuery.includes('furnished')) filters.furnished = true;

    const abujaAliases = ['abuja', 'federal capital territory', 'fct', 'ftc'];
    if (abujaAliases.some(alias => lowerQuery.includes(alias))) {
        filters.state = 'FCT';
    }

    return filters;
};

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-4 border-[var(--color-brand-green)] border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold text-[var(--text-muted)]">Loading search results...</p>
            </div>
        </div>}>
            <SearchContent />
        </Suspense>
    );
}

function FilterPanel({
    filters,
    updateFilter,
    clearFilters,
    availableLocations,
}: {
    filters: SearchFilters;
    updateFilter: (key: keyof SearchFilters, value: any) => void;
    clearFilters: () => void;
    availableLocations: Record<string, string[]>;
}) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-[var(--color-brand-blue)]">Filters</h2>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[var(--text-muted)]">
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                </Button>
            </div>

            {/* State & City */}
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">State</label>
                    <select
                        value={filters.state || ""}
                        onChange={(e) => updateFilter("state", e.target.value || undefined)}
                        className="w-full text-[var(--text-primary)] bg-[var(--bg-input)] h-11 px-3 rounded-lg border-2 border-[var(--border-color)] focus:border-[var(--color-brand-blue)] focus:outline-none font-medium transition-all"
                    >
                        <option value="">All States</option>
                        {Object.keys(availableLocations).map((state) => (
                            <option key={state} value={state}>
                                {state === "FCT" ? "Abuja (FCT)" : state}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        {filters.state ? `Areas in ${filters.state}` : "LGA / City / Area"}
                    </label>
                    {filters.state && availableLocations[filters.state] ? (
                        <select
                            value={filters.city || ""}
                            onChange={(e) => updateFilter("city", e.target.value || undefined)}
                            className="w-full text-[var(--text-primary)] bg-[var(--bg-input)] h-11 px-3 rounded-lg border-2 border-[var(--border-color)] focus:border-[var(--color-brand-blue)] focus:outline-none font-medium transition-all"
                        >
                            <option value="">All Areas</option>
                            {availableLocations[filters.state].map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    ) : (
                        <Input
                            placeholder="e.g. Lekki, Maitama..."
                            value={filters.city || ""}
                            onChange={(e) => updateFilter("city", e.target.value)}
                            className="h-11"
                        />
                    )}
                </div>
            </div>

            {/* Property Type */}
            <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">Property Category</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {PROPERTY_CATEGORIES.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => updateFilter("propertyType", type.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filters.propertyType === type.value
                                ? "bg-[var(--color-brand-blue)] text-white shadow-md"
                                : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]"
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Detailed Types</label>
                <div className="flex flex-wrap gap-2">
                    {(filters.propertyType && DETAILED_TYPES_MAP[filters.propertyType]
                        ? DETAILED_TYPES_MAP[filters.propertyType]
                        : Object.values(DETAILED_TYPES_MAP).flat()
                    ).map((typeValue) => (
                        <button
                            key={typeValue}
                            onClick={() => updateFilter("propertyType", typeValue)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filters.propertyType === typeValue
                                ? "bg-[var(--color-brand-green)] text-white"
                                : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]"
                                }`}
                        >
                            {typeValue.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">Price Range (₦/year)</label>
                <div className="grid grid-cols-2 gap-3">
                    <Input type="number" placeholder="Min" value={filters.minPrice || ""} onChange={(e) => updateFilter("minPrice", e.target.value ? parseInt(e.target.value) : undefined)} />
                    <Input type="number" placeholder="Max" value={filters.maxPrice || ""} onChange={(e) => updateFilter("maxPrice", e.target.value ? parseInt(e.target.value) : undefined)} />
                </div>
            </div>

            {/* Bedrooms */}
            <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">Bedrooms</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <button
                            key={num}
                            onClick={() => updateFilter("bedrooms", num)}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${filters.bedrooms === num ? "bg-[var(--color-brand-green)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]"}`}
                        >{num}+</button>
                    ))}
                </div>
            </div>

            {/* Bathrooms */}
            <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">Bathrooms</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map((num) => (
                        <button
                            key={num}
                            onClick={() => updateFilter("bathrooms", num)}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${filters.bathrooms === num ? "bg-[var(--color-brand-green)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]"}`}
                        >{num}+</button>
                    ))}
                </div>
            </div>

            {/* Power & Water */}
            <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">Power Supply</label>
                <select
                    value={filters.powerSupply || ""}
                    onChange={(e) => updateFilter("powerSupply", e.target.value || undefined)}
                    className="w-full text-[var(--text-primary)] bg-[var(--bg-input)] h-11 px-3 rounded-lg border-2 border-[var(--border-color)] focus:border-[var(--color-brand-blue)] focus:outline-none font-medium transition-all mb-3 text-sm"
                >
                    <option value="">Any Power Supply</option>
                    <option value="GRID_ONLY">NEPA/PHCN Only</option>
                    <option value="GRID_AND_GENERATOR">Grid + Generator</option>
                    <option value="GRID_AND_SOLAR">Grid + Solar</option>
                    <option value="SOLAR_ONLY">Solar Only</option>
                </select>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">Water Supply</label>
                <select
                    value={filters.waterSupply || ""}
                    onChange={(e) => updateFilter("waterSupply", e.target.value || undefined)}
                    className="w-full text-[var(--text-primary)] bg-[var(--bg-input)] h-11 px-3 rounded-lg border-2 border-[var(--border-color)] focus:border-[var(--color-brand-blue)] focus:outline-none font-medium transition-all text-sm"
                >
                    <option value="">Any Water Source</option>
                    <option value="BOREHOLE">Borehole</option>
                    <option value="TREATED_WATER">Treated / State Water</option>
                    <option value="BOTH">Both</option>
                </select>
            </div>

            {/* Parking */}
            <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">Parking Spaces</label>
                <div className="flex gap-2">
                    {[1, 2, 3].map((num) => (
                        <button
                            key={num}
                            onClick={() => updateFilter("parkingSpaces", num)}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${filters.parkingSpaces === num ? "bg-[var(--color-brand-blue)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]"}`}
                        >{num}+</button>
                    ))}
                </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filters.serviced === true}
                        onChange={(e) => updateFilter("serviced", e.target.checked ? true : undefined)}
                        className="w-5 h-5 rounded border-gray-300 text-[var(--color-brand-green)] focus:ring-[var(--color-brand-green)]"
                    />
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">Serviced Property</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filters.verified === true}
                        onChange={(e) => updateFilter("verified", e.target.checked ? true : undefined)}
                        className="w-5 h-5 rounded border-gray-300 text-[var(--color-brand-green)] focus:ring-[var(--color-brand-green)]"
                    />
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">Verified Listings Only</span>
                </label>
            </div>

            {/* Furnishing */}
            <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">Furnishing</label>
                <div className="flex gap-2">
                    {[
                        { label: "Any", value: undefined },
                        { label: "Furnished", value: true },
                        { label: "Unfurnished", value: false },
                    ].map((opt) => (
                        <button
                            key={opt.label}
                            onClick={() => updateFilter("furnished", opt.value)}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${filters.furnished === opt.value ? "bg-[var(--color-brand-green)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]"}`}
                        >{opt.label}</button>
                    ))}
                </div>
            </div>

            {/* Amenities */}
            <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">Amenities</label>
                <div className="flex flex-wrap gap-2">
                    {["Fiber Internet", "24/7 Power", "Swimming Pool", "Gym", "Security", "Borehole", "Generator", "Parking Space", "Fitted Kitchen"].map((amenity) => {
                        const isSelected = filters.amenities?.includes(amenity);
                        return (
                            <button
                                key={amenity}
                                onClick={() => {
                                    const current = filters.amenities || [];
                                    const next = isSelected ? current.filter((a) => a !== amenity) : [...current, amenity];
                                    updateFilter("amenities", next.length > 0 ? next : undefined);
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isSelected ? "bg-[var(--color-brand-green)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]"}`}
                            >{amenity}</button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function SearchContent() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
    const [filters, setFilters] = useState<SearchFilters>({});
    const [searchOnMove, setSearchOnMove] = useState(true);
    const [shouldAutoFit, setShouldAutoFit] = useState(true);
    const [mapKey, setMapKey] = useState(0);
    const [availableLocations, setAvailableLocations] = useState<Record<string, string[]>>({});
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    const placeholders = [
        'Try "3 bedroom in Lekki"',
        'Try "Apartment under 5M"',
        'Try "Serviced flat in Abuja"',
        'Try "Duplex with 3 parking spaces"',
        'Try "Mini flat in Yaba"',
        'Try "Self-contain under 200k"',
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 100000);
        return () => clearInterval(interval);
    }, []);

    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await api.get("/properties/locations");
                if (res.data.success) setAvailableLocations(res.data.data);
            } catch (error) {
                console.error("Failed to fetch locations:", error);
            }
        };
        fetchLocations();
    }, []);

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

        if (city) initialFilters.city = city;
        if (type) initialFilters.propertyType = type;
        if (verified) initialFilters.verified = verified === "true";
        if (minPrice) initialFilters.minPrice = parseInt(minPrice);
        if (maxPrice) initialFilters.maxPrice = parseInt(maxPrice);
        if (bedrooms) initialFilters.bedrooms = parseInt(bedrooms);
        if (state) initialFilters.state = state;
        if (sortBy) initialFilters.sortBy = sortBy;

        if (Object.keys(initialFilters).length > 0) setFilters(initialFilters);
    }, [searchParams]);

    useEffect(() => {
        searchProperties();
    }, [filters]);

    const searchProperties = async () => {
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
            if (filters.q) params.append("q", filters.q);
            if (filters.neLat) params.append("neLat", filters.neLat.toString());
            if (filters.neLng) params.append("neLng", filters.neLng.toString());
            if (filters.swLat) params.append("swLat", filters.swLat.toString());
            if (filters.swLng) params.append("swLng", filters.swLng.toString());
            if (filters.amenities && filters.amenities.length > 0) params.append("amenities", filters.amenities.join(","));
            if (filters.furnished !== undefined) params.append("furnished", filters.furnished.toString());
            if (filters.verified !== undefined) params.append("verified", filters.verified.toString());
            if (filters.polygon) params.append("polygon", filters.polygon);

            const res = await api.get(`/properties?${params.toString()}`);
            setProperties(res.data.data.properties || []);
        } catch (error) {
            console.error("Search failed:", error);
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

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

    const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== "").length;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Search Header */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-16 z-40">
                <div className="container-wide py-3 md:py-4">
                    <div className="flex gap-2 md:gap-4 items-center">
                        {/* Search input */}
                        <div className="flex-1">
                            <Input
                                key={placeholderIndex}
                                icon={<Search className="h-5 w-5" />}
                                placeholder={placeholders[placeholderIndex]}
                                value={filters.q || ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const detected = parseSmartQuery(val);
                                    setFilters(prev => ({ ...prev, q: val, ...detected }));
                                }}
                                className="h-11 md:h-12 text-sm md:text-base border-2 focus:border-[var(--color-brand-blue)] shadow-sm bg-[var(--bg-input)] text-[var(--text-primary)]"
                            />
                        </div>

                        {/* Mobile: Filter button */}
                        <Button
                            variant="outline"
                            onClick={() => setShowMobileFilters(true)}
                            className="md:hidden flex gap-2 h-11 border-[var(--border-color)] text-[var(--text-secondary)] relative shrink-0"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-[var(--color-brand-orange)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>

                        {/* Desktop: Filter toggle */}
                        <Button
                            variant="ghost"
                            onClick={() => setShowFilters(!showFilters)}
                            className="hidden md:flex gap-2 text-[var(--text-secondary)]"
                        >
                            <SlidersHorizontal className="h-5 w-5" />
                            Filters {activeFilterCount > 0 && <span className="bg-[var(--color-brand-orange)] text-white text-xs px-1.5 rounded-full font-bold">{activeFilterCount}</span>}
                        </Button>

                        {/* Desktop: Sort */}
                        <div className="hidden md:flex gap-2 border-l border-[var(--border-color)] pl-4 shrink-0">
                            <select
                                value={filters.sortBy || "newest"}
                                onChange={(e) => updateFilter("sortBy", e.target.value)}
                                className="h-12 bg-[var(--bg-input)] text-[var(--text-secondary)] border-2 border-[var(--border-color)] rounded-lg px-4 text-sm font-bold focus:border-[var(--color-brand-blue)] focus:outline-none"
                            >
                                <option value="newest">Latest First</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                            </select>
                        </div>

                        {/* Desktop: View mode */}
                        <div className="hidden md:flex gap-2 border-l border-[var(--border-color)] pl-4">
                            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
                                <Grid3x3 className="h-4 w-4" />
                            </Button>
                            <Button variant={viewMode === "map" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("map")}>
                                <MapIcon className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90 h-11 md:h-12 px-4 md:px-6 shrink-0">
                            <Search className="h-5 w-5 md:mr-2" />
                            <span className="hidden md:inline">Search</span>
                        </Button>
                    </div>

                    {/* Mobile: Sort + View toggle row */}
                    <div className="md:hidden flex items-center gap-2 mt-2">
                        <select
                            value={filters.sortBy || "newest"}
                            onChange={(e) => updateFilter("sortBy", e.target.value)}
                            className="flex-1 h-9 bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg px-3 text-xs font-bold focus:border-[var(--color-brand-blue)] focus:outline-none"
                        >
                            <option value="newest">Latest First</option>
                            <option value="price_asc">Price ↑</option>
                            <option value="price_desc">Price ↓</option>
                        </select>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-lg border transition-colors ${viewMode === "grid" ? "bg-[var(--color-brand-blue)] text-white border-[var(--color-brand-blue)]" : "border-[var(--border-color)] text-[var(--text-muted)]"}`}
                            >
                                <Grid3x3 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("map")}
                                className={`p-2 rounded-lg border transition-colors ${viewMode === "map" ? "bg-[var(--color-brand-blue)] text-white border-[var(--color-brand-blue)]" : "border-[var(--border-color)] text-[var(--text-muted)]"}`}
                            >
                                <MapIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-wide py-6 md:py-8">
                <div className="flex gap-8">
                    {/* Desktop Filters Sidebar */}
                    {showFilters && (
                        <aside className="hidden md:block w-80 flex-shrink-0">
                            <div className="bg-[var(--bg-card)] rounded-xl p-6 shadow-[var(--shadow-sm)] border border-[var(--border-color)] sticky top-36 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
                                <FilterPanel
                                    filters={filters}
                                    updateFilter={updateFilter}
                                    clearFilters={clearFilters}
                                    availableLocations={availableLocations}
                                />
                            </div>
                        </aside>
                    )}

                    {/* Results */}
                    <main className="flex-1 min-w-0">
                        <div className="mb-4 md:mb-6">
                            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-brand-blue)]">
                                {loading ? "Searching..." : `${properties.length} Properties Found`}
                            </h1>
                            {(filters.city || filters.state) && (
                                <p className="text-[var(--text-muted)] mt-1 text-sm">
                                    {filters.city ? `in ${filters.city}` : ""}{filters.state ? `${filters.city ? ", " : "in "}${filters.state}` : ""}
                                </p>
                            )}
                        </div>

                        {viewMode === "map" ? (
                            <div className="h-[calc(100vh-300px)] min-h-[400px] relative">
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-[var(--bg-card)] px-4 py-2 rounded-full shadow-md border border-[var(--border-color)] flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="searchOnMove"
                                        checked={searchOnMove}
                                        onChange={(e) => setSearchOnMove(e.target.checked)}
                                        className="w-4 h-4 text-[var(--color-brand-green)] rounded focus:ring-[var(--color-brand-green)]"
                                    />
                                    <label htmlFor="searchOnMove" className="text-sm font-semibold text-[var(--text-secondary)] cursor-pointer">
                                        Search as I move the map
                                    </label>
                                </div>
                                <Map
                                    key={mapKey}
                                    properties={properties.map((p) => ({
                                        id: p.id,
                                        title: p.title,
                                        latitude: p.latitude,
                                        longitude: p.longitude,
                                        pricePerYear: p.pricePerYear,
                                        city: p.city,
                                        image: p.images?.[0]?.url,
                                    }))}
                                    onPropertyClick={(id) => { window.location.href = `/properties/${id}`; }}
                                    onBoundsChange={(bounds) => {
                                        if (searchOnMove && !loading) {
                                            setShouldAutoFit(false);
                                            setFilters((prev) => ({ ...prev, ...bounds }));
                                        }
                                    }}
                                    onPolygonChange={(polygon) => {
                                        setShouldAutoFit(true);
                                        setFilters((prev) => ({ ...prev, polygon: polygon ? JSON.stringify(polygon) : undefined }));
                                    }}
                                    autoFit={shouldAutoFit}
                                />
                                {loading && (
                                    <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-sm rounded-xl">
                                        <div className="bg-white p-4 rounded-full shadow-xl animate-bounce">
                                            <Search className="h-8 w-8 text-[var(--color-brand-green)]" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : loading ? (
                            <div className={`grid gap-4 md:gap-6 ${showFilters ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-[var(--bg-card)] rounded-xl h-80 animate-pulse" />
                                ))}
                            </div>
                        ) : properties.length > 0 ? (
                            <div className={`grid gap-4 md:gap-6 ${showFilters ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
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
                                            image: property.images?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-e32c53048057?auto=format&fit=crop&w=800&q=80",
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
                            <div className="text-center py-16 md:py-20 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                                <Search className="h-14 w-14 text-[var(--text-muted)] mx-auto mb-4 opacity-40" />
                                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No properties found</h3>
                                <p className="text-[var(--text-muted)] mb-6">Try adjusting your filters or search in a different area</p>
                                <Button onClick={clearFilters} className="bg-[var(--color-brand-blue)]">Clear Filters</Button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Bottom Sheet */}
            {showMobileFilters && (
                <>
                    {/* Backdrop */}
                    <div
                        className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowMobileFilters(false)}
                    />
                    {/* Sheet */}
                    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-card)] rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
                        {/* Handle */}
                        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-color)] shrink-0">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">Filters</h2>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="p-2 rounded-full hover:bg-[var(--bg-muted)] transition-colors"
                            >
                                <X className="h-5 w-5 text-[var(--text-muted)]" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-4 py-4">
                            <FilterPanel
                                filters={filters}
                                updateFilter={updateFilter}
                                clearFilters={clearFilters}
                                availableLocations={availableLocations}
                            />
                        </div>
                        <div className="px-4 py-4 border-t border-[var(--border-color)] shrink-0">
                            <Button
                                className="w-full bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 h-12 font-bold text-white"
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
