import { Request, Response } from "express";
import { agentService } from "../services/agentService";
import { prisma } from "../config/database";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const ok = (res: Response, data: any, message = "Success") =>
    res.json({ success: true, message, data });

const fail = (res: Response, message: string, status = 400) =>
    res.status(status).json({ success: false, message });

/** Safely coerce a query/param value to string */
const str = (v: unknown): string =>
    Array.isArray(v) ? String(v[0] ?? "") : String(v ?? "");

function getClerkId(req: Request): string {
    return req.auth?.userId ?? req.user?.clerkId ?? "";
}

async function resolveDbUserId(req: Request): Promise<string | null> {
    if (req.user?.id) return req.user.id;
    const clerkId = getClerkId(req);
    if (!clerkId) return null;
    const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true }
    });
    return user?.id ?? null;
}

// ─── PROFILE ENDPOINTS ───────────────────────────────────────────────────────

export const getMyAgentProfile = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const profile = await agentService.getOrCreateProfile(userId);
        return ok(res, profile);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

export const updateMyAgentProfile = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const profile = await agentService.updateProfile(userId, req.body);
        return ok(res, profile, "Profile updated");
    } catch (e: any) {
        return fail(res, e.message);
    }
};

export const submitAgentForReview = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const profile = await agentService.submitForReview(userId);
        return ok(res, profile, "Application submitted for review");
    } catch (e: any) {
        return fail(res, e.message);
    }
};

export const getAgentStats = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const stats = await agentService.getAgentStats(userId);
        return ok(res, stats);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

// ─── DELEGATION ENDPOINTS ─────────────────────────────────────────────────────

/** Agent requests to manage a property */
export const requestDelegation = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const { propertyId, agentNote, commissionPct } = req.body;
        if (!propertyId) return fail(res, "propertyId is required");

        const delegation = await agentService.requestDelegation({
            agentId: userId,
            propertyId: String(propertyId),
            agentNote: agentNote ? String(agentNote) : undefined,
            commissionPct: commissionPct != null ? Number(commissionPct) : undefined
        });
        return ok(res, delegation, "Delegation request sent to landlord");
    } catch (e: any) {
        return fail(res, e.message);
    }
};

/** Get delegations (listings) for the logged-in agent */
export const getMyDelegations = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const delegations = await agentService.getAgentDelegations(userId);
        return ok(res, delegations);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

/** Get commission payouts and settlement status for the logged-in agent */
export const getMyAgentPayouts = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const payouts = await agentService.getAgentPayouts(userId);
        return ok(res, payouts);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

/** Landlord: get all delegation requests for their properties */
export const getLandlordDelegations = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const delegations = await agentService.getLandlordDelegations(userId);
        return ok(res, delegations);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

/** Landlord authorizes a delegation */
export const authorizeDelegation = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const id = str(req.params.id);
        const { landlordNote } = req.body;

        const delegation = await agentService.authorizeDelegation(id, userId, landlordNote);
        return ok(res, delegation, "Agent authorized for this listing");
    } catch (e: any) {
        return fail(res, e.message);
    }
};

/** Landlord revokes a delegation */
export const revokeDelegation = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const id = str(req.params.id);
        const delegation = await agentService.revokeDelegation(id, userId);
        return ok(res, delegation, "Agent access revoked");
    } catch (e: any) {
        return fail(res, e.message);
    }
};

// ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────────

