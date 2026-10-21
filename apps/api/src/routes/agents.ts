import { Router, IRouter } from "express";
import {
    getMyAgentProfile,
    updateMyAgentProfile,
    submitAgentForReview,
    getAgentStats,
    requestDelegation,
    getMyDelegations,
    getMyAgentPayouts,
    getLandlordDelegations,
    authorizeDelegation,
    revokeDelegation,
    listActiveAgents,
    getAgentPublicProfile,
    adminListPendingAgents,
    adminApproveAgent,
    adminRejectAgent,
    adminSuspendAgent,
    fileStrikeReport,
    adminListStrikes,
    adminReviewStrike,
    getMyStrikes,
} from "../controllers/agentController";

const router: IRouter = Router();

// ─── PUBLIC ──────────────────────────────────────────────────────────────────
// GET /api/agents?city=Lagos
router.get("/", listActiveAgents);
// GET /api/agents/profile/:userId
router.get("/profile/:userId", getAgentPublicProfile);

// ─── STRIKES & ZERO SIDE-PAYMENTS (Tenant Reporting) ─────────────────────────
// POST /api/agents/strikes/report - Report agent for asking for cash/side fees
router.post("/strikes/report", fileStrikeReport);

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
// GET  /api/agents/me/payouts - agent's commission payouts & settlement
router.get("/me/payouts", getMyAgentPayouts);
// GET  /api/agents/me/strikes - agent's compliance and strike status
router.get("/me/strikes", getMyStrikes);
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
// GET  /api/agents/admin/strikes - list all side-payment violation reports
router.get("/admin/strikes", adminListStrikes);
// POST /api/agents/admin/strikes/:id/review - uphold or dismiss strike
router.post("/admin/strikes/:id/review", adminReviewStrike);

export default router;

