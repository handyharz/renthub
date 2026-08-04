import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { Bed, Bath, ArrowRight, Shield } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";


interface PropertyProps {
    id: string;
    title: string;
    address: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    image: string;
    verified: boolean;
    featured?: boolean;
    landlordVerified?: boolean;
    type: string;
    status?: string;
    isFavorited?: boolean;
}

export function PropertyCard({ property }: { property: PropertyProps }) {
    const isRented = property.status === "RENTED" || property.status === "UNAVAILABLE";

    return (
        <Link
            href={`/properties/${property.id}`}
            className={`group block bg-[var(--bg-card)] rounded-xl overflow-hidden border border-[var(--border-color)] transition-all hover:shadow-lg hover:-translate-y-1 relative ${property.featured ? 'border-[var(--color-brand-orange)]/30 ring-1 ring-[var(--color-brand-orange)]/10' : ''}`}
        >
            <div className="relative aspect-[16/9] w-full bg-[var(--bg-muted)]">
                <Image
                    src={property.image}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                />

                {isRented && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 backdrop-blur-[1px]">
                        <span className="bg-red-600 text-white px-6 py-2 text-lg font-bold rounded-full transform -rotate-12 border-2 border-white shadow-xl tracking-wider">
                            RENTED
                        </span>
                    </div>
                )}

                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 items-start">
                    <div className="flex gap-2">
                        {property.featured && (
                            <Badge className="bg-[var(--color-brand-orange)] text-white border-none shadow-md font-bold">
                                Featured
                            </Badge>
                        )}
                        {property.verified && (
                            <Badge variant="success" className="bg-[var(--color-brand-green)] text-white border-none shadow-md">
                                Verified Property
                            </Badge>
                        )}
                    </div>
                    {property.landlordVerified && (
                        <Badge className="bg-[var(--color-brand-blue)] text-white border-none shadow-sm text-[10px] py-0 px-2 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            <Shield className="h-2.5 w-2.5" /> Verified Landlord
                        </Badge>
                    )}
                </div>

                <div className="absolute bottom-3 left-3 z-10">
                    <Badge variant="secondary" className="bg-black/60 backdrop-blur-sm text-white shadow-md font-bold border-none">
                        {property.type}
                    </Badge>
                </div>

                <div className="absolute top-3 right-3 z-10">
                    <FavoriteButton propertyId={property.id} initialFavorited={property.isFavorited} />
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-2xl font-bold text-[var(--color-brand-blue)]">
                            {formatPrice(property.price)}<span className="text-sm font-normal text-[var(--text-muted)]">/yr</span>
                        </p>
                        <h3 className="font-semibold text-[var(--text-primary)]">{property.title}</h3>
                    </div>
                </div>

                <p className="text-sm text-[var(--text-muted)] mb-4 truncate">{property.address}</p>

                <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] pt-4 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{property.bedrooms} Beds</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        <span>{property.bathrooms} Baths</span>
                    </div>
                    <div className="ml-auto">
                        <ArrowRight className="h-4 w-4 text-[var(--color-brand-orange)] group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </Link >
    );
}
