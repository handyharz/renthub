"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { MessageSquare, Lock } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { calculateTrustScore, cn } from "@/lib/utils";
import api from "@/lib/api";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { useRouter } from "next/navigation";

interface LockedMessageButtonProps {
    landlordId: string;
    propertyId: string;
    propertyTitle?: string;
    className?: string;
}

export function LockedMessageButton({ landlordId, propertyId, propertyTitle, className }: LockedMessageButtonProps) {
    const { user } = useUser();
    const router = useRouter();
    const [trustScore, setTrustScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [initiating, setInitiating] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUserScore();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchUserScore = async () => {
        try {
            const res = await api.get(`/users/me?clerkId=${user?.id}`);
            const score = calculateTrustScore(res.data.data);
            setTrustScore(score);
        } catch (error) {
            console.error("Failed to fetch user score:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClick = async () => {
        if (!user) {
            router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`);
            return;
        }

        if (trustScore < 60) {
            setShowLockModal(true);
        } else {
            setInitiating(true);
            try {
                // Initiate/Get conversation
                const res = await api.post(`/messages/initiate?clerkId=${user.id}`, {
                    receiverId: landlordId,
                    propertyId: propertyId,
                    content: `Hello, I'm interested in your property "${propertyTitle || propertyId}".`
                });

                const convId = res.data.data.id;

                // Redirect to dashboard messages
                router.push(`/dashboard/messages?convId=${convId}`);
            } catch (error) {
                console.error("Failed to start conversation:", error);
                alert("Failed to start conversation. Please try again.");
            } finally {
                setInitiating(false);
            }
        }
    };

    if (loading) {
        return (
            <Button
                disabled
                className={cn(
                    "w-full justify-center gap-2 h-11 text-xs sm:text-sm font-bold border border-[var(--border-color)] bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-2xl cursor-not-allowed",
                    className
                )}
            >
                <MessageSquare className="h-4 w-4 animate-pulse text-[var(--color-brand-green)]" />
                <span>Checking Access...</span>
            </Button>
        );
    }

    return (
        <>
            <Button
                onClick={handleClick}
                disabled={initiating}
                className={cn(
                    "w-full justify-center gap-2 h-11 text-xs sm:text-sm font-black border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] hover:border-[var(--color-brand-green)] rounded-2xl shadow-xs transition-all active:scale-[0.99]",
                    className
                )}
            >
                {initiating ? (
                    <>
                        <MessageSquare className="h-4 w-4 animate-spin text-[var(--color-brand-green)]" />
                        <span className="font-black text-[var(--text-primary)]">Connecting...</span>
                    </>
                ) : (
                    <>
                        <MessageSquare className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                        <span className="font-black text-[var(--text-primary)]">Message Landlord</span>
                        {user && trustScore < 60 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-500/20 flex items-center gap-0.5">
                                <Lock className="h-2.5 w-2.5" /> 60% ID
                            </span>
                        )}
                    </>
                )}
            </Button>

            <Dialog open={showLockModal} onOpenChange={setShowLockModal}>
                <DialogContent className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black">
                            <Lock className="h-5 w-5" />
                            Security Trust Check
                        </DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            To protect landlords and renters from fraud, direct messaging requires a verified profile.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 text-center space-y-4">
                        <div className="bg-[var(--bg-muted)] p-5 rounded-2xl border border-[var(--border-color)]">
                            <p className="font-black text-base text-[var(--text-primary)] mb-1">
                                Your Current Trust Score: {trustScore}%
                            </p>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                                You need at least <span className="font-black text-[var(--color-brand-green)]">60%</span> to start conversations.
                            </p>
                            <div className="h-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full mt-3 overflow-hidden">
                                <div
                                    className="h-full bg-[var(--color-brand-orange)] transition-all"
                                    style={{ width: `${Math.max(trustScore, 5)}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                            Complete your profile verification with your Government ID or BVN/NIN to unlock instant messaging.
                        </p>

                        <Link href="/dashboard/profile" onClick={() => setShowLockModal(false)}>
                            <Button className="w-full bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-black h-12 rounded-2xl shadow-md">
                                Complete Profile Verification
                            </Button>
                        </Link>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
