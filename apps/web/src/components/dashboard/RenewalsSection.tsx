"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Sparkles,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRight,
    ShieldCheck,
    AlertCircle,
    Loader2,
    RefreshCw,
    Home,
    User,
    DollarSign,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { OfferRenewalModal } from "./OfferRenewalModal";
import Link from "next/link";

export interface LeaseRenewalItem {
    id: string;
    propertyId: string;
    tenantId: string;
    landlordId: string;
    currentRent: number;
    offeredRent: number;
    leaseDuration: number;
    currentLeaseEndDate: string;
    newLeaseStartDate: string;
    newLeaseEndDate: string;
    platformFeeTenant: number;
    platformFeeLandlord: number;
    cautionRolledOver: boolean;
    cautionAmount: number;
    status:
        | "OFFERED_BY_LANDLORD"
        | "PENDING_TENANT_REVIEW"
        | "COUNTER_OFFERED"
        | "ACCEPTED"
        | "PAID_IN_ESCROW"
        | "COMPLETED"
        | "DECLINED"
        | "CANCELLED";
    landlordNote?: string;
    tenantNote?: string;
    createdAt: string;
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        images?: { url: string; isPrimary: boolean }[];
    };
    tenant?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
    };
    landlord?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
    };
}

interface RenewalsSectionProps {
    role: "LANDLORD" | "TENANT";
    properties?: any[]; // for landlords to pick property to renew
}

