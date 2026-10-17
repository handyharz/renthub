"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    MapPin,
    ExternalLink,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    Clock,
    Building2,
    Users,
    RefreshCcw,
    AlertTriangle,
    Wallet,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface VerificationProperty {
    id: string;
    title: string;
    address: string;
    city: string;
    pricePerYear: number;
    bedrooms: number;
    propertyType: string;
    verified: boolean;
    verifiedAt?: string;
    updatedAt: string;
    landlord: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        verified: boolean;
        afriExchangeAccountEmail?: string;
        afriExchangeWalletAddress?: string;
    };
    images: { url: string; isPrimary?: boolean }[];
}

interface VerificationStats {
    pendingReview: number;
    verifiedProps: number;
    unverifiedProps: number;
    verifiedLandlords: number;
}

export default function AdminVerificationsPage() {
    const [properties, setProperties] = useState<VerificationProperty[]>([]);
    const [recentlyVerified, setRecentlyVerified] = useState<VerificationProperty[]>([]);
    const [stats, setStats] = useState<VerificationStats>({
        pendingReview: 0,
        verifiedProps: 0,
        unverifiedProps: 0,
        verifiedLandlords: 0,
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"pending" | "certified">("pending");
    const [actionId, setActionId] = useState<string | null>(null);

    // Rejection modal state
    const [rejectModalProp, setRejectModalProp] = useState<VerificationProperty | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const fetchQueue = () => {
        setLoading(true);
        api.get("/admin/verifications")
            .then((res) => {
                const data = res.data.data;
                if (Array.isArray(data)) {
                    setProperties(data);
                } else if (data?.properties) {
                    setProperties(data.properties);
                    if (data.recentlyVerified) setRecentlyVerified(data.recentlyVerified);
                    if (data.stats) setStats(data.stats);
                }
            })
            .catch(() => toast.error("Failed to load verification queue"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleApprove = async (id: string) => {
        setActionId(id);
        try {
            await api.post(`/admin/verifications/${id}/approve`);
            toast.success("Property verified — badge issued");
            fetchQueue();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Approval failed");
        } finally {
            setActionId(null);
        }
    };

    const confirmReject = async () => {
        if (!rejectModalProp) return;
        const id = rejectModalProp.id;
        setActionId(id);
        try {
            await api.post(`/admin/verifications/${id}/reject`, { reason: rejectReason.trim() || undefined });
            toast.success("Verification rejected");
            setRejectModalProp(null);
            setRejectReason("");
            fetchQueue();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Rejection failed");
        } finally {
            setActionId(null);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!window.confirm("Are you sure you want to revoke this property's verification badge?")) return;
        setActionId(id);
        try {
            await api.post(`/admin/verifications/${id}/revoke`);
            toast.success("Verification badge revoked");
            fetchQueue();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Revoke failed");
        } finally {
            setActionId(null);
        }
    };

    return (
        <>
            <AdminHeader
                title="Verification Queue"
                description="Physical property inspections, badge issuance audits, and landlord KYC verification"
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchQueue}
                        disabled={loading}
                        className="gap-2 h-9 border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]"
                    >
                        <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                }
            />

            <div className="flex-1 p-6 space-y-6 overflow-auto">
                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Pending Inspections"
                        value={stats.pendingReview}
                        icon={Clock}
                        accent={stats.pendingReview > 0 ? "orange" : "green"}
                        trend={
                            stats.pendingReview > 0
                                ? "Paid inspections awaiting field agent"
                                : "Queue clean — zero pending"
                        }
                    />
                    <StatCard
                        label="Verified Properties"
                        value={stats.verifiedProps}
                        icon={ShieldCheck}
                        accent="green"
                        trend="Certified marketplace badges issued"
                    />
                    <StatCard
                        label="Unverified Listings"
                        value={stats.unverifiedProps}
                        icon={Building2}
                        accent="blue"
                        trend="Standard unverified self-listings"
                    />
                    <StatCard
                        label="Verified Landlords"
                        value={stats.verifiedLandlords}
                        icon={Users}
                        accent="blue"
                        trend="KYC & identity certified hosts"
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                            activeTab === "pending"
                                ? "bg-[var(--color-brand-blue)] text-white shadow-xs"
                                : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
                        }`}
                    >
                        Inspection Queue ({properties.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("certified")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                            activeTab === "certified"
                                ? "bg-[var(--color-brand-blue)] text-white shadow-xs"
                                : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
                        }`}
                    >
                        Certified Badge Audit ({recentlyVerified.length})
                    </button>
                </div>

                {/* Tab 1: Pending Queue */}
                {activeTab === "pending" && (
                    <>
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-green)] border-t-transparent" />
                            </div>
                        ) : properties.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8">
                                <CheckCircle2 className="h-12 w-12 text-[var(--color-brand-green)] mb-3" />
                                <h2 className="text-base font-bold text-[var(--text-primary)]">Inspection Queue is Clear</h2>
                                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
                                    All submitted properties have been audited and assigned marketplace verification badges.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveTab("certified")}
                                    className="mt-4 text-xs border-[var(--border-color)]"
                                >
                                    View Certified Badges ({stats.verifiedProps})
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {properties.map((property) => {
                                    const primaryImage =
                                        property.images.find((i) => i.isPrimary) || property.images[0];
                                    const isActing = actionId === property.id;
                                    return (
                                        <div
                                            key={property.id}
                                            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-[var(--shadow-sm)]"
                                        >
                                            <div className="flex flex-col lg:flex-row">
                                                {/* Image */}
                                                <div className="relative h-48 lg:h-auto lg:w-56 shrink-0 bg-[var(--bg-muted)]">
                                                    {primaryImage ? (
                                                        <Image
                                                            src={primaryImage.url}
                                                            alt={property.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-[var(--text-muted)] text-sm">
                                                            No image
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 p-5">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className="font-bold text-[var(--text-primary)]">
                                                                    {property.title}
                                                                </h3>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-[var(--color-brand-orange)]/40 text-[var(--color-brand-orange)]"
                                                                >
                                                                    Pending Review
                                                                </Badge>
                                                            </div>
                                                            <p className="flex items-center gap-1 text-sm text-[var(--text-muted)] mt-1">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                {property.address}, {property.city}
                                                            </p>
                                                            <p className="text-sm font-semibold text-[var(--color-brand-green)] mt-2 font-mono">
                                                                {formatPrice(property.pricePerYear)} NT/yr · {property.bedrooms} bed · {property.propertyType}
                                                            </p>
                                                        </div>
                                                        <Link
                                                            href={`/properties/${property.id}`}
                                                            target="_blank"
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-blue)] hover:underline"
                                                        >
                                                            View listing <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    </div>

                                                    {/* Landlord info */}
                                                    <div className="mt-4 rounded-lg bg-[var(--bg-muted)] p-3">
                                                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1">
                                                            Landlord & Settlement Readiness
                                                        </p>
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                            {property.landlord.firstName} {property.landlord.lastName}
                                                            {property.landlord.verified && (
                                                                <Badge variant="success" className="ml-2 text-[10px]">
                                                                    KYC Verified
                                                                </Badge>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                                            {property.landlord.email} · {property.landlord.phone || "No phone"}
                                                        </p>
                                                        {property.landlord.afriExchangeAccountEmail && (
                                                            <p className="text-xs text-emerald-400 font-mono mt-1 flex items-center gap-1">
                                                                <Wallet className="h-3 w-3" />
                                                                AfriX: {property.landlord.afriExchangeAccountEmail}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        <Button
                                                            size="sm"
                                                            disabled={isActing}
                                                            onClick={() => handleApprove(property.id)}
                                                            className="gap-1.5"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Approve & Issue Badge
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={isActing}
                                                            onClick={() => {
                                                                setRejectModalProp(property);
                                                                setRejectReason("");
                                                            }}
                                                            className="gap-1.5"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                            Reject Inspection
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* Tab 2: Certified Badges Audit */}
                {activeTab === "certified" && (
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] overflow-hidden">
                        <div className="border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">Certified Properties Audit</h2>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Displaying {recentlyVerified.length} of {stats.verifiedProps} verified marketplace properties
                                </p>
                            </div>
                        </div>

                        {recentlyVerified.length === 0 ? (
                            <div className="p-16 text-center text-[var(--text-muted)]">
                                <ShieldCheck className="h-10 w-10 mx-auto text-[var(--text-muted)]/40 mb-3" />
                                <p className="text-sm font-medium text-[var(--text-primary)]">No verified properties found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[var(--border-color)] text-left">
                                    <thead className="bg-[var(--bg-primary)]">
                                        <tr>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                Property
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                Landlord
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                Rent / Year
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                Verification Badge
                                            </th>
                                            <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                                        {recentlyVerified.map((prop) => (
                                            <tr key={prop.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-12 rounded bg-[var(--bg-muted)] overflow-hidden relative shrink-0 border border-[var(--border-color)]">
                                                            {prop.images?.[0]?.url ? (
                                                                <img
                                                                    src={prop.images[0].url}
                                                                    alt=""
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <Building2 className="h-4 w-4 m-auto text-[var(--text-muted)]" />
                                                            )}
                                                        </div>
                                                        <div className="max-w-[220px]">
                                                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                                                {prop.title}
                                                            </p>
                                                            <p className="text-xs text-[var(--text-muted)] truncate">
                                                                {prop.city}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                                                        {prop.landlord?.firstName} {prop.landlord?.lastName}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--text-muted)]">{prop.landlord?.email}</p>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-[var(--text-primary)]">
                                                    {formatPrice(prop.pricePerYear)} NT/yr
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                        Verified Badge Active
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                                    <Link
                                                        href={`/properties/${prop.id}`}
                                                        target="_blank"
                                                        className="inline-flex items-center justify-center h-7 px-2 rounded border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={actionId === prop.id}
                                                        onClick={() => handleRevoke(prop.id)}
                                                        className="h-7 text-[11px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                    >
                                                        Revoke Badge
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {rejectModalProp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                            <h3 className="text-base font-bold text-[var(--text-primary)]">Reject Property Verification</h3>
                            <button
                                onClick={() => setRejectModalProp(null)}
                                className="h-7 w-7 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)]">
                                You are rejecting the physical verification for:
                            </p>
                            <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                                {rejectModalProp.title}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                Rejection Reason / Field Inspection Notes (Optional):
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                                placeholder="E.g., Inaccurate property photos, ownership document mismatch..."
                                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectModalProp(null)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={actionId === rejectModalProp.id}
                                onClick={confirmReject}
                                className="text-xs"
                            >
                                Confirm Rejection
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
