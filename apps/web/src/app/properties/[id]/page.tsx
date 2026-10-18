"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Map } from "@/components/map/Map";
import { PropertyCard } from "@/components/property/PropertyCard";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import {
    Bed,
    Bath,
    Maximize,
    MapPin,
    Share2,
    CheckCircle2,
    Calendar,
    Shield,
    ShieldCheck,
    Star,
    Zap,
    Wifi,
    Car,
    Phone,
    ArrowLeft,
    Sparkles,
    Building2,
    Droplets,
    Lock,
    Copy,
    CheckCheck,
    Heart,
    FileText,
    ChevronRight,
    Clock,
    DollarSign,
    Check,
    Info,
    Waves,
    Utensils,
    Flame,
    Tv,
    Wind,
    Compass,
    Eye,
} from "lucide-react";
import { LockedMessageButton } from "@/components/property/LockedMessageButton";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ImageCarousel } from "@/components/property/ImageCarousel";
import { ApplicationModal } from "@/components/property/ApplicationModal";
import { getCoordinatesForLocation } from "@/lib/locations";

// Amenity Icons mapping
const AMENITY_ICONS: Record<string, any> = {
    "24/7 Power": Zap,
    "Backup Generator": Zap,
    "Inverter System": Zap,
    "Solar Power": Zap,
    "Fiber Internet": Wifi,
    "WiFi": Wifi,
    "Covered Parking": Car,
    "Parking Space": Car,
    "Swimming Pool": Waves,
    "Fitted Kitchen": Utensils,
    "Gas Cooker": Flame,
    "Electric Fence": Lock,
    "CCTV Surveillance": ShieldCheck,
    "Security Guards": Shield,
    "Air Conditioning": Wind,
    "Smart TV": Tv,
    "Borehole Water": Droplets,
    "Water Treatment": Droplets,
    default: CheckCircle2,
};

