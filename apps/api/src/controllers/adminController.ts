import { Request, Response } from "express";
import { adminService } from "../services/adminService";
import { prisma } from "../config/database";

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

    async revokeVerification(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { reason } = req.body;
            const property = await adminService.revokeVerification(id, req.user!.id, reason);
            return res.status(200).json({
                success: true,
                message: "Property verification badge revoked",
                data: property,
            });
        } catch (error: any) {
            console.error("Revoke verification error:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to revoke verification",
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

    async getEscrowTransactions(req: Request, res: Response) {
        try {
            const { status } = req.query;
            const data = await adminService.getEscrowTransactions(status as string);
            return res.status(200).json({ success: true, data });
        } catch (error: any) {
            console.error("Admin escrow error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch escrow transactions",
                error: error.message,
            });
        }
    }

    async getAllProperties(req: Request, res: Response) {
        try {
            const { status } = req.query;
            const properties = await adminService.getAllProperties(status as string);
            return res.status(200).json({ success: true, data: properties });
        } catch (error: any) {
            console.error("Admin properties error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch properties",
                error: error.message,
            });
        }
    }

    async getSettings(req: Request, res: Response) {
        try {
            const settings = await adminService.getSettings();
            return res.status(200).json({ success: true, data: settings });
        } catch (error: any) {
            console.error("Admin getSettings error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch platform settings",
                error: error.message,
            });
        }
    }

    async updateSettings(req: Request, res: Response) {
        try {
            const updated = await adminService.updateSettings(req.body);
            return res.status(200).json({
                success: true,
                message: "Platform settings updated successfully",
                data: updated,
            });
        } catch (error: any) {
            console.error("Admin updateSettings error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to update platform settings",
                error: error.message,
            });
        }
    }

    async testAfriExchangeConnection(req: Request, res: Response) {
        try {
            const result = await adminService.testAfriExchangeConnection();
            return res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            console.error("Admin testAfriExchange error:", error);
            return res.status(500).json({
                success: false,
                message: "AfriExchange health check ping failed",
                error: error.message,
            });
        }
    }

    async getTransparencyAudit(req: Request, res: Response) {
        try {
            const snapshots = await prisma.transparencySnapshot.findMany({
                orderBy: { timestamp: "desc" },
                take: 30,
            });
            const serialized = snapshots.map((s: any) => ({
                ...s,
                dbExpectedKobo: s.dbExpectedKobo.toString(),
                anchorPoolKobo: s.anchorPoolKobo.toString(),
                afriExchangePoolKobo: s.afriExchangePoolKobo.toString(),
                varianceKobo: s.varianceKobo.toString(),
            }));
            return res.status(200).json({
                success: true,
                data: {
                    snapshots: serialized,
                    count: serialized.length,
                    auditedAt: new Date().toISOString(),
                },
            });
        } catch (error: any) {
            console.error("Admin transparency audit error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch transparency audit snapshots",
                error: error.message,
            });
        }
    }
}

export const adminController = new AdminController();
