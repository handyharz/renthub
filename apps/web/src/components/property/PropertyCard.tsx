"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { Bed, Bath, ArrowRight, ShieldCheck, MapPin, Sparkles } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";

export interface PropertyCardProps {
    id: string;
    title: string;
    address?: string;
    city?: string;
    state?: string;
    price?: number;
    pricePerYear?: number;
    bedrooms?: number;
    bathrooms?: number;
    image?: string;
    images?: Array<{ url: string; isPrimary?: boolean } | string>;
    verified?: boolean;
    featured?: boolean;
    landlordVerified?: boolean;
    landlord?: { verified?: boolean; firstName?: string; lastName?: string };
    type?: string;
    propertyType?: string;
    status?: string;
    isFavorited?: boolean;
    agentFee?: number;
}

const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80";

export function PropertyCard({ property }: { property: PropertyCardProps }) {
    const isRented = property.status === "RENTED" || property.status === "UNAVAILABLE";
    
    // Resilient price resolver (supports price, pricePerYear, or numeric string)
    const rawPrice = property.price ?? property.pricePerYear;
    const resolvedPrice = typeof rawPrice === "number" && !isNaN(rawPrice) ? rawPrice : Number(rawPrice) || 0;

    // Resilient image resolver (supports image string, images array of objects, or images array of strings)
    const rawImage = property.image || (
        Array.isArray(property.images) && property.images.length > 0
            ? (typeof property.images[0] === "string" ? property.images[0] : property.images[0]?.url)
            : null
    );
    const initialImage = rawImage && rawImage.startsWith("http") ? rawImage : DEFAULT_FALLBACK_IMAGE;
    const [imgSrc, setImgSrc] = useState(initialImage);

    // Resilient type and address resolver
    const resolvedType = (property.type || property.propertyType || "Apartment").replace(/_/g, " ");
    const resolvedAddress = property.address || (property.city && property.state ? `${property.city}, ${property.state}` : property.city || property.state || "Nigeria");
    const isLandlordVerified = Boolean(property.landlordVerified ?? property.landlord?.verified);
    const isPropertyVerified = Boolean(property.verified);

    return (
        <Link
            href={`/properties/${property.id}`}
            className={`group flex flex-col bg-[var(--bg-card)] rounded-3xl overflow-hidden border border-[var(--border-color)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative ${
                property.featured ? "ring-2 ring-emerald-500/20 border-emerald-500/40" : "hover:border-[var(--color-brand-green)]/40"
            }`}
        >
            {/* Property Image Showcase */}
            <div className="relative aspect-[16/10] w-full bg-[var(--bg-muted)] overflow-hidden">
                <Image
                    src={imgSrc}
                    alt={property.title || "RentHub Property"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImgSrc(DEFAULT_FALLBACK_IMAGE)}
                />
                
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Rented Overlay */}
                {isRented && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
                        <span className="bg-red-600 text-white px-5 py-2 text-sm sm:text-base font-black rounded-full transform -rotate-6 border-2 border-white shadow-xl tracking-wider">
                            RENTED OUT
                        </span>
                    </div>
                )}

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 items-start max-w-[70%]">
                    {property.featured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white font-black text-[11px] shadow-md">
                            <Sparkles className="w-3 h-3 fill-current" />
                            Featured
                        </span>
                    )}
                    {isPropertyVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-brand-green)] text-white font-black text-[11px] shadow-md">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified
                        </span>
                    )}
                    {isLandlordVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/90 text-white font-bold text-[10px] shadow-sm backdrop-blur-xs">
                            Direct Landlord
                        </span>
                    )}
                </div>

                {/* Favorite Button */}
                <div className="absolute top-3 right-3 z-10">
                    <FavoriteButton propertyId={property.id} initialFavorited={property.isFavorited} />
                </div>

                {/* Bottom Left Type & 0% Agent Fee Badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 gap-2">
                    <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white shadow-md font-bold border-none text-[11px] capitalize">
                        {resolvedType}
                    </Badge>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white font-black text-[10px] uppercase tracking-wider backdrop-blur-sm shadow-sm">
                        0% Agent Fee
                    </span>
                </div>
            </div>

            {/* Property Content */}
            <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                <div>
                    {/* Price and Term */}
                    <div className="flex items-baseline justify-between gap-2 mb-2">
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                                {formatPrice(resolvedPrice)}
                            </span>
                            <span className="text-xs font-semibold text-[var(--text-secondary)]">/yr</span>
                        </div>
                        {property.state && (
                            <span className="text-xs font-bold text-[var(--color-brand-green)] bg-emerald-500/10 px-2 py-0.5 rounded-lg truncate max-w-[120px]">
                                {property.state}
                            </span>
                        )}
                    </div>

                    {/* Property Title */}
                    <h3 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--color-brand-green)] transition-colors line-clamp-1">
                        {property.title}
                    </h3>

                    {/* Address with Icon */}
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[var(--color-brand-green)] shrink-0" />
                        <span className="truncate">{resolvedAddress}</span>
                    </p>
                </div>

                {/* Specs Footer */}
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-3.5 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 font-bold">
                            <Bed className="h-4 w-4 text-[var(--color-brand-green)]" />
                            <span>{property.bedrooms ?? 0} Beds</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                            <Bath className="h-4 w-4 text-[var(--color-brand-green)]" />
                            <span>{property.bathrooms ?? 0} Baths</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs font-black text-[var(--color-brand-green)] group-hover:translate-x-0.5 transition-transform">
                        <span>Details</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
