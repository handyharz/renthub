import { Router } from "express";
import { uploadController, uploadMiddleware } from "../controllers/uploadController";

const router: Router = Router();

// Upload property images (multiple files)
router.post(
    "/property/:propertyId",
    uploadMiddleware.array("images", 10), // Max 10 images
    uploadController.uploadPropertyImages.bind(uploadController)
);

// Upload user avatar (single file)
router.post(
    "/avatar",
    uploadMiddleware.single("avatar"),
    uploadController.uploadAvatar.bind(uploadController)
);

// Upload identity document (single file)
router.post(
    "/id-document",
    uploadMiddleware.single("idDocument"),
    uploadController.uploadIdDocument.bind(uploadController)
);

// Delete image
router.delete(
    "/image/:imageId",
    uploadController.deleteImage.bind(uploadController)
);

// Set primary image
router.patch(
    "/image/:imageId/primary",
    uploadController.setPrimaryImage.bind(uploadController)
);

export default router;
