import { Request, Response } from "express";
import { tourService } from "../services/tourService";
import { TourStatus } from "@prisma/client";
import { prisma } from "../config/database";

export class TourController {
    async createTourRequest(req: Request, res: Response) {
        try {
            const { propertyId, preferredDate, preferredTime, message, clerkId } = req.body;

            if (!propertyId || !preferredDate || !preferredTime || !clerkId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields",
                });
            }

            // Find tenant by clerkId
            const tenant = await prisma.user.findUnique({
                where: { clerkId },
            });

            if (!tenant) {
                return res.status(404).json({
                    success: false,
                    message: "Tenant not found",
                });
            }

            // Find property and landlord
            const property = await prisma.property.findUnique({
                where: { id: propertyId },
                select: { landlordId: true },
            });

            if (!property) {
                return res.status(404).json({
                    success: false,
                    message: "Property not found",
                });
            }

            if (property.landlordId === tenant.id) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot schedule an inspection tour for your own property",
                });
            }

            const tourRequest = await tourService.createTourRequest({
                propertyId,
                tenantId: tenant.id,
                landlordId: property.landlordId,
                preferredDate: new Date(preferredDate),
                preferredTime,
                message,
            });

            return res.status(201).json({
                success: true,
                data: tourRequest,
            });
        } catch (error: any) {
            console.error("Error creating tour request:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to create tour request",
                error: error.message,
            });
        }
    }

    async getTourRequests(req: Request, res: Response) {
        try {
            let userId = req.user?.id;
            let userRole: string | undefined = req.user?.role || (req.query.role as string);
            const { clerkId } = req.query;

            if (!userId && clerkId && typeof clerkId === "string") {
                const user = await prisma.user.findUnique({ where: { clerkId } });
                userId = user?.id;
                userRole = userRole || user?.role;
            }

            if (!userId || !userRole) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification and role required",
                });
            }

            const tours = await tourService.getTourRequestsByUser(
                userId,
                userRole as "LANDLORD" | "TENANT"
            );

            return res.status(200).json({
                success: true,
                data: tours,
            });
        } catch (error: any) {
            console.error("Error fetching tour requests:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch tour requests",
                error: error.message,
            });
        }
    }

    async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status || !Object.values(TourStatus).includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status",
                });
            }

            const tour = await tourService.updateTourStatus(id as string, status as TourStatus);

            return res.status(200).json({
                success: true,
                data: tour,
            });
        } catch (error: any) {
            console.error("Error updating tour status:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to update tour status",
                error: error.message,
            });
        }
    }
}

export const tourController = new TourController();
