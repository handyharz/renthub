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
        const favorites = await prisma.favorite.findMany({
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

        // Option 1: Prioritize AVAILABLE properties first, sinking RENTED properties to bottom
        return favorites.sort((a, b) => {
            const isRentedA = a.property?.status === "RENTED" || a.property?.status === "UNAVAILABLE";
            const isRentedB = b.property?.status === "RENTED" || b.property?.status === "UNAVAILABLE";
            if (isRentedA && !isRentedB) return 1;
            if (!isRentedA && isRentedB) return -1;
            return 0;
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
