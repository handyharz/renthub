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
    adminGetAgentKPIs,
    adminListAllAgents,
} from "../controllers/agentController";
import { requireAuth, requireDbUser, requireRole } from "../middleware/auth";

const router: IRouter = Router();

router.get("/", listActiveAgents);
router.get("/profile/:userId", getAgentPublicProfile);

router.post("/strikes/report", requireAuth, requireDbUser, fileStrikeReport);

router.get("/me", requireAuth, requireDbUser, getMyAgentProfile);
router.patch("/me", requireAuth, requireDbUser, updateMyAgentProfile);
router.post("/me/submit", requireAuth, requireDbUser, submitAgentForReview);
router.get("/me/stats", requireAuth, requireDbUser, getAgentStats);
router.get("/me/delegations", requireAuth, requireDbUser, getMyDelegations);
router.get("/me/payouts", requireAuth, requireDbUser, getMyAgentPayouts);
router.get("/me/strikes", requireAuth, requireDbUser, getMyStrikes);
router.post("/me/delegations", requireAuth, requireDbUser, requestDelegation);

router.get("/landlord/delegations", requireAuth, requireDbUser, getLandlordDelegations);
router.patch("/delegations/:id/authorize", requireAuth, requireDbUser, authorizeDelegation);
router.patch("/delegations/:id/revoke", requireAuth, requireDbUser, revokeDelegation);

const adminRouter: IRouter = Router();
adminRouter.use(requireAuth, requireRole("ADMIN"));
adminRouter.get("/kpis", adminGetAgentKPIs);
adminRouter.get("/all", adminListAllAgents);
adminRouter.get("/pending", adminListPendingAgents);
adminRouter.post("/:id/approve", adminApproveAgent);
adminRouter.post("/:id/reject", adminRejectAgent);
adminRouter.post("/:id/suspend", adminSuspendAgent);
adminRouter.get("/strikes", adminListStrikes);
adminRouter.post("/strikes/:id/review", adminReviewStrike);
router.use("/admin", adminRouter);

export default router;
