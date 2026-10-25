"use client";

import { useState } from "react";
import { KeyRound, Upload, CheckCircle2, AlertTriangle, ShieldCheck, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { toast } from "sonner";

interface HandoverProofModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    isLandlord: boolean;
    existingProof?: any;
    onSuccess: () => void;
}

export function HandoverProofModal({
    isOpen,
    onClose,
    transactionId,
    isLandlord,
    existingProof,
    onSuccess,
}: HandoverProofModalProps) {
    const [proofUrl, setProofUrl] = useState(existingProof?.proofUrl || "");
    const [notes, setNotes] = useState(existingProof?.notes || "");
    const [contestReason, setContestReason] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmitLandlordProof = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proofUrl.trim()) {
            toast.error("Please provide a photo or document URL of the signed key handover acknowledgment");
            return;
        }

        setLoading(true);
        try {
            await api.post(`/transactions/${transactionId}/handover-proof`, {
                proofUrl: proofUrl.trim(),
                notes: notes.trim(),
            });
            toast.success("Handover proof submitted! Tenant has 24 hours to challenge.");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit handover proof");
        } finally {
            setLoading(false);
        }
    };

    const handleTenantResponse = async (contest: boolean) => {
        setLoading(true);
        try {
            await api.post(`/transactions/${transactionId}/handover-challenge`, {
                contest,
                reason: contest ? contestReason : undefined,
            });
            toast.success(contest ? "Dispute recorded. Case moved to arbitration." : "Key handover confirmed! Rent released.");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to process handover response");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                                {isLandlord ? "Proof of Key Handover" : "Review Landlord Handover Claim"}
                            </h2>
                            <p className="text-xs text-[var(--text-secondary)]">Guide §5.3 Handover Resolution Protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {isLandlord ? (
                    <form onSubmit={handleSubmitLandlordProof} className="space-y-4 text-xs">
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                            If the tenant has occupied the apartment but withheld the 6-digit OTP, submit photo evidence of key exchange or signed meter acknowledgment. The tenant will receive a 24-hour response timer.
                        </p>

                        <div className="space-y-1.5">
                            <label className="font-bold text-[var(--text-primary)]">Evidence Document / Photo URL *</label>
                            <input
                                type="url"
                                required
                                value={proofUrl}
                                onChange={(e) => setProofUrl(e.target.value)}
                                placeholder="https://res.cloudinary.com/... or document link"
                                className="w-full h-10 px-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:ring-1 focus:ring-[var(--color-brand-green)] outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-[var(--text-primary)]">Handover Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Met tenant on-site, keys handed over, meter reading recorded at 0492..."
                                className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:ring-1 focus:ring-[var(--color-brand-green)] outline-none resize-none"
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-2.5">
                            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-9 text-xs">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-[var(--color-brand-green)] text-white rounded-xl h-9 text-xs font-bold gap-1.5">
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Submit Proof of Handover
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4 text-xs">
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>Landlord has declared keys were exchanged</span>
                            </div>
                            <p className="text-[var(--text-secondary)]">
                                Notes: {existingProof?.notes || "No notes provided"}
                            </p>
                            {existingProof?.proofUrl && (
                                <a
                                    href={existingProof.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[var(--color-brand-green)] underline font-bold block"
                                >
                                    View Landlord Proof Document
                                </a>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="font-bold text-[var(--text-primary)]">If contesting, explain defect or non-receipt:</label>
                            <textarea
                                value={contestReason}
                                onChange={(e) => setContestReason(e.target.value)}
                                rows={2}
                                placeholder="Explain why keys were not accepted..."
                                className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="outline"
                                onClick={() => handleTenantResponse(true)}
                                disabled={loading}
                                className="text-red-500 border-red-500/30 hover:bg-red-500/10 rounded-xl h-9 text-xs font-bold"
                            >
                                Contest Handover
                            </Button>
                            <Button
                                onClick={() => handleTenantResponse(false)}
                                disabled={loading}
                                className="bg-[var(--color-brand-green)] text-white rounded-xl h-9 text-xs font-bold"
                            >
                                Confirm Possession & Release
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
