import { Router } from "express";
import { uploadController, uploadMiddleware } from "../controllers/uploadController";
import { requireAuth, requireDbUser } from "../middleware/auth";

const router: Router = Router();

router.use(requireAuth, requireDbUser);

router.post(
    "/property/:propertyId",
    uploadMiddleware.array("images", 10),
    uploadController.uploadPropertyImages.bind(uploadController)
);

router.post(
    "/avatar",
    uploadMiddleware.single("avatar"),
    uploadController.uploadAvatar.bind(uploadController)
);

router.post(
    "/id-document",
    uploadMiddleware.single("idDocument"),
    uploadController.uploadIdDocument.bind(uploadController)
);

router.delete(
    "/image/:imageId",
    uploadController.deleteImage.bind(uploadController)
);

router.patch(
    "/image/:imageId/primary",
    uploadController.setPrimaryImage.bind(uploadController)
);

export default router;
