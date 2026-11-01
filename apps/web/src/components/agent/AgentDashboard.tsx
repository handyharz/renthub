"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Briefcase, MapPin, Star, CheckCircle2, Clock, XCircle,
    Building2, Phone, ChevronRight, AlertCircle, Plus,
    TrendingUp, Users, FileCheck, Wallet, Edit3, Send,
    ShieldCheck, ArrowRight, RefreshCw, X, Home,
    Upload, FileText, ExternalLink, PlusSquare
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { AgentDeactivationModal } from "./AgentDeactivationModal";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AgentProfile {
    id: string;
    status: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED";
    businessName?: string;
    businessAddress?: string;
    licenseNumber?: string;
    licenseDocUrl?: string;
    cacDocUrl?: string;
    addressDocUrl?: string;
    yearsOfExperience: number;
    operatingCities: string[];
    bio?: string;
    defaultCommissionPct: number;
    avgRating?: number;
    reviewCount: number;
    totalListings: number;
    totalClosed: number;
    rejectionReason?: string;
    user?: {
        id?: string;
        idDocumentUrl?: string | null;
        verified?: boolean;
    };
}

interface AgentDelegation {
    id: string;
    status: "PENDING_LANDLORD" | "AUTHORIZED" | "REVOKED" | "COMPLETED";
    commissionPct: number;
    commissionAmount?: number;
    agentNote?: string;
    landlordNote?: string;
    requestedAt: string;
    authorizedAt?: string;
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        state: string;
        pricePerYear: number;
        status: string;
        bedrooms: number;
        bathrooms: number;
        images: { url: string }[];
    };
    landlord: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        phone?: string;
    };
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING_REVIEW: { label: "Under Review", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800", icon: Clock },
    ACTIVE: { label: "Active Agent", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
    SUSPENDED: { label: "Suspended", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800", icon: XCircle },
    REJECTED: { label: "Rejected", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800", icon: XCircle },
    PENDING_LANDLORD: { label: "Awaiting Landlord", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800", icon: Clock },
    AUTHORIZED: { label: "Authorized", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
    REVOKED: { label: "Revoked", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800", icon: XCircle },
    COMPLETED: { label: "Completed", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800", icon: ShieldCheck },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] || { label: status, color: "bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-color)]", icon: AlertCircle };
    const Icon = cfg.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold", cfg.color)}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    );
}

// ─── ADD PROPERTY FOR LANDLORD MODAL ─────────────────────────────────────────

const PROPERTY_TYPES = [
    "SELF_CONTAIN", "ROOM_AND_PARLOUR", "MINI_FLAT", "APARTMENT_2BED", "APARTMENT_3BED",
    "APARTMENT_4BED", "DUPLEX", "BUNGALOW", "DETACHED_HOUSE", "SEMI_DETACHED", "TERRACE",
    "PENTHOUSE", "STUDIO"
];

function AddPropertyModal({ clerkId, onClose, onSuccess }: { clerkId: string; onClose: () => void; onSuccess: () => void }) {
    const [landlords, setLandlords] = useState<any[]>([]);
    const [loadingLandlords, setLoadingLandlords] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        landlordId: "",
        title: "",
        description: "",
        address: "",
        city: "",
        state: "",
        propertyType: "APARTMENT_2BED",
        bedrooms: "2",
        bathrooms: "2",
        toilets: "2",
        parkingSpaces: "1",
        pricePerYear: "",
        cautionFee: "",
        legalFee: "",
        paymentTerms: "TWO_YEARS",
        furnished: false,
        serviced: false,
        negotiable: false,
        agentNote: "",
    });

    useEffect(() => {
        api.get(`/agents/me/authorized-landlords?clerkId=${clerkId}`)
            .then(r => setLandlords(r.data.data || []))
            .catch(() => setLandlords([]))
            .finally(() => setLoadingLandlords(false));
    }, [clerkId]);

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.landlordId) { toast.error("Please select a landlord"); return; }
        setSubmitting(true);
        try {
            await api.post(`/agents/me/properties?clerkId=${clerkId}`, {
                ...form,
                bedrooms: parseInt(form.bedrooms),
                bathrooms: parseInt(form.bathrooms),
                toilets: parseInt(form.toilets),
                parkingSpaces: parseInt(form.parkingSpaces || "0"),
                pricePerYear: parseInt(form.pricePerYear),
                cautionFee: form.cautionFee ? parseInt(form.cautionFee) : 0,
                legalFee: form.legalFee ? parseInt(form.legalFee) : 0,
            });
            toast.success("Property created as DRAFT! Landlord has been notified to review and publish.");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create property");
        } finally {
            setSubmitting(false);
        }
    };

    const inputCls = "w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelCls = "block text-xs font-semibold text-[var(--text-secondary)] mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                            <PlusSquare className="h-5 w-5 text-blue-600" />
                            Add Property for Client
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Property will be created as DRAFT — landlord reviews & publishes it
                        </p>
                    </div>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6">
                    {loadingLandlords ? (
                        <div className="text-center py-10 text-[var(--text-muted)] text-sm">Loading landlord relationships...</div>
                    ) : landlords.length === 0 ? (
                        // No delegations at all
                        <div className="space-y-4">
                            <div className="text-center py-8">
                                <Building2 className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3" />
                                <p className="text-[var(--text-secondary)] font-semibold text-lg">No landlord relationships yet</p>
                                <p className="text-[var(--text-muted)] text-sm mt-2 max-w-sm mx-auto">
                                    To add a property for a client, you first need to request delegation on one of their existing properties.
                                    Once they authorize you, you can create new listings on their behalf.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                                <p className="font-semibold mb-1">📋 How to get started:</p>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                    <li>Ask the landlord to share their property ID (found in the property URL)</li>
                                    <li>Click <strong>"Request to List Property"</strong> and enter the property ID</li>
                                    <li>The landlord goes to their dashboard → <strong>Agent Partners</strong> tab → clicks <strong>"Authorize Agent"</strong></li>
                                    <li>Come back here and you'll see them in the landlord dropdown</li>
                                </ol>
                            </div>
                            <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] text-sm font-semibold hover:bg-[var(--bg-muted)] transition-colors">
                                Close
                            </button>
                        </div>
                    ) : landlords.every((l: any) => l.pendingApproval) ? (
                        // Has delegations but all are still pending landlord approval
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    <p className="font-bold text-amber-800 dark:text-amber-300">Waiting for landlord approval</p>
                                </div>
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    You've requested delegation, but the landlord hasn't authorized you yet.
                                    They need to go to their dashboard → <strong>Agent Partners</strong> tab and click <strong>"Authorize Agent"</strong>.
                                </p>
                            </div>

                            <p className="text-sm font-semibold text-[var(--text-secondary)]">Your pending requests:</p>
                            <div className="space-y-3">
                                {landlords.map((l: any) => (
                                    <div key={l.id} className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-xs shrink-0">
                                                {l.firstName?.[0]}{l.lastName?.[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm text-[var(--text-primary)]">{l.firstName} {l.lastName}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{l.phone || l.email}</p>
                                            </div>
                                            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-700">
                                                Awaiting Auth
                                            </span>
                                        </div>
                                        {l.pendingProperties?.length > 0 && (
                                            <div className="mt-2 pl-10">
                                                {l.pendingProperties.map((p: any) => (
                                                    <p key={p.id} className="text-[11px] text-[var(--text-muted)]">• {p.title} — {p.city}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] text-sm font-semibold hover:bg-[var(--bg-muted)] transition-colors">
                                Close
                            </button>
                        </div>
                    ) : (
                        // Has at least one AUTHORIZED landlord — show the form
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Pending approval notice (if some are still pending) */}
                            {landlords.some((l: any) => l.pendingApproval) && (
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                                    <span className="font-semibold">⏳ Some landlords still pending:</span>{" "}
                                    {landlords.filter((l: any) => l.pendingApproval).map((l: any) => `${l.firstName} ${l.lastName}`).join(", ")} — they haven't authorized you yet and won't appear below.
                                </div>
                            )}

                            {/* Landlord picker (AUTHORIZED only) */}
                            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                <label className={labelCls + " text-blue-800 dark:text-blue-300"}>Select Landlord / Client *</label>
                                <select
                                    value={form.landlordId}
                                    onChange={e => set("landlordId", e.target.value)}
                                    className={inputCls + " bg-white dark:bg-blue-950/20"}
                                    required
                                >
                                    <option value="">— Pick an authorized landlord —</option>
                                    {landlords.filter((l: any) => !l.pendingApproval).map((l: any) => (
                                        <option key={l.id} value={l.id}>
                                            {l.firstName} {l.lastName} ({l.phone || l.email}) · {l.agreedCommissionPct}% commission
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1.5">
                                    Only landlords who have authorized you appear here.
                                </p>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className={labelCls}>Property Title *</label>
                                    <input type="text" value={form.title} onChange={e => set("title", e.target.value)}
                                        placeholder="e.g. Spacious 3-Bed Flat in Lekki Phase 1"
                                        className={inputCls} required />
                                </div>
                                <div>
                                    <label className={labelCls}>Description *</label>
                                    <textarea value={form.description} onChange={e => set("description", e.target.value)}
                                        placeholder="Describe the property..."
                                        rows={3}
                                        className={inputCls + " resize-none"} required />
                                </div>
                            </div>

                            {/* Location */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-3">
                                    <label className={labelCls}>Street Address *</label>
                                    <input type="text" value={form.address} onChange={e => set("address", e.target.value)}
                                        placeholder="12 Palm Avenue, Victoria Island"
                                        className={inputCls} required />
                                </div>
                                <div>
                                    <label className={labelCls}>City *</label>
                                    <input type="text" value={form.city} onChange={e => set("city", e.target.value)}
                                        placeholder="Lagos" className={inputCls} required />
                                </div>
                                <div>
                                    <label className={labelCls}>State *</label>
                                    <input type="text" value={form.state} onChange={e => set("state", e.target.value)}
                                        placeholder="Lagos" className={inputCls} required />
                                </div>
                                <div>
                                    <label className={labelCls}>Property Type *</label>
                                    <select value={form.propertyType} onChange={e => set("propertyType", e.target.value)} className={inputCls}>
                                        {PROPERTY_TYPES.map(t => (
                                            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Specs */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: "Bedrooms *", key: "bedrooms", min: 0, max: 20 },
                                    { label: "Bathrooms *", key: "bathrooms", min: 1, max: 20 },
                                    { label: "Toilets", key: "toilets", min: 1, max: 20 },
                                    { label: "Parking Spaces", key: "parkingSpaces", min: 0, max: 20 },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className={labelCls}>{f.label}</label>
                                        <input type="number" min={f.min} max={f.max}
                                            value={(form as any)[f.key]}
                                            onChange={e => set(f.key, e.target.value)}
                                            className={inputCls} required={f.label.endsWith("*")} />
                                    </div>
                                ))}
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className={labelCls}>Annual Rent (₦) *</label>
                                    <input type="number" value={form.pricePerYear} onChange={e => set("pricePerYear", e.target.value)}
                                        placeholder="1500000" className={inputCls} required />
                                </div>
                                <div>
                                    <label className={labelCls}>Caution Fee (₦)</label>
                                    <input type="number" value={form.cautionFee} onChange={e => set("cautionFee", e.target.value)}
                                        placeholder="100000" className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Legal Fee (₦)</label>
                                    <input type="number" value={form.legalFee} onChange={e => set("legalFee", e.target.value)}
                                        placeholder="50000" className={inputCls} />
                                </div>
                            </div>

                            {/* Payment Terms */}
                            <div>
                                <label className={labelCls}>Payment Terms</label>
                                <select value={form.paymentTerms} onChange={e => set("paymentTerms", e.target.value)} className={inputCls}>
                                    {["ONE_YEAR", "TWO_YEARS", "THREE_YEARS", "FLEXIBLE"].map(t => (
                                        <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { label: "Furnished", key: "furnished" },
                                    { label: "Serviced", key: "serviced" },
                                    { label: "Negotiable", key: "negotiable" },
                                ].map(t => (
                                    <label key={t.key} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={(form as any)[t.key]}
                                            onChange={e => set(t.key, e.target.checked)}
                                            className="rounded border-[var(--border-color)] text-blue-600" />
                                        <span className="text-sm font-medium text-[var(--text-primary)]">{t.label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Agent note */}
                            <div>
                                <label className={labelCls}>Agent Note (internal)</label>
                                <input type="text" value={form.agentNote} onChange={e => set("agentNote", e.target.value)}
                                    placeholder="Any notes for this listing..."
                                    className={inputCls} />
                            </div>

                            {/* Info banner */}
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                                <strong>📋 What happens next:</strong> This property will be saved as DRAFT under the landlord's account.
                                They will receive a notification to review details and publish the listing.
                                Your delegation is automatically set to AUTHORIZED at the agreed commission rate.
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-[var(--border-color)]">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                                    {submitting ? "Creating..." : "Create Listing for Client"}
                                    <PlusSquare className="ml-1.5 h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── REQUEST DELEGATION MODAL ─────────────────────────────────────────────────

function RequestDelegationModal({ clerkId, onClose, onSuccess }: { clerkId: string; onClose: () => void; onSuccess: () => void }) {
    const [propertyId, setPropertyId] = useState("");
    const [note, setNote] = useState("");
    const [commissionPct, setCommissionPct] = useState("5");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!propertyId.trim()) return;
        setLoading(true);
        try {
            await api.post(`/agents/me/delegations?clerkId=${clerkId}`, {
                propertyId: propertyId.trim(),
                agentNote: note,
                commissionPct: parseFloat(commissionPct)
            });
            toast.success("Delegation request sent to landlord");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Request Property Delegation</h2>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-300">
                    <strong>How it works:</strong> The landlord will receive your request and must authorize you before you can manage this listing. Commission is paid by the landlord from their rental income.
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Property ID *</label>
                        <input
                            type="text"
                            value={propertyId}
                            onChange={e => setPropertyId(e.target.value)}
                            placeholder="Paste the property ID from RentHub"
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">You can find the property ID in the URL when viewing a listing</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                            Commission Rate (%) — Max 5%
                        </label>
                        <input
                            type="number"
                            value={commissionPct}
                            onChange={e => setCommissionPct(e.target.value)}
                            min="0.5"
                            max="5"
                            step="0.5"
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">Paid by the landlord. Tenant pays 0% agent fee.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Note to Landlord</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Briefly explain your experience and why you want to list this property..."
                            rows={3}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold">
                        {loading ? "Sending..." : "Send Delegation Request"}
                        <Send className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

// ─── PROFILE EDIT MODAL ───────────────────────────────────────────────────────

function ProfileEditModal({
    clerkId,
    profile,
    onClose,
    onSuccess
}: {
    clerkId: string;
    profile: AgentProfile | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState({
        businessName: profile?.businessName || "",
        businessAddress: profile?.businessAddress || "",
        licenseNumber: profile?.licenseNumber || "",
        yearsOfExperience: String(profile?.yearsOfExperience || "0"),
        operatingCities: profile?.operatingCities?.join(", ") || "",
        bio: profile?.bio || "",
        defaultCommissionPct: String(profile?.defaultCommissionPct || "5"),
    });
    const [addressDocUrl, setAddressDocUrl] = useState(profile?.addressDocUrl || "");
    const [cacDocUrl, setCacDocUrl] = useState(profile?.cacDocUrl || "");
    const [uploadingAddress, setUploadingAddress] = useState(false);
    const [uploadingCac, setUploadingCac] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleUploadDoc = async (file: File, docType: "address" | "cac") => {
        const formData = new FormData();
        formData.append("document", file);
        formData.append("docType", docType);

        if (docType === "address") setUploadingAddress(true);
        else setUploadingCac(true);

        try {
            const res = await api.post(`/upload/agent-document?clerkId=${clerkId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data?.success) {
                toast.success(res.data.message);
                if (docType === "address") setAddressDocUrl(res.data.data.url);
                else setCacDocUrl(res.data.data.url);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to upload document");
        } finally {
            if (docType === "address") setUploadingAddress(false);
            else setUploadingCac(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch(`/agents/me?clerkId=${clerkId}`, {
                businessName: form.businessName,
                businessAddress: form.businessAddress,
                licenseNumber: form.licenseNumber || undefined,
                addressDocUrl: addressDocUrl || undefined,
                cacDocUrl: cacDocUrl || undefined,
                yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
                operatingCities: form.operatingCities
                    .split(",")
                    .map(c => c.trim())
                    .filter(Boolean),
                bio: form.bio || undefined,
                defaultCommissionPct: parseFloat(form.defaultCommissionPct),
            });
            toast.success("Profile updated");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-lg my-8 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Agent Profile</h2>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Business / Agency Name *</label>
                        <input
                            value={form.businessName}
                            onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Business Address *</label>
                        <input
                            value={form.businessAddress}
                            onChange={e => setForm(f => ({ ...f, businessAddress: e.target.value }))}
                            placeholder="e.g. Suite 4, Lekki Mall, Admiralty Way, Lagos"
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Office Address Verification Upload */}
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                Office Address Verification (Utility Bill or Tenancy Agreement)
                            </label>
                            {addressDocUrl && (
                                <a
                                    href={addressDocUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                                >
                                    View Current <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                            Upload a recent electricity bill (EKEDC / IKEDC / AEDC), waste bill, or office tenancy agreement within 3 months to prove your physical office address.
                        </p>
                        <div className="flex items-center gap-3">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] transition-colors">
                                <Upload className="h-3 w-3 text-blue-600" />
                                <span>{uploadingAddress ? "Uploading..." : addressDocUrl ? "Replace Address Doc" : "Upload Address Doc (PDF/Image)"}</span>
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    className="hidden"
                                    disabled={uploadingAddress}
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleUploadDoc(e.target.files[0], "address");
                                    }}
                                />
                            </label>
                            {addressDocUrl && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Document Uploaded
                                </span>
                            )}
                        </div>
                    </div>

                    {/* CAC Business Registration Certificate (Optional) */}
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                CAC Registration Certificate (Form CAC 1.1 / Status Report)
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                                    Optional
                                </span>
                            </label>
                            {cacDocUrl && (
                                <a
                                    href={cacDocUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                                >
                                    View Current <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                            Optional: Upload your CAC Certificate of Registration or Status Report showing your registered office address.
                        </p>
                        <div className="flex items-center gap-3">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] transition-colors">
                                <Upload className="h-3 w-3 text-purple-600" />
                                <span>{uploadingCac ? "Uploading..." : cacDocUrl ? "Replace CAC Doc" : "Upload CAC Certificate (PDF/Image)"}</span>
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    className="hidden"
                                    disabled={uploadingCac}
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleUploadDoc(e.target.files[0], "cac");
                                    }}
                                />
                            </label>
                            {cacDocUrl && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> CAC Uploaded
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">NIESV / License Number</label>
                        <input
                            value={form.licenseNumber}
                            onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
                            placeholder="Optional professional registration"
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Years of Experience</label>
                            <input
                                type="number"
                                value={form.yearsOfExperience}
                                onChange={e => setForm(f => ({ ...f, yearsOfExperience: e.target.value }))}
                                min="0"
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Default Commission %</label>
                            <input
                                type="number"
                                value={form.defaultCommissionPct}
                                onChange={e => setForm(f => ({ ...f, defaultCommissionPct: e.target.value }))}
                                min="0.5"
                                max="5"
                                step="0.5"
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Operating Cities (comma-separated) *</label>
                        <input
                            value={form.operatingCities}
                            onChange={e => setForm(f => ({ ...f, operatingCities: e.target.value }))}
                            placeholder="Lagos, Abuja, Port Harcourt"
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Bio</label>
                        <textarea
                            value={form.bio}
                            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                            placeholder="Tell landlords about your expertise..."
                            rows={3}
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold">
                        {loading ? "Saving..." : "Save Profile"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

// ─── DELEGATION CARD ──────────────────────────────────────────────────────────

function DelegationCard({ delegation }: { delegation: AgentDelegation }) {
    const img = delegation.property.images?.[0]?.url;
    const isDraft = delegation.property.status === "DRAFT";
    const isLive = delegation.property.status === "AVAILABLE";

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
                <div className="relative h-36 bg-[var(--bg-muted)]">
                    {img ? (
                        <Image src={img} alt={delegation.property.title} fill className="object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <Home className="h-10 w-10 text-[var(--text-muted)]" />
                        </div>
                    )}
                    {/* Top Left: Property Live/Draft Status Badge */}
                    <div className="absolute top-2 left-2 flex gap-1">
                        {isDraft ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/90 text-white backdrop-blur-sm shadow-sm flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" /> Draft (Pending Review)
                            </span>
                        ) : isLive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600/90 text-white backdrop-blur-sm shadow-sm flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Published & Live
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/90 text-white backdrop-blur-sm shadow-sm">
                                {delegation.property.status}
                            </span>
                        )}
                    </div>

                    {/* Top Right: Delegation Status */}
                    <div className="absolute top-2 right-2">
                        <StatusBadge status={delegation.status} />
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="font-bold text-[var(--text-primary)] text-sm line-clamp-1">{delegation.property.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {delegation.property.city}, {delegation.property.state}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--text-muted)]">Annual Rent</p>
                            <p className="font-bold text-[var(--text-primary)] text-sm">{formatPrice(delegation.property.pricePerYear)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-[var(--text-muted)]">Your Commission</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">{delegation.commissionPct}%</p>
                        </div>
                    </div>

                    {/* Client / Landlord Attribution */}
                    {delegation.landlord && (
                        <div className="mt-3 pt-2.5 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
                                <Users className="h-3 w-3 text-blue-500" />
                                Landlord: <strong className="text-[var(--text-primary)]">{delegation.landlord.firstName} {delegation.landlord.lastName}</strong>
                            </span>
                            {delegation.landlord.phone && (
                                <span className="text-[10px] font-mono text-[var(--text-muted)]">{delegation.landlord.phone}</span>
                            )}
                        </div>
                    )}

                    {/* Explanatory Banners */}
                    {isDraft && delegation.status === "AUTHORIZED" && (
                        <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                            <span>Listed for client — awaiting landlord to review & publish.</span>
                        </div>
                    )}

                    {!isDraft && delegation.status === "AUTHORIZED" && (
                        <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                            ✓ You are authorized to manage this listing
                        </div>
                    )}

                    {delegation.status === "PENDING_LANDLORD" && (
                        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                            ⏳ Awaiting landlord authorization
                        </div>
                    )}

                    {delegation.landlordNote && (
                        <div className="mt-2 p-2 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-secondary)]">
                            <span className="font-medium text-[var(--text-primary)]">Landlord note:</span> {delegation.landlordNote}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 pt-0">
                <Link href={`/properties/${delegation.property.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]">
                        View Property <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}

// ─── MAIN AGENT DASHBOARD ────────────────────────────────────────────────────

export default function AgentDashboard() {
    const { user } = useUser();
    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [delegations, setDelegations] = useState<AgentDelegation[]>([]);
    const [stats, setStats] = useState({ authorized: 0, completed: 0, pending: 0, totalEarned: 0 });
    const [strikesInfo, setStrikesInfo] = useState<{ strikeCount: number; strikesRemaining: number; isBanned: boolean; history: any[] }>({
        strikeCount: 0,
        strikesRemaining: 3,
        isBanned: false,
        history: [],
    });
    const [loading, setLoading] = useState(true);
    const [showDelegationModal, setShowDelegationModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>("ALL");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileRes, delegationsRes, statsRes, strikesRes] = await Promise.allSettled([
                api.get(`/agents/me?clerkId=${user?.id}`),
                api.get(`/agents/me/delegations?clerkId=${user?.id}`),
                api.get(`/agents/me/stats?clerkId=${user?.id}`),
                api.get(`/agents/me/strikes?clerkId=${user?.id}`),
            ]);
            if (profileRes.status === "fulfilled") setProfile(profileRes.value.data.data);
            if (delegationsRes.status === "fulfilled") setDelegations(delegationsRes.value.data.data || []);
            if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data);
            if (strikesRes.status === "fulfilled") setStrikesInfo(strikesRes.value.data.data || { strikeCount: 0, strikesRemaining: 3, isBanned: false, history: [] });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const handleSubmitForReview = async () => {
        setSubmitting(true);
        try {
            await api.post(`/agents/me/submit?clerkId=${user?.id}`);
            toast.success("Application submitted! Our team will review within 1-2 business days.");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredDelegations = delegations.filter(d =>
        activeFilter === "ALL" || d.status === activeFilter
    );

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-[var(--bg-muted)] rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Status Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Briefcase className="h-5 w-5 opacity-80" />
                            <span className="text-sm opacity-80">Agent Status</span>
                        </div>
                        <h2 className="text-2xl font-extrabold">
                            {profile?.businessName || "Complete Your Profile"}
                        </h2>
                        {profile?.operatingCities?.length ? (
                            <p className="text-sm opacity-75 mt-1 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {profile.operatingCities.slice(0, 3).join(" · ")}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {profile && <StatusBadge status={profile.status} />}
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => setShowProfileModal(true)}
                                className="text-xs underline opacity-80 hover:opacity-100 flex items-center gap-1"
                            >
                                <Edit3 className="h-3 w-3" />
                                Edit Profile
                            </button>
                            <span className="opacity-40 text-xs">·</span>
                            <button
                                onClick={() => setShowDeactivateModal(true)}
                                className="text-xs text-red-200 hover:text-white underline transition-colors"
                            >
                                Close Agent Account
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile completion nudge */}
                {profile?.status === "PENDING_REVIEW" && (
                    <div className="mt-4 p-3 bg-white/10 rounded-xl text-sm">
                        ⏳ Your application is under review. We'll notify you within 1–2 business days.
                    </div>
                )}

                {profile?.status === "REJECTED" && (
                    <div className="mt-4 p-3 bg-red-400/20 rounded-xl text-sm">
                        ❌ Application rejected: {profile.rejectionReason || "See admin feedback"}
                        <button onClick={() => setShowProfileModal(true)} className="ml-2 underline">
                            Update & Resubmit
                        </button>
                    </div>
                )}

                {profile?.status !== "ACTIVE" && profile?.status !== "PENDING_REVIEW" && (() => {
                    const hasProfileInfo = Boolean(profile?.businessName && profile?.businessAddress && profile?.operatingCities?.length);
                    const hasAddressDoc = Boolean(profile?.addressDocUrl);
                    const hasGovId = Boolean(profile?.user?.idDocumentUrl);
                    const allMandatoryDone = hasProfileInfo && hasAddressDoc && hasGovId;

                    const items = [
                        { label: "Agency info (name, address, cities)", done: hasProfileInfo, required: true },
                        { label: "Office Address Proof (utility bill / lease)", done: hasAddressDoc, required: true },
                        { label: "Government Photo ID (from your Profile)", done: hasGovId, required: true },
                        { label: "CAC Registration Certificate", done: Boolean(profile?.cacDocUrl), required: false },
                    ];

                    return (
                        <div className="mt-4 space-y-3">
                            <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Verification Readiness</p>
                            <div className="space-y-1.5">
                                {items.map((item) => (
                                    <div key={item.label} className="flex items-center gap-2 text-xs">
                                        {item.done ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                                        ) : (
                                            <AlertCircle className={`h-3.5 w-3.5 shrink-0 ${item.required ? "text-red-300" : "text-white/40"}`} />
                                        )}
                                        <span className={item.done ? "opacity-80 line-through" : item.required ? "opacity-90 font-semibold" : "opacity-60"}>
                                            {item.label}
                                            {!item.required && " (optional)"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {!hasProfileInfo && (
                                <Button
                                    onClick={() => setShowProfileModal(true)}
                                    className="bg-white text-blue-700 hover:bg-blue-50 h-9 text-sm font-semibold"
                                >
                                    Complete Profile <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            )}
                            {hasProfileInfo && (
                                <div className="space-y-2">
                                    {!allMandatoryDone && (
                                        <p className="text-[11px] text-red-200 font-medium">
                                            ⚠️ Upload the missing required documents above before submitting.
                                        </p>
                                    )}
                                    <Button
                                        onClick={handleSubmitForReview}
                                        disabled={!allMandatoryDone || submitting}
                                        className={cn(
                                            "h-9 text-sm font-semibold transition-all",
                                            allMandatoryDone
                                                ? "bg-white text-blue-700 hover:bg-blue-50"
                                                : "bg-white/20 text-white/50 cursor-not-allowed border border-white/20"
                                        )}
                                    >
                                        {submitting ? "Submitting..." : "Submit for Verification"}
                                        <Send className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* Stats */}
            {profile?.status === "ACTIVE" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Active Listings", value: stats.authorized, icon: Building2, color: "text-blue-600 dark:text-blue-400" },
                        { label: "Awaiting Auth", value: stats.pending, icon: Clock, color: "text-amber-600 dark:text-amber-400" },
                        { label: "Closed Deals", value: stats.completed, icon: FileCheck, color: "text-emerald-600 dark:text-emerald-400" },
                        { label: "Total Earned", value: formatPrice(stats.totalEarned), icon: Wallet, color: "text-purple-600 dark:text-purple-400", href: "/dashboard?tab=payouts" },
                    ].map(stat => {
                        const card = (
                            <div className={cn("bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm", stat.href && "hover:border-purple-400 dark:hover:border-purple-600 transition-colors cursor-pointer group")}>
                                <div className="flex items-center justify-between mb-2">
                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                    {stat.href && <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 group-hover:underline flex items-center">Payouts →</span>}
                                </div>
                                <p className="text-xl font-extrabold text-[var(--text-primary)]">{stat.value}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</p>
                            </div>
                        );
                        return stat.href ? <Link key={stat.label} href={stat.href}>{card}</Link> : <div key={stat.label}>{card}</div>;
                    })}
                </div>
            )}

            {/* Fee Transparency & Zero Side-Payment Notice */}
            {profile?.status === "ACTIVE" && (
                <div className="space-y-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-xs text-emerald-800 dark:text-emerald-300">
                        <strong>💡 Fee Policy:</strong> Your commission (up to 5%) is paid by the landlord from their rent proceeds.
                        Tenants pay <em>zero</em> agent fee — keeping RentHub's promise intact.
                        All payments flow through RentHub escrow — no side payments allowed.
                    </div>

                    {/* Strike & Compliance Card */}
                    <div className={cn(
                        "rounded-2xl p-4 border text-xs space-y-2 transition-all",
                        strikesInfo.strikeCount === 0
                            ? "bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-200"
                            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200"
                    )}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-extrabold flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                Platform Compliance Standing: {strikesInfo.strikeCount} / 3 Strikes
                            </span>
                            <span className={cn(
                                "px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider",
                                strikesInfo.strikeCount === 0
                                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                    : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                            )}>
                                {strikesInfo.strikeCount === 0 ? "Good Standing (0 Violations)" : `${strikesInfo.strikesRemaining} strikes remaining before ban`}
                            </span>
                        </div>
                        <p className="leading-relaxed text-[11px] opacity-85">
                            <strong>Rolling 90-Day Policy:</strong> Demanding cash inspection fees, registration fees, or fuel money from tenants is strictly prohibited. Offenses result in strikes that remain active for 90 days. If you maintain clean compliance for 90 days, active strikes expire. Accumulating 3 strikes results in permanent suspension.
                        </p>
                        {Boolean((strikesInfo as any).expiredCount) && (
                            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {(strikesInfo as any).expiredCount} past strike(s) have successfully expired and faded after 90 days of good compliance.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Delegations */}
            {profile?.status === "ACTIVE" && (
                <div>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">My Listings</h3>
                        <div className="flex gap-2">
                            <Link href="/properties/new-for-client">
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs font-semibold"
                                >
                                    <PlusSquare className="h-3.5 w-3.5 mr-1" />
                                    Add Property for Client
                                </Button>
                            </Link>
                            <Button
                                onClick={() => setShowDelegationModal(true)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-semibold"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Request to List Property
                            </Button>
                        </div>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                        {["ALL", "PENDING_LANDLORD", "AUTHORIZED", "COMPLETED", "REVOKED"].map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border",
                                    activeFilter === f
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border-[var(--border-color)]"
                                )}
                            >
                                {f === "ALL" ? "All" : statusConfig[f]?.label || f}
                                {f === "ALL" && ` (${delegations.length})`}
                                {f !== "ALL" && ` (${delegations.filter(d => d.status === f).length})`}
                            </button>
                        ))}
                    </div>

                    {filteredDelegations.length === 0 ? (
                        <div className="text-center py-16 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl">
                            <Building2 className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3" />
                            <p className="text-[var(--text-secondary)] font-medium">No listings yet</p>
                            <p className="text-[var(--text-muted)] text-sm mt-1 mb-4">
                                Request to manage properties and build your portfolio
                            </p>
                            <Button
                                onClick={() => setShowDelegationModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm font-semibold"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Request Delegation
                            </Button>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDelegations.map(d => (
                                <DelegationCard key={d.id} delegation={d} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showDelegationModal && (
                <RequestDelegationModal
                    clerkId={user?.id || ""}
                    onClose={() => setShowDelegationModal(false)}
                    onSuccess={fetchData}
                />
            )}
            {showAddPropertyModal && (
                <AddPropertyModal
                    clerkId={user?.id || ""}
                    onClose={() => setShowAddPropertyModal(false)}
                    onSuccess={fetchData}
                />
            )}
            {showProfileModal && (
                <ProfileEditModal
                    clerkId={user?.id || ""}
                    profile={profile}
                    onClose={() => setShowProfileModal(false)}
                    onSuccess={fetchData}
                />
            )}
            {showDeactivateModal && (
                <AgentDeactivationModal
                    isOpen={showDeactivateModal}
                    onClose={() => setShowDeactivateModal(false)}
                    onSuccess={fetchData}
                    clerkId={user?.id || ""}
                />
            )}
        </div>
    );
}
