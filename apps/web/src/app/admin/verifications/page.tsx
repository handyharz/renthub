"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
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
    updatedAt: string;
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

export default function AdminVerificationsPage() {
    const [properties, setProperties] = useState<VerificationProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchQueue = () => {
        setLoading(true);
        api.get("/admin/verifications")
            .then((res) => setProperties(res.data.data))
            .catch(() => toast.error("Failed to load verification queue"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchQueue(); }, []);

    const handleApprove = async (id: string) => {
        setActionId(id);
        try {
            await api.post(`/admin/verifications/${id}/approve`);
            toast.success("Property verified — badge issued");
            setProperties((prev) => prev.filter((p) => p.id !== id));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Approval failed");
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt("Rejection reason (optional):");
        if (reason === null) return;
        setActionId(id);
        try {
            await api.post(`/admin/verifications/${id}/reject`, { reason });
            toast.success("Verification rejected");
            setProperties((prev) => prev.filter((p) => p.id !== id));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Rejection failed");
        } finally {
            setActionId(null);
        }
    };

    return (
        <>
            <AdminHeader
                title="Verification Queue"
                description="Properties that paid ₦20,000 — awaiting field inspection"
            />
            <div className="flex-1 p-6 overflow-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-green)] border-t-transparent" />
                    </div>
                ) : properties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <CheckCircle2 className="h-12 w-12 text-[var(--color-brand-green)] mb-4" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">Queue is clear</h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">No properties pending review.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {properties.map((property) => {
                            const primaryImage = property.images.find((i) => i.isPrimary) || property.images[0];
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
                                                        <Badge variant="outline" className="border-[var(--color-brand-orange)]/40 text-[var(--color-brand-orange)]">
                                                            Pending Review
                                                        </Badge>
                                                    </div>
                                                    <p className="flex items-center gap-1 text-sm text-[var(--text-muted)] mt-1">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {property.address}, {property.city}
                                                    </p>
                                                    <p className="text-sm font-semibold text-[var(--color-brand-green)] mt-2">
                                                        {formatPrice(property.pricePerYear)}/yr · {property.bedrooms} bed · {property.propertyType}
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
                                                    Landlord
                                                </p>
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                    {property.landlord.firstName} {property.landlord.lastName}
                                                    {property.landlord.verified && (
                                                        <Badge variant="success" className="ml-2 text-[10px]">Verified</Badge>
                                                    )}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">{property.landlord.email} · {property.landlord.phone}</p>
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
                                                    onClick={() => handleReject(property.id)}
                                                    className="gap-1.5"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                    Reject
                                                </Button>
                                            </div>
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
