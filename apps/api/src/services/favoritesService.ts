import { prisma } from "../config/database";

export class FavoritesService {
    /**
     * Toggle favorite status for a property
     */
    async toggleFavorite(userId: string, propertyId: string) {
        // Check if favorite exists
        const existing = await prisma.favorite.findUnique({
            where: {
                userId_propertyId: {
                    userId,
                    propertyId,
                },
            },
        });

        if (existing) {
            // Remove
            await prisma.favorite.delete({
                where: { id: existing.id },
            });
            return { favorited: false };
        } else {
            // Add
            await prisma.favorite.create({
                data: {
                    userId,
                    propertyId,
                },
            });
            return { favorited: true };
        }
    }

    /**
     * Get user's favorites
     */
    async getUserFavorites(userId: string) {
        return await prisma.favorite.findMany({
            where: { userId },
            include: {
                property: {
                    include: {
                        images: {
                            where: { isPrimary: true },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    /**
     * Check if property is favorited by user
     */
    async isFavorited(userId: string, propertyId: string) {
        const count = await prisma.favorite.count({
            where: {
                userId,
                propertyId,
            },
        });
        return count > 0;
    }
}

export const favoritesService = new FavoritesService();
