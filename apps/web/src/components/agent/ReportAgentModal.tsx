"use client";

import { useState } from "react";
import { AlertTriangle, ShieldAlert, X, CheckCircle2, Loader2, DollarSign, Fuel, FileText, Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface ReportAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string;
    agentName: string;
    propertyId?: string;
    propertyTitle?: string;
}

const REASONS = [
    {
        id: "INSPECTION_FEE",
        label: "Demanded Inspection / Viewing Fee",
        description: "Agent demanded cash (e.g. ₦5,000) or money before showing the property",
        icon: DollarSign,
    },
    {
        id: "FUEL_MONEY",
        label: "Demanded Fuel Money / Transport Fare",
        description: "Agent asked for fuel or mobility money to come for inspection",
        icon: Fuel,
    },
    {
        id: "REGISTRATION_FORM_FEE",
        label: "Demanded Registration / Paper Form Fee",
        description: "Agent asked to buy a physical registration form or application sheet",
        icon: FileText,
    },
    {
        id: "OFF_PLATFORM_CASH",
        label: "Demanded Direct Cash / Bank Transfer",
        description: "Agent instructed not to use RentHub escrow and requested direct payment",
        icon: Ban,
    },
    {
        id: "OTHER",
        label: "Other Side-Payment / Unprofessional Demands",
        description: "Any other off-platform cash extortion or unauthorized surcharge",
        icon: AlertTriangle,
    },
];

export function ReportAgentModal({
    isOpen,
    onClose,
    agentId,
    agentName,
    propertyId,
    propertyTitle,
}: ReportAgentModalProps) {
    const { user } = useUser();
    const [reason, setReason] = useState("INSPECTION_FEE");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please sign in to file a report");
            return;
        }

        if (description.trim().length < 5) {
            toast.error("Please provide at least a brief explanation (min 5 characters)");
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/agents/strikes/report?clerkId=${user.id}`, {
                agentId,
                propertyId,
                reason,
                description: description.trim(),
            });
            setSubmitted(true);
            toast.success("Violation report submitted to compliance team");
        } catch (err: any) {
            console.error("Failed to submit report", err);
            toast.error(err.response?.data?.message || "Failed to submit report. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-[var(--card-bg)] border border-[var(--border-color)] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {submitted ? (
                    <div className="text-center py-6 space-y-4">
                        <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-primary)]">
                            Report Logged Successfully
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                            Thank you for helping keep RentHub safe. Our platform compliance team has received your report regarding <strong>{agentName}</strong>. If verified, a formal strike will be registered against their partner license.
                        </p>
                        <div className="pt-2">
                            <Button
                                onClick={() => {
                                    setSubmitted(false);
                                    setDescription("");
                                    onClose();
                                }}
                                className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Header */}
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-black uppercase tracking-wider">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                Zero Side-Payment Policy
                            </div>
                            <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                                Report Agent for Cash / Side Fee
                            </h2>
                            <p className="text-xs text-[var(--text-secondary)]">
                                Reporting agent: <strong className="text-[var(--text-primary)]">{agentName}</strong>
                                {propertyTitle ? ` for "${propertyTitle}"` : ""}
                            </p>
                        </div>

                        {/* Policy banner */}
                        <div className="rounded-2xl p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                            <p className="font-extrabold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                Strictly Prohibited on RentHub
                            </p>
                            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/80">
                                RentHub partner agents are prohibited from charging tenants any inspection fee, fuel fare, or paper registration form fee. All agent commissions are landlord-paid via escrow. Offending agents receive a strike, and 3 strikes result in a permanent ban.
                            </p>
                        </div>

                        {/* Violation Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                                Nature of Violation
                            </label>
                            <div className="space-y-2">
                                {REASONS.map((r) => {
                                    const Icon = r.icon;
                                    const isSelected = reason === r.id;
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => setReason(r.id)}
                                            className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                                                isSelected
                                                    ? "bg-purple-50 dark:bg-purple-950/30 border-purple-600 dark:border-purple-500 shadow-sm"
                                                    : "bg-[var(--card-bg)] border-[var(--border-color)] hover:bg-[var(--hover-bg)]"
                                            }`}
                                        >
                                            <div
                                                className={`p-2 rounded-xl shrink-0 ${
                                                    isSelected
                                                        ? "bg-purple-600 text-white"
                                                        : "bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-[var(--text-primary)]">
                                                    {r.label}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                                                    {r.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                                Details / What happened?
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                required
                                placeholder="E.g. Agent texted me demanding ₦5,000 before meeting me at the gate for inspection..."
                                className="w-full rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] p-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="w-1/2 h-11 rounded-xl font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || !description.trim()}
                                className="w-1/2 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Filing...
                                    </>
                                ) : (
                                    "Submit Report"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
