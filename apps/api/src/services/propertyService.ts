import { prisma } from "../config/database";
import { Property, PropertyStatus, Prisma } from "@prisma/client";
import { mapPropertyType } from "../utils/propertyUtils";

export class PropertyService {
    /**
     * Create a new property
     */
    async createProperty(data: Prisma.PropertyCreateInput): Promise<Property> {
        return await prisma.property.create({
            data,
            include: {
                landlord: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        verified: true,
                    },
                },
                images: true,
                amenities: {
                    include: {
                        amenity: true,
                    },
                },
            },
        });
    }

    /**
     * Get all properties with filters
     */
    async getProperties(filters?: {
        city?: string;
        state?: string;
        propertyType?: string;
        minPrice?: number;
        maxPrice?: number;
        bedrooms?: number;
        status?: PropertyStatus;
        featured?: boolean;
        verified?: boolean;
        neLat?: number;
        neLng?: number;
        swLat?: number;
        swLng?: number;
        amenities?: string[];
        furnished?: boolean;
        serviced?: boolean;
        petsAllowed?: boolean;
        parkingSpaces?: number;
        powerSupply?: string;
        waterSupply?: string;
        polygon?: string; // JSON string of coordinates [[lng, lat], ...]
        landlordId?: string;
        q?: string;
        sortBy?: "newest" | "price_asc" | "price_desc" | "featured";
        limit?: number;
        offset?: number;
    }) {
        const {
            city,
            state,
            propertyType,
            minPrice,
            maxPrice,
            bedrooms,
            status,
            featured,
            verified,
            neLat,
            neLng,
            swLat,
            swLng,
            amenities,
            furnished,
            serviced,
            petsAllowed,
            parkingSpaces,
            powerSupply,
            waterSupply,
            polygon,
            landlordId,
            q,
            sortBy = "newest",
            limit = 100,
            offset = 0,
        } = filters || {};

        const polygonBounds = (polyStr: string) => {
            try {
                const points = JSON.parse(polyStr);
                const lats = points.map((p: any) => p[1]);
                const lngs = points.map((p: any) => p[0]);
                return {
                    minLat: Math.min(...lats),
                    maxLat: Math.max(...lats),
                    minLng: Math.min(...lngs),
                    maxLng: Math.max(...lngs)
                };
            } catch (e) {
                return null;
            }
        };

        const polyBbox = polygon ? polygonBounds(polygon) : null;

        const where: Prisma.PropertyWhereInput = {
            deletedAt: null, // Exclude soft-deleted properties
            ...(status
                ? { status }
                : landlordId
                    ? {} // If landlordId is provided, don't filter by status by default
                    : { status: { in: [PropertyStatus.AVAILABLE, PropertyStatus.RENTED] } }
            ),
            ...(city && { city: { contains: city, mode: "insensitive" } }),
            ...(state && { state: { contains: state, mode: "insensitive" } }),
            ...(propertyType && {
                propertyType: {
                    in: mapPropertyType(propertyType),
                },
            }),
            ...(bedrooms && { bedrooms: { gte: bedrooms } }),
            ...(parkingSpaces && { parkingSpaces: { gte: parkingSpaces } }),
            ...(landlordId && { landlordId }),
            ...(featured !== undefined && { featured }),
            ...(verified !== undefined && { verified }),
            ...(furnished !== undefined && { furnished }),
            ...(serviced !== undefined && { serviced }),
            ...(petsAllowed !== undefined && { petsAllowed }),
            ...(powerSupply && { powerSupply: powerSupply as any }),
            ...(waterSupply && { waterSupply: waterSupply as any }),
            ...(amenities && amenities.length > 0 && {
                amenities: {
                    some: {
                        amenity: {
                            name: { in: amenities }
                        }
                    }
                }
            }),
            // Use polygon bbox if available, otherwise use neLat/swLat
            ...(polyBbox ? {
                latitude: { gte: polyBbox.minLat, lte: polyBbox.maxLat },
                longitude: { gte: polyBbox.minLng, lte: polyBbox.maxLng }
            } : {
                ...(neLat && swLat && { latitude: { gte: swLat, lte: neLat } }),
                ...(neLng && swLng && { longitude: { gte: swLng, lte: neLng } }),
            }),
            ...(minPrice !== undefined || maxPrice !== undefined
                ? {
                    pricePerYear: {
                        ...(minPrice && { gte: minPrice }),
                        ...(maxPrice && { lte: maxPrice }),
                    },
                }
                : {}),
            ...(q && {
                OR: [
                    { title: { contains: q, mode: "insensitive" } },
                    { description: { contains: q, mode: "insensitive" } },
                    { address: { contains: q, mode: "insensitive" } },
                    { city: { contains: q, mode: "insensitive" } },
                    { state: { contains: q, mode: "insensitive" } },
                    // Smart Alias: If searching for Abuja or Federal Capital Territory, include FCT
                    ...(
                        ['abuja', 'federal capital territory', 'ftc'].some(term => q.toLowerCase().includes(term))
                            ? [{ state: { equals: 'FCT', mode: 'insensitive' as const } }]
                            : []
                    )
                ]
            }),
        };

        const getOrderBy = () => {
            const baseOrder: any[] = [];
            if (sortBy === "price_asc") baseOrder.push({ pricePerYear: "asc" });
            else if (sortBy === "price_desc") baseOrder.push({ pricePerYear: "desc" });
            else if (sortBy === "newest") baseOrder.push({ createdAt: "desc" });

            baseOrder.push({ featured: "desc" });
            baseOrder.push({ verified: "desc" });
            return baseOrder;
        };

        console.log("DEBUG: Property Query Where:", JSON.stringify(where, null, 2));

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where,
                include: {
                    landlord: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            verified: true,
                        },
                    },
                    images: {
                        where: { isPrimary: true },
                        take: 1,
                    },
                },
                orderBy: getOrderBy(),
                take: limit,
                skip: offset,
            }),
            prisma.property.count({ where }),
        ]);

        return {
            properties,
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
        };
    }

    /**
     * Get a single property by ID
     */
    async getPropertyById(id: string): Promise<Property | null> {
        return await prisma.property.findUnique({
            where: { id },
            include: {
                landlord: {
                    select: {
                        id: true,
                        clerkId: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        verified: true,
                        avatar: true,
                        createdAt: true,
                        // @ts-ignore
                        landlordAvgRating: true,
                        // @ts-ignore
                        landlordReviewCount: true,
                        _count: {
                            select: {
                                propertiesOwned: true
                            }
                        }
                    },
                },
                images: {
                    orderBy: { order: "asc" },
                },
                videos: true,
                amenities: {
                    include: {
                        amenity: true,
                    },
                },
                reviews: {
                    include: {
                        reviewer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
                // @ts-ignore
                delegatedListings: {
                    where: { status: "AUTHORIZED" },
                    take: 1,
                    include: {
                        agentProfile: {
                            select: {
                                businessName: true,
                                licenseNumber: true,
                                avgRating: true,
                                totalClosed: true,
                            },
                        },
                        agent: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                                verified: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Update a property
     */
    async updateProperty(
        id: string,
        data: Prisma.PropertyUpdateInput
    ): Promise<Property> {
        return await prisma.property.update({
            where: { id },
            data,
            include: {
                landlord: true,
                images: true,
                amenities: {
                    include: {
                        amenity: true,
                    },
                },
            },
        });
    }

    /**
     * Delete a property (soft delete)
     */
    async deleteProperty(id: string): Promise<Property> {
        return await prisma.property.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                status: PropertyStatus.ARCHIVED,
            },
        });
    }

    /**
     * Get properties by landlord ID
     */
    async getPropertiesByLandlord(landlordId: string) {
        return await prisma.property.findMany({
            where: {
                landlordId,
                deletedAt: null,
            },
            include: {
                images: {
                    where: { isPrimary: true },
                    take: 1,
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    /**
     * Increment view count
     */
    async incrementViewCount(propertyId: string, userId?: string): Promise<void> {
        await Promise.all([
            prisma.property.update({
                where: { id: propertyId },
                data: {
                    viewCount: {
                        increment: 1,
                    },
                },
            }),
            prisma.propertyView.create({
                data: {
                    propertyId,
                    userId,
                },
            }),
        ]);
    }

    /**
     * Search properties (full-text search)
     */
    async searchProperties(query: string, limit = 100) {
        // Note: Full-text search requires PostgreSQL
        // For now, we'll use simple LIKE search
        return await prisma.property.findMany({
            where: {
                deletedAt: null,
                status: { in: [PropertyStatus.AVAILABLE, PropertyStatus.RENTED] },
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                    { address: { contains: query, mode: "insensitive" } },
                    { city: { contains: query, mode: "insensitive" } },
                ],
            },
            include: {
                landlord: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        verified: true,
                    },
                },
                images: {
                    where: { isPrimary: true },
                    take: 1,
                },
            },
            take: limit,
            orderBy: [
                { featured: "desc" },
                { verified: "desc" },
                { createdAt: "desc" },
            ],
        });
    }

    /**
     * Get unique locations (states and cities) with active properties
     */
    async getLocations() {
        const properties = await prisma.property.findMany({
            where: {
                deletedAt: null,
                status: PropertyStatus.AVAILABLE,
            },
            select: {
                state: true,
                city: true,
            },
            distinct: ["state", "city"],
        });

        // Group by state
        const locations: Record<string, string[]> = {};
        properties.forEach((p) => {
            if (!locations[p.state]) {
                locations[p.state] = [];
            }
            if (!locations[p.state].includes(p.city)) {
                locations[p.state].push(p.city);
            }
        });

        return locations;
    }
}

export const propertyService = new PropertyService();
