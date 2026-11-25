import { Router } from "express";
import { ServiceTransactionController } from "../controllers/serviceTransaction.controller";
import { requireAuth, requireDbUser } from "../middleware/auth";

const router: Router = Router();
const controller = new ServiceTransactionController();

router.use(requireAuth, requireDbUser);

router.post("/pay", controller.initiate.bind(controller));
router.post("/anchor/pay", controller.initiateAnchor.bind(controller));
router.post("/afriexchange/pay", controller.initiateAfriExchange.bind(controller));
router.get("/verify", controller.verify.bind(controller));
router.post("/verify", controller.verify.bind(controller));
router.get("/verify/:reference", controller.verify.bind(controller));
router.get("/anchor/verify/:reference", controller.verify.bind(controller));
router.post("/anchor/verify/:reference", controller.verify.bind(controller));

export default router;