export function RenewalsSection({ role, properties = [] }: RenewalsSectionProps) {
    const { user } = useUser();
    const [renewals, setRenewals] = useState<LeaseRenewalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal state for Landlord
    const [selectedPropertyForRenewal, setSelectedPropertyForRenewal] = useState<any | null>(null);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

    const fetchRenewals = async () => {
        try {
            const endpoint = role === "LANDLORD" ? "/renewals/landlord" : "/renewals/tenant";
            const res = await api.get(`${endpoint}?clerkId=${user?.id}`);
            if (res.data?.success) {
                setRenewals(res.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch renewals:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchRenewals();
        }
    }, [user?.id, role]);

    const handleTenantResponse = async (renewalId: string, action: "ACCEPT" | "DECLINE") => {
        try {
            setActionLoading(renewalId);
            const res = await api.patch(`/renewals/${renewalId}/respond?clerkId=${user?.id}`, {
                action
            });

            if (res.data?.success) {
                toast.success(
                    action === "ACCEPT"
                        ? "Renewal Offer Accepted! Please proceed to pay rent into escrow."
                        : "Renewal Offer Declined"
                );
                fetchRenewals();
            }
        } catch (error: any) {
            console.error("Failed to respond to renewal:", error);
            toast.error("Action Failed", {
                description: error.response?.data?.message || "Could not update renewal offer"
            });
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: LeaseRenewalItem["status"]) => {
        switch (status) {
            case "OFFERED_BY_LANDLORD":
            case "PENDING_TENANT_REVIEW":
                return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold">Offer Pending Review</Badge>;
            case "ACCEPTED":
                return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold">Accepted • Awaiting Escrow</Badge>;
            case "PAID_IN_ESCROW":
            case "COMPLETED":
                return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold">Renewed & Protected</Badge>;
            case "DECLINED":
                return <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 font-bold">Declined</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="py-8 flex items-center justify-center text-xs text-[var(--text-muted)] gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-brand-green)]" />
                <span>Loading lease renewals...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[var(--color-brand-green)]" />
                        Lease Renewals & 1-Click Extensions
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {role === "LANDLORD"
                            ? "Automated renewal proposals with zero agent fees, 2% escrow protection, and rollover caution custody."
                            : "Direct renewal offers from your landlord. Zero 10% agent commission and your caution deposit carries over."}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setRefreshing(true);
                            fetchRenewals();
                        }}
                        disabled={refreshing}
                        className="rounded-xl border-[var(--border-color)] text-xs h-9"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>

                    {role === "LANDLORD" && properties.length > 0 && (
                        <Button
                            size="sm"
                            onClick={() => {
                                setSelectedPropertyForRenewal(properties[0]);
                                setIsOfferModalOpen(true);
                            }}
                            className="rounded-xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white text-xs font-bold h-9 shadow-xs"
                        >
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            Offer Lease Renewal
                        </Button>
                    )}
                </div>
            </div>

            {/* Renewals List */}
            {renewals.length === 0 ? (
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">No Active Renewal Offers</h4>
                    <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                        {role === "LANDLORD"
                            ? "When your tenant approaches the end of their lease (at 90 or 60 days), send them a 1-click renewal offer here to lock in another year with 0 vacancy downtime."
                            : "When your current lease approaches expiration, your landlord will send you a renewal offer directly here with 0% agent commission and rolled-over caution."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3.5">
                    {renewals.map((item) => {
                        const totalOfferedRent = item.offeredRent * (item.leaseDuration / 12);
                        const landlordNet = totalOfferedRent - item.platformFeeLandlord;
                        const tenantTotal = totalOfferedRent + item.platformFeeTenant;

                        return (
                            <div
                                key={item.id}
                                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 shadow-xs hover:border-[var(--color-brand-green)]/30 transition-all space-y-3.5"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[var(--color-brand-green)] flex items-center justify-center shrink-0">
                                            <Home className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[var(--text-primary)]">
                                                {item.property?.title}
                                            </h4>
                                            <p className="text-[11px] text-[var(--text-muted)]">
                                                {item.property?.address}, {item.property?.city}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(item.status)}
                                    </div>
                                </div>

                                {/* Financial Details Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[var(--bg-muted)] p-3 rounded-xl border border-[var(--border-color)] text-xs">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Proposed Rent</span>
                                        <span className="font-extrabold text-[var(--text-primary)] mt-0.5 block">
                                            {formatPrice(item.offeredRent)}/yr
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Lease Duration</span>
                                        <span className="font-extrabold text-[var(--text-primary)] mt-0.5 block">
                                            {item.leaseDuration} Months ({item.leaseDuration / 12} Yr)
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Caution Rollover</span>
                                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                                            ₦0 (Protected in Escrow)
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                                            {role === "LANDLORD" ? "Your Net Payout (98%)" : "Total to Pay (Rent + 2%)"}
                                        </span>
                                        <span className="font-extrabold text-[var(--color-brand-green)] mt-0.5 block">
                                            {role === "LANDLORD" ? formatPrice(landlordNet) : formatPrice(tenantTotal)}
                                        </span>
                                    </div>
                                </div>

                                {/* Note / Message */}
                                {item.landlordNote && (
                                    <div className="text-xs text-[var(--text-secondary)] bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl font-medium">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">Landlord Note: </span>
                                        {item.landlordNote}
                                    </div>
                                )}

                                {/* Tenant Action Bar */}
                                {role === "TENANT" && (item.status === "OFFERED_BY_LANDLORD" || item.status === "PENDING_TENANT_REVIEW") && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 border-t border-[var(--border-color)]">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                                            <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-brand-green)]" />
                                            <span>No agent renewal fee. Protected by RentHub Escrow.</span>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleTenantResponse(item.id, "DECLINE")}
                                                disabled={actionLoading === item.id}
                                                className="rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold flex-1 sm:flex-none"
                                            >
                                                Decline
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleTenantResponse(item.id, "ACCEPT")}
                                                disabled={actionLoading === item.id}
                                                className="rounded-xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white text-xs font-extrabold flex items-center gap-1.5 flex-1 sm:flex-none shadow-xs"
                                            >
                                                {actionLoading === item.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Check className="h-3.5 w-3.5" />
                                                )}
                                                Accept & Lock Renewal
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {role === "TENANT" && item.status === "ACCEPTED" && (
                                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                            <CheckCircle2 className="h-4 w-4" /> Renewal accepted! Pay into escrow to commence next term.
                                        </span>
                                        <Link href={`/properties/${item.propertyId}/rent`}>
                                            <Button size="sm" className="rounded-xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white text-xs font-bold">
                                                Pay into Escrow ({formatPrice(tenantTotal)})
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Offer Renewal Modal for Landlords */}
            {isOfferModalOpen && (
                <OfferRenewalModal
                    isOpen={isOfferModalOpen}
                    onClose={() => {
                        setIsOfferModalOpen(false);
                        setSelectedPropertyForRenewal(null);
                    }}
                    property={selectedPropertyForRenewal}
                    properties={properties}
                    onSuccess={() => {
                        fetchRenewals();
                    }}
                />
            )}
        </div>
    );
}