export default function PropertyDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<any>(null);
    const [similarProperties, setSimilarProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [showPhone, setShowPhone] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    useEffect(() => {
        if (id) {
            fetchProperty();
        }
    }, [id]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/properties/${id}`);
            const propData = res.data.data;
            setProperty(propData);

            // Fetch similar properties in the same city or state
            if (propData) {
                fetchSimilarProperties(propData.city, propData.state, propData.id);
            }
        } catch (error) {
            console.error("Failed to fetch property:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSimilarProperties = async (city?: string, state?: string, currentId?: string) => {
        try {
            const queryParam = city ? `city=${encodeURIComponent(city)}` : state ? `state=${encodeURIComponent(state)}` : "";
            const res = await api.get(`/properties?${queryParam}&limit=4`);
            const items = res.data?.data || res.data?.properties || [];
            // Filter out current property
            const filtered = items.filter((p: any) => p.id !== currentId).slice(0, 3);
            setSimilarProperties(filtered);
        } catch (err) {
            console.error("Failed to fetch similar listings:", err);
        }
    };

    const getAmenityIcon = (name: string) => {
        const Icon = AMENITY_ICONS[name] || AMENITY_ICONS.default;
        return <Icon className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />;
    };

    const handleShare = async () => {
        if (!property) return;
        const shareData = {
            title: property.title,
            text: `Rent ${property.title} in ${property.city}, ${property.state} on RentHub.`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 3000);
            }
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    const handleCopyId = () => {
        if (!property) return;
        navigator.clipboard.writeText(property.id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2500);
    };

    // Calculate total initial move-in estimate
    const feeCalculation = useMemo(() => {
        if (!property) return null;
        const rent = property.pricePerYear || 0;
        const caution = property.cautionFee || 0;
        const legal = property.legalFee || 0;
        const agent = property.agentFee || 0;
        const service = property.serviceFee || 0;
        const total = rent + caution + legal + agent + service;
        const monthlyEq = Math.round(rent / 12);

        return {
            rent,
            caution,
            legal,
            agent,
            service,
            total,
            monthlyEq,
        };
    }, [property]);

    // Resolved Coordinates
    const coordinates = useMemo(() => {
        if (!property) return { lat: 9.0765, lng: 7.4905 };
        if (property.latitude && property.longitude && !isNaN(Number(property.latitude)) && !isNaN(Number(property.longitude))) {
            return { lat: Number(property.latitude), lng: Number(property.longitude) };
        }
        return getCoordinatesForLocation(property.state, property.city, 0);
    }, [property]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] pt-12 pb-24">
                <div className="container-wide space-y-8 animate-pulse">
                    <div className="h-6 w-72 bg-[var(--bg-muted)] rounded-xl" />
                    <div className="h-[460px] w-full bg-[var(--bg-muted)] rounded-3xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-32 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]" />
                            <div className="h-48 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]" />
                        </div>
                        <div className="h-96 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]" />
                    </div>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                    <Building2 className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black text-[var(--text-primary)]">Property Not Found</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-md">
                    The listing you are searching for might have been unlisted, rented, or moved.
                </p>
                <Button
                    onClick={() => router.push("/search")}
                    className="mt-6 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-black px-6 py-3 rounded-2xl shadow-lg"
                >
                    Browse Available Homes
                </Button>
            </div>
        );
    }

    const powerSupplyLabel = property.powerSupply ? property.powerSupply.replace(/_/g, " ") : "Standard Grid";
    const waterSupplyLabel = property.waterSupply ? property.waterSupply.replace(/_/g, " ") : "Borehole Supply";

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-24">
            {/* Top Navigation & Breadcrumbs */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-30 backdrop-blur-md bg-[var(--bg-card)]/90">
                <div className="container-wide py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--text-secondary)] overflow-x-auto scrollbar-none whitespace-nowrap">
                        <Link href="/search" className="hover:text-[var(--color-brand-green)] flex items-center gap-1 font-semibold">
                            <ArrowLeft className="w-4 h-4" />
                            <span>For Rent</span>
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                        <span className="font-semibold text-[var(--text-primary)]">{property.state || "Nigeria"}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                        <span className="font-semibold text-[var(--text-primary)]">{property.city}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0 hidden sm:inline" />
                        <span className="text-[var(--text-muted)] truncate max-w-[200px] hidden sm:inline">
                            {property.title}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleCopyId}
                            title="Copy Listing ID"
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)]/50 hover:bg-[var(--bg-muted)] text-[11px] font-mono text-[var(--text-secondary)] transition-all"
                        >
                            {copiedId ? (
                                <>
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-emerald-500 font-bold">Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>#{property.id.slice(0, 8)}</span>
                                </>
                            )}
                        </button>

                        <FavoriteButton
                            propertyId={property.id}
                            initialFavorited={property.isFavorited}
                            className="h-9 w-9 p-0 flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] rounded-xl text-[var(--text-primary)]"
                        />

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleShare}
                            className="h-9 w-9 rounded-xl border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]"
                            title="Share Property"
                        >
                            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 1. Hero Photo Gallery (Airbnb 5-Photo Mosaic & Lightbox) */}
            <div className="container-wide pt-4 sm:pt-6">
                <ImageCarousel images={property.images || []} title={property.title} />
            </div>

            {/* Main Content Layout */}
            <div className="container-wide py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* LEFT 2 COLUMNS: Property Deep-Dive */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header & Badges Card */}
                        <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-5">
                            {/* Badges Bar */}
                            <div className="flex flex-wrap items-center gap-2">
                                {property.verified && (
                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>Verified Property</span>
                                    </Badge>
                                )}
                                {property.agentFee === 0 && (
                                    <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Direct Landlord • ₦0 Agency Fee</span>
                                    </Badge>
                                )}
                                {property.featured && (
                                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5">
                                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                        <span>Featured Listing</span>
                                    </Badge>
                                )}
                                {property.status === "RENTED" ? (
                                    <Badge className="bg-red-500/15 text-red-500 border border-red-500/20 px-3 py-1 rounded-xl text-xs font-black">
                                        RENTED
                                    </Badge>
                                ) : property.status === "UNDER_OFFER" ? (
                                    <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-xl text-xs font-black">
                                        UNDER OFFER
                                    </Badge>
                                ) : (
                                    <Badge className="bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] border border-[var(--color-brand-green)]/20 px-3 py-1 rounded-xl text-xs font-black">
                                        AVAILABLE NOW
                                    </Badge>
                                )}
                                <Badge variant="outline" className="border-[var(--border-color)] text-[var(--text-secondary)] font-extrabold text-xs px-3 py-1 rounded-xl">
                                    {property.propertyType?.replace(/_/g, " ")}
                                </Badge>
                                {property.serviced && (
                                    <Badge variant="outline" className="border-blue-500/30 text-blue-500 font-extrabold text-xs px-3 py-1 rounded-xl">
                                        Serviced
                                    </Badge>
                                )}
                                {property.furnished && (
                                    <Badge variant="outline" className="border-orange-500/30 text-orange-500 font-extrabold text-xs px-3 py-1 rounded-xl">
                                        Furnished
                                    </Badge>
                                )}
                            </div>

                            {/* Property Title & Address */}
                            <div>
                                <h1 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
                                    {property.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs sm:text-sm text-[var(--text-secondary)] font-semibold">
                                    <span className="flex items-center gap-1.5 text-[var(--color-brand-orange)]">
                                        <MapPin className="w-4 h-4 shrink-0" />
                                        <span>{property.address}, {property.city}, {property.state}</span>
                                    </span>
                                    <span className="text-[var(--text-muted)]">•</span>
                                    <a
                                        href="#map-section"
                                        className="text-[var(--color-brand-green)] hover:underline font-bold"
                                    >
                                        View on map
                                    </a>
                                </div>
                            </div>

                            {/* Key Specifications Grid (6 Stat Cards) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[var(--border-color)]">
                                <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                                        <Bed className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Bedrooms</p>
                                        <p className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                                            {property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                                        <Bath className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Bathrooms</p>
                                        <p className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                                            {property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Toilets</p>
                                        <p className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                                            {property.toilets || property.bathrooms} Toilets
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                                        <Car className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Parking</p>
                                        <p className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                                            {property.parkingSpaces > 0 ? `${property.parkingSpaces} Cars` : "Available"}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                                        <Maximize className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Floor Area</p>
                                        <p className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                                            {property.floorArea ? `${property.floorArea} m²` : "Full Compound"}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500 shrink-0">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Type</p>
                                        <p className="text-base sm:text-lg font-black text-[var(--text-primary)] truncate">
                                            {property.propertyType?.replace(/_/g, " ")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Nigerian Living & Infrastructure Blueprint */}
                        <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-[var(--text-primary)]">
                                        Living Infrastructure & Utilities
                                    </h2>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                                        Crucial Nigerian utilities and compound infrastructure verified for this home.
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] flex items-start gap-3.5">
                                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs uppercase font-extrabold text-[var(--text-muted)] tracking-wider">Power System</h3>
                                        <p className="text-sm font-black text-[var(--text-primary)] capitalize mt-0.5">
                                            {powerSupplyLabel}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                                            Equipped with reliable power support to maintain continuous supply.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] flex items-start gap-3.5">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                                        <Droplets className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs uppercase font-extrabold text-[var(--text-muted)] tracking-wider">Water System</h3>
                                        <p className="text-sm font-black text-[var(--text-primary)] capitalize mt-0.5">
                                            {waterSupplyLabel}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                                            Dedicated clean water source with overhead storage capacity.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] flex items-start gap-3.5">
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs uppercase font-extrabold text-[var(--text-muted)] tracking-wider">Perimeter Security</h3>
                                        <p className="text-sm font-black text-[var(--text-primary)] mt-0.5">
                                            Gated Compound & Security Fence
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                                            Secured access control with reinforced boundary infrastructure.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] flex items-start gap-3.5">
                                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shrink-0 mt-0.5">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs uppercase font-extrabold text-[var(--text-muted)] tracking-wider">Facility Management</h3>
                                        <p className="text-sm font-black text-[var(--text-primary)] mt-0.5">
                                            {property.serviced ? "Fully Serviced Estate" : "Self-Managed Compound"}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                                            {property.petsAllowed ? "Pets are warmly welcomed on compound rules." : "Strict no-pets policy maintained."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Transparent Move-In Financial Cost Breakdown */}
                        {feeCalculation && (
                            <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h2 className="text-xl font-black text-[var(--text-primary)]">
                                            Transparent Move-In Financials
                                        </h2>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                            Zero hidden costs. 100% upfront transparency backed by RentHub escrow.
                                        </p>
                                    </div>
                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl text-xs font-black self-start sm:self-auto">
                                        {property.paymentTerms?.replace(/_/g, " ") || "1 Year Upfront"}
                                    </Badge>
                                </div>

                                <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden bg-[var(--bg-muted)]/20">
                                    <div className="p-4 flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-extrabold text-[var(--text-primary)]">Annual Rent</p>
                                            <p className="text-xs text-[var(--text-secondary)]">Base tenancy rate per year</p>
                                        </div>
                                        <p className="font-black text-base text-[var(--text-primary)]">
                                            {formatPrice(feeCalculation.rent)}
                                        </p>
                                    </div>

                                    <div className="p-4 flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-extrabold text-[var(--text-primary)]">Refundable Caution Deposit</p>
                                            <p className="text-xs text-[var(--text-secondary)]">100% refundable upon exit inspection</p>
                                        </div>
                                        <p className="font-black text-base text-[var(--text-primary)]">
                                            {formatPrice(feeCalculation.caution)}
                                        </p>
                                    </div>

                                    <div className="p-4 flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-extrabold text-[var(--text-primary)]">Legal & Tenancy Documentation</p>
                                            <p className="text-xs text-[var(--text-secondary)]">Agreement drafting & legal stamp duty</p>
                                        </div>
                                        <p className="font-black text-base text-[var(--text-primary)]">
                                            {formatPrice(feeCalculation.legal)}
                                        </p>
                                    </div>

                                    <div className="p-4 flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-extrabold text-[var(--text-primary)]">Agency / Brokerage Fee</p>
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                {feeCalculation.agent === 0 ? "Direct landlord listing • Zero agency markup" : "Standard agency fee"}
                                            </p>
                                        </div>
                                        <p className={`font-black text-base ${feeCalculation.agent === 0 ? "text-emerald-500" : "text-[var(--text-primary)]"}`}>
                                            {feeCalculation.agent === 0 ? "₦0 (Free)" : formatPrice(feeCalculation.agent)}
                                        </p>
                                    </div>

                                    {feeCalculation.service > 0 && (
                                        <div className="p-4 flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-extrabold text-[var(--text-primary)]">Annual Service Charge</p>
                                                <p className="text-xs text-[var(--text-secondary)]">Compound maintenance, security, & waste</p>
                                            </div>
                                            <p className="font-black text-base text-[var(--text-primary)]">
                                                {formatPrice(feeCalculation.service)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Total Move-In Cost Row */}
                                    <div className="p-5 bg-[var(--bg-muted)]/60 flex items-center justify-between">
                                        <div>
                                            <p className="font-black text-base text-[var(--text-primary)]">
                                                Total Estimated Move-In Cost
                                            </p>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                                Equivalent to approx. {formatPrice(feeCalculation.monthlyEq)}/month
                                            </p>
                                        </div>
                                        <p className="text-xl sm:text-2xl font-black text-[var(--color-brand-green)]">
                                            {formatPrice(feeCalculation.total)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Description */}
                        <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-4">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">About this Residence</h2>
                            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-medium">
                                {property.description || "No specific description provided by the landlord."}
                            </p>
                        </div>

                        {/* 5. Amenities Showcase */}
                        <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-6">
                            <div>
                                <h2 className="text-xl font-black text-[var(--text-primary)]">Amenities & Facilities</h2>
                                <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                                    Features and appliances provided with this home.
                                </p>
                            </div>

                            {property.amenities && property.amenities.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {property.amenities.map((pa: any, idx: number) => {
                                        const name = pa.amenity?.name || "Amenity";
                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm hover:border-[var(--color-brand-green)]/30 transition-all"
                                            >
                                                {getAmenityIcon(name)}
                                                <span className="truncate">{name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-[var(--text-muted)] italic">
                                    No custom amenities specified. Standard residential utilities apply.
                                </p>
                            )}
                        </div>

                        {/* 6. Neighborhood & Mapbox Location */}
                        <div id="map-section" className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-xl font-black text-[var(--text-primary)]">Location & Neighborhood</h2>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                                        {property.address}, {property.city}, {property.state}, Nigeria
                                    </p>
                                </div>
                                <Badge variant="outline" className="border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-xs self-start sm:self-auto">
                                    Coordinates: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                                </Badge>
                            </div>

                            <div className="h-[360px] sm:h-[440px] rounded-2xl overflow-hidden border border-[var(--border-color)] relative">
                                <Map
                                    properties={[
                                        {
                                            id: property.id,
                                            title: property.title,
                                            latitude: coordinates.lat,
                                            longitude: coordinates.lng,
                                            pricePerYear: property.pricePerYear,
                                            city: property.city,
                                            image: property.images?.[0]?.url,
                                        },
                                    ]}
                                    zoom={14}
                                    center={[coordinates.lng, coordinates.lat]}
                                    autoFit={false}
                                />
                            </div>
                        </div>

                        {/* 7. Tenant Reviews & Rating */}
                        <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-6">
                            <div>
                                <h2 className="text-xl font-black text-[var(--text-primary)]">Verified Reviews & Ratings</h2>
                                <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                                    Feedback from verified tenants and tour inspectors.
                                </p>
                            </div>
                            <ReviewList propertyId={property.id} />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sticky Executive Actions & Landlord Card */}
                    <div className="lg:col-span-1 space-y-6 sticky top-20">
                        {/* 1. Main Booking / Rent Pricing Card */}
                        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-lg space-y-6">
                            {/* Price Header */}
                            <div className="space-y-1">
                                <span className="text-xs uppercase font-extrabold tracking-wider text-[var(--text-muted)]">
                                    Annual Rent
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl sm:text-4xl font-black text-[var(--color-brand-green)] tracking-tight">
                                        {formatPrice(property.pricePerYear)}
                                    </span>
                                    <span className="text-sm font-extrabold text-[var(--text-secondary)]">/ year</span>
                                </div>
                                <p className="text-xs font-semibold text-[var(--text-muted)]">
                                    ≈ {formatPrice(Math.round(property.pricePerYear / 12))} / month equivalent
                                </p>
                            </div>

                            {/* Move-in Quick Summary */}
                            <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] space-y-2 text-xs">
                                <div className="flex justify-between font-semibold text-[var(--text-secondary)]">
                                    <span>Refundable Caution:</span>
                                    <span className="font-bold text-[var(--text-primary)]">{formatPrice(property.cautionFee || 0)}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-[var(--text-secondary)]">
                                    <span>Legal & Agreement:</span>
                                    <span className="font-bold text-[var(--text-primary)]">{formatPrice(property.legalFee || 0)}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-[var(--text-secondary)]">
                                    <span>Agency Fee:</span>
                                    <span className="font-black text-emerald-500">
                                        {property.agentFee === 0 ? "₦0 (Direct Listing)" : formatPrice(property.agentFee)}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-[var(--border-color)] flex justify-between font-black text-sm text-[var(--text-primary)]">
                                    <span>Total Initial:</span>
                                    <span className="text-[var(--color-brand-green)]">{formatPrice(feeCalculation?.total || property.pricePerYear)}</span>
                                </div>
                            </div>

                            {/* Primary Action Buttons */}
                            <div className="space-y-3">
                                {property.status === "RENTED" ? (
                                    <>
                                        <Button
                                            disabled
                                            className="w-full h-13 text-base font-black bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-color)] rounded-2xl cursor-not-allowed"
                                        >
                                            Listing Already Rented
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="w-full h-12 text-sm font-extrabold rounded-2xl border-[var(--border-color)]"
                                        >
                                            <Link href="/search">Find Similar Properties</Link>
                                        </Button>
                                    </>
                                ) : property.status === "UNDER_OFFER" ? (
                                    <>
                                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                                            <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                                                Application Under Review / Pending Offer
                                            </p>
                                        </div>
                                        <Button
                                            asChild
                                            className="w-full h-13 text-base font-black bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white rounded-2xl shadow-lg"
                                        >
                                            <Link href={`/properties/${property.id}/tour`}>
                                                Schedule Inspection Tour
                                            </Link>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={() => setIsAppModalOpen(true)}
                                            className="w-full h-13 text-base font-black bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                                        >
                                            Apply to Rent
                                        </Button>

                                        <Button
                                            asChild
                                            variant="outline"
                                            className="w-full h-12 text-sm font-black border-2 border-[var(--border-color)] hover:border-[var(--color-brand-green)] hover:text-[var(--color-brand-green)] rounded-2xl transition-all"
                                        >
                                            <Link href={`/properties/${property.id}/tour`}>
                                                Schedule Physical Tour
                                            </Link>
                                        </Button>

                                        <Button
                                            asChild
                                            variant="ghost"
                                            className="w-full h-10 text-xs font-extrabold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl"
                                        >
                                            <Link href={`/properties/${property.id}/rent`}>
                                                Pay Directly via Escrow →
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* RentHub Escrow Trust Guarantee Banner */}
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <div className="text-xs leading-relaxed">
                                    <p className="font-black text-emerald-700 dark:text-emerald-300">
                                        100% Escrow Protected
                                    </p>
                                    <p className="text-emerald-800/80 dark:text-emerald-200/70 mt-0.5 font-medium">
                                        Your rent is locked safely in escrow. Landlord is only paid after physical inspection & key handover.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Executive Landlord Card */}
                        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)]">
                                    Listing Landlord
                                </h3>
                                {property.landlord?.landlordAvgRating > 0 && (
                                    <div className="flex items-center gap-1 bg-amber-500/15 px-2.5 py-1 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-black border border-amber-500/20">
                                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                                        <span>{Number(property.landlord.landlordAvgRating).toFixed(1)}</span>
                                        <span className="text-[10px] opacity-70">
                                            ({property.landlord.landlordReviewCount || 0})
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-[var(--bg-muted)] overflow-hidden relative border border-[var(--border-color)] shrink-0">
                                    {property.landlord?.avatar ? (
                                        <Image
                                            src={property.landlord.avatar}
                                            alt="Landlord"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] text-xl font-black">
                                            {property.landlord?.firstName?.[0] || "L"}
                                            {property.landlord?.lastName?.[0] || ""}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-base font-black text-[var(--text-primary)] truncate">
                                        {property.landlord?.firstName || "Verified"} {property.landlord?.lastName || "Landlord"}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-semibold mt-0.5">
                                        <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                        <span>
                                            Member since {property.landlord?.createdAt ? new Date(property.landlord.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Jan 2026"}
                                        </span>
                                    </div>
                                    {property.landlord?._count?.propertiesOwned > 0 && (
                                        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                                            {property.landlord._count.propertiesOwned} Managed Properties
                                        </p>
                                    )}
                                </div>
                            </div>

                            {property.landlord?.verified && (
                                <div className="p-3 rounded-xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] flex items-center gap-2 text-xs font-bold text-[var(--color-brand-green)]">
                                    <ShieldCheck className="w-4 h-4 shrink-0" />
                                    <span>Government ID & NIN Verified Landlord</span>
                                </div>
                            )}

                            {/* Contact Landlord Actions */}
                            <div className="space-y-2.5 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowPhone(!showPhone)}
                                    className="w-full justify-center gap-2 h-11 text-xs sm:text-sm font-black border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] rounded-2xl"
                                >
                                    <Phone className="w-4 h-4 text-[var(--color-brand-green)]" />
                                    <span>
                                        {showPhone
                                            ? property.landlord?.phone && !property.landlord.phone.startsWith("no-phone")
                                                ? property.landlord.phone
                                                : "+234 (0) 800-RENTHUB"
                                            : "Reveal Landlord Phone"}
                                    </span>
                                </Button>

                                <LockedMessageButton
                                    landlordId={property.landlordId}
                                    propertyId={property.id}
                                    propertyTitle={property.title}
                                    className="w-full justify-center gap-2 h-11 text-xs sm:text-sm font-black border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] rounded-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Similar Properties in this Area */}
                {similarProperties.length > 0 && (
                    <div className="mt-16 pt-12 border-t border-[var(--border-color)] space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                                    Similar Homes in {property.city || property.state}
                                </h2>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1">
                                    Explore other verified listings in this neighborhood.
                                </p>
                            </div>
                            <Button asChild variant="outline" className="rounded-xl border-[var(--border-color)] font-bold text-xs">
                                <Link href={`/search?city=${encodeURIComponent(property.city)}`}>
                                    View All in {property.city}
                                </Link>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {similarProperties.map((p) => (
                                <PropertyCard key={p.id} property={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Fixed Bottom Action Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur-md border-t border-[var(--border-color)] p-4 shadow-2xl flex items-center justify-between gap-3">
                <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block">
                        Annual Rent
                    </span>
                    <span className="text-lg font-black text-[var(--color-brand-green)]">
                        {formatPrice(property.pricePerYear)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        asChild
                        variant="outline"
                        className="h-11 px-4 text-xs font-black rounded-xl border-[var(--border-color)]"
                    >
                        <Link href={`/properties/${property.id}/tour`}>Tour</Link>
                    </Button>
                    <Button
                        onClick={() => setIsAppModalOpen(true)}
                        className="h-11 px-5 text-xs font-black bg-[var(--color-brand-green)] text-white rounded-xl shadow-md"
                    >
                        Apply Now
                    </Button>
                </div>
            </div>

            {/* Application Modal */}
            {property && (
                <ApplicationModal
                    isOpen={isAppModalOpen}
                    onClose={() => setIsAppModalOpen(false)}
                    property={property}
                />
            )}
        </div>
    );
}
