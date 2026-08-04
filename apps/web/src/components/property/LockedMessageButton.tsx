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
            alert("Please sign in to contact the landlord.");
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
        return <Button disabled className={className} size="sm">Loading...</Button>;
    }

    return (
        <>
            <Button
                onClick={handleClick}
                className={cn(
                    "gap-2 transition-all",
                    trustScore < 60 ? "opacity-100 border-gray-300 text-gray-500 hover:text-gray-700" : "",
                    className
                )}
                variant={trustScore < 60 ? "outline" : "default"}
            >
                {trustScore < 60 ? <Lock className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                {trustScore < 60 ? "Contact Locked" : "Message Landlord"}
            </Button>

            <Dialog open={showLockModal} onOpenChange={setShowLockModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Lock className="h-5 w-5" />
                            Security Check
                        </DialogTitle>
                        <DialogDescription>
                            To protect our community, messaging is locked for new accounts.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 text-center space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-bold text-gray-900 mb-1">Your Trust Score: {trustScore}%</p>
                            <p className="text-sm text-gray-600">You need <span className="font-bold text-green-600">60%</span> to contact landlords.</p>
                            <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-red-500" style={{ width: `${trustScore}%` }} />
                            </div>
                        </div>

                        <p className="text-sm">Please complete your profile to verify you are a real tenant.</p>

                        <Link href="/dashboard/profile" onClick={() => setShowLockModal(false)}>
                            <Button className="w-full bg-[var(--color-brand-blue)] font-bold">
                                Complete Profile Now
                            </Button>
                        </Link>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
