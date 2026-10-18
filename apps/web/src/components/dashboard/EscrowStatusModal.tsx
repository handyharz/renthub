"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Home } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface Transaction {
    id: string;
    totalAmount: number;
    rentAmount?: number;
    cautionDeposit?: number;
    platformFee: number;
    escrowHeld: boolean;
    escrowReleased: boolean;
    status: string;
    property: {
        title: string;
        address: string;
        city: string;
    };
    landlord?: {
        firstName: string;
        lastName: string;
    };
    tenant?: {
        firstName: string;
        lastName: string;
    };
}

interface EscrowStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction;
    userRole: "TENANT" | "LANDLORD";
    onRelease?: () => void;
}

export function EscrowStatusModal({
    isOpen,
    onClose,
    transaction,
    userRole,
    onRelease,
}: EscrowStatusModalProps) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleReleaseClick = () => {
        setShowConfirm(true);
    };

    const confirmRelease = async () => {
        setLoading(true);
        try {
            await api.post(`/transactions/${transaction.id}/release`, {
                releaseReason: "Tenant confirmed satisfaction via dashboard"
            });
            if (onRelease) {
                onRelease();
            }
            setShowConfirm(false);
            onClose();
            router.refresh();
        } catch (error) {
            console.error("Failed to release funds:", error);
            alert("Failed to release funds. Please try again.");
            setLoading(false);
        }
    };

    const isReleased = transaction.escrowReleased || transaction.status === "RELEASED";

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-[var(--color-brand-green)]/15 border border-[var(--color-brand-green)]/30 p-2.5 rounded-full">
                                <ShieldCheck className="h-6 w-6 text-[var(--color-brand-green)]" />
                            </div>
                            <DialogTitle className="text-xl font-extrabold text-[var(--text-primary)]">Escrow Status: {isReleased ? "Completed" : "Secure"}</DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-[var(--text-secondary)] font-medium">
                            Transaction ID: #{transaction.id.slice(-8).toUpperCase()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Status Timeline / Card */}
                        <div className="bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl p-4">
                            {userRole === "LANDLORD" ? (
                                <div className="space-y-2 mb-4 pb-3 border-b border-[var(--border-color)] text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-[var(--text-secondary)]">Annual Rent (Gross):</span>
                                        <span className="font-mono font-bold text-[var(--text-primary)]">{formatPrice(transaction.rentAmount || 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-red-500">
                                        <span>RentHub Escrow Fee (2%):</span>
                                        <span className="font-mono font-bold">
                                            - {formatPrice(transaction.platformFee || Math.round((transaction.rentAmount || 0) * 0.02))}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)]/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                                        <span>Your Net Payout (98%):</span>
                                        <span className="font-mono">
                                            {formatPrice((transaction.rentAmount || 0) - (transaction.platformFee || Math.round((transaction.rentAmount || 0) * 0.02)))}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-0.5">
                                        <span>Tenant Total Paid in Escrow:</span>
                                        <span className="font-mono">{formatPrice(transaction.totalAmount)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
                                    <div>
                                        <span className="text-sm font-bold text-[var(--text-primary)] block">Total Secured in Escrow</span>
                                        <span className="text-[10px] text-[var(--text-muted)] font-medium">Includes Rent + 2% Escrow Protection Fee + Caution</span>
                                    </div>
                                    <span className="text-lg font-extrabold text-[var(--color-brand-green)]">{formatPrice(transaction.totalAmount)}</span>
                                </div>
                            )}

                            <div className="relative pl-4 border-l-2 border-[var(--border-color)] space-y-6">
                                {/* Step 1: Payment Received */}
                                <div className="relative">
                                    <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-[var(--color-brand-green)] ring-4 ring-[var(--bg-card)]" />
                                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Payment Received</h4>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">Tenant payment secured by RentHub.</p>
                                </div>

                                {/* Step 2: Escrow Hold */}
                                <div className="relative">
                                    <span className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ${isReleased ? "bg-[var(--color-brand-green)]" : "bg-amber-500 animate-pulse"} ring-4 ring-[var(--bg-card)]`} />
                                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Held in Escrow</h4>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                        {isReleased
                                            ? "Funds were held until tenant confirmation."
                                            : "Funds are currently held safely. Landlord has not received payment yet."}
                                    </p>
                                </div>

                                {/* Step 3: Release */}
                                <div className="relative">
                                    <span className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ${isReleased ? "bg-[var(--color-brand-green)]" : "bg-[var(--border-color)]"} ring-4 ring-[var(--bg-card)]`} />
                                    <h4 className={`text-sm font-bold ${isReleased ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>Funds Released</h4>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                        {isReleased
                                            ? "Payment has been transferred to the Landlord."
                                            : "Waiting for Tenant confirmation to release funds."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Role Specific Actions */}
                        {!isReleased && (
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-xs text-[var(--text-secondary)] font-medium">
                                {userRole === "TENANT" ? (
                                    <p>
                                        <strong className="text-[var(--text-primary)]">Action Required:</strong> Only release funds after you have verified the property, received keys, and signed the agreement.
                                    </p>
                                ) : (
                                    <p>
                                        <strong className="text-[var(--text-primary)]">Status:</strong> Waiting for tenant to confirm satisfaction. You will be notified once funds are released.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto rounded-xl border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] font-bold">
                            Close
                        </Button>

                        {!isReleased && userRole === "TENANT" && (
                            <Button
                                onClick={handleReleaseClick}
                                disabled={loading}
                                className="w-full sm:w-auto bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white gap-2 font-bold rounded-xl"
                            >
                                {loading ? (
                                    "Processing..."
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Confirm & Release Funds
                                    </>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="sm:max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl">
                    <DialogHeader>
                        <div className="mx-auto bg-amber-500/15 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-6 w-6 text-amber-500" />
                        </div>
                        <DialogTitle className="text-center text-xl font-extrabold text-[var(--text-primary)]">Release Funds?</DialogTitle>
                        <DialogDescription className="text-center pt-2 text-xs text-[var(--text-secondary)] font-medium">
                            Are you sure you want to release the funds to the landlord? This action <strong className="text-[var(--text-primary)]">cannot be undone</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center gap-3 mt-4">
                        <Button variant="outline" onClick={() => setShowConfirm(false)} className="rounded-xl border-[var(--border-color)] text-[var(--text-primary)] font-bold">
                            Cancel
                        </Button>
                        <Button onClick={confirmRelease} disabled={loading} className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold rounded-xl">
                            {loading ? "Releasing..." : "Yes, Release Funds"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
