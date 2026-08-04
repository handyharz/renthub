import { Router } from "express";
import { tourController } from "../controllers/tourController";

import { requireAuth } from "../middleware/auth";

const router: Router = Router();

router.post("/", requireAuth, tourController.createTourRequest);
router.get("/", requireAuth, tourController.getTourRequests);
router.patch("/:id/status", requireAuth, tourController.updateStatus);

export default router;
