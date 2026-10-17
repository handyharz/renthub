"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AfriExchangeLinkingCard } from "@/components/payouts/AfriExchangeLinkingCard";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { ArrowLeft, Loader2, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";

export default function LandlordPayoutsPage() {
    const { user, isLoaded } = useUser();
    const [dbUser, setDbUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const res = await api.get(`/users/me?clerkId=${user.id}`);
            setDbUser(res.data.data);
        } catch (error) {
            console.error("Failed to load user for payouts page:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && user) {
            fetchUserProfile();
        }
    }, [isLoaded, user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-green)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 pb-20">
            <div className="container-wide max-w-4xl space-y-6">
                {/* Header with back button */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="gap-2 mb-2 text-xs font-semibold">
                                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                            </Button>
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                            AfriExchange Escrow Settlement
                        </h1>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                            Configure your verified 2FA payment route for receiving released tenant rent tokens.
                        </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                        <ShieldCheck className="h-4 w-4" />
                        RentHub Escrow Protected
                    </div>
                </div>

                {/* AfriExchange Linking Card */}
                <AfriExchangeLinkingCard dbUser={dbUser} onRefresh={fetchUserProfile} />
            </div>
        </div>
    );
}
