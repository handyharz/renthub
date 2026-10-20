"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Home, Search, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export function OnboardingBanner() {
    const { user, isLoaded } = useUser();
    const [isVisible, setIsVisible] = useState(false);
    const [dbUser, setDbUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isLoaded && user) {
            fetchUser();
        } else if (isLoaded && !user) {
            setLoading(false);
        }
    }, [isLoaded, user]);

    const fetchUser = async () => {
        try {
            const res = await api.get(`/users/me?clerkId=${user?.id}`);
            const userData = res.data.data;
            setDbUser(userData);

            const isDismissed = localStorage.getItem("onboarding_banner_dismissed");

            // Only show onboarding role selection banner to new/un-onboarded tenants
            // Landlords, agents, and admins have already established their role and should not see this banner
            const isEstablishedRole = userData.role && userData.role !== "TENANT";
            if (userData && !userData.onboardingCompleted && !isEstablishedRole && !isDismissed) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        } catch (error) {
            console.error("Failed to fetch user for banner:", error);
        } finally {
            setLoading(false);
        }
    };

    const dismissBanner = () => {
        setIsVisible(false);
        localStorage.setItem("onboarding_banner_dismissed", "true");
    };

    if (!isVisible || loading) return null;

    return (
        <div className="bg-[var(--color-brand-blue)] border-b border-white/10 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-green)]/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--color-brand-orange)]/10 rounded-full -ml-24 -mb-24 blur-3xl" />

            <div className="container-wide py-4 md:py-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shrink-0">
                            <Home className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                Ready to find your next home or list a property?
                            </h3>
                            <p className="text-white/70 text-sm">
                                Complete your profile setup to unlock all RentHub features.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/onboarding">
                            <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold px-6">
                                Choose My Role
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <button
                            onClick={dismissBanner}
                            className="p-2 text-white/50 hover:text-white transition-colors"
                            aria-label="Dismiss banner"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
