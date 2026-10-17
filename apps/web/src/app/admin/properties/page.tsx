"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Building2,
    ShieldCheck,
    CheckCircle2,
    Clock,
    RefreshCcw,
    Search,
    ChevronDown,
    Loader2,
    ExternalLink,
    MapPin,
    Wallet,
    X,
    Eye,
    Bed,
    Bath,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface PropertyItem {
    id: string;
    title: string;
    description?: string;
    address: string;
    city: string;
    state?: string;
    pricePerYear: number;
    bedrooms: number;
    bathrooms: number;
    status: "AVAILABLE" | "RENTED" | "PENDING_REVIEW" | "UNDER_OFFER" | "DRAFT" | "UNAVAILABLE" | "ARCHIVED";
    verified: boolean;
    createdAt: string;
    landlord: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        verified: boolean;
        afriExchangeAccountEmail?: string;
        afriExchangeWalletAddress?: string;
    };
    images: { url: string }[];
}

interface PropertyStats {
    total: number;
    available: number;
    rented: number;
    underOffer: number;
    pendingReview: number;
}

export default function AdminPropertiesPage() {
    const [properties, setProperties] = useState<PropertyItem[]>([]);
    const [stats, setStats] = useState<PropertyStats>({
        total: 0,
        available: 0,
        rented: 0,
        underOffer: 0,
        pendingReview: 0,
    });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProp, setSelectedProp] = useState<PropertyItem | null>(null);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (statusFilter !== "ALL") params.status = statusFilter;

            const res = await api.get("/admin/properties", { params });
            if (res.data?.success) {
                const data = res.data.data;
                if (Array.isArray(data)) {
                    setProperties(data);
                } else if (data?.properties) {
                    setProperties(data.properties);
                    if (data.stats) {
                        setStats(data.stats);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load properties:", error);
            toast.error("Failed to fetch property listings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, [statusFilter]);

    const filteredProperties = useMemo(() => {
        if (!searchQuery.trim()) return properties;
        const q = searchQuery.toLowerCase();
        return properties.filter((p) => {
            const title = (p.title || "").toLowerCase();
            const city = (p.city || "").toLowerCase();
            const landlord = `${p.landlord?.firstName || ""} ${p.landlord?.lastName || ""}`.toLowerCase();
            const email = (p.landlord?.email || "").toLowerCase();
            const id = (p.id || "").toLowerCase();
            return (
                title.includes(q) ||
                city.includes(q) ||
                landlord.includes(q) ||
                email.includes(q) ||
                id.includes(q)
            );
        });
    }, [properties, searchQuery]);

    const getStatusBadge = (status: PropertyItem["status"]) => {
        switch (status) {
            case "AVAILABLE":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        Available
                    </span>
                );
            case "RENTED":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        Rented
                    </span>
                );
            case "UNDER_OFFER":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Under Offer
                    </span>
                );
            case "PENDING_REVIEW":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="h-3 w-3" />
                        Pending Review
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                        {status}
                    </span>
                );
        }
    };

    return (
        <>
            <AdminHeader
                title="Properties"
                description="Moderate listings, audit ownership documents, and verify landlord settlement readiness"
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchProperties}
                        disabled={loading}
                        className="gap-2 h-9 border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]"
                    >
                        <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                }
            />

            <div className="flex-1 p-6 space-y-6 overflow-auto">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Properties"
                        value={stats.total}
                        icon={Building2}
                        accent="blue"
                        trend="Total recorded platform listings"
                    />
                    <StatCard
                        label="Available on Market"
                        value={stats.available}
                        icon={CheckCircle2}
                        accent="green"
                        trend="Open for tenant applications"
                    />
                    <StatCard
                        label="Active Leases (Rented)"
                        value={stats.rented}
                        icon={Building2}
                        accent="blue"
                        trend="Occupied & escrow settled"
                    />
                    <StatCard
                        label="Under Offer / Review"
                        value={stats.underOffer + stats.pendingReview}
                        icon={Clock}
                        accent={stats.underOffer + stats.pendingReview > 0 ? "orange" : "green"}
                        trend={
                            stats.underOffer + stats.pendingReview > 0
                                ? `${stats.underOffer} under offer · ${stats.pendingReview} review queue`
                                : "Zero pending moderation"
                        }
                    />
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Listing Status
                            </label>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                                >
                                    <option value="ALL">All Statuses ({stats.total})</option>
                                    <option value="AVAILABLE">Available ({stats.available})</option>
                                    <option value="RENTED">Rented ({stats.rented})</option>
                                    <option value="UNDER_OFFER">Under Offer ({stats.underOffer})</option>
                                    <option value="PENDING_REVIEW">Pending Review ({stats.pendingReview})</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Search Listings
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by title, city, landlord name, or property ID..."
                                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStatusFilter("ALL");
                                    setSearchQuery("");
                                }}
                                className="w-full border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] text-sm font-semibold h-[38px]"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] overflow-hidden">
                    <div className="border-b border-[var(--border-color)] px-6 py-4">
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">Property Listings</h2>
                        <p className="text-xs text-[var(--text-muted)]">
                            Showing {filteredProperties.length} properties • All rental prices denominated in AfriExchange Naira Token (NT)
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-16 text-[var(--text-muted)]">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-blue)] mb-2" />
                            <span className="text-sm font-medium">Loading properties...</span>
                        </div>
                    ) : filteredProperties.length === 0 ? (
                        <div className="p-16 text-center text-[var(--text-muted)]">
                            <Building2 className="h-10 w-10 mx-auto text-[var(--text-muted)]/40 mb-3" />
                            <p className="text-sm font-medium text-[var(--text-primary)]">No properties found</p>
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
                                            Landlord & Settlement
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Rent / Year
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Verification
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Status
                                        </th>
                                        <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                                    {filteredProperties.map((prop) => (
                                        <tr key={prop.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-12 rounded-lg bg-[var(--bg-muted)] overflow-hidden relative shrink-0 border border-[var(--border-color)]">
                                                        {prop.images?.[0]?.url ? (
                                                            <img
                                                                src={prop.images[0].url}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <Building2 className="h-5 w-5 m-auto text-[var(--text-muted)]" />
                                                        )}
                                                    </div>
                                                    <div className="max-w-[220px]">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                                            {prop.title}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 truncate">
                                                            <MapPin className="h-3 w-3 shrink-0" />
                                                            {prop.city} • {prop.bedrooms} Bed, {prop.bathrooms} Bath
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-xs font-semibold text-[var(--text-primary)]">
                                                    {prop.landlord?.firstName} {prop.landlord?.lastName}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-muted)]">{prop.landlord?.email}</p>
                                                {prop.landlord?.afriExchangeAccountEmail ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono mt-0.5">
                                                        <Wallet className="h-3 w-3" />
                                                        {prop.landlord.afriExchangeAccountEmail}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-amber-400/80 mt-0.5 block">
                                                        Wallet unlinked
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-[var(--text-primary)]">
                                                <span>{formatPrice(prop.pricePerYear)}</span>
                                                <span className="ml-1 text-xs font-semibold text-[var(--color-brand-green)]">NT</span>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {prop.verified ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-green)]">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                                        Unverified
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(prop.status)}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedProp(prop)}
                                                    className="h-8 text-xs border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                                    Audit
                                                </Button>
                                                <Link
                                                    href={`/properties/${prop.id}`}
                                                    target="_blank"
                                                    className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Audit Drawer */}
            {selectedProp && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-lg bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">Property Audit</h3>
                                <p className="text-xs text-[var(--text-muted)] font-mono">
                                    ID: {selectedProp.id}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedProp(null)}
                                className="h-8 w-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {selectedProp.images?.[0]?.url && (
                            <div className="rounded-xl overflow-hidden h-48 w-full border border-[var(--border-color)]">
                                <img
                                    src={selectedProp.images[0].url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-bold text-[var(--text-primary)]">{selectedProp.title}</h4>
                                {getStatusBadge(selectedProp.status)}
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">{selectedProp.address}, {selectedProp.city}</p>
                            <p className="text-base font-bold font-mono text-[var(--color-brand-blue)]">
                                {formatPrice(selectedProp.pricePerYear)} NT / year
                            </p>
                        </div>

                        {/* Specs */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                                <Bed className="h-4 w-4 text-[var(--text-muted)]" />
                                <span>{selectedProp.bedrooms} Bedrooms</span>
                            </div>
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                                <Bath className="h-4 w-4 text-[var(--text-muted)]" />
                                <span>{selectedProp.bathrooms} Bathrooms</span>
                            </div>
                        </div>

                        {/* Landlord information */}
                        <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4 bg-[var(--bg-primary)]/40">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Landlord & Payout Settlement
                            </h4>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                {selectedProp.landlord?.firstName} {selectedProp.landlord?.lastName}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">Email: {selectedProp.landlord?.email}</p>
                            <p className="text-xs text-[var(--text-muted)]">Phone: {selectedProp.landlord?.phone || "None"}</p>
                            <div className="pt-2 border-t border-[var(--border-color)] space-y-1">
                                <span className="text-xs text-[var(--text-muted)]">AfriExchange Settlement Account:</span>
                                <p className="text-xs font-mono font-semibold text-emerald-400">
                                    {selectedProp.landlord?.afriExchangeAccountEmail || "⚠️ Not linked yet"}
                                </p>
                                {selectedProp.landlord?.afriExchangeWalletAddress && (
                                    <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                                        Wallet: {selectedProp.landlord.afriExchangeWalletAddress}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Link
                                href={`/properties/${selectedProp.id}`}
                                target="_blank"
                                className="flex-1 inline-flex items-center justify-center rounded-lg bg-[var(--color-brand-blue)] text-white text-sm font-semibold h-9 gap-1.5"
                            >
                                <ExternalLink className="h-4 w-4" />
                                View Public Page
                            </Link>
                            <Button
                                variant="outline"
                                onClick={() => setSelectedProp(null)}
                                className="border-[var(--border-color)]"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