/** Public: list active/verified agents (for landlords to browse) */
export const listActiveAgents = async (req: Request, res: Response) => {
    try {
        const city = str(req.query.city) || undefined;
        const skip = parseInt(str(req.query.skip)) || 0;
        const take = Math.min(parseInt(str(req.query.take)) || 20, 50);

        const agents = await agentService.listActiveAgents({ city, skip, take });
        return ok(res, agents);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

/** Public: get a single agent profile by user ID */
export const getAgentPublicProfile = async (req: Request, res: Response) => {
    try {
        const userId = str(req.params.userId);
        const profile = await agentService.getProfileByUserId(userId);
        if (!profile) return fail(res, "Agent not found", 404);
        return ok(res, profile);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

// ─── ADMIN ENDPOINTS ─────────────────────────────────────────────────────────

export const adminListPendingAgents = async (req: Request, res: Response) => {
    try {
        const skip = parseInt(str(req.query.skip)) || 0;
        const take = parseInt(str(req.query.take)) || 20;
        const agents = await agentService.listPendingProfiles(skip, take);
        return ok(res, agents);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

export const adminApproveAgent = async (req: Request, res: Response) => {
    try {
        const adminClerkId = req.user?.clerkId || req.auth?.userId || "";
        const id = str(req.params.id);
        const updated = await agentService.approveAgent(id, adminClerkId);
        return ok(res, updated, "Agent approved");
    } catch (e: any) {
        return fail(res, e.message);
    }
};

export const adminRejectAgent = async (req: Request, res: Response) => {
    try {
        const adminClerkId = req.user?.clerkId || req.auth?.userId || "";
        const id = str(req.params.id);
        const { reason } = req.body;
        if (!reason) return fail(res, "Rejection reason is required");
        const updated = await agentService.rejectAgent(id, adminClerkId, String(reason));
        return ok(res, updated, "Agent rejected");
    } catch (e: any) {
        return fail(res, e.message);
    }
};

export const adminSuspendAgent = async (req: Request, res: Response) => {
    try {
        const id = str(req.params.id);
        const updated = await agentService.suspendAgent(id);
        return ok(res, updated, "Agent suspended");
    } catch (e: any) {
        return fail(res, e.message);
    }
};

// ─── STRIKE & ZERO SIDE-PAYMENTS CONTROLLERS ─────────────────────────────────

export const fileStrikeReport = async (req: Request, res: Response) => {
    try {
        const reporterId = await resolveDbUserId(req);
        if (!reporterId) return fail(res, "Unauthorized: Please log in to file a report", 401);

        const { agentId, propertyId, reason, description, evidenceUrls } = req.body;
        if (!agentId) return fail(res, "Agent ID is required", 400);
        if (!reason) return fail(res, "Violation reason is required", 400);
        if (!description || description.trim().length < 5) {
            return fail(res, "Please provide a brief description of the incident (min 5 chars)", 400);
        }

        const report = await agentService.fileStrikeReport(reporterId, {
            agentId,
            propertyId,
            reason,
            description,
            evidenceUrls,
        });

        return ok(res, report, "Report submitted successfully. Our compliance team will investigate.");
    } catch (e: any) {
        return fail(res, e.message, 400);
    }
};

export const adminListStrikes = async (req: Request, res: Response) => {
    try {
        const status = str(req.query.status);
        const skip = parseInt(str(req.query.skip)) || 0;
        const take = parseInt(str(req.query.take)) || 50;

        const strikes = await agentService.listStrikes({
            status: status && status !== "ALL" ? status : undefined,
            skip,
            take,
        });

        return ok(res, strikes);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

export const adminReviewStrike = async (req: Request, res: Response) => {
    try {
        const adminClerkId = req.user?.clerkId || req.auth?.userId || "";
        const id = str(req.params.id);
        const { action, adminNote } = req.body;

        if (action !== "UPHOLD" && action !== "DISMISS") {
            return fail(res, "Action must be UPHOLD or DISMISS", 400);
        }

        const result = await agentService.reviewStrike(id, adminClerkId, action, adminNote);
        return ok(res, result, action === "UPHOLD" ? "Strike recorded and applied" : "Report dismissed");
    } catch (e: any) {
        return fail(res, e.message, 400);
    }
};

export const getMyStrikes = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const data = await agentService.getAgentStrikes(userId);
        return ok(res, data);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

export const adminGetAgentKPIs = async (req: Request, res: Response) => {
    try {
        const kpis = await agentService.getAdminAgentKPIs();
        return ok(res, kpis);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

export const adminListAllAgents = async (req: Request, res: Response) => {
    try {
        const status = str(req.query.status);
        const search = str(req.query.search);
        const city = str(req.query.city);
        const skip = parseInt(str(req.query.skip)) || 0;
        const take = parseInt(str(req.query.take)) || 50;

        const agents = await agentService.listAdminAgents({
            status: status && status !== "ALL" ? status : undefined,
            search: search || undefined,
            city: city && city !== "ALL" ? city : undefined,
            skip,
            take,
        });

        return ok(res, agents);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

