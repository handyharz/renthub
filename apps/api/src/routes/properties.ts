import { Router } from "express";
import { propertyController } from "../controllers/propertyController";

import { optionalAuth, requireAuth, requireDbUser } from "../middleware/auth";

const router: Router = Router();

// Search properties (must be before /:id route)
router.get("/search", propertyController.searchProperties.bind(propertyController));
router.get("/locations", propertyController.getLocations.bind(propertyController));

// Get properties by landlord
router.get("/landlord/:landlordId", propertyController.getPropertiesByLandlord.bind(propertyController));

// CRUD routes
router.post("/", requireAuth, requireDbUser, propertyController.createProperty.bind(propertyController));
router.get("/", propertyController.getProperties.bind(propertyController));
router.get("/:id/trustscore", propertyController.getPropertyTrustScore.bind(propertyController));
router.get("/:id", optionalAuth, propertyController.getPropertyById.bind(propertyController));
router.patch("/:id", requireAuth, requireDbUser, propertyController.updateProperty.bind(propertyController));
router.delete("/:id", requireAuth, requireDbUser, propertyController.deleteProperty.bind(propertyController));

export default router;
