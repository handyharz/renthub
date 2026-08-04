import { Router } from "express";
import { propertyController } from "../controllers/propertyController";

import { requireAuth } from "../middleware/auth";

const router: Router = Router();

// Search properties (must be before /:id route)
router.get("/search", propertyController.searchProperties.bind(propertyController));
router.get("/locations", propertyController.getLocations.bind(propertyController));

// Get properties by landlord
router.get("/landlord/:landlordId", propertyController.getPropertiesByLandlord.bind(propertyController));

// CRUD routes
router.post("/", requireAuth, propertyController.createProperty.bind(propertyController));
router.get("/", propertyController.getProperties.bind(propertyController));
router.get("/:id", propertyController.getPropertyById.bind(propertyController));
router.patch("/:id", requireAuth, propertyController.updateProperty.bind(propertyController));
router.delete("/:id", requireAuth, propertyController.deleteProperty.bind(propertyController));

export default router;
