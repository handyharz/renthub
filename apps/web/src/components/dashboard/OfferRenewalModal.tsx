"use client";

import { useState } from "react";
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
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface OfferRenewalModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: {
        id: string;
        title: string;
        pricePerYear: number;
        cautionFee?: number;
        address: string;
        city: string;
    };
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
    tenant,
    onSuccess
}: OfferRenewalModalProps) {
    const { user } = useUser();
    const [offeredRent, setOfferedRent] = useState<number>(property.pricePerYear || 0);
    const [leaseDuration, setLeaseDuration] = useState<string>("12");
    const [landlordNote, setLandlordNote] = useState<string>("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const durationMonths = parseInt(leaseDuration) || 12;
    const durationYears = durationMonths / 12;
    const totalRent = Math.round(offeredRent * durationYears);
    const landlordFee = Math.round(totalRent * 0.02); // 2% deducted from landlord
    const netLandlordPayout = totalRent - landlordFee; // 98%
    const tenantFee = Math.round(totalRent * 0.02); // 2% tenant pays on top
    const tenantTotalToPay = totalRent + tenantFee;

    const applyPercentage = (pct: number) => {
        const base = property.pricePerYear || 0;
        const adjusted = Math.round(base * (1 + pct / 100));
        setOfferedRent(adjusted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!offeredRent || offeredRent <= 0) {
            toast.error("Please enter a valid renewal rent amount");
            return;
        }

        try {
            setLoading(true);

            await api.post(`/renewals/offer?clerkId=${user?.id}`, {
                propertyId: property.id,
                tenantId: tenant?.id,
                offeredRent,
                leaseDuration: parseInt(leaseDuration),
                landlordNote
            });

            toast.success("Renewal Offer Sent!", {
                description: `Your tenant has been notified of the renewal offer for ${property.title}.`
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
                            {property.title} • {property.city}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                            <span className="text-[11px] text-[var(--text-muted)]">
                                Current: {formatPrice(property.pricePerYear)}/yr
                            </span>
                        </div>
                        <input
                            type="number"
                            required
                            min={10000}
                            step={10000}
                            value={offeredRent}
                            onChange={(e) => setOfferedRent(Number(e.target.value))}
                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] outline-none transition-colors"
                        />
                        {/* Quick adjust percentage buttons */}
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => applyPercentage(0)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors"
                            >
                                Same Rent
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPercentage(5)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors"
                            >
                                +5%
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPercentage(10)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors"
                            >
                                +10%
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPercentage(15)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] transition-colors"
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
                                    : `Rent (${durationYears} Years @ ${formatPrice(offeredRent)}/yr):`}
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
                            disabled={loading}
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
