"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Calendar,
    Clock,
    DollarSign,
    FileText,
    ShieldCheck,
    AlertCircle,
    X,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    Building2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export interface PropertyItem {
    id: string;
    title: string;
    pricePerYear: number;
    cautionFee?: number;
    address: string;
    city: string;
}

interface OfferRenewalModalProps {
    isOpen: boolean;
    onClose: () => void;
    property?: PropertyItem | null;
    properties?: PropertyItem[];
    tenant?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
    };
    onSuccess?: () => void;
}

export function OfferRenewalModal({
    isOpen,
    onClose,
    property,
    properties = [],
    tenant,
    onSuccess
}: OfferRenewalModalProps) {
    const { user } = useUser();

    // Default to passed property or first in list
    const [selectedPropId, setSelectedPropId] = useState<string>(
        property?.id || properties[0]?.id || ""
    );

    const activeProperty =
        (properties.length > 0
            ? properties.find((p) => p.id === selectedPropId) || property || properties[0]
            : property) || null;

    const [offeredRent, setOfferedRent] = useState<number>(
        Number(activeProperty?.pricePerYear) || 1000000
    );
    const [leaseDuration, setLeaseDuration] = useState<string>("12");
    const [landlordNote, setLandlordNote] = useState<string>("");
    const [loading, setLoading] = useState(false);

    // Synchronize whenever modal opens or active property changes
    useEffect(() => {
        if (isOpen && activeProperty) {
            const basePrice = Number(activeProperty.pricePerYear) || 1000000;
            setOfferedRent(basePrice);
            if (activeProperty.id) {
                setSelectedPropId(activeProperty.id);
            }
        }
    }, [isOpen, activeProperty?.id, activeProperty?.pricePerYear]);

    if (!isOpen) return null;

    const durationMonths = parseInt(leaseDuration) || 12;
    const durationYears = durationMonths / 12;
    const rentNum = Number(offeredRent) || 0;
    const totalRent = Math.round(rentNum * durationYears);
    const landlordFee = Math.round(totalRent * 0.02); // 2% deducted from landlord
    const netLandlordPayout = Math.max(0, totalRent - landlordFee); // 98%
    const tenantFee = Math.round(totalRent * 0.02); // 2% tenant pays on top
    const tenantTotalToPay = totalRent + tenantFee;

    const applyPercentage = (pct: number) => {
        const base = Number(activeProperty?.pricePerYear) || rentNum || 1000000;
        if (pct === 0) {
            setOfferedRent(base);
            return;
        }
        const adjusted = Math.round((base * (1 + pct / 100)) / 1000) * 1000;
        setOfferedRent(adjusted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rentNum || isNaN(rentNum) || rentNum <= 0) {
            toast.error("Please enter a valid renewal rent amount");
            return;
        }

        if (!activeProperty?.id) {
            toast.error("Please select a property for the renewal offer");
            return;
        }

        try {
            setLoading(true);

            await api.post(`/renewals/offer?clerkId=${user?.id}`, {
                propertyId: activeProperty.id,
                tenantId: tenant?.id,
                offeredRent: rentNum,
                leaseDuration: parseInt(leaseDuration),
                landlordNote
            });

            toast.success("Renewal Offer Sent!", {
                description: `Your tenant has been notified of the renewal offer for ${activeProperty.title}.`
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Renewal offer failed:", error);
            toast.error("Failed to Send Offer", {
                description: error.response?.data?.message || "Could not send renewal offer. Please try again."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-[var(--color-brand-green)]" /> Offer Lease Renewal
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-sm">
                            {activeProperty?.title || "Select a property"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Property Selector (if multiple properties exist) */}
                    {properties.length > 1 && (
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                                Select Rented Property *
                            </label>
                            <select
                                value={selectedPropId}
                                onChange={(e) => {
                                    setSelectedPropId(e.target.value);
                                    const selected = properties.find((p) => p.id === e.target.value);
                                    if (selected?.pricePerYear) {
                                        setOfferedRent(Number(selected.pricePerYear));
                                    }
                                }}
                                className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] outline-none transition-colors"
                            >
                                {properties.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.title} ({formatPrice(p.pricePerYear)}/yr)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Tenant Info */}
                    {tenant && (
                        <div className="bg-[var(--bg-muted)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between text-xs">
                            <span className="text-[var(--text-secondary)] font-medium">Current Tenant:</span>
                            <span className="font-bold text-[var(--text-primary)]">
                                {tenant.firstName} {tenant.lastName}
                            </span>
                        </div>
                    )}

                    {/* Proposed Annual Rent */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-[var(--text-primary)]">
                                Proposed Annual Rent (₦/yr) *
                            </label>
                            {activeProperty && (
                                <span className="text-[11px] text-[var(--text-muted)] font-medium">
                                    Current: {formatPrice(activeProperty.pricePerYear)}/yr
                                </span>
                            )}
                        </div>
                        <input
                            type="number"
                            required
                            min={1}
                            step="any"
                            value={offeredRent > 0 ? offeredRent : ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                setOfferedRent(val === "" ? 0 : Number(val));
                            }}
                            placeholder="e.g. 1500000"
                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] outline-none transition-colors"
                        />
                        {/* Quick adjust percentage buttons */}
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => applyPercentage(0)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors active:scale-95"
                            >
                                Same Rent
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPercentage(5)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors active:scale-95"
                            >
                                +5%
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPercentage(10)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors active:scale-95"
                            >
                                +10%
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPercentage(15)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors active:scale-95"
                            >
                                +15%
                            </button>
                        </div>
                    </div>

                    {/* Lease Duration */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                            Renewal Lease Duration
                        </label>
                        <select
                            value={leaseDuration}
                            onChange={(e) => setLeaseDuration(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] outline-none transition-colors"
                        >
                            <option value="12">1 Year (12 Months)</option>
                            <option value="24">2 Years (24 Months)</option>
                        </select>
                    </div>

                    {/* Note to Tenant */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                            Personal Note to Tenant (Optional)
                        </label>
                        <textarea
                            rows={2}
                            placeholder="e.g. Thank you for taking great care of the home! We are happy to invite you to renew..."
                            value={landlordNote}
                            onChange={(e) => setLandlordNote(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] outline-none resize-none transition-colors"
                        />
                    </div>

                    {/* Settlement Breakdown */}
                    <div className="bg-[var(--bg-muted)] rounded-2xl p-4 border border-[var(--border-color)] text-xs space-y-2">
                        <div className="font-bold text-[var(--text-primary)] mb-1">Renewal Settlement Breakdown</div>
                        <div className="flex justify-between text-[var(--text-secondary)] font-medium">
                            <span>
                                {durationMonths === 12
                                    ? "Annual Rent:"
                                    : `Rent (${durationYears} Years @ ${formatPrice(rentNum)}/yr):`}
                            </span>
                            <span className="font-bold text-[var(--text-primary)]">{formatPrice(totalRent)}</span>
                        </div>
                        <div className="flex justify-between text-red-500 font-semibold">
                            <span>Landlord Escrow Fee (2% from rent):</span>
                            <span>- {formatPrice(landlordFee)}</span>
                        </div>
                        <div className="border-t border-[var(--border-color)]/60 pt-1.5 flex justify-between font-extrabold text-emerald-600 dark:text-emerald-400">
                            <span>Your Net Bank Payout (98%):</span>
                            <span className="text-sm">{formatPrice(netLandlordPayout)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]/40">
                            <span>Caution Deposit Rollover:</span>
                            <span className="text-emerald-500 font-bold">₦0 (Rolled over from existing escrow)</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-xl border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || rentNum <= 0}
                            className="rounded-xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold flex items-center gap-2"
                        >
                            {loading ? "Sending Offer..." : "Send Renewal Offer"}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
