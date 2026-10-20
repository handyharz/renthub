"use client";

import { useState, useEffect } from "react";
import {
    Briefcase, MapPin, Star, CheckCircle2, Clock, XCircle,
    ShieldCheck, Phone, Mail, Building2, Users
} from "lucide-react";
import Image from "next/image";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface AgentProfile {
    id: string;
    status: string;
    businessName?: string;
    businessAddress?: string;
    licenseNumber?: string;
    yearsOfExperience: number;
    operatingCities: string[];
    bio?: string;
    defaultCommissionPct: number;
    totalListings: number;
    totalClosed: number;
    createdAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        email?: string;
        phone?: string;
        verified: boolean;
    };
}

export default function AdminAgentsPage() {
    const { user } = useUser();
    const [agents, setAgents] = useState<AgentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
    const [filter, setFilter] = useState("pending");

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/agents/admin/pending?clerkId=${user?.id}`);
            setAgents(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchAgents();
    }, [user]);

    const handleApprove = async (agentProfileId: string) => {
        setActionLoading(agentProfileId + "_approve");
        try {
            await api.post(`/agents/admin/${agentProfileId}/approve?clerkId=${user?.id}`);
            toast.success("Agent approved! Their account is now active.");
            fetchAgents();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (agentProfileId: string) => {
        const reason = rejectionReasons[agentProfileId];
        if (!reason?.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }
        setActionLoading(agentProfileId + "_reject");
        try {
            await api.post(`/agents/admin/${agentProfileId}/reject?clerkId=${user?.id}`, { reason });
            toast.success("Agent application rejected");
            fetchAgents();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to reject");
        } finally {
            setActionLoading(null);
        }
    };

    const handleSuspend = async (agentProfileId: string) => {
        if (!confirm("Suspend this agent? They will lose active status.")) return;
        setActionLoading(agentProfileId + "_suspend");
        try {
            await api.post(`/agents/admin/${agentProfileId}/suspend?clerkId=${user?.id}`);
            toast.success("Agent suspended");
            fetchAgents();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to suspend");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <>
            <AdminHeader
                title="Agent Partners"
                description="Review agent applications, approve verified partners, and manage their status"
            />

            <div className="p-6 space-y-6">
                {/* Info */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-700">
                    <strong>💡 Agent Partner Policy:</strong> Agents earn up to 5% commission, paid by the landlord.
                    Tenants pay zero agent fee. All money flows through RentHub escrow — no side payments allowed.
                    Each listing requires explicit landlord authorization.
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : agents.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No pending agent applications</p>
                        <p className="text-gray-400 text-sm mt-1">New applications will appear here for review</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 font-medium">{agents.length} applications pending review</p>
                        {agents.map(agent => {
                            const isApproving = actionLoading === agent.id + "_approve";
                            const isRejecting = actionLoading === agent.id + "_reject";
                            const isSuspending = actionLoading === agent.id + "_suspend";

                            return (
                                <div key={agent.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                    <div className="flex flex-col md:flex-row gap-5">
                                        {/* Agent identity */}
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="h-14 w-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                {agent.user.avatar ? (
                                                    <Image src={agent.user.avatar} alt="" width={56} height={56} className="object-cover rounded-2xl" />
                                                ) : (
                                                    <span className="text-purple-600 font-bold text-lg">
                                                        {agent.user.firstName[0]}{agent.user.lastName[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-gray-900 text-lg">
                                                        {agent.user.firstName} {agent.user.lastName}
                                                    </h3>
                                                    {agent.user.verified && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                            <ShieldCheck className="h-3 w-3" /> ID Verified
                                                        </span>
                                                    )}
                                                </div>
                                                {agent.businessName && (
                                                    <p className="text-sm font-semibold text-purple-600 mt-0.5 flex items-center gap-1">
                                                        <Building2 className="h-3.5 w-3.5" />
                                                        {agent.businessName}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                                    {agent.user.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> {agent.user.email}
                                                        </span>
                                                    )}
                                                    {agent.user.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" /> {agent.user.phone}
                                                        </span>
                                                    )}
                                                    {agent.operatingCities?.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" /> {agent.operatingCities.join(", ")}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-3 mt-2 text-xs">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                        {agent.yearsOfExperience} yrs experience
                                                    </span>
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                        {agent.defaultCommissionPct}% default commission
                                                    </span>
                                                    {agent.licenseNumber && (
                                                        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-mono">
                                                            License: {agent.licenseNumber}
                                                        </span>
                                                    )}
                                                </div>
                                                {agent.bio && (
                                                    <p className="text-xs text-gray-500 mt-2 italic">"{agent.bio}"</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="md:w-64 shrink-0 space-y-3">
                                            <Button
                                                onClick={() => handleApprove(agent.id)}
                                                disabled={isApproving || isRejecting || isSuspending}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-sm font-semibold"
                                            >
                                                {isApproving ? "Approving..." : "✓ Approve Agent"}
                                            </Button>

                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    placeholder="Rejection reason (required)..."
                                                    value={rejectionReasons[agent.id] || ""}
                                                    onChange={e => setRejectionReasons(r => ({ ...r, [agent.id]: e.target.value }))}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                                                />
                                                <Button
                                                    onClick={() => handleReject(agent.id)}
                                                    disabled={isApproving || isRejecting || isSuspending}
                                                    variant="outline"
                                                    className="w-full border-red-300 text-red-600 hover:bg-red-50 h-9 text-xs font-semibold"
                                                >
                                                    {isRejecting ? "Rejecting..." : "✗ Reject Application"}
                                                </Button>
                                            </div>

                                            <p className="text-[10px] text-center text-gray-400">
                                                Applied {new Date(agent.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
