import { Request, Response } from "express";
import { renewalService } from "../services/renewalService";

export class RenewalController {
    /**
     * Identity comes from the verified Clerk JWT only.
     */
    private async resolveUserId(req: Request): Promise<string | null> {
        return req.user?.id || null;
    }

    /**
     * Landlord creates a renewal offer
     * POST /api/renewals/offer
     */
    async createRenewalOffer(req: Request, res: Response) {
        try {
            const landlordId = await this.resolveUserId(req);
            if (!landlordId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const { propertyId, tenantId, offeredRent, leaseDuration, landlordNote, currentLeaseEndDate } = req.body;

            if (!propertyId || !offeredRent) {
                return res.status(400).json({
                    success: false,
                    message: "Property ID and offered rent amount are required"
                });
            }

            const renewal = await renewalService.createRenewalOffer({
                landlordId,
                propertyId,
                tenantId,
                offeredRent: parseInt(offeredRent),
                leaseDuration: leaseDuration ? parseInt(leaseDuration) : 12,
                currentLeaseEndDate: currentLeaseEndDate ? new Date(currentLeaseEndDate) : undefined,
                landlordNote
            });

            return res.status(201).json({
                success: true,
                message: "Lease renewal offer created and sent to tenant successfully!",
                data: renewal
            });
        } catch (error: any) {
            console.error("Create renewal offer error:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to create renewal offer"
            });
        }
    }

    /**
     * Get landlord's renewals
     * GET /api/renewals/landlord
     */
    async getLandlordRenewals(req: Request, res: Response) {
        try {
            const landlordId = await this.resolveUserId(req);
            if (!landlordId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const renewals = await renewalService.getLandlordRenewals(landlordId);

            return res.status(200).json({
                success: true,
                data: renewals
            });
        } catch (error: any) {
            console.error("Get landlord renewals error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch landlord renewals"
            });
        }
    }

    /**
     * Get tenant's renewals
     * GET /api/renewals/tenant
     */
    async getTenantRenewals(req: Request, res: Response) {
        try {
            const tenantId = await this.resolveUserId(req);
            if (!tenantId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const renewals = await renewalService.getTenantRenewals(tenantId);

            return res.status(200).json({
                success: true,
                data: renewals
            });
        } catch (error: any) {
            console.error("Get tenant renewals error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch tenant renewals"
            });
        }
    }

    /**
     * Tenant responds to renewal offer
     * PATCH /api/renewals/:id/respond
     */
    async respondToRenewal(req: Request, res: Response) {
        try {
            const tenantId = await this.resolveUserId(req);
            if (!tenantId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const { id } = req.params;
            const { action, counterRent, tenantNote } = req.body;

            if (!["ACCEPT", "DECLINE", "COUNTER"].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: "Action must be ACCEPT, DECLINE, or COUNTER"
                });
            }

            const updated = await renewalService.respondToRenewal({
                renewalId: id as string,
                tenantId,
                action,
                counterRent: counterRent ? parseInt(counterRent) : undefined,
                tenantNote
            });

            return res.status(200).json({
                success: true,
                message: `Renewal offer ${action.toLowerCase()}ed successfully`,
                data: updated
            });
        } catch (error: any) {
            console.error("Respond to renewal error:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to update renewal offer"
            });
        }
    }
}

export const renewalController = new RenewalController();
