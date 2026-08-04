import { Router } from "express";
import { favoritesController } from "../controllers/favoritesController";

const router: Router = Router();

// Toggle favorite
router.post("/:propertyId", favoritesController.toggleFavorite);

// Get my favorites
router.get("/me", favoritesController.getMyFavorites);

export default router;
