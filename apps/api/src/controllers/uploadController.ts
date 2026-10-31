import { Request, Response } from "express";
import { uploadService } from "../services/uploadService";
import { prisma } from "../config/database";
import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();

// For property images and avatars — images only
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed"));
        }
        cb(null, true);
    },
});

// For KYC / ID documents — accepts images AND PDFs
const uploadId = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
        if (!allowed) {
            return cb(new Error("Only image or PDF files are allowed for ID documents"));
        }
        cb(null, true);
    },
});

export const uploadMiddleware = upload;
export const uploadIdMiddleware = uploadId;

export class UploadController {
    /**
     * Upload property images
     * POST /api/upload/property/:propertyId
     */
    async uploadPropertyImages(req: Request, res: Response) {
        try {
            const propertyId = req.params.propertyId as string;
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No files uploaded",
                });
            }

            // Verify property exists
            const property = await prisma.property.findUnique({
                where: { id: propertyId },
            });

            if (!property) {
                return res.status(404).json({
                    success: false,
                    message: "Property not found",
                });
            }

            if (!req.user || (property.landlordId !== req.user.id && req.user.role !== "ADMIN")) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }

            // Get current image count
            const currentImageCount = await prisma.image.count({
                where: { propertyId },
            });

            // Upload images to Cloudinary
            const uploadPromises = files.map(async (file, index) => {
                const isPrimary = currentImageCount === 0 && index === 0;

                const result = await uploadService.uploadPropertyImage(
                    file.buffer,
                    propertyId,
                    { isPrimary }
                );

                // Save to database
                return prisma.image.create({
                    data: {
                        url: result.secureUrl,
                        publicId: result.publicId,
                        width: result.width,
                        height: result.height,
                        format: result.format,
                        size: result.size,
                        isPrimary,
                        order: currentImageCount + index,
                        propertyId,
                    },
                });
            });

            const images = await Promise.all(uploadPromises);

            return res.status(201).json({
                success: true,
                message: `${images.length} image(s) uploaded successfully`,
                data: images,
            });
        } catch (error: any) {
            console.error("Error uploading property images:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to upload images",
                error: error.message,
            });
        }
    }

    /**
     * Upload user avatar
     * POST /api/upload/avatar
     */
    async uploadAvatar(req: Request, res: Response) {
        try {
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Delete old avatar if exists
            if (user.avatar) {
                const oldPublicId = user.avatar.split("/").pop()?.split(".")[0];
                if (oldPublicId) {
                    await uploadService.deleteImage(`renthub/users/${oldPublicId}`);
                }
            }

            // Upload new avatar
            const result = await uploadService.uploadUserAvatar(file.buffer, userId);

            // Update user avatar in database
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { avatar: result.secureUrl },
            });

            return res.status(200).json({
                success: true,
                message: "Avatar uploaded successfully",
                data: {
                    avatar: result.secureUrl,
                    user: updatedUser,
                },
            });
        } catch (error: any) {
            console.error("Error uploading avatar:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to upload avatar",
                error: error.message,
            });
        }
    }

    /**
     * Delete property image
     * DELETE /api/upload/image/:imageId
     */
    async deleteImage(req: Request, res: Response) {
        try {
            const imageId = req.params.imageId as string;

            // Get image from database
            const image = await prisma.image.findUnique({
                where: { id: imageId },
                include: { property: true },
            });

            if (!image) {
                return res.status(404).json({
                    success: false,
                    message: "Image not found",
                });
            }

            if (!req.user || (image.property.landlordId !== req.user.id && req.user.role !== "ADMIN")) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }

            // Delete from Cloudinary
            await uploadService.deleteImage(image.publicId);

            // Delete from database
            await prisma.image.delete({
                where: { id: imageId },
            });

            // If this was the primary image, set another as primary
            if (image.isPrimary) {
                const nextImage = await prisma.image.findFirst({
                    where: { propertyId: image.propertyId },
                    orderBy: { order: "asc" },
                });

                if (nextImage) {
                    await prisma.image.update({
                        where: { id: nextImage.id },
                        data: { isPrimary: true },
                    });
                }
            }

            return res.status(200).json({
                success: true,
                message: "Image deleted successfully",
            });
        } catch (error: any) {
            console.error("Error deleting image:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to delete image",
                error: error.message,
            });
        }
    }

    /**
     * Set primary image
     * PATCH /api/upload/image/:imageId/primary
     */
    async setPrimaryImage(req: Request, res: Response) {
        try {
            const imageId = req.params.imageId as string;

            const image = await prisma.image.findUnique({
                where: { id: imageId },
                include: { property: true },
            });

            if (!image) {
                return res.status(404).json({
                    success: false,
                    message: "Image not found",
                });
            }

            if (!req.user || (image.property.landlordId !== req.user.id && req.user.role !== "ADMIN")) {
                return res.status(403).json({ success: false, message: "Forbidden" });
            }

            // Unset current primary
            await prisma.image.updateMany({
                where: {
                    propertyId: image.propertyId,
                    isPrimary: true,
                },
                data: { isPrimary: false },
            });

            // Set new primary
            const updatedImage = await prisma.image.update({
                where: { id: imageId },
                data: { isPrimary: true },
            });

            return res.status(200).json({
                success: true,
                message: "Primary image updated",
                data: updatedImage,
            });
        } catch (error: any) {
            console.error("Error setting primary image:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to set primary image",
                error: error.message,
            });
        }
    }

    /**
     * Upload government ID document
     * POST /api/upload/id-document
     */
    async uploadIdDocument(req: Request, res: Response) {
        try {
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Delete old ID document if exists
            if (user.idDocumentUrl) {
                const oldPublicId = user.idDocumentUrl.split("/").pop()?.split(".")[0];
                if (oldPublicId) {
                    await uploadService.deleteImage(`renthub/identities/${oldPublicId}`);
                }
            }

            // Upload new ID document
            const result = await uploadService.uploadIdDocument(file.buffer, userId);

            // Update user in database
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    idDocumentUrl: result.secureUrl,
                },
            });

            return res.status(200).json({
                success: true,
                message: "ID document uploaded successfully",
                data: {
                    idDocumentUrl: result.secureUrl,
                    user: updatedUser,
                },
            });
        } catch (error: any) {
            console.error("Error uploading ID document:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to upload ID document",
                error: error.message,
            });
        }
    }
}

export const uploadController = new UploadController();
