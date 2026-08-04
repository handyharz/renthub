"use client";

import { useState, useEffect } from "react";
import {
    AlertCircle,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Home,
    User,
    Phone,
    Mail,
    Loader2,
    RotateCcw,
    Send
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface DisputeTransaction {
    id: string;
    totalAmount: number;
    rentAmount: number;
    cautionFee: number;
    legalFee: number;
    disputeReason?: string;
    createdAt: string;
    updatedAt: string;
    tenant: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        landlord: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
        };
    };
}

export function AdminDisputesTab({ onRefreshStats }: { onRefreshStats?: () => void }) {
    const [disputes, setDisputes] = useState<DisputeTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [selectedTx, setSelectedTx] = useState<DisputeTransaction | null>(null);
    const [actionType, setActionType] = useState<"release" | "refund">("refund");
    const [resolutionNote, setResolutionNote] = useState("");
    const [showResolveModal, setShowResolveModal] = useState(false);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/disputes");
            setDisputes(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch disputes:", error);
            toast.error("Failed to load escrow disputes");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenResolveModal = (tx: DisputeTransaction, type: "release" | "refund") => {
        setSelectedTx(tx);
        setActionType(type);
        setResolutionNote("");
        setShowResolveModal(true);
    };

    const handleConfirmResolve = async () => {
        if (!selectedTx) return;

        try {
            setActionLoading(selectedTx.id);
            await api.post(`/admin/disputes/${selectedTx.id}/resolve`, {
                action: actionType,
                note: resolutionNote
            });

            toast.success(
                actionType === "refund"
                    ? "Escrow Refunded to Tenant!"
                    : "Escrow Released to Landlord!",
                {
                    description: `Transaction #${selectedTx.id.slice(-6).toUpperCase()} has been resolved by Admin.`
                }
            );

            setShowResolveModal(false);
            setSelectedTx(null);
            fetchDisputes();
            if (onRefreshStats) onRefreshStats();
        } catch (error: any) {
            console.error("Resolve dispute error:", error);
            toast.error(error.response?.data?.message || "Failed to resolve dispute");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
                <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-3" />
                <p className="font-semibold text-sm">Loading active escrow disputes...</p>
            </div>
        );
    }

    if (disputes.length === 0) {
        return (
            <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 shadow-[var(--shadow-sm)]">
                <ShieldCheck className="h-12 w-12 text-[var(--color-brand-green)] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">No Locked Escrow Disputes</h3>
                <p className="text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto mt-1">
                    All escrow transactions are progressing smoothly through key handover.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    Locked Escrow Dispute Center ({disputes.length})
                </h2>
                <Button onClick={fetchDisputes} variant="outline" size="sm" className="rounded-xl text-xs font-bold border-[var(--border-color)]">
                    Refresh Disputes
                </Button>
            </div>

            <div className="grid gap-4">
                {disputes.map((tx) => (
                    <div key={tx.id} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-red-500/30 shadow-[var(--shadow-sm)] space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                            <div>
                                <h3 className="font-extrabold text-[var(--text-primary)] text-base">{tx.property.title}</h3>
                                <p className="text-xs text-[var(--text-secondary)] font-medium">{tx.property.city} • Amount Locked: <strong className="text-[var(--text-primary)]">{formatPrice(tx.totalAmount)}</strong></p>
                            </div>

                            <Badge className="bg-red-500/15 text-red-500 border-red-500/30 font-extrabold text-xs px-3 py-1 self-start sm:self-center">
                                ESCROW LOCKED / DISPUTED
                            </Badge>
                        </div>

                        {/* Dispute Reason */}
                        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-xs space-y-1">
                            <span className="font-extrabold text-red-500 uppercase tracking-widest block text-[10px]">Tenant Claim Reason:</span>
                            <p className="text-[var(--text-primary)] font-bold text-sm leading-relaxed">
                                "{tx.disputeReason || "No specific reason logged"}"
                            </p>
                        </div>

                        {/* Tenant vs Landlord Contacts */}
                        <div className="grid md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-[var(--bg-muted)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-1">
                                <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 text-sm">
                                    <User className="h-4 w-4 text-blue-500" />
                                    Tenant: {tx.tenant.firstName} {tx.tenant.lastName}
                                </div>
                                <div className="text-[var(--text-secondary)] font-medium">Phone: {tx.tenant.phone}</div>
                                <div className="text-[var(--text-secondary)] font-medium">Email: {tx.tenant.email}</div>
                            </div>

                            <div className="bg-[var(--bg-muted)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-1">
                                <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 text-sm">
                                    <User className="h-4 w-4 text-[var(--color-brand-green)]" />
                                    Landlord: {tx.property.landlord.firstName} {tx.property.landlord.lastName}
                                </div>
                                <div className="text-[var(--text-secondary)] font-medium">Phone: {tx.property.landlord.phone}</div>
                                <div className="text-[var(--text-secondary)] font-medium">Email: {tx.property.landlord.email}</div>
                            </div>
                        </div>

                        {/* Admin Resolution Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                disabled={actionLoading === tx.id}
                                onClick={() => handleOpenResolveModal(tx, "refund")}
                                className="text-red-500 border-red-500/30 hover:bg-red-500/10 text-xs font-bold rounded-xl h-10 px-4 gap-1.5"
                            >
                                <RotateCcw className="h-4 w-4" /> Force Refund to Tenant
                            </Button>

                            <Button
                                disabled={actionLoading === tx.id}
                                onClick={() => handleOpenResolveModal(tx, "release")}
                                className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs rounded-xl h-10 px-5 gap-1.5"
                            >
                                <Send className="h-4 w-4" /> Force Release to Landlord
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resolve Modal */}
            {showResolveModal && selectedTx && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
                            <ShieldCheck className="h-6 w-6 text-[var(--color-brand-green)]" />
                            <h3 className="font-extrabold text-[var(--text-primary)] text-lg">
                                {actionType === "refund" ? "Confirm Refund to Tenant" : "Confirm Release to Landlord"}
                            </h3>
                        </div>

                        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                            {actionType === "refund"
                                ? `Are you sure you want to refund ${formatPrice(selectedTx.totalAmount)} back to tenant ${selectedTx.tenant.firstName}?`
                                : `Are you sure you want to release ${formatPrice(selectedTx.rentAmount + selectedTx.cautionFee + selectedTx.legalFee)} to landlord ${selectedTx.property.landlord.firstName}?`}
                        </p>

                        <textarea
                            rows={3}
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            placeholder="Add admin resolution notes (e.g., Keys confirmed working, refund issued per tenant agreement)..."
                            className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:border-[var(--color-brand-green)] resize-none font-medium"
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setShowResolveModal(false)} className="rounded-xl text-xs font-bold border-[var(--border-color)]">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmResolve}
                                disabled={actionLoading === selectedTx.id}
                                className={`text-white font-bold text-xs rounded-xl px-5 ${actionType === "refund" ? "bg-red-600 hover:bg-red-700" : "bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90"}`}
                            >
                                {actionLoading === selectedTx.id ? "Processing..." : actionType === "refund" ? "Confirm Tenant Refund" : "Confirm Landlord Release"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
