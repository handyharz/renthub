import { Router } from "express";
import { tourController } from "../controllers/tourController";
import { requireAuth, requireDbUser } from "../middleware/auth";

const router: Router = Router();

router.use(requireAuth, requireDbUser);

router.post("/", tourController.createTourRequest);
router.get("/", tourController.getTourRequests);
router.patch("/:id/status", tourController.updateStatus);

export default router;
