import { Request, Response } from "express";
import { adminService } from "../services/adminService";

export class AdminController {
    async getStats(req: Request, res: Response) {
        try {
            const stats = await adminService.getStats();
            return res.status(200).json({ success: true, data: stats });
        } catch (error: any) {
            console.error("Admin stats error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch admin stats",
                error: error.message,
            });
        }
    }

    async getPendingVerifications(req: Request, res: Response) {
        try {
            const properties = await adminService.getPendingVerifications();
            return res.status(200).json({ success: true, data: properties });
        } catch (error: any) {
            console.error("Admin verifications error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch verification queue",
                error: error.message,
            });
        }
    }

    async approveVerification(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const property = await adminService.approveVerification(id, req.user!.id);
            return res.status(200).json({
                success: true,
                message: "Property verified successfully",
                data: property,
            });
        } catch (error: any) {
            console.error("Approve verification error:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to approve verification",
            });
        }
    }

    async rejectVerification(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { reason } = req.body;
            const property = await adminService.rejectVerification(id, req.user!.id, reason);
            return res.status(200).json({
                success: true,
                message: "Verification rejected",
                data: property,
            });
        } catch (error: any) {
            console.error("Reject verification error:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to reject verification",
            });
        }
    }

    async getDisputes(req: Request, res: Response) {
        try {
            const disputes = await adminService.getDisputes();
            return res.status(200).json({ success: true, data: disputes });
        } catch (error: any) {
            console.error("Admin disputes error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch disputes",
                error: error.message,
            });
        }
    }

    async resolveDispute(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { action, note } = req.body;

            if (action !== "release" && action !== "refund") {
                return res.status(400).json({
                    success: false,
                    message: "Action must be 'release' or 'refund'",
                });
            }

            const transaction = await adminService.resolveDispute(
                id,
                action,
                req.user!.id,
                note
            );

            return res.status(200).json({
                success: true,
                message: `Dispute resolved — ${action === "refund" ? "refunded to tenant" : "released to landlord"}`,
                data: transaction,
            });
        } catch (error: any) {
            console.error("Resolve dispute error:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to resolve dispute",
            });
        }
    }
}

export const adminController = new AdminController();
