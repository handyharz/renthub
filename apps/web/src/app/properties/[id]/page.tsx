"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Map } from "@/components/map/Map";
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
    Star,
    Zap,
    Wifi,
    Car,
    Phone,
} from "lucide-react";
import Link from "next/link";
import { LockedMessageButton } from "@/components/property/LockedMessageButton";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ImageCarousel } from "@/components/property/ImageCarousel";
import { ApplicationModal } from "@/components/property/ApplicationModal";

// Amenity Icons mapping
const AMENITY_ICONS: Record<string, any> = {
    "24/7 Power": Zap,
    "Backup Generator": Zap,
    "Fiber Internet": Wifi,
    "Covered Parking": Car,
    "default": CheckCircle2,
};

export default function PropertyDetailsPage() {
    const { id } = useParams();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            fetchProperty();
        }
    }, [id]);

    const fetchProperty = async () => {
        try {
            const res = await api.get(`/properties/${id}`);
            setProperty(res.data.data);
        } catch (error) {
            console.error("Failed to fetch property:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-64 bg-[var(--bg-muted)] rounded-xl mb-4" />
                    <div className="h-4 w-48 bg-[var(--bg-muted)] rounded-xl" />
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] pt-20 text-center px-4">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Property not found</h1>
                <Button onClick={() => window.location.href = "/search"} className="mt-4 bg-[var(--color-brand-green)] text-white font-bold rounded-xl">
                    Back to Search
                </Button>
            </div>
        );
    }

    const getAmenityIcon = (name: string) => {
        const Icon = AMENITY_ICONS[name] || AMENITY_ICONS["default"];
        return <Icon className="h-5 w-5 text-[var(--color-brand-green)] shrink-0" />;
    };

    const handleShare = async () => {
        const shareData = {
            title: property.title,
            text: `Check out this property on RentHub: ${property.title}`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
            }
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
            {/* 1. Image Carousel */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
                <div className="container-wide py-4 sm:py-6">
                    <ImageCarousel
                        images={property.images || []}
                        title={property.title}
                    />
                </div>
            </div>

            <div className="container-wide py-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* LEFT COLUMN: Main Info */}
                    <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                        {/* Header Info Card */}
                        <div className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {property.featured && (
                                            <Badge className="bg-[var(--color-brand-orange)] text-white border-none shadow-md flex items-center gap-1 font-bold text-xs">
                                                <Star className="h-3 w-3 fill-white" /> Featured Listing
                                            </Badge>
                                        )}
                                        {property.verified && (
                                            <Badge className="bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] border-none flex items-center gap-1 font-bold text-xs">
                                                <Shield className="h-3 w-3" /> Verified Property
                                            </Badge>
                                        )}
                                        {(property.status === "RENTED" || property.status === "UNAVAILABLE") ? (
                                            <Badge className="bg-red-500/15 text-red-500 border-none flex items-center gap-1 font-bold text-xs">
                                                RENTED
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[var(--text-secondary)] border-[var(--border-color)] font-bold text-xs">
                                                {property.propertyType.replace(/_/g, " ")}
                                            </Badge>
                                        )}
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
                                        {property.title}
                                    </h1>
                                    <div className="flex items-center text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                                        <MapPin className="h-4 w-4 mr-1 text-[var(--color-brand-orange)] shrink-0" />
                                        {property.address}, {property.city}, {property.state}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <FavoriteButton
                                        propertyId={property.id}
                                        initialFavorited={property.isFavorited}
                                        className="h-10 w-10 p-0 flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="text-[var(--text-primary)] border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] h-10 w-10 rounded-xl"
                                        onClick={handleShare}
                                    >
                                        <Share2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Specs Strip */}
                            <div className="flex flex-wrap gap-4 sm:gap-8 py-5 border-y border-[var(--border-color)] my-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                                        <Bed className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div>
                                        <span className="block text-base sm:text-lg font-bold text-[var(--text-primary)]">{property.bedrooms}</span>
                                        <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">Bedrooms</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
                                        <Bath className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div>
                                        <span className="block text-base sm:text-lg font-bold text-[var(--text-primary)]">{property.bathrooms}</span>
                                        <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">Bathrooms</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500 shrink-0">
                                        <Maximize className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div>
                                        <span className="block text-base sm:text-lg font-bold text-[var(--text-primary)]">{property.floorArea || "N/A"}</span>
                                        <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">Sq. Meters</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="pt-2">
                                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-3">Description</h2>
                                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-medium">
                                    {property.description}
                                </p>
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Amenity & Features</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                {property.amenities?.map((pa: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold text-xs sm:text-sm">
                                        {getAmenityIcon(pa.amenity.name)}
                                        <span>{pa.amenity.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Location Map */}
                        <div className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Location</h2>
                            <div className="h-[300px] sm:h-[400px] rounded-xl overflow-hidden border border-[var(--border-color)]">
                                <Map
                                    properties={[
                                        {
                                            id: property.id,
                                            title: property.title,
                                            latitude: property.latitude || 6.45,
                                            longitude: property.longitude || 3.40,
                                            pricePerYear: property.pricePerYear,
                                            city: property.city,
                                        },
                                    ]}
                                    zoom={14}
                                    center={[property.longitude || 3.40, property.latitude || 6.45]}
                                    autoFit={false}
                                />
                            </div>
                        </div>

                        {/* Reviews */}
                        <div className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Reviews & Ratings</h2>
                            <ReviewList propertyId={property.id} />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Contact & Price */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Price Card */}
                            <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                                <div className="mb-6">
                                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mb-1">Rent per annum</p>
                                    <p className="text-3xl sm:text-4xl font-extrabold text-[var(--color-brand-green)]">
                                        {formatPrice(property.pricePerYear)}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {(property.status === "RENTED" || property.status === "UNAVAILABLE") ? (
                                        <>
                                            <Button disabled className="w-full h-12 text-base font-bold bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-not-allowed rounded-xl">
                                                Home Rented
                                            </Button>
                                            <Button disabled variant="outline" className="w-full h-12 text-base font-bold border border-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed rounded-xl">
                                                Tour Unavailable
                                            </Button>
                                        </>
                                    ) : property.status === "UNDER_OFFER" ? (
                                        <>
                                            <Button disabled className="w-full h-12 text-sm sm:text-base bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30 cursor-not-allowed rounded-xl">
                                                Application Approved / Under Offer
                                            </Button>
                                            <Button asChild variant="outline" className="w-full h-12 text-base font-bold border-2 border-[var(--color-brand-green)] text-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)] hover:text-white transition-all rounded-xl">
                                                <Link href={`/properties/${property.id}/tour`}>
                                                    Schedule Inspection Tour
                                                </Link>
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={() => setIsAppModalOpen(true)}
                                                className="w-full h-12 text-base sm:text-lg bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold shadow-md hover:shadow-lg transition-all rounded-xl"
                                            >
                                                Apply to Rent
                                            </Button>
                                            <Button asChild variant="outline" className="w-full h-12 text-base sm:text-lg font-bold border-2 border-[var(--color-brand-green)] text-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)] hover:text-white transition-all rounded-xl">
                                                <Link href={`/properties/${property.id}/tour`}>
                                                    Schedule Tour
                                                </Link>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Landlord Info Card */}
                            <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Listing Landlord</h3>
                                    {property.avgRating > 0 && (
                                        <div className="flex items-center gap-1 bg-amber-500/15 px-3 py-1 rounded-full text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                            {property.avgRating.toFixed(1)}
                                            <span className="opacity-60 font-medium ml-0.5">/ 5.0</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[var(--bg-muted)] overflow-hidden relative border-2 border-[var(--border-color)] shrink-0">
                                        {property.landlord?.avatar ? (
                                            <Image src={property.landlord.avatar} alt="Landlord" fill className="object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] text-lg sm:text-xl font-bold">
                                                {property.landlord?.firstName?.[0]}
                                                {property.landlord?.lastName?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
                                            {property.landlord?.firstName} {property.landlord?.lastName}
                                        </p>
                                        <div className="flex flex-col gap-1 mt-0.5">
                                            <div className="flex items-center text-xs text-[var(--text-secondary)] font-medium">
                                                <Calendar className="h-3 w-3 mr-1 shrink-0 text-[var(--text-muted)]" />
                                                Member since {new Date(property.landlord?.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </div>
                                            {property.landlord?._count?.propertiesOwned > 0 && (
                                                <div className="flex items-center text-xs text-[var(--text-secondary)] font-medium">
                                                    <Maximize className="h-3 w-3 mr-1 shrink-0 text-[var(--text-muted)]" />
                                                    {property.landlord._count.propertiesOwned} Active Listings
                                                </div>
                                            )}
                                            {property.landlord?.landlordAvgRating > 0 && (
                                                <div className="flex items-center text-xs font-bold text-amber-500">
                                                    <Star className="h-3 w-3 fill-amber-500 mr-1 shrink-0" />
                                                    {property.landlord.landlordAvgRating.toFixed(1)}
                                                    <span className="text-[var(--text-muted)] font-normal ml-1">
                                                        ({property.landlord.landlordReviewCount} {property.landlord.landlordReviewCount === 1 ? 'review' : 'reviews'})
                                                    </span>
                                                </div>
                                            )}
                                            {property.landlord?.verified && (
                                                <div className="flex items-center text-xs font-bold mt-1">
                                                    <Badge className="bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] border-none flex items-center gap-1 py-0.5 px-2 font-bold">
                                                        <Shield className="h-3 w-3" />
                                                        Verified Landlord
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start pl-4 gap-3 h-11 text-[var(--text-primary)] font-bold border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] rounded-xl text-sm">
                                        <Phone className="h-4 w-4 text-[var(--color-brand-green)]" />
                                        Show Phone Number
                                    </Button>
                                    <LockedMessageButton
                                        landlordId={property.landlordId}
                                        propertyId={property.id}
                                        propertyTitle={property.title}
                                        className="w-full justify-start pl-4 gap-3 h-11 text-[var(--text-primary)] font-bold border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
