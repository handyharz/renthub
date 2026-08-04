import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import api from "@/lib/api";

async function getFeaturedProperties() {
    try {
        const res = await api.get("/properties");
        return res.data.data.properties.slice(0, 3); // Top 3
    } catch (error) {
        console.error("Failed to fetch properties:", error);
        return [];
    }
}

export async function FeaturedProperties() {
    const properties = await getFeaturedProperties();

    return (
        <section className="py-20">
            <div className="container-wide">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Fresh on RentHub</h2>
                        <p className="text-[var(--text-secondary)]">Newly listed properties verified by our team.</p>
                    </div>
                    <Link href="/search" className="text-[var(--color-brand-orange)] font-bold flex items-center hover:underline">
                        View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </div>

                {properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map((property: any) => (
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
                                    type: property.propertyType.replace(/_/g, " "),
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                        <p className="text-[var(--text-secondary)]">No properties found. Check back soon!</p>
                    </div>
                )}
            </div>
        </section>
    );
}
