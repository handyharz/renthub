"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { loading, authenticated, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !authenticated) {
            router.replace("/sign-in?redirect_url=/admin");
        } else if (!loading && authenticated && !isAdmin) {
            router.replace("/dashboard");
        }
    }, [loading, authenticated, isAdmin, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-green)] border-t-transparent" />
                    <p className="text-sm text-[var(--text-muted)]">Loading admin portal…</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center p-8">
                    <ShieldAlert className="h-12 w-12 text-[var(--color-brand-orange)] mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-[var(--text-primary)]">Access Denied</h1>
                    <p className="text-[var(--text-muted)] mt-2">Admin privileges required.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
