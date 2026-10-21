"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Briefcase, MapPin, Star, CheckCircle2, Clock, XCircle,
    Building2, Phone, ChevronRight, AlertCircle, Plus,
    TrendingUp, Users, FileCheck, Wallet, Edit3, Send,
    ShieldCheck, ArrowRight, RefreshCw, X, Home
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AgentProfile {
    id: string;
    status: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED";
    businessName?: string;
    businessAddress?: string;
    licenseNumber?: string;
    yearsOfExperience: number;
    operatingCities: string[];
    bio?: string;
    defaultCommissionPct: number;
    avgRating?: number;
    reviewCount: number;
    totalListings: number;
    totalClosed: number;
    rejectionReason?: string;
}

interface AgentDelegation {
    id: string;
    status: "PENDING_LANDLORD" | "AUTHORIZED" | "REVOKED" | "COMPLETED";
    commissionPct: number;
    commissionAmount?: number;
    agentNote?: string;
    landlordNote?: string;
    requestedAt: string;
    authorizedAt?: string;
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        state: string;
        pricePerYear: number;
        status: string;
        bedrooms: number;
        bathrooms: number;
        images: { url: string }[];
    };
    landlord: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        phone?: string;
    };
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING_REVIEW: { label: "Under Review", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800", icon: Clock },
    ACTIVE: { label: "Active Agent", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
    SUSPENDED: { label: "Suspended", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800", icon: XCircle },
    REJECTED: { label: "Rejected", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800", icon: XCircle },
    PENDING_LANDLORD: { label: "Awaiting Landlord", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800", icon: Clock },
    AUTHORIZED: { label: "Authorized", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
    REVOKED: { label: "Revoked", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800", icon: XCircle },
    COMPLETED: { label: "Completed", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800", icon: ShieldCheck },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] || { label: status, color: "bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-color)]", icon: AlertCircle };
    const Icon = cfg.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold", cfg.color)}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    );
}

// ─── REQUEST DELEGATION MODAL ─────────────────────────────────────────────────

function RequestDelegationModal({ clerkId, onClose, onSuccess }: { clerkId: string; onClose: () => void; onSuccess: () => void }) {
    const [propertyId, setPropertyId] = useState("");
    const [note, setNote] = useState("");
    const [commissionPct, setCommissionPct] = useState("5");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!propertyId.trim()) return;
        setLoading(true);
        try {
            await api.post(`/agents/me/delegations?clerkId=${clerkId}`, {
                propertyId: propertyId.trim(),
                agentNote: note,
                commissionPct: parseFloat(commissionPct)
            });
            toast.success("Delegation request sent to landlord");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Request Property Delegation</h2>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-300">
                    <strong>How it works:</strong> The landlord will receive your request and must authorize you before you can manage this listing. Commission is paid by the landlord from their rental income.
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Property ID *</label>
                        <input
                            type="text"
                            value={propertyId}
                            onChange={e => setPropertyId(e.target.value)}
                            placeholder="Paste the property ID from RentHub"
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">You can find the property ID in the URL when viewing a listing</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                            Commission Rate (%) — Max 5%
                        </label>
                        <input
                            type="number"
                            value={commissionPct}
                            onChange={e => setCommissionPct(e.target.value)}
                            min="0.5"
                            max="5"
                            step="0.5"
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">Paid by the landlord. Tenant pays 0% agent fee.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Note to Landlord</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Briefly explain your experience and why you want to list this property..."
                            rows={3}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold">
                        {loading ? "Sending..." : "Send Delegation Request"}
                        <Send className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

// ─── PROFILE EDIT MODAL ───────────────────────────────────────────────────────

function ProfileEditModal({
    clerkId,
    profile,
    onClose,
    onSuccess
}: {
    clerkId: string;
    profile: AgentProfile | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState({
        businessName: profile?.businessName || "",
        businessAddress: profile?.businessAddress || "",
        licenseNumber: profile?.licenseNumber || "",
        yearsOfExperience: String(profile?.yearsOfExperience || "0"),
        operatingCities: profile?.operatingCities?.join(", ") || "",
        bio: profile?.bio || "",
        defaultCommissionPct: String(profile?.defaultCommissionPct || "5"),
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch(`/agents/me?clerkId=${clerkId}`, {
                businessName: form.businessName,
                businessAddress: form.businessAddress,
                licenseNumber: form.licenseNumber || undefined,
                yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
                operatingCities: form.operatingCities
                    .split(",")
                    .map(c => c.trim())
                    .filter(Boolean),
                bio: form.bio || undefined,
                defaultCommissionPct: parseFloat(form.defaultCommissionPct),
            });
            toast.success("Profile updated");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-lg my-8 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Agent Profile</h2>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Business / Agency Name *</label>
                        <input
                            value={form.businessName}
                            onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Business Address</label>
                        <input
                            value={form.businessAddress}
                            onChange={e => setForm(f => ({ ...f, businessAddress: e.target.value }))}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">NIESV / License Number</label>
                        <input
                            value={form.licenseNumber}
                            onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
                            placeholder="Optional but builds trust"
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Years of Experience</label>
                            <input
                                type="number"
                                value={form.yearsOfExperience}
                                onChange={e => setForm(f => ({ ...f, yearsOfExperience: e.target.value }))}
                                min="0"
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Default Commission %</label>
                            <input
                                type="number"
                                value={form.defaultCommissionPct}
                                onChange={e => setForm(f => ({ ...f, defaultCommissionPct: e.target.value }))}
                                min="0.5"
                                max="5"
                                step="0.5"
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Operating Cities (comma-separated) *</label>
                        <input
                            value={form.operatingCities}
                            onChange={e => setForm(f => ({ ...f, operatingCities: e.target.value }))}
                            placeholder="Lagos, Abuja, Port Harcourt"
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Bio</label>
                        <textarea
                            value={form.bio}
                            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                            placeholder="Tell landlords about your expertise..."
                            rows={3}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold">
                        {loading ? "Saving..." : "Save Profile"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

// ─── DELEGATION CARD ──────────────────────────────────────────────────────────

function DelegationCard({ delegation }: { delegation: AgentDelegation }) {
    const img = delegation.property.images?.[0]?.url;
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative h-36 bg-[var(--bg-muted)]">
                {img ? (
                    <Image src={img} alt={delegation.property.title} fill className="object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Home className="h-10 w-10 text-[var(--text-muted)]" />
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <StatusBadge status={delegation.status} />
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-[var(--text-primary)] text-sm line-clamp-1">{delegation.property.title}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {delegation.property.city}, {delegation.property.state}
                </p>
                <div className="mt-3 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[var(--text-muted)]">Annual Rent</p>
                        <p className="font-bold text-[var(--text-primary)] text-sm">{formatPrice(delegation.property.pricePerYear)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-[var(--text-muted)]">Your Commission</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">{delegation.commissionPct}%</p>
                    </div>
                </div>
                {delegation.status === "AUTHORIZED" && (
                    <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        ✓ You are authorized to manage this listing
                    </div>
                )}
                {delegation.status === "PENDING_LANDLORD" && (
                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                        ⏳ Awaiting landlord authorization
                    </div>
                )}
                {delegation.landlordNote && (
                    <div className="mt-2 p-2 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-secondary)]">
                        <span className="font-medium text-[var(--text-primary)]">Landlord note:</span> {delegation.landlordNote}
                    </div>
                )}
                <Link href={`/properties/${delegation.property.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-3 text-xs h-8 border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]">
                        View Property <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}

// ─── MAIN AGENT DASHBOARD ────────────────────────────────────────────────────

export default function AgentDashboard() {
    const { user } = useUser();
    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [delegations, setDelegations] = useState<AgentDelegation[]>([]);
    const [stats, setStats] = useState({ authorized: 0, completed: 0, pending: 0, totalEarned: 0 });
    const [strikesInfo, setStrikesInfo] = useState<{ strikeCount: number; strikesRemaining: number; isBanned: boolean; history: any[] }>({
        strikeCount: 0,
        strikesRemaining: 3,
        isBanned: false,
        history: [],
    });
    const [loading, setLoading] = useState(true);
    const [showDelegationModal, setShowDelegationModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>("ALL");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileRes, delegationsRes, statsRes, strikesRes] = await Promise.allSettled([
                api.get(`/agents/me?clerkId=${user?.id}`),
                api.get(`/agents/me/delegations?clerkId=${user?.id}`),
                api.get(`/agents/me/stats?clerkId=${user?.id}`),
                api.get(`/agents/me/strikes?clerkId=${user?.id}`),
            ]);
            if (profileRes.status === "fulfilled") setProfile(profileRes.value.data.data);
            if (delegationsRes.status === "fulfilled") setDelegations(delegationsRes.value.data.data || []);
            if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data);
            if (strikesRes.status === "fulfilled") setStrikesInfo(strikesRes.value.data.data || { strikeCount: 0, strikesRemaining: 3, isBanned: false, history: [] });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const handleSubmitForReview = async () => {
        setSubmitting(true);
        try {
            await api.post(`/agents/me/submit?clerkId=${user?.id}`);
            toast.success("Application submitted! Our team will review within 1-2 business days.");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredDelegations = delegations.filter(d =>
        activeFilter === "ALL" || d.status === activeFilter
    );

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-[var(--bg-muted)] rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Status Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Briefcase className="h-5 w-5 opacity-80" />
                            <span className="text-sm opacity-80">Agent Status</span>
                        </div>
                        <h2 className="text-2xl font-extrabold">
                            {profile?.businessName || "Complete Your Profile"}
                        </h2>
                        {profile?.operatingCities?.length ? (
                            <p className="text-sm opacity-75 mt-1 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {profile.operatingCities.slice(0, 3).join(" · ")}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {profile && <StatusBadge status={profile.status} />}
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="text-xs underline opacity-80 hover:opacity-100 flex items-center gap-1"
                        >
                            <Edit3 className="h-3 w-3" />
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* Profile completion nudge */}
                {profile?.status === "PENDING_REVIEW" && (
                    <div className="mt-4 p-3 bg-white/10 rounded-xl text-sm">
                        ⏳ Your application is under review. We'll notify you within 1–2 business days.
                    </div>
                )}

                {profile?.status === "REJECTED" && (
                    <div className="mt-4 p-3 bg-red-400/20 rounded-xl text-sm">
                        ❌ Application rejected: {profile.rejectionReason || "See admin feedback"}
                        <button onClick={() => setShowProfileModal(true)} className="ml-2 underline">
                            Update & Resubmit
                        </button>
                    </div>
                )}

                {(!profile?.businessName || !profile?.operatingCities?.length) && profile?.status !== "ACTIVE" && (
                    <div className="mt-4">
                        <p className="text-sm opacity-80 mb-2">Complete your profile to apply for agent verification:</p>
                        <Button
                            onClick={() => setShowProfileModal(true)}
                            className="bg-white text-blue-700 hover:bg-blue-50 h-9 text-sm font-semibold"
                        >
                            Complete Profile <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                )}

                {profile?.businessName && profile.operatingCities?.length > 0 &&
                    profile.status !== "ACTIVE" && profile.status !== "PENDING_REVIEW" && (
                        <div className="mt-4">
                            <Button
                                onClick={handleSubmitForReview}
                                disabled={submitting}
                                className="bg-white text-blue-700 hover:bg-blue-50 h-9 text-sm font-semibold"
                            >
                                {submitting ? "Submitting..." : "Submit for Verification"}
                                <Send className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    )}
            </div>

            {/* Stats */}
            {profile?.status === "ACTIVE" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Active Listings", value: stats.authorized, icon: Building2, color: "text-blue-600 dark:text-blue-400" },
                        { label: "Awaiting Auth", value: stats.pending, icon: Clock, color: "text-amber-600 dark:text-amber-400" },
                        { label: "Closed Deals", value: stats.completed, icon: FileCheck, color: "text-emerald-600 dark:text-emerald-400" },
                        { label: "Total Earned", value: formatPrice(stats.totalEarned), icon: Wallet, color: "text-purple-600 dark:text-purple-400", href: "/dashboard?tab=payouts" },
                    ].map(stat => {
                        const card = (
                            <div className={cn("bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm", stat.href && "hover:border-purple-400 dark:hover:border-purple-600 transition-colors cursor-pointer group")}>
                                <div className="flex items-center justify-between mb-2">
                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                    {stat.href && <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 group-hover:underline flex items-center">Payouts →</span>}
                                </div>
                                <p className="text-xl font-extrabold text-[var(--text-primary)]">{stat.value}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</p>
                            </div>
                        );
                        return stat.href ? <Link key={stat.label} href={stat.href}>{card}</Link> : <div key={stat.label}>{card}</div>;
                    })}
                </div>
            )}

            {/* Fee Transparency & Zero Side-Payment Notice */}
            {profile?.status === "ACTIVE" && (
                <div className="space-y-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-xs text-emerald-800 dark:text-emerald-300">
                        <strong>💡 Fee Policy:</strong> Your commission (up to 5%) is paid by the landlord from their rent proceeds.
                        Tenants pay <em>zero</em> agent fee — keeping RentHub's promise intact.
                        All payments flow through RentHub escrow — no side payments allowed.
                    </div>

                    {/* Strike & Compliance Card */}
                    <div className={cn(
                        "rounded-2xl p-4 border text-xs space-y-2 transition-all",
                        strikesInfo.strikeCount === 0
                            ? "bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-200"
                            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200"
                    )}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-extrabold flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                Platform Compliance Standing: {strikesInfo.strikeCount} / 3 Strikes
                            </span>
                            <span className={cn(
                                "px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider",
                                strikesInfo.strikeCount === 0
                                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                    : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                            )}>
                                {strikesInfo.strikeCount === 0 ? "Good Standing (0 Violations)" : `${strikesInfo.strikesRemaining} strikes remaining before ban`}
                            </span>
                        </div>
                        <p className="leading-relaxed text-[11px] opacity-85">
                            <strong>Zero Side-Payment Rule:</strong> Demanding cash inspection fees, registration fees, or fuel money from tenants is strictly prohibited. Offenses result in strikes. Accumulating 3 strikes results in immediate, permanent suspension.
                        </p>
                    </div>
                </div>
            )}

            {/* Delegations */}
            {profile?.status === "ACTIVE" && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">My Listings</h3>
                        <Button
                            onClick={() => setShowDelegationModal(true)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-semibold"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Request to List Property
                        </Button>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                        {["ALL", "PENDING_LANDLORD", "AUTHORIZED", "COMPLETED", "REVOKED"].map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border",
                                    activeFilter === f
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border-[var(--border-color)]"
                                )}
                            >
                                {f === "ALL" ? "All" : statusConfig[f]?.label || f}
                                {f === "ALL" && ` (${delegations.length})`}
                                {f !== "ALL" && ` (${delegations.filter(d => d.status === f).length})`}
                            </button>
                        ))}
                    </div>

                    {filteredDelegations.length === 0 ? (
                        <div className="text-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl">
                            <Building2 className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3" />
                            <p className="text-[var(--text-secondary)] font-medium">No listings yet</p>
                            <p className="text-[var(--text-muted)] text-sm mt-1 mb-4">
                                Request to manage properties and build your portfolio
                            </p>
                            <Button
                                onClick={() => setShowDelegationModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm font-semibold"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Request Delegation
                            </Button>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDelegations.map(d => (
                                <DelegationCard key={d.id} delegation={d} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showDelegationModal && (
                <RequestDelegationModal
                    clerkId={user?.id || ""}
                    onClose={() => setShowDelegationModal(false)}
                    onSuccess={fetchData}
                />
            )}
            {showProfileModal && (
                <ProfileEditModal
                    clerkId={user?.id || ""}
                    profile={profile}
                    onClose={() => setShowProfileModal(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}
