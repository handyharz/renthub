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

    if (dbUser && dbUser.role !== "LANDLORD") {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] py-16">
                <div className="container-wide max-w-lg mx-auto text-center space-y-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-3xl shadow-sm">
                    <div className="w-14 h-14 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl mx-auto flex items-center justify-center border border-blue-500/20">
                        <ShieldCheck className="h-7 w-7" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Landlord Payout Portal</h2>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                        AfriExchange payout settlement is designed exclusively for property owners and landlords receiving released rent escrow payments. Tenants pay rent via the secure property rental checkout.
                    </p>
                    <div className="pt-2">
                        <Link href="/dashboard">
                            <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold rounded-xl px-5">
                                Return to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
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
