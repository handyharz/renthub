import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
    publicId: string;
    url: string;
    secureUrl: string;
    width: number;
    height: number;
    format: string;
    size: number;
}

export class UploadService {
    /**
     * Upload image to Cloudinary
     * @param file - File buffer or stream
     * @param folder - Cloudinary folder (e.g., 'properties', 'users')
     * @param options - Additional upload options
     */
    async uploadImage(
        file: Buffer | Readable,
        folder: string = "renthub",
        options?: {
            transformation?: any;
            publicId?: string;
        }
    ): Promise<UploadResult> {
        return new Promise((resolve, reject) => {
            const uploadOptions = {
                folder: `renthub/${folder}`,
                resource_type: "image" as const,
                allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
                transformation: options?.transformation || [
                    { quality: "auto:good" },
                    { fetch_format: "auto" },
                ],
                ...(options?.publicId && { public_id: options.publicId }),
            };

            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }

                    if (!result) {
                        return reject(new Error("Upload failed - no result"));
                    }

                    resolve({
                        publicId: result.public_id,
                        url: result.url,
                        secureUrl: result.secure_url,
                        width: result.width,
                        height: result.height,
                        format: result.format,
                        size: result.bytes,
                    });
                }
            );

            // Handle buffer or stream
            if (Buffer.isBuffer(file)) {
                const bufferStream = new Readable();
                bufferStream.push(file);
                bufferStream.push(null);
                bufferStream.pipe(uploadStream);
            } else {
                file.pipe(uploadStream);
            }
        });
    }

    /**
     * Upload property image with optimizations
     */
    async uploadPropertyImage(
        file: Buffer | Readable,
        propertyId: string,
        options?: { isPrimary?: boolean }
    ): Promise<UploadResult> {
        const transformation = [
            { width: 1200, height: 800, crop: "limit" }, // Max dimensions
            { quality: "auto:good" },
            { fetch_format: "auto" }, // Auto WebP/AVIF
        ];

        return this.uploadImage(file, `properties/${propertyId}`, {
            transformation,
            publicId: options?.isPrimary ? `${propertyId}_primary` : undefined,
        });
    }

    /**
     * Upload user avatar with optimizations
     */
    async uploadUserAvatar(
        file: Buffer | Readable,
        userId: string
    ): Promise<UploadResult> {
        const transformation = [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto:good" },
            { fetch_format: "auto" },
        ];

        return this.uploadImage(file, `users`, {
            transformation,
            publicId: `avatar_${userId}`,
        });
    }
    /**
     * Upload government ID document
     */
    async uploadIdDocument(
        file: Buffer | Readable,
        userId: string
    ): Promise<UploadResult> {
        const transformation = [
            { width: 1600, height: 1200, crop: "limit" }, // High res but capped
            { quality: "auto:best" },
            { fetch_format: "auto" },
        ];

        return this.uploadImage(file, `identities`, {
            transformation,
            publicId: `id_${userId}`,
        });
    }

    /**
     * Delete image from Cloudinary
     */
    async deleteImage(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error("Error deleting image:", error);
            throw error;
        }
    }

    /**
     * Delete multiple images
     */
    async deleteImages(publicIds: string[]): Promise<void> {
        try {
            await cloudinary.api.delete_resources(publicIds);
        } catch (error) {
            console.error("Error deleting images:", error);
            throw error;
        }
    }

    /**
     * Get image details
     */
    async getImageDetails(publicId: string) {
        try {
            return await cloudinary.api.resource(publicId);
        } catch (error) {
            console.error("Error getting image details:", error);
            throw error;
        }
    }
}

export const uploadService = new UploadService();
