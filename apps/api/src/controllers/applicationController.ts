import { Request, Response } from "express";
import { applicationService } from "../services/applicationService";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "../config/database";

export class ApplicationController {
    /**
     * Submit a rental application (Tenant)
     * POST /api/applications
     */
    async createApplication(req: Request, res: Response) {
        try {
            let tenantId = req.user?.id;
            const { clerkId } = req.query;

            if (!tenantId && clerkId && typeof clerkId === "string") {
                const tenant = await prisma.user.findUnique({ where: { clerkId } });
                tenantId = tenant?.id;
            }

            if (!tenantId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const { propertyId, proposedMoveInDate, leaseDuration, note } = req.body;

            if (!propertyId || !proposedMoveInDate) {
                return res.status(400).json({
                    success: false,
                    message: "Property ID and proposed move-in date are required"
                });
            }

            const application = await applicationService.createApplication({
                tenantId,
                propertyId,
                proposedMoveInDate: new Date(proposedMoveInDate),
                leaseDuration: leaseDuration ? parseInt(leaseDuration) : 12,
                note
            });

            return res.status(201).json({
                success: true,
                message: "Application submitted successfully",
                data: application
            });
        } catch (error: any) {
            console.error("Create application error:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to submit application"
            });
        }
    }

    /**
     * Get tenant applications
     * GET /api/applications/tenant
     */
    async getTenantApplications(req: Request, res: Response) {
        try {
            const tenantId = req.user?.id;
            if (!tenantId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const applications = await applicationService.getTenantApplications(tenantId);

            return res.status(200).json({
                success: true,
                data: applications
            });
        } catch (error: any) {
            console.error("Get tenant applications error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch applications"
            });
        }
    }

    /**
     * Get landlord applications
     * GET /api/applications/landlord
     */
    async getLandlordApplications(req: Request, res: Response) {
        try {
            const landlordId = req.user?.id;
            if (!landlordId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const applications = await applicationService.getLandlordApplications(landlordId);

            return res.status(200).json({
                success: true,
                data: applications
            });
        } catch (error: any) {
            console.error("Get landlord applications error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch applications"
            });
        }
    }

    /**
     * Update application status (Landlord approves/rejects)
     * PATCH /api/applications/:id/status
     */
    async updateStatus(req: Request, res: Response) {
        try {
            const landlordId = req.user?.id;
            if (!landlordId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const id = req.params.id as string;
            const { status } = req.body;

            if (!status || !Object.values(ApplicationStatus).includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Valid status (APPROVED, REJECTED, CANCELLED) is required"
                });
            }

            const updated = await applicationService.updateApplicationStatus(
                id,
                landlordId,
                status as ApplicationStatus
            );

            return res.status(200).json({
                success: true,
                message: `Application ${status.toLowerCase()} successfully`,
                data: updated
            });
        } catch (error: any) {
            console.error("Update application status error:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to update application status"
            });
        }
    }
}

export const applicationController = new ApplicationController();
