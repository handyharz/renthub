"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AnchorBankLinkingCard } from "@/components/payouts/AnchorBankLinkingCard";
import { AfriExchangeLinkingCard } from "@/components/payouts/AfriExchangeLinkingCard";
import { LandlordPayoutHistory } from "@/components/payouts/LandlordPayoutHistory";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { ArrowLeft, Loader2, ShieldCheck, Wallet, Landmark, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LandlordPayoutsPage() {
    const { user, isLoaded } = useUser();
    const [dbUser, setDbUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeRailTab, setActiveRailTab] = useState<"BANK" | "AFRIEXCHANGE">("BANK");

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
                            Escrow Payouts & Settlements
                        </h1>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                            Configure your verified bank or mobile wallet route for receiving released tenant rent payments.
                        </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs font-bold">
                        <ShieldCheck className="h-4 w-4" />
                        RentHub Escrow Protected
                    </div>
                </div>

                {/* Settlement Rail Tab Selector */}
                <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full sm:w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveRailTab("BANK")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial ${
                            activeRailTab === "BANK"
                                ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                        }`}
                    >
                        <Landmark className="h-4 w-4 shrink-0" />
                        <span>Commercial Bank (Anchor NIP)</span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                            activeRailTab === "BANK"
                                ? "bg-white/20 text-white"
                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        }`}>
                            Recommended
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveRailTab("AFRIEXCHANGE")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial ${
                            activeRailTab === "AFRIEXCHANGE"
                                ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                        }`}
                    >
                        <Wallet className="h-4 w-4 shrink-0" />
                        <span>AfriExchange Wallet (Crypto)</span>
                    </button>
                </div>

                {/* Active Linking Card */}
                {activeRailTab === "BANK" ? (
                    <AnchorBankLinkingCard dbUser={dbUser} onRefresh={fetchUserProfile} />
                ) : (
                    <AfriExchangeLinkingCard dbUser={dbUser} onRefresh={fetchUserProfile} />
                )}

                {/* Landlord Escrow Settlements & Payout Records */}
                <LandlordPayoutHistory />
            </div>
        </div>
    );
}
