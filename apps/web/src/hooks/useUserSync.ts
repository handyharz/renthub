"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import api from "@/lib/api";

export function useUserSync() {
    const { user, isLoaded } = useUser();
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    const syncUser = useCallback(async () => {
        if (!isLoaded || !user) return null;

        setIsSyncing(true);
        setSyncError(null);

        try {
            // First attempt to get the user
            const res = await api.get(`/users/me?clerkId=${user.id}`).catch(async (err) => {
                // If not found (404), create the user
                if (err.response?.status === 404) {
                    const createRes = await api.post("/users", {
                        clerkId: user.id,
                        email: user.emailAddresses[0]?.emailAddress,
                        phone: user.phoneNumbers[0]?.phoneNumber,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        avatar: user.imageUrl,
                    });
                    return createRes;
                }
                throw err;
            });

            return res.data.data;
        } catch (error: any) {
            console.error("Failed to sync user with DB:", error);
            setSyncError(error.message || "Failed to sync user");
            return null;
        } finally {
            setIsSyncing(false);
        }
    }, [isLoaded, user]);

    return {
        syncUser,
        isSyncFinished: isLoaded && !isSyncing,
        isSyncing,
        syncError,
        clerkUser: user,
        isClerkLoaded: isLoaded
    };
}
