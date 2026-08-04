"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
    propertyId: string;
    initialFavorited?: boolean;
    className?: string;
    onToggle?: (newState: boolean) => void;
}

export function FavoriteButton({ propertyId, initialFavorited = false, className, onToggle }: FavoriteButtonProps) {
    const { user } = useUser();
    const [isFavorited, setIsFavorited] = useState(initialFavorited);
    const [loading, setLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();

        if (!user) {
            alert("Please sign in to save properties");
            return;
        }

        if (loading) return;

        setLoading(true);
        // Optimistic update
        const newState = !isFavorited;
        setIsFavorited(newState);

        try {
            await api.post(`/favorites/${propertyId}?clerkId=${user.id}`);
            if (onToggle) onToggle(newState);
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
            // Revert
            setIsFavorited(!newState);
            alert("Failed to save property");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={cn(
                "p-2 rounded-full backdrop-blur-sm transition-all duration-200 shadow-sm",
                isFavorited
                    ? "bg-red-50 text-red-500 hover:bg-red-100"
                    : "bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white",
                className
            )}
            disabled={loading}
        >
            <Heart
                className={cn(
                    "h-5 w-5 transition-all",
                    isFavorited ? "fill-red-500" : "fill-transparent"
                )}
            />
        </button>
    );
}
