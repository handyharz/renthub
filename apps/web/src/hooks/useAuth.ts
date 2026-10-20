"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import api from "@/lib/api";

export interface DBUser {
    id: string;
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "TENANT" | "LANDLORD" | "AGENT" | "ADMIN";
    avatar?: string;
    verified: boolean;
}

export function useAuth() {
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const [dbUser, setDbUser] = useState<DBUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchDbUser = async () => {
            if (!isClerkLoaded || !clerkUser) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get(`/users/me?clerkId=${clerkUser.id}`);
                setDbUser(res.data.data);
            } catch (err: any) {
                console.error("Failed to fetch database user:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDbUser();
    }, [clerkUser, isClerkLoaded]);

    return {
        user: dbUser,
        clerkUser,
        loading: loading || !isClerkLoaded,
        authenticated: !!clerkUser,
        isLandlord: dbUser?.role === "LANDLORD",
        isTenant: dbUser?.role === "TENANT",
        isAgent: dbUser?.role === "AGENT",
        isAdmin: dbUser?.role === "ADMIN",
        error,
    };
}
