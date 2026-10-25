"use client";

import { useState } from "react";
import { ShieldCheck, Plus, Trash2, CheckCircle2, AlertCircle, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface MoveOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    cautionAmount: number;
    isLandlord: boolean;
    existingReport?: any;
    onSuccess: () => void;
}

export function MoveOutModal({
    isOpen,
    onClose,
    transactionId,
    cautionAmount,
    isLandlord,
    existingReport,
    onSuccess,
}: MoveOutModalProps) {
    const [notes, setNotes] = useState(existingReport?.notes || "");
    const [photoInput, setPhotoInput] = useState("");
    const [photos, setPhotos] = useState<string[]>(existingReport?.photos || []);
    const [deductions, setDeductions] = useState<{ item: string; amount: number; quoteUrl?: string }[]>(
        existingReport?.deductions || []
    );
    const [newItem, setNewItem] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleAddPhoto = () => {
        if (!photoInput.trim()) return;
        setPhotos([...photos, photoInput.trim()]);
        setPhotoInput("");
    };

    const handleAddDeduction = () => {
        const amt = Number(newAmount);
        if (!newItem.trim() || isNaN(amt) || amt <= 0) {
            toast.error("Please enter a valid item name and repair amount");
            return;
        }
        setDeductions([...deductions, { item: newItem.trim(), amount: amt }]);
        setNewItem("");
        setNewAmount("");
    };

    const handleRemoveDeduction = (idx: number) => {
        setDeductions(deductions.filter((_, i) => i !== idx));
    };

    const handleSubmitReport = async () => {
        setLoading(true);
        try {
            await api.post(`/transactions/${transactionId}/move-out-report`, {
                photos,
                notes,
                deductions: isLandlord ? deductions : undefined,
            });
            toast.success("Move-out condition report submitted!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit move-out report");
        } finally {
            setLoading(false);
        }
    };

    const handleResolveDeductions = async (accept: boolean) => {
        setLoading(true);
        try {
            await api.post(`/transactions/${transactionId}/caution-resolve`, {
                accept,
            });
            toast.success(accept ? "Deductions accepted. Caution refund dispatched!" : "Deductions contested. Sent to arbitration.");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to resolve caution deductions");
        } finally {
            setLoading(false);
        }
    };

    const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const netRefund = Math.max(0, cautionAmount - totalDeductions);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                                Caution Deposit & Move-Out Walkthrough
                            </h2>
                            <p className="text-xs text-[var(--text-secondary)]">Guide §6 Evidence-Based Deposit Protection</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Caution Escrow Balance Banner */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                            Protected Caution Vault
                        </span>
                        <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                            {formatPrice(cautionAmount)}
                        </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/20 px-2.5 py-1 rounded-xl">
                        Escrow Protected
                    </span>
                </div>

                {/* If Tenant reviewing landlord deductions */}
                {!isLandlord && existingReport?.status === "PENDING_TENANT_REVIEW" ? (
                    <div className="space-y-4 text-xs">
                        <p className="font-bold text-[var(--text-primary)]">Landlord has submitted proposed damage deductions:</p>
                        <div className="space-y-2 border border-[var(--border-color)] rounded-2xl p-3 bg-[var(--bg-muted)]/20">
                            {existingReport.deductions?.map((d: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-1 border-b border-[var(--border-color)] last:border-none">
                                    <span>{d.item}</span>
                                    <span className="font-bold text-red-500">- {formatPrice(d.amount)}</span>
                                </div>
                            ))}
                            <div className="pt-2 flex justify-between font-black text-sm text-[var(--text-primary)]">
                                <span>Net Caution Refund to You:</span>
                                <span className="text-emerald-600">{formatPrice(Math.max(0, cautionAmount - (existingReport.totalDeductions || totalDeductions)))}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="outline"
                                onClick={() => handleResolveDeductions(false)}
                                disabled={loading}
                                className="text-red-500 border-red-500/30 rounded-xl h-9 text-xs font-bold"
                            >
                                Contest to Arbitration
                            </Button>
                            <Button
                                onClick={() => handleResolveDeductions(true)}
                                disabled={loading}
                                className="bg-[var(--color-brand-green)] text-white rounded-xl h-9 text-xs font-bold"
                            >
                                Accept & Receive Net Refund
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 text-xs">
                        {/* Inspection Photos */}
                        <div className="space-y-2">
                            <label className="font-bold text-[var(--text-primary)]">Move-Out Photos / Inspection Evidence</label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={photoInput}
                                    onChange={(e) => setPhotoInput(e.target.value)}
                                    placeholder="Photo URL (e.g. Cloudinary link)"
                                    className="flex-1 h-9 px-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none"
                                />
                                <Button type="button" onClick={handleAddPhoto} className="h-9 px-3 rounded-xl text-xs font-bold shrink-0">
                                    Add
                                </Button>
                            </div>
                            {photos.length > 0 && (
                                <p className="text-[11px] text-[var(--text-secondary)]">{photos.length} photo(s) attached</p>
                            )}
                        </div>

                        {/* Landlord Itemized Deductions */}
                        {isLandlord && (
                            <div className="space-y-3 pt-2 border-t border-[var(--border-color)]">
                                <label className="font-bold text-[var(--text-primary)]">Itemized Damage Deductions (Optional)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newItem}
                                        onChange={(e) => setNewItem(e.target.value)}
                                        placeholder="Item (e.g., Repaint bedroom wall)"
                                        className="flex-1 h-9 px-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none"
                                    />
                                    <input
                                        type="number"
                                        value={newAmount}
                                        onChange={(e) => setNewAmount(e.target.value)}
                                        placeholder="₦ Amount"
                                        className="w-24 h-9 px-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none"
                                    />
                                    <Button type="button" onClick={handleAddDeduction} className="h-9 px-3 rounded-xl text-xs font-bold shrink-0">
                                        <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {deductions.length > 0 && (
                                    <div className="space-y-1.5 p-3 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border-color)]">
                                        {deductions.map((d, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs">
                                                <span>{d.item}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-red-500">- {formatPrice(d.amount)}</span>
                                                    <button onClick={() => handleRemoveDeduction(i)} className="text-red-400 hover:text-red-600">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t border-[var(--border-color)] flex justify-between font-bold">
                                            <span>Net Caution to Refund Tenant:</span>
                                            <span className="text-emerald-600">{formatPrice(netRefund)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="font-bold text-[var(--text-primary)]">Move-Out Walkthrough Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Property inspected on-site; all sockets and plumbing checked..."
                                className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs outline-none resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2.5 pt-2">
                            <Button variant="outline" onClick={onClose} className="rounded-xl h-9 text-xs">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitReport}
                                disabled={loading}
                                className="bg-[var(--color-brand-green)] text-white rounded-xl h-9 text-xs font-bold gap-1.5"
                            >
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Submit Condition Report
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
