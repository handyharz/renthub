"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Home, Search, ChevronRight, ShieldCheck, Briefcase } from "lucide-react";
import api from "@/lib/api";

export default function OnboardingPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [tookTooLong, setTookTooLong] = useState(false);

    // Safety timeout for Clerk loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isLoaded) setTookTooLong(true);
        }, 8000);
        return () => clearTimeout(timer);
    }, [isLoaded]);

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4 text-center px-4">
                    <div className="h-12 w-12 border-4 border-[var(--color-brand-blue)] border-t-transparent rounded-full animate-spin"></div>
                    <div>
                        <p className="text-gray-600 font-medium">Loading your profile...</p>
                        {tookTooLong && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <p className="text-sm text-gray-400 mb-2">This is taking longer than usual. Please check your internet.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.reload()}
                                    size="sm"
                                    className="font-bold"
                                >
                                    Try Reloading
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        router.push("/sign-up");
        return null;
    }

    const handleRoleSelection = async (role: "TENANT" | "LANDLORD" | "AGENT") => {
        if (!user) return;

        setLoading(role);
        try {
            await api.post("/users", {
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress,
                phone: user.phoneNumbers[0]?.phoneNumber || `no-phone-${user.id}`,
                firstName: user.firstName || "User",
                lastName: user.lastName || "",
                avatar: user.imageUrl,
                // Agents start as TENANT in DB until they are verified by admin
                role: role === "AGENT" ? "TENANT" : role,
                onboardingCompleted: true,
            });

            // For AGENT: pre-create the agent profile shell
            if (role === "AGENT") {
                try {
                    await api.get(`/agents/me?clerkId=${user.id}`);
                } catch {
                    // Auto-created on GET — ignore errors
                }
            }

            if (role === "LANDLORD") {
                router.push("/dashboard");
            } else if (role === "AGENT") {
                router.push("/dashboard?tab=agent");
            } else {
                router.push("/search");
            }
        } catch (error) {
            console.error("Failed to select role:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-5xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-[var(--color-brand-blue)] mb-4">
                        Welcome to RentHub!
                    </h1>
                    <p className="text-xl text-gray-600">
                        How do you plan to use the platform today?
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Tenant */}
                    <div
                        className="bg-white rounded-3xl p-8 border-2 border-transparent hover:border-[var(--color-brand-blue)] transition-all cursor-pointer group shadow-sm hover:shadow-xl"
                        onClick={() => handleRoleSelection("TENANT")}
                    >
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[var(--color-brand-blue)] group-hover:text-white transition-colors">
                            <Search className="h-8 w-8 text-[var(--color-brand-blue)] group-hover:text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">I'm a Tenant</h2>
                        <ul className="space-y-3 text-gray-600 mb-8">
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <span>Browse verified properties</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <span>Save ₦600k+ on agent fees</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <span>Secure escrow payments</span>
                            </li>
                        </ul>
                        <Button
                            className="w-full bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90 h-12 text-lg font-bold"
                            disabled={!!loading}
                        >
                            {loading === "TENANT" ? "Setting up..." : "Find a Home"}
                            <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>

                    {/* Landlord */}
                    <div
                        className="bg-white rounded-3xl p-8 border-2 border-transparent hover:border-[var(--color-brand-green)] transition-all cursor-pointer group shadow-sm hover:shadow-xl"
                        onClick={() => handleRoleSelection("LANDLORD")}
                    >
                        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[var(--color-brand-green)] group-hover:text-white transition-colors">
                            <Home className="h-8 w-8 text-[var(--color-brand-green)] group-hover:text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">I'm a Landlord</h2>
                        <ul className="space-y-3 text-gray-600 mb-8">
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <span>List your property for free</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <span>Get verified and build trust</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <span>Manage tenants directly</span>
                            </li>
                        </ul>
                        <Button
                            className="w-full bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 h-12 text-lg font-bold"
                            disabled={!!loading}
                        >
                            {loading === "LANDLORD" ? "Setting up..." : "List a Property"}
                            <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>

                    {/* Agent */}
                    <div
                        className="bg-white rounded-3xl p-8 border-2 border-transparent hover:border-purple-500 transition-all cursor-pointer group shadow-sm hover:shadow-xl"
                        onClick={() => handleRoleSelection("AGENT")}
                    >
                        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Briefcase className="h-8 w-8 text-purple-600 group-hover:text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">I'm an Agent</h2>
                        <p className="text-xs text-purple-600 font-semibold mb-3">Verified Partner Programme</p>
                        <ul className="space-y-3 text-gray-600 mb-8">
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-purple-500" />
                                <span>List on behalf of landlords</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-purple-500" />
                                <span>Earn up to 5% commission</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-purple-500" />
                                <span>All payments via RentHub escrow</span>
                            </li>
                        </ul>
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-lg font-bold"
                            disabled={!!loading}
                        >
                            {loading === "AGENT" ? "Setting up..." : "Join as Agent"}
                            <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="mt-12 text-center text-gray-500 text-sm">
                    You can always change your profile type later in settings.
                </div>
            </div>
        </div>
    );
}
