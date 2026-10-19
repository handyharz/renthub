"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * /auth/redirect
 *
 * Clerk bounces here after every sign-in.
 * We read the DB role (fetched by useAuth) and forward:
 *   ADMIN  → /admin
 *   others → /dashboard
 */
export default function AuthRedirectPage() {
    const { loading, isAdmin, authenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // Wait until the DB user is resolved

        if (!authenticated) {
            router.replace("/sign-in");
            return;
        }

        if (isAdmin) {
            router.replace("/admin");
        } else {
            router.replace("/dashboard");
        }
    }, [loading, authenticated, isAdmin, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--color-brand-green)] border-t-transparent" />
                <p className="text-sm font-medium text-[var(--text-muted)]">Signing you in…</p>
            </div>
        </div>
    );
}
