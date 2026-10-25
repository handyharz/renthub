import { Request, Response } from "express";
import { tourService } from "../services/tourService";
import { TourStatus } from "@prisma/client";
import { prisma } from "../config/database";

export class TourController {
    async createTourRequest(req: Request, res: Response) {
        try {
            const { propertyId, preferredDate, preferredTime, message } = req.body;
            const tenant = req.user;

            if (!propertyId || !preferredDate || !preferredTime) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields",
                });
            }

            if (!tenant) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
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
            const userId = req.user?.id;
            const userRole = req.user?.role;

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
            const userId = req.user?.id;
            const role = req.user?.role;

            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            if (!status || !Object.values(TourStatus).includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status",
                });
            }

            const existing = await prisma.tourRequest.findUnique({ where: { id: id as string } });
            if (!existing) {
                return res.status(404).json({ success: false, message: "Tour not found" });
            }

            const isLandlord = existing.landlordId === userId;
            const isTenant = existing.tenantId === userId;
            const isAdmin = role === "ADMIN";
            if (!isLandlord && !isTenant && !isAdmin) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }
            if (isTenant && !isAdmin && status !== TourStatus.CANCELLED && status !== "CANCELLED") {
                return res.status(403).json({ success: false, message: "Tenants can only cancel a tour" });
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
