import { Router, IRouter } from "express";
import {
    getMyAgentProfile,
    updateMyAgentProfile,
    submitAgentForReview,
    getAgentStats,
    requestDelegation,
    getMyDelegations,
    getLandlordDelegations,
    authorizeDelegation,
    revokeDelegation,
    listActiveAgents,
    getAgentPublicProfile,
    adminListPendingAgents,
    adminApproveAgent,
    adminRejectAgent,
    adminSuspendAgent,
} from "../controllers/agentController";

const router: IRouter = Router();

// ─── PUBLIC ──────────────────────────────────────────────────────────────────
// GET /api/agents?city=Lagos
router.get("/", listActiveAgents);
// GET /api/agents/profile/:userId
router.get("/profile/:userId", getAgentPublicProfile);

// ─── AGENT (authenticated) ────────────────────────────────────────────────────
// GET  /api/agents/me  - get or create my agent profile
router.get("/me", getMyAgentProfile);
// PATCH /api/agents/me - update profile fields
router.patch("/me", updateMyAgentProfile);
// POST /api/agents/me/submit - submit profile for admin review
router.post("/me/submit", submitAgentForReview);
// GET  /api/agents/me/stats
router.get("/me/stats", getAgentStats);
// GET  /api/agents/me/delegations - agent's listing assignments
router.get("/me/delegations", getMyDelegations);
// POST /api/agents/me/delegations - request to manage a property
router.post("/me/delegations", requestDelegation);

// ─── LANDLORD ─────────────────────────────────────────────────────────────────
// GET  /api/agents/landlord/delegations - see all requests for landlord's properties
router.get("/landlord/delegations", getLandlordDelegations);
// PATCH /api/agents/delegations/:id/authorize
router.patch("/delegations/:id/authorize", authorizeDelegation);
// PATCH /api/agents/delegations/:id/revoke
router.patch("/delegations/:id/revoke", revokeDelegation);

// ─── ADMIN ────────────────────────────────────────────────────────────────────
// GET  /api/agents/admin/pending
router.get("/admin/pending", adminListPendingAgents);
// POST /api/agents/admin/:id/approve
router.post("/admin/:id/approve", adminApproveAgent);
// POST /api/agents/admin/:id/reject
router.post("/admin/:id/reject", adminRejectAgent);
// POST /api/agents/admin/:id/suspend
router.post("/admin/:id/suspend", adminSuspendAgent);

export default router;
