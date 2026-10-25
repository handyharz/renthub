import { Request, Response } from "express";
import { favoritesService } from "../services/favoritesService";

export class FavoritesController {
    /**
     * Toggle favorite
     * POST /api/favorites/:propertyId
     */
    async toggleFavorite(req: Request, res: Response) {
        try {
            const propertyId = req.params.propertyId as string;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification required",
                });
            }

            const result = await favoritesService.toggleFavorite(userId, propertyId);

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error("Error toggling favorite:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to toggle favorite",
                error: error.message,
            });
        }
    }

    /**
     * Get my favorites
     * GET /api/favorites/me
     */
    async getMyFavorites(req: Request, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: User identification required",
                });
            }

            const favorites = await favoritesService.getUserFavorites(userId);

            return res.status(200).json({
                success: true,
                data: favorites,
            });
        } catch (error: any) {
            console.error("Error fetching favorites:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch favorites",
                error: error.message,
            });
        }
    }
}

export const favoritesController = new FavoritesController();
