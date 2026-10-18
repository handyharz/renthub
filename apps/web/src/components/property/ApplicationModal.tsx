"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Calendar, Clock, DollarSign, FileText, CheckCircle2, ShieldCheck, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: {
        id: string;
        title: string;
        pricePerYear: number;
        cautionFee?: number;
        legalFee?: number;
        address: string;
        city: string;
    };
    onSuccess?: () => void;
}

export function ApplicationModal({ isOpen, onClose, property, onSuccess }: ApplicationModalProps) {
    const { user } = useUser();
    const [proposedMoveInDate, setProposedMoveInDate] = useState("");
    const [leaseDuration, setLeaseDuration] = useState("12");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const durationMonths = parseInt(leaseDuration) || 12;
    const durationYears = durationMonths / 12;
    const rent = Math.round(property.pricePerYear * durationYears);
    const caution = property.cautionFee || 0;
    const legal = property.legalFee || 0;
    const platformFee = Math.round(rent * 0.02); // 2% tenant platform escrow fee
    const estimatedTotal = rent + caution + legal + platformFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proposedMoveInDate) {
            toast.error("Please select a proposed move-in date");
            return;
        }

        try {
            setLoading(true);

            await api.post("/applications", {
                propertyId: property.id,
                proposedMoveInDate,
                leaseDuration: parseInt(leaseDuration),
                note
            });

            toast.success("Rental Application Submitted!", {
                description: "The landlord has been notified to review your application."
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Application submission failed:", error);
            toast.error("Submission Failed", {
                description: error.response?.data?.message || "Could not submit application. Please try again."
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
                            <FileText className="h-5 w-5 text-[var(--color-brand-green)]" /> Apply to Rent
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{property.title} • {property.city}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                            Proposed Move-in Date *
                        </label>
                        <input
                            type="date"
                            required
                            min={new Date().toISOString().split("T")[0]}
                            value={proposedMoveInDate}
                            onChange={(e) => setProposedMoveInDate(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                            Lease Duration
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

                    <div>
                        <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                            Note for Landlord (Optional)
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Introduce yourself, employment status, or any questions..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] outline-none resize-none transition-colors"
                        />
                    </div>

                    {/* Estimated Cost Breakdown */}
                    <div className="bg-[var(--bg-muted)] rounded-xl p-4 border border-[var(--border-color)] text-xs space-y-2">
                        <div className="font-bold text-[var(--text-primary)] mb-1">Estimated Cost Breakdown (If Accepted)</div>
                        <div className="flex justify-between text-[var(--text-secondary)] font-medium">
                            <span>
                                {durationMonths === 12
                                    ? "Annual Rent (1 Year):"
                                    : `Rent (${durationYears} Years @ ${formatPrice(property.pricePerYear)}/yr):`}
                            </span>
                            <span className="font-bold text-[var(--text-primary)]">{formatPrice(rent)}</span>
                        </div>
                        {caution > 0 && (
                            <div className="flex justify-between text-[var(--text-secondary)] font-medium">
                                <span>Caution Deposit:</span>
                                <span className="font-bold text-[var(--text-primary)]">{formatPrice(caution)}</span>
                            </div>
                        )}
                        {legal > 0 && (
                            <div className="flex justify-between text-[var(--text-secondary)] font-medium">
                                <span>Legal Agreement Fee:</span>
                                <span className="font-bold text-[var(--text-primary)]">{formatPrice(legal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-[var(--color-brand-green)] font-bold">
                            <span>RentHub Escrow Platform Fee (2%):</span>
                            <span>{formatPrice(platformFee)}</span>
                        </div>
                        <div className="border-t border-[var(--border-color)] pt-2 flex justify-between font-extrabold text-sm text-[var(--text-primary)]">
                            <span>Total Estimated Escrow:</span>
                            <span className="text-[var(--color-brand-green)]">{formatPrice(estimatedTotal)}</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-[11px] text-[var(--text-secondary)] bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 font-medium">
                        <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>No payment is charged right now. If the landlord accepts your application, you will receive an offer lock and pay into RentHub Escrow.</span>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-bold">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold rounded-xl px-5"
                        >
                            {loading ? "Submitting..." : "Submit Application"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
