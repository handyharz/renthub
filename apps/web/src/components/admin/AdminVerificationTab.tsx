"use client";

import { useState, useEffect } from "react";
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Home,
    User,
    Phone,
    Mail,
    Clock,
    Loader2,
    Eye,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";

interface PendingProperty {
    id: string;
    title: string;
    address: string;
    city: string;
    pricePerYear: number;
    bedrooms: number;
    bathrooms: number;
    status: string;
    createdAt: string;
    landlord: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        verified: boolean;
    };
    images: { url: string; isPrimary: boolean }[];
}

export function AdminVerificationTab({ onRefreshStats }: { onRefreshStats?: () => void }) {
    const [properties, setProperties] = useState<PendingProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<PendingProperty | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        fetchQueue();
    }, []);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/verifications");
            setProperties(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch verification queue:", error);
            toast.error("Failed to load verification queue");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (property: PendingProperty) => {
        try {
            setActionLoading(property.id);
            await api.post(`/admin/verifications/${property.id}/approve`);
            toast.success("Property Verified & Activated!", {
                description: `${property.title} has been granted the Verified Badge and is live on RentHub.`
            });
            fetchQueue();
            if (onRefreshStats) onRefreshStats();
        } catch (error: any) {
            console.error("Approve error:", error);
            toast.error(error.response?.data?.message || "Failed to approve property");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!selectedProperty) return;
        try {
            setActionLoading(selectedProperty.id);
            await api.post(`/admin/verifications/${selectedProperty.id}/reject`, { reason: rejectReason });
            toast.success("Property Verification Rejected", {
                description: "Landlord has been notified to amend the listing."
            });
            setShowRejectModal(false);
            setRejectReason("");
            setSelectedProperty(null);
            fetchQueue();
            if (onRefreshStats) onRefreshStats();
        } catch (error: any) {
            console.error("Reject error:", error);
            toast.error(error.response?.data?.message || "Failed to reject property");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-green)] mb-3" />
                <p className="font-semibold text-sm">Loading property verification queue...</p>
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 shadow-[var(--shadow-sm)]">
                <CheckCircle2 className="h-12 w-12 text-[var(--color-brand-green)] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Verification Queue Empty</h3>
                <p className="text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto mt-1">
                    All submitted properties have been physically inspected and verified by field agents.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-[var(--color-brand-green)]" />
                    Field Inspection Queue ({properties.length})
                </h2>
                <Button onClick={fetchQueue} variant="outline" size="sm" className="rounded-xl text-xs font-bold border-[var(--border-color)]">
                    Refresh Queue
                </Button>
            </div>

            <div className="grid gap-4">
                {properties.map((prop) => {
                    const primaryImage = prop.images?.find((img) => img.isPrimary)?.url || prop.images?.[0]?.url;

                    return (
                        <div key={prop.id} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-[var(--shadow-sm)] space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-xl bg-[var(--bg-muted)] overflow-hidden relative shrink-0 border border-[var(--border-color)]">
                                        {primaryImage ? (
                                            <Image src={primaryImage} alt="Property" fill className="object-cover" />
                                        ) : (
                                            <Home className="h-8 w-8 text-[var(--text-muted)] m-auto mt-4" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-[var(--text-primary)] text-base">{prop.title}</h3>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{prop.address}, {prop.city}</p>
                                        <div className="text-xs font-extrabold text-[var(--color-brand-green)] mt-1">
                                            {formatPrice(prop.pricePerYear)} / year • {prop.bedrooms} Beds • {prop.bathrooms} Baths
                                        </div>
                                    </div>
                                </div>

                                <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 px-3 py-1.5 font-bold self-start sm:self-center shrink-0">
                                    <Clock className="h-3.5 w-3.5 mr-1" /> Pending Inspection
                                </Badge>
                            </div>

                            {/* Landlord Info & Actions */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-muted)] p-4 rounded-xl border border-[var(--border-color)]">
                                <div className="space-y-1 text-xs text-[var(--text-secondary)] font-medium">
                                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 text-sm">
                                        <User className="h-4 w-4 text-[var(--color-brand-green)]" />
                                        Landlord: {prop.landlord.firstName} {prop.landlord.lastName}
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap pt-0.5">
                                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {prop.landlord.phone}</span>
                                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {prop.landlord.email}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <Button
                                        variant="outline"
                                        disabled={actionLoading === prop.id}
                                        onClick={() => { setSelectedProperty(prop); setShowRejectModal(true); }}
                                        className="text-red-500 border-red-500/30 hover:bg-red-500/10 text-xs font-bold rounded-xl h-10 px-4"
                                    >
                                        Reject Listing
                                    </Button>

                                    <Button
                                        disabled={actionLoading === prop.id}
                                        onClick={() => handleApprove(prop)}
                                        className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs rounded-xl h-10 px-5"
                                    >
                                        {actionLoading === prop.id ? "Verifying..." : "Approve & Grant Verified Badge"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reject Modal */}
            {showRejectModal && selectedProperty && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <h3 className="font-extrabold text-[var(--text-primary)] text-lg">Reject Property Verification</h3>
                        </div>

                        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                            Specify the reason for rejecting <strong>{selectedProperty.title}</strong> so the landlord can correct it.
                        </p>

                        <textarea
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Photos are blurry, address requires clarification, missing caution fee details..."
                            className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:border-red-500 resize-none font-medium"
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setShowRejectModal(false)} className="rounded-xl text-xs font-bold border-[var(--border-color)]">
                                Cancel
                            </Button>
                            <Button onClick={handleReject} disabled={actionLoading === selectedProperty.id} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl px-4">
                                {actionLoading === selectedProperty.id ? "Rejecting..." : "Confirm Rejection"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
