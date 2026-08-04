"use client";

import { useEffect, useState } from "react";
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
    Star
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";

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
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchApplications();
        }
    }, [user]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const res = await api.get("/applications/landlord");
            setApplications(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch landlord applications:", error);
            toast.error("Failed to load rental applications");
        } finally {
            setLoading(false);
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
                            ? "The property status has been updated to UNDER_OFFER so the tenant can complete escrow payment."
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-green)] mb-3" />
                <p className="font-semibold text-sm">Loading applications...</p>
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <div className="text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-8 shadow-[var(--shadow-sm)]">
                <FileText className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">No Rental Applications Yet</h3>
                <p className="text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto mt-1">
                    When prospective tenants submit rental applications for your properties, they will appear here for your review and approval.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[var(--color-brand-green)]" /> Applicant Queue ({applications.length})
                </h2>
            </div>

            <div className="grid gap-4">
                {applications.map((app) => {
                    const primaryImage = app.property.images?.find((img) => img.isPrimary)?.url || app.property.images?.[0]?.url;

                    return (
                        <div
                            key={app.id}
                            className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-[var(--shadow-sm)] space-y-4"
                        >
                            {/* Property & Status Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-[var(--bg-muted)] overflow-hidden relative shrink-0 border border-[var(--border-color)]">
                                        {primaryImage ? (
                                            <Image src={primaryImage} alt="Property" fill className="object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-[var(--bg-muted)] text-[var(--text-muted)]">
                                                <Home className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)] text-sm leading-tight">{app.property.title}</h3>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{app.property.address}, {app.property.city}</p>
                                        <div className="text-xs font-extrabold text-[var(--color-brand-green)] mt-0.5">
                                            {formatPrice(app.property.pricePerYear)} / year
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    {app.status === "PENDING" && (
                                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 px-3 py-1 font-bold flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" /> Pending Review
                                        </Badge>
                                    )}
                                    {app.status === "APPROVED" && (
                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 font-bold flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Approved & Locked
                                        </Badge>
                                    )}
                                    {app.status === "REJECTED" && (
                                        <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 px-3 py-1 font-bold flex items-center gap-1">
                                            <XCircle className="h-3.5 w-3.5" /> Declined
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Tenant Profile Card */}
                            <div className="bg-[var(--bg-muted)] rounded-xl p-4 border border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] flex items-center justify-center font-extrabold text-sm shrink-0 border border-[var(--border-color)]">
                                        {app.tenant.firstName?.[0]}{app.tenant.lastName?.[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-[var(--text-primary)] text-sm">
                                                {app.tenant.firstName} {app.tenant.lastName}
                                            </span>
                                            {app.tenant.phoneVerified && (
                                                <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] px-2 py-0.5 font-bold flex items-center gap-1">
                                                    <ShieldCheck className="h-3 w-3" /> Verified Phone
                                                </Badge>
                                            )}
                                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] px-2 py-0.5 font-bold flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 5.0 ⭐ Verified Tenant Score
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] font-medium mt-1">
                                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {app.tenant.phone}</span>
                                            {app.tenant.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {app.tenant.email}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-xs space-y-1 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)] shrink-0">
                                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-medium">
                                        <Calendar className="h-3.5 w-3.5 text-[var(--color-brand-green)] shrink-0" />
                                        <span>Proposed Move-in: <strong className="text-[var(--text-primary)]">{new Date(app.proposedMoveInDate).toLocaleDateString()}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-medium">
                                        <Clock className="h-3.5 w-3.5 text-[var(--color-brand-green)] shrink-0" />
                                        <span>Lease Duration: <strong className="text-[var(--text-primary)]">{app.leaseDuration} Months</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* Application Note */}
                            {app.note && (
                                <div className="text-xs text-[var(--text-secondary)] font-medium bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/20">
                                    <strong className="text-[var(--text-primary)] block mb-1 font-bold">Applicant's Note:</strong>
                                    "{app.note}"
                                </div>
                            )}

                            {/* Actions */}
                            {app.status === "PENDING" && (
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        disabled={actionLoading === app.id}
                                        onClick={() => handleUpdateStatus(app.id, "REJECTED")}
                                        className="text-red-500 border-red-500/30 hover:bg-red-500/10 text-xs font-bold rounded-xl h-10 px-4"
                                    >
                                        Decline
                                    </Button>
                                    <Button
                                        disabled={actionLoading === app.id}
                                        onClick={() => handleUpdateStatus(app.id, "APPROVED")}
                                        className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white text-xs font-bold rounded-xl h-10 px-5"
                                    >
                                        {actionLoading === app.id ? "Approving..." : "Approve & Lock Property"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
