"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import {
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Calendar,
    Home,
    ShieldCheck,
    Phone,
    Mail,
    Loader2,
    AlertCircle,
    Star,
    Search,
    Filter,
    RefreshCw,
    ExternalLink,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    MessageSquare,
    Check,
    X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { RenewalsSection } from "./RenewalsSection";

interface Application {
    id: string;
    propertyId: string;
    tenantId: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    proposedMoveInDate: string;
    leaseDuration: number;
    note?: string;
    createdAt: string;
    tenant: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        avatar?: string;
        verified: boolean;
        phoneVerified: boolean;
    };
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        pricePerYear: number;
        images: { url: string; isPrimary: boolean }[];
    };
}

export function LandlordApplicationsTab() {
    const { user } = useUser();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Sub-navigation: Applications vs Renewals
    const [activeSection, setActiveSection] = useState<"applications" | "renewals">("applications");

    // Search, filter & pagination state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const properties = useMemo(() => {
        const map = new Map();
        applications.forEach((a) => {
            if (a.property && !map.has(a.property.id)) {
                map.set(a.property.id, a.property);
            }
        });
        return Array.from(map.values());
    }, [applications]);

    useEffect(() => {
        if (user) {
            fetchApplications();
        }
    }, [user]);

    const fetchApplications = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);

            const res = await api.get("/applications/landlord");
            setApplications(res.data.data || []);
            if (isManualRefresh) {
                toast.success("Applications updated");
            }
        } catch (error) {
            console.error("Failed to fetch landlord applications:", error);
            toast.error("Failed to load rental applications");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleUpdateStatus = async (applicationId: string, newStatus: "APPROVED" | "REJECTED") => {
        try {
            setActionLoading(applicationId);
            await api.patch(`/applications/${applicationId}/status`, { status: newStatus });

            toast.success(
                newStatus === "APPROVED"
                    ? "Application Approved & Property Locked!"
                    : "Application Declined",
                {
                    description:
                        newStatus === "APPROVED"
                            ? "The property status has been updated to Under Offer so the tenant can complete escrow payment."
                            : "The tenant has been notified."
                }
            );

            fetchApplications();
        } catch (error: any) {
            console.error("Failed to update status:", error);
            toast.error(error.response?.data?.message || "Failed to update application status");
        } finally {
            setActionLoading(null);
        }
    };

    // Calculate metric statistics
    const stats = useMemo(() => {
        const total = applications.length;
        const pending = applications.filter((a) => a.status === "PENDING").length;
        const approved = applications.filter((a) => a.status === "APPROVED").length;
        const rejected = applications.filter((a) => a.status === "REJECTED").length;
        return { total, pending, approved, rejected };
    }, [applications]);

    // Filter and search applications
    const filteredApplications = useMemo(() => {
        return applications.filter((app) => {
            const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            if (!q) return matchesStatus;

            const tenantName = `${app.tenant?.firstName || ""} ${app.tenant?.lastName || ""}`.toLowerCase();
            const tenantEmail = (app.tenant?.email || "").toLowerCase();
            const tenantPhone = (app.tenant?.phone || "").toLowerCase();
            const propertyTitle = (app.property?.title || "").toLowerCase();
            const propertyCity = (app.property?.city || "").toLowerCase();
            const propertyAddress = (app.property?.address || "").toLowerCase();

            const matchesSearch =
                tenantName.includes(q) ||
                tenantEmail.includes(q) ||
                tenantPhone.includes(q) ||
                propertyTitle.includes(q) ||
                propertyCity.includes(q) ||
                propertyAddress.includes(q);

            return matchesStatus && matchesSearch;
        });
    }, [applications, statusFilter, searchQuery]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE) || 1;
    const paginatedApplications = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredApplications.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredApplications, currentPage]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-green)]/10 flex items-center justify-center animate-pulse">
                        <FileText className="h-6 w-6 text-[var(--color-brand-green)]" />
                    </div>
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand-green)] absolute -bottom-1 -right-1" />
                </div>
                <p className="font-bold text-sm text-[var(--text-primary)] mt-4">Loading applicant queue...</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Retrieving incoming tenant applications & verifications</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Title & Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-[var(--color-brand-green)]/10 border border-emerald-500/30 flex items-center justify-center text-[var(--color-brand-green)] shadow-xs">
                            <FileText className="h-4 w-4" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                            Rental Applications
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1">
                        Review, vet, and approve tenant rental applications to lock listings for escrow payment
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchApplications(true)}
                        disabled={refreshing}
                        className="h-9 px-3.5 rounded-xl border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5 shadow-xs"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[var(--color-brand-green)]" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Sub-navigation Switcher: Applications vs Renewals */}
            <div className="flex border-b border-[var(--border-color)] gap-2">
                <button
                    type="button"
                    onClick={() => setActiveSection("applications")}
                    className={`pb-3 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
                        activeSection === "applications"
                            ? "border-[var(--color-brand-green)] text-[var(--color-brand-green)]"
                            : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                >
                    <FileText className="h-4 w-4" />
                    Incoming Applications
                    {stats.pending > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full font-black">
                            {stats.pending}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSection("renewals")}
                    className={`pb-3 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
                        activeSection === "renewals"
                            ? "border-[var(--color-brand-green)] text-[var(--color-brand-green)]"
                            : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                >
                    <Sparkles className="h-4 w-4 text-[var(--color-brand-green)]" />
                    Lease Renewals & Extensions
                </button>
            </div>

            {activeSection === "renewals" ? (
                <RenewalsSection role="LANDLORD" properties={properties} />
            ) : (
                <>
            {/* Metric Overview Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div
                    onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "ALL"
                            ? "border-[var(--color-brand-green)] ring-2 ring-[var(--color-brand-green)]/15"
                            : "border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            Total Received
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                            <FileText className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[var(--text-primary)]">{stats.total}</span>
                        <span className="text-[11px] font-semibold text-[var(--text-muted)]">applications</span>
                    </div>
                </div>

                <div
                    onClick={() => { setStatusFilter("PENDING"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "PENDING"
                            ? "border-amber-500 ring-2 ring-amber-500/15"
                            : "border-[var(--border-color)] hover:border-amber-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Pending Review
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</span>
                        <span className="text-[11px] font-semibold text-amber-600/80 dark:text-amber-400/80">awaiting decision</span>
                    </div>
                </div>

                <div
                    onClick={() => { setStatusFilter("APPROVED"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "APPROVED"
                            ? "border-emerald-500 ring-2 ring-emerald-500/15"
                            : "border-[var(--border-color)] hover:border-emerald-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Approved & Locked
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.approved}</span>
                        <span className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80">ready for escrow</span>
                    </div>
                </div>

                <div
                    onClick={() => { setStatusFilter("REJECTED"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "REJECTED"
                            ? "border-red-500 ring-2 ring-red-500/15"
                            : "border-[var(--border-color)] hover:border-red-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                            Declined
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <XCircle className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-red-600 dark:text-red-400">{stats.rejected}</span>
                        <span className="text-[11px] font-semibold text-red-600/80 dark:text-red-400/80">closed</span>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-xs">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search className="h-4 w-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by tenant name, property title, city, phone..."
                        className="w-full h-10 pl-10 pr-4 text-xs font-medium bg-[var(--bg-muted)] rounded-xl border border-transparent focus:border-[var(--color-brand-green)] focus:bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold p-1"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Status Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {(
                        [
                            { id: "ALL", label: "All Status", count: stats.total },
                            { id: "PENDING", label: "Pending", count: stats.pending },
                            { id: "APPROVED", label: "Approved", count: stats.approved },
                            { id: "REJECTED", label: "Declined", count: stats.rejected }
                        ] as const
                    ).map((filter) => {
                        const isActive = statusFilter === filter.id;
                        return (
                            <button
                                key={filter.id}
                                onClick={() => {
                                    setStatusFilter(filter.id);
                                    setCurrentPage(1);
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                                    isActive
                                        ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                        : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)]"
                                }`}
                            >
                                <span>{filter.label}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                        isActive
                                            ? "bg-white/20 text-white"
                                            : "bg-[var(--bg-card)] text-[var(--text-muted)]"
                                    }`}
                                >
                                    {filter.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Applications List */}
            {applications.length === 0 ? (
                <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-green)]/10 text-[var(--color-brand-green)] flex items-center justify-center mx-auto mb-4 border border-[var(--color-brand-green)]/20 shadow-xs">
                        <FileText className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">No Rental Applications Yet</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto mt-1 leading-relaxed">
                        When verified renters submit applications for your listings, they will appear here with background checks and move-in details.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <Link href="/properties/new">
                            <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white text-xs font-bold rounded-xl h-10 px-5 shadow-xs">
                                List Another Property
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="text-center py-14 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 shadow-xs">
                    <Search className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
                    <h3 className="text-base font-bold text-[var(--text-primary)]">No Matching Applications</h3>
                    <p className="text-xs text-[var(--text-secondary)] font-medium max-w-sm mx-auto mt-1">
                        We couldn't find any applications matching your search or active filters.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("ALL");
                            setCurrentPage(1);
                        }}
                        className="mt-4 h-9 px-4 rounded-xl text-xs font-bold border-[var(--border-color)]"
                    >
                        Clear All Filters
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4">
                        {paginatedApplications.map((app) => {
                            const primaryImage =
                                app.property.images?.find((img) => img.isPrimary)?.url ||
                                app.property.images?.[0]?.url;

                            return (
                                <div
                                    key={app.id}
                                    className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-xs hover:border-[var(--color-brand-green)]/40 transition-all duration-200 space-y-4"
                                >
                                    {/* Top Bar: Property info & status badge */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="h-14 w-14 rounded-2xl bg-[var(--bg-muted)] overflow-hidden relative shrink-0 border border-[var(--border-color)] shadow-xs">
                                                {primaryImage ? (
                                                    <Image
                                                        src={primaryImage}
                                                        alt={app.property.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-[var(--bg-muted)] text-[var(--text-muted)]">
                                                        <Home className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-extrabold text-[var(--text-primary)] text-sm sm:text-base leading-snug truncate">
                                                        {app.property.title}
                                                    </h3>
                                                    <Link
                                                        href={`/properties/${app.property.id}`}
                                                        target="_blank"
                                                        className="text-[var(--text-muted)] hover:text-[var(--color-brand-green)] transition-colors shrink-0"
                                                        title="View property listing"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </Link>
                                                </div>
                                                <p className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1 mt-0.5 truncate">
                                                    <MapPin className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                                                    {app.property.address}, {app.property.city}
                                                </p>
                                                <div className="text-xs font-black text-[var(--color-brand-green)] mt-1">
                                                    {formatPrice(app.property.pricePerYear)}{" "}
                                                    <span className="text-[11px] font-semibold text-[var(--text-muted)]">/ year</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                                            {app.status === "PENDING" && (
                                                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                                                    <Clock className="h-3.5 w-3.5 animate-pulse" /> Pending Review
                                                </Badge>
                                            )}
                                            {app.status === "APPROVED" && (
                                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved & Locked
                                                </Badge>
                                            )}
                                            {app.status === "REJECTED" && (
                                                <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                                                    <XCircle className="h-3.5 w-3.5" /> Declined
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle: Tenant Profile & Lease Specifications */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                                        {/* Tenant Card */}
                                        <div className="lg:col-span-2 p-3.5 rounded-2xl bg-[var(--bg-muted)]/70 border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[var(--color-brand-green)]/20 to-[var(--color-brand-green)]/5 text-[var(--color-brand-green)] flex items-center justify-center font-black text-sm shrink-0 border border-[var(--color-brand-green)]/30 shadow-2xs">
                                                    {app.tenant.firstName?.[0]}
                                                    {app.tenant.lastName?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-extrabold text-[var(--text-primary)] text-sm truncate">
                                                            {app.tenant.firstName} {app.tenant.lastName}
                                                        </span>
                                                        {app.tenant.phoneVerified && (
                                                            <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 shadow-2xs">
                                                                <ShieldCheck className="h-3 w-3" /> Verified Phone
                                                            </Badge>
                                                        )}
                                                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 shadow-2xs">
                                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 5.0 Renter Score
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-medium mt-1 flex-wrap">
                                                        <a
                                                            href={`tel:${app.tenant.phone}`}
                                                            className="flex items-center gap-1 hover:text-[var(--color-brand-green)] transition-colors"
                                                            title="Call applicant"
                                                        >
                                                            <Phone className="h-3 w-3 text-[var(--color-brand-green)]" />
                                                            {app.tenant.phone}
                                                        </a>
                                                        {app.tenant.email && (
                                                            <a
                                                                href={`mailto:${app.tenant.email}`}
                                                                className="flex items-center gap-1 hover:text-[var(--color-brand-green)] transition-colors truncate max-w-[200px]"
                                                                title="Email applicant"
                                                            >
                                                                <Mail className="h-3 w-3 text-[var(--color-brand-green)]" />
                                                                {app.tenant.email}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                <a
                                                    href={`tel:${app.tenant.phone}`}
                                                    className="h-8 px-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--color-brand-green)] hover:border-[var(--color-brand-green)]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                                                >
                                                    <Phone className="h-3 w-3" /> Call
                                                </a>
                                                {app.tenant.email && (
                                                    <a
                                                        href={`mailto:${app.tenant.email}`}
                                                        className="h-8 px-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--color-brand-green)] hover:border-[var(--color-brand-green)]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                                                    >
                                                        <Mail className="h-3 w-3" /> Email
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Lease Specs Card */}
                                        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-center space-y-2 text-xs shadow-2xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-[var(--color-brand-green)]" /> Proposed Move-in:
                                                </span>
                                                <span className="font-extrabold text-[var(--text-primary)]">
                                                    {new Date(app.proposedMoveInDate).toLocaleDateString("en-NG", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-[var(--color-brand-green)]" /> Lease Duration:
                                                </span>
                                                <span className="font-extrabold text-[var(--text-primary)]">
                                                    {app.leaseDuration} Months
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)] text-[11px]">
                                                <span className="text-[var(--text-muted)] font-medium">Applied on:</span>
                                                <span className="text-[var(--text-muted)] font-semibold">
                                                    {new Date(app.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Application Note */}
                                    {app.note && (
                                        <div className="text-xs text-[var(--text-secondary)] font-medium bg-blue-500/10 p-3.5 rounded-2xl border border-blue-500/20 flex items-start gap-2.5">
                                            <MessageSquare className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                            <div>
                                                <strong className="text-[var(--text-primary)] font-bold block mb-0.5">
                                                    Applicant's Personal Note:
                                                </strong>
                                                <span className="italic leading-relaxed">"{app.note}"</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Decision Actions */}
                                    {app.status === "PENDING" && (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)]">
                                            <div className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                                <ShieldCheck className="h-4 w-4 text-[var(--color-brand-green)]" />
                                                <span>Approving will lock the listing to <strong>Under Offer</strong> and prompt the tenant to deposit funds into Escrow.</span>
                                            </div>

                                            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                                                <Button
                                                    variant="outline"
                                                    disabled={actionLoading === app.id}
                                                    onClick={() => handleUpdateStatus(app.id, "REJECTED")}
                                                    className="h-10 px-4 rounded-xl text-red-500 border-red-500/30 hover:bg-red-500/10 text-xs font-bold gap-1.5 shadow-xs"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                    Decline
                                                </Button>
                                                <Button
                                                    disabled={actionLoading === app.id}
                                                    onClick={() => handleUpdateStatus(app.id, "APPROVED")}
                                                    className="h-10 px-5 rounded-xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white text-xs font-bold gap-1.5 shadow-xs"
                                                >
                                                    {actionLoading === app.id ? (
                                                        <>
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            Approving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="h-3.5 w-3.5" />
                                                            Approve & Lock Property
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {app.status === "APPROVED" && (
                                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>
                                                This application is approved! Listing is marked as <strong>Under Offer</strong>. Once the tenant deposits rent into Escrow, you will be notified for physical key handover.
                                            </span>
                                        </div>
                                    )}

                                    {app.status === "REJECTED" && (
                                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
                                            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                                            <span>This application was declined. The listing remains active for other prospective tenants.</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Strip */}
                    {filteredApplications.length > ITEMS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-color)]">
                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                Showing{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredApplications.length)}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {filteredApplications.length}
                                </span>{" "}
                                applications
                            </p>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-[var(--border-color)]"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                </Button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                                            currentPage === page
                                                ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-[var(--border-color)]"
                                >
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            </>
            )}
        </div>
    );
}

