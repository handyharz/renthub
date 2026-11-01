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
    return (req.query?.clerkId as string) ?? (req.body?.clerkId as string) ?? req.auth?.userId ?? req.user?.clerkId ?? "";
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

/** Agent: get distinct landlords for whom they have an AUTHORIZED delegation */
export const getMyAuthorizedLandlords = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const landlords = await agentService.getAuthorizedLandlords(userId);
        return ok(res, landlords);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

/** Agent: create a new DRAFT property listing on behalf of an authorized landlord */
export const createListingForLandlord = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const {
            landlordId, title, description, address, city, state,
            propertyType, bedrooms, bathrooms, toilets, parkingSpaces,
            floorArea, pricePerYear, cautionFee, legalFee, agentFee,
            paymentTerms, negotiable, furnished, serviced, petsAllowed,
            powerSupply, waterSupply, amenities, agentNote,
        } = req.body;

        if (!landlordId) return fail(res, "landlordId is required", 400);
        if (!title || !description || !address || !city || !state) return fail(res, "Missing required property fields", 400);
        if (!propertyType) return fail(res, "propertyType is required", 400);
        if (!bedrooms || !bathrooms || !pricePerYear) return fail(res, "Missing bedrooms, bathrooms, or pricePerYear", 400);

        const property = await agentService.createPropertyForLandlord(userId, {
            landlordId: String(landlordId),
            title: String(title),
            description: String(description),
            address: String(address),
            city: String(city),
            state: String(state),
            propertyType: String(propertyType),
            bedrooms: parseInt(bedrooms),
            bathrooms: parseInt(bathrooms),
            toilets: parseInt(toilets || bathrooms),
            parkingSpaces: parkingSpaces ? parseInt(parkingSpaces) : undefined,
            floorArea: floorArea ? parseFloat(floorArea) : undefined,
            pricePerYear: parseInt(pricePerYear),
            cautionFee: cautionFee ? parseInt(cautionFee) : undefined,
            legalFee: legalFee ? parseInt(legalFee) : undefined,
            agentFee: agentFee ? parseInt(agentFee) : undefined,
            paymentTerms: paymentTerms ? String(paymentTerms) : undefined,
            negotiable: negotiable === true || negotiable === "true",
            furnished: furnished === true || furnished === "true",
            serviced: serviced === true || serviced === "true",
            petsAllowed: petsAllowed === true || petsAllowed === "true",
            powerSupply: powerSupply ? String(powerSupply) : undefined,
            waterSupply: waterSupply ? String(waterSupply) : undefined,
            amenities: Array.isArray(amenities) ? amenities.map(String) : undefined,
            agentNote: agentNote ? String(agentNote) : undefined,
        });

        return res.status(201).json({
            success: true,
            message: "Property listing created as DRAFT. The landlord has been notified to review and publish it.",
            data: property,
        });
    } catch (e: any) {
        return fail(res, e.message, e.message.includes("not currently active") || e.message.includes("do not have") ? 403 : 500);
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

/** Check eligibility to deactivate / relinquish agent account */
export const checkAgentDeactivationEligibility = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const eligibility = await agentService.checkDeactivationEligibility(userId);
        return ok(res, eligibility);
    } catch (e: any) {
        return fail(res, e.message, 500);
    }
};

/** Deactivate agent account, archive records, and revert user to TENANT */
export const deactivateAgentAccount = async (req: Request, res: Response) => {
    try {
        const userId = await resolveDbUserId(req);
        if (!userId) return fail(res, "Unauthorized", 401);

        const confirmation = req.body?.confirmation;
        const result = await agentService.deactivateAgentAccount(userId, confirmation);
        return ok(res, result, result.message);
    } catch (e: any) {
        return fail(res, e.message, 400);
    }
};

