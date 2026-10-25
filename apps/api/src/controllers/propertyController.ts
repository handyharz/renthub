import { Request, Response } from "express";
import { propertyService } from "../services/propertyService";
import { PropertyStatus, PropertyType } from "@prisma/client";
import { prisma } from "../config/database";

export class PropertyController {
    /**
     * Create a new property
     * POST /api/properties
     */
    async createProperty(req: Request, res: Response) {
        try {
            const {
                title,
                description,
                address,
                city,
                state,
                zipCode,
                latitude,
                longitude,
                propertyType,
                bedrooms,
                bathrooms,
                toilets,
                parkingSpaces,
                floorArea,
                pricePerYear,
                agentFee,
                cautionFee,
                legalFee,
                serviceFee,
                paymentTerms,
                negotiable,
                furnished,
                serviced,
                petsAllowed,
                powerSupply,
                waterSupply,
                landlordId,
                images,
                amenities: selectedAmenities,
            } = req.body;

            // Validation
            if (!title || !description || !address || !city || !state) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields",
                });
            }

            if (!propertyType || !Object.values(PropertyType).includes(propertyType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid property type",
                });
            }

            if (!bedrooms || !bathrooms || !pricePerYear) {
                return res.status(400).json({
                    success: false,
                    message: "Missing property details",
                });
            }

            const targetLandlordId = req.user?.id;

            if (!targetLandlordId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            const property = await propertyService.createProperty({
                title,
                description,
                address,
                city,
                state,
                zipCode,
                latitude,
                longitude,
                propertyType,
                bedrooms: parseInt(bedrooms),
                bathrooms: parseInt(bathrooms),
                toilets: parseInt(toilets || bathrooms),
                parkingSpaces: parseInt(parkingSpaces || 0),
                floorArea: floorArea ? parseFloat(floorArea) : undefined,
                pricePerYear: parseInt(pricePerYear),
                agentFee: parseInt(agentFee || 0),
                cautionFee: parseInt(cautionFee || 0),
                legalFee: parseInt(legalFee || 0),
                serviceFee: parseInt(serviceFee || 0),
                paymentTerms,
                negotiable: negotiable === true || negotiable === "true",
                furnished: furnished === true || furnished === "true",
                serviced: serviced === true || serviced === "true",
                petsAllowed: petsAllowed === true || petsAllowed === "true",
                powerSupply,
                waterSupply,
                status: PropertyStatus.AVAILABLE, // Make properties immediately available
                landlord: {
                    connect: { id: targetLandlordId },
                },
                images: {
                    create: (images || []).map((url: string, index: number) => ({
                        url,
                        publicId: `cl_img_${Date.now()}_${index}`,
                        isPrimary: index === 0,
                        order: index
                    }))
                },
                amenities: {
                    create: (selectedAmenities || []).map((name: string) => ({
                        amenity: { connect: { name } }
                    }))
                },
            });

            return res.status(201).json({
                success: true,
                message: "Property created successfully",
                data: property,
            });
        } catch (error: any) {
            console.error("Error creating property:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to create property",
                error: error.message,
            });
        }
    }

    /**
     * Get all properties with filters
     * GET /api/properties
     */
    async getProperties(req: Request, res: Response) {
        try {
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
                polygon,
                landlordId,
                q,
                limit,
                offset,
            } = req.query;

            const result = await propertyService.getProperties({
                city: typeof city === 'string' ? city : undefined,
                state: typeof state === 'string' ? state : undefined,
                propertyType: typeof propertyType === 'string' ? propertyType : undefined,
                minPrice: minPrice && typeof minPrice === 'string' ? parseInt(minPrice) : undefined,
                maxPrice: maxPrice && typeof maxPrice === 'string' ? parseInt(maxPrice) : undefined,
                bedrooms: bedrooms && typeof bedrooms === 'string' ? parseInt(bedrooms) : undefined,
                status: typeof status === 'string' ? status as PropertyStatus : undefined,
                featured: featured !== undefined ? featured === "true" : undefined,
                verified: verified !== undefined ? verified === "true" : undefined,
                neLat: neLat ? parseFloat(neLat as string) : undefined,
                neLng: neLng ? parseFloat(neLng as string) : undefined,
                swLat: swLat ? parseFloat(swLat as string) : undefined,
                swLng: swLng ? parseFloat(swLng as string) : undefined,
                amenities: typeof amenities === 'string' ? amenities.split(',') : undefined,
                furnished: furnished !== undefined ? furnished === "true" : undefined,
                polygon: typeof polygon === 'string' ? polygon : undefined,
                landlordId: typeof landlordId === 'string' ? landlordId : undefined,
                q: typeof q === 'string' ? q : undefined,
                limit: limit && typeof limit === 'string' ? parseInt(limit) : 100,
                offset: offset && typeof offset === 'string' ? parseInt(offset) : 0,
            });

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error("Error fetching properties:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch properties",
                error: error.message,
            });
        }
    }

    /**
     * Get a single property by ID
     * GET /api/properties/:id
     */
    async getPropertyById(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            const property = await propertyService.getPropertyById(id);

            if (!property) {
                return res.status(404).json({
                    success: false,
                    message: "Property not found",
                });
            }

            const userId: string | undefined = req.user?.id;

            // Increment view count (async, don't wait)
            propertyService.incrementViewCount(id, userId).catch(console.error);

            return res.status(200).json({
                success: true,
                data: property,
            });
        } catch (error: any) {
            console.error("Error fetching property:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch property",
                error: error.message,
            });
        }
    }

    /**
     * Update a property
     * PATCH /api/properties/:id
     */
    async updateProperty(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const {
                title,
                description,
                address,
                city,
                state,
                zipCode,
                latitude,
                longitude,
                propertyType,
                bedrooms,
                bathrooms,
                toilets,
                parkingSpaces,
                floorArea,
                pricePerYear,
                agentFee,
                cautionFee,
                legalFee,
                serviceFee,
                paymentTerms,
                negotiable,
                furnished,
                serviced,
                petsAllowed,
                powerSupply,
                waterSupply,
                images,
                amenities: selectedAmenities,
            } = req.body;

            // Prepare update data
            const updateData: any = {
                ...(title && { title }),
                ...(description && { description }),
                ...(address && { address }),
                ...(city && { city }),
                ...(state && { state }),
                ...(zipCode !== undefined && { zipCode }),
                ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
                ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
                ...(propertyType && { propertyType }),
                ...(bedrooms !== undefined && { bedrooms: parseInt(bedrooms) }),
                ...(bathrooms !== undefined && { bathrooms: parseInt(bathrooms) }),
                ...(toilets !== undefined && { toilets: parseInt(toilets) }),
                ...(parkingSpaces !== undefined && { parkingSpaces: parseInt(parkingSpaces) }),
                ...(floorArea !== undefined && { floorArea: floorArea ? parseFloat(floorArea) : null }),
                ...(pricePerYear !== undefined && { pricePerYear: parseInt(pricePerYear) }),
                ...(agentFee !== undefined && { agentFee: parseInt(agentFee) }),
                ...(cautionFee !== undefined && { cautionFee: parseInt(cautionFee) }),
                ...(legalFee !== undefined && { legalFee: parseInt(legalFee) }),
                ...(serviceFee !== undefined && { serviceFee: parseInt(serviceFee) }),
                ...(paymentTerms && { paymentTerms }),
                ...(negotiable !== undefined && { negotiable: negotiable === true || negotiable === "true" }),
                ...(furnished !== undefined && { furnished: furnished === true || furnished === "true" }),
                ...(serviced !== undefined && { serviced: serviced === true || serviced === "true" }),
                ...(petsAllowed !== undefined && { petsAllowed: petsAllowed === true || petsAllowed === "true" }),
                ...(powerSupply && { powerSupply }),
                ...(waterSupply && { waterSupply }),
            };

            // Handle images update
            if (images && Array.isArray(images)) {
                updateData.images = {
                    deleteMany: {},
                    create: images.map((url: string, index: number) => ({
                        url,
                        publicId: `cl_img_${Date.now()}_${index}`,
                        isPrimary: index === 0,
                        order: index
                    }))
                };
            }

            // Handle amenities update
            if (selectedAmenities && Array.isArray(selectedAmenities)) {
                updateData.amenities = {
                    deleteMany: {},
                    create: selectedAmenities.map((name: string) => ({
                        amenity: { connect: { name } }
                    }))
                };
            }

            // Verify property ownership or admin role
            const existingProp = await propertyService.getPropertyById(id);
            if (!existingProp) {
                return res.status(404).json({ success: false, message: "Property not found" });
            }
            if (!req.user || (existingProp.landlordId !== req.user.id && req.user.role !== "ADMIN")) {
                return res.status(403).json({ success: false, message: "Forbidden: You do not own this property" });
            }

            const property = await propertyService.updateProperty(id, updateData);

            return res.status(200).json({
                success: true,
                message: "Property updated successfully",
                data: property,
            });
        } catch (error: any) {
            console.error("Error updating property:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to update property",
                error: error.message,
            });
        }
    }

    /**
     * Delete a property (soft delete)
     * DELETE /api/properties/:id
     */
    async deleteProperty(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            // Verify property ownership or admin role
            const existingProp = await propertyService.getPropertyById(id);
            if (!existingProp) {
                return res.status(404).json({ success: false, message: "Property not found" });
            }
            if (!req.user || (existingProp.landlordId !== req.user.id && req.user.role !== "ADMIN")) {
                return res.status(403).json({ success: false, message: "Forbidden: You do not own this property" });
            }

            const property = await propertyService.deleteProperty(id);

            return res.status(200).json({
                success: true,
                message: "Property deleted successfully",
                data: property,
            });
        } catch (error: any) {
            console.error("Error deleting property:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to delete property",
                error: error.message,
            });
        }
    }

    /**
     * Search properties
     * GET /api/properties/search
     */
    async searchProperties(req: Request, res: Response) {
        try {
            const { q, limit } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: "Search query is required",
                });
            }

            const properties = await propertyService.searchProperties(
                typeof q === 'string' ? q : '',
                limit && typeof limit === 'string' ? parseInt(limit) : 100
            );

            return res.status(200).json({
                success: true,
                data: properties,
            });
        } catch (error: any) {
            console.error("Error searching properties:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to search properties",
                error: error.message,
            });
        }
    }

    /**
     * Get properties by landlord
     * GET /api/properties/landlord/:landlordId
     */
    async getPropertiesByLandlord(req: Request, res: Response) {
        try {
            const landlordId = req.params.landlordId as string;

            const properties = await propertyService.getPropertiesByLandlord(landlordId);

            return res.status(200).json({
                success: true,
                data: properties,
            });
        } catch (error: any) {
            console.error("Error fetching landlord properties:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch landlord properties",
                error: error.message,
            });
        }
    }

    /**
     * Get unique locations (states and cities)
     * GET /api/properties/locations
     */
    async getLocations(req: Request, res: Response) {
        try {
            const locations = await propertyService.getLocations();

            return res.status(200).json({
                success: true,
                data: locations,
            });
        } catch (error: any) {
            console.error("Error fetching locations:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch locations",
                error: error.message,
            });
        }
    }
}

export const propertyController = new PropertyController();
