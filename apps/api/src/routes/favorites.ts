import { Router } from "express";
import { favoritesController } from "../controllers/favoritesController";
import { requireAuth, requireDbUser } from "../middleware/auth";

const router: Router = Router();

router.use(requireAuth, requireDbUser);

router.post("/:propertyId", favoritesController.toggleFavorite);
router.get("/me", favoritesController.getMyFavorites);

export default router;
