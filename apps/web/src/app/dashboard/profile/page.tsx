"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TrustScore } from "@/components/profile/TrustScore";
import { PhoneVerificationModal } from "@/components/profile/PhoneVerificationModal";
import { DocumentUploader } from "@/components/profile/DocumentUploader";
import api from "@/lib/api";
import {
    Loader2,
    CheckCircle2,
    ShieldCheck,
    Phone,
    Mail,
    User,
    Calendar,
    ArrowLeft,
    Sparkles,
    FileCheck2,
    Lock,
    ExternalLink,
    Building2,
    AlertCircle,
    Save,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AfriExchangeLinkingCard } from "@/components/payouts/AfriExchangeLinkingCard";

export default function ProfilePage() {
    const { user, isLoaded } = useUser();
    const [dbUser, setDbUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [activeSection, setActiveSection] = useState<"all" | "personal" | "kyc" | "settlement">("all");

    // Form Stats
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        avatar: "",
        idType: "",
        idNumber: "",
    });

    useEffect(() => {
        if (isLoaded && user) {
            fetchUserProfile();
        }
    }, [isLoaded, user]);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get(`/users/me?clerkId=${user?.id}`);
            const data = res.data.data;
            setDbUser(data);
            setFormData({
                firstName: data.firstName || user?.firstName || "",
                lastName: data.lastName || user?.lastName || "",
                phone: data.phone || "",
                avatar: data.avatar || user?.imageUrl || "",
                idType: data.idType || "",
                idNumber: data.idNumber || "",
            });
        } catch (error) {
            console.error("Failed to fetch user:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/users/me?clerkId=${user?.id}`, formData);
            await fetchUserProfile();
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast.error("Failed to update profile. Please check your details and try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-green)]" />
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">Loading your profile...</p>
                </div>
            </div>
        );
    }

    const isLandlord = dbUser?.role === "LANDLORD";
    const memberSince = dbUser?.createdAt
        ? new Date(dbUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "Recent";

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-24 transition-colors">
            {/* Top Navigation Bar */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-16 z-20 backdrop-blur-md bg-[var(--bg-card)]/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black text-[var(--text-primary)]">Account Profile</h1>
                                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[var(--color-brand-green)]/10 text-[var(--color-brand-green)] border border-[var(--color-brand-green)]/20">
                                    {isLandlord ? "Landlord" : "Tenant"}
                                </span>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] font-medium">Manage your personal details, trust verification, and security</p>
                        </div>
                    </div>

                    <Button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-sm active:scale-[0.98]"
                    >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Hero Profile Overview Card */}
                <div className="relative rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-xs">
                    {/* Decorative Top Accent Banner */}
                    <div className="h-28 sm:h-36 bg-gradient-to-r from-emerald-600/20 via-blue-600/15 to-amber-500/10 border-b border-[var(--border-color)] relative">
                        <div className="absolute inset-0 bg-[radial-gradient(#00a651_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                    </div>

                    <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-12 sm:-mt-14">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl border-4 border-[var(--bg-card)] bg-[var(--bg-muted)] overflow-hidden shadow-lg flex items-center justify-center shrink-0">
                                    {formData.avatar ? (
                                        <img
                                            src={formData.avatar}
                                            alt={formData.firstName || "Profile"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-12 w-12 text-[var(--text-muted)]" />
                                    )}
                                </div>
                                {dbUser?.phoneVerified && (
                                    <div
                                        className="absolute -bottom-1 -right-1 p-1 bg-[var(--color-brand-green)] text-white rounded-full border-2 border-[var(--bg-card)] shadow-xs"
                                        title="Phone Verified"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                )}
                            </div>

                            {/* User details */}
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                                        {formData.firstName || user?.firstName}{" "}
                                        {formData.lastName || user?.lastName || ""}
                                    </h2>
                                    {dbUser?.verified ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                            <ShieldCheck className="h-3.5 w-3.5" /> ID Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                            Verification Pending
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                    {user?.emailAddresses?.[0]?.emailAddress || dbUser?.email || "No email on file"}
                                </p>
                            </div>
                        </div>

                        {/* Quick Metadata Stats */}
                        <div className="flex items-center gap-3 self-stretch sm:self-auto border-t sm:border-t-0 border-[var(--border-color)] pt-3 sm:pt-0">
                            <div className="px-3.5 py-2 rounded-2xl bg-[var(--bg-muted)]/70 border border-[var(--border-color)] text-center flex-1 sm:flex-initial">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Role</p>
                                <p className="text-xs font-black text-[var(--text-primary)]">{isLandlord ? "Landlord" : "Tenant"}</p>
                            </div>
                            <div className="px-3.5 py-2 rounded-2xl bg-[var(--bg-muted)]/70 border border-[var(--border-color)] text-center flex-1 sm:flex-initial">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Member Since</p>
                                <p className="text-xs font-black text-[var(--text-primary)]">{memberSince}</p>
                            </div>
                            <div className="px-3.5 py-2 rounded-2xl bg-[var(--bg-muted)]/70 border border-[var(--border-color)] text-center flex-1 sm:flex-initial">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Phone Status</p>
                                <p className={`text-xs font-black ${dbUser?.phoneVerified ? "text-[var(--color-brand-green)]" : "text-amber-600 dark:text-amber-400"}`}>
                                    {dbUser?.phoneVerified ? "Verified" : "Unverified"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3 overflow-x-auto">
                    <button
                        onClick={() => setActiveSection("all")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeSection === "all"
                                ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                        }`}
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        All Overview
                    </button>
                    <button
                        onClick={() => setActiveSection("personal")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeSection === "personal"
                                ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                        }`}
                    >
                        <User className="h-3.5 w-3.5" />
                        Personal Information
                    </button>
                    <button
                        onClick={() => setActiveSection("kyc")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeSection === "kyc"
                                ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                        }`}
                    >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Government ID & KYC
                    </button>
                    {isLandlord && (
                        <button
                            onClick={() => setActiveSection("settlement")}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                                activeSection === "settlement"
                                    ? "bg-[var(--color-brand-green)] text-white shadow-xs"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                            }`}
                        >
                            <Building2 className="h-3.5 w-3.5" />
                            AfriExchange Payouts
                        </button>
                    )}
                </div>

                {/* Two-Column Grid: Form & Settings on Left, Trust Score & Tips on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column (Content Sections) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Section 1: Personal Information */}
                        {(activeSection === "all" || activeSection === "personal") && (
                            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 sm:p-7 shadow-xs space-y-6">
                                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-[var(--color-brand-green)] flex items-center justify-center border border-emerald-500/20">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-[var(--text-primary)]">
                                                Personal Details
                                            </h3>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                                Your legal name and direct contact details used for rental agreements
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                                            First Name
                                        </label>
                                        <Input
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            placeholder="e.g. Adebayo"
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                                            Last Name
                                        </label>
                                        <Input
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            placeholder="e.g. Ogunlesi"
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Email Address (Locked with Clerk indicator) */}
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Input
                                            disabled
                                            value={user?.emailAddresses?.[0]?.emailAddress || dbUser?.email || ""}
                                            className="h-11 rounded-xl bg-[var(--bg-muted)]/80 text-[var(--text-muted)] cursor-not-allowed pl-10"
                                            icon={<Lock className="h-4 w-4" />}
                                        />
                                    </div>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1 font-medium">
                                        <Lock className="h-3 w-3" /> Managed securely by Clerk Authentication
                                    </p>
                                </div>

                                {/* Phone Number with inline Verification */}
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                                        Phone Number (WhatsApp & SMS)
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2.5">
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })
                                            }
                                            placeholder="08012345678"
                                            className="flex-1 h-11 rounded-xl font-mono"
                                            maxLength={14}
                                        />
                                        {dbUser?.phoneVerified ? (
                                            <div className="flex items-center justify-center gap-2 px-4 h-11 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 font-bold text-xs shrink-0">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Phone Verified
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-11 px-5 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/10 font-bold text-xs rounded-xl shrink-0"
                                                onClick={() => setShowVerifyModal(true)}
                                                disabled={!formData.phone || formData.phone.length < 10}
                                            >
                                                <Phone className="h-3.5 w-3.5 mr-1.5" />
                                                Verify Phone
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 font-medium">
                                        Required for physical key handover OTPs and landlord direct messaging.
                                    </p>
                                </div>

                                {/* Avatar URL / Sync */}
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                                        Avatar Image URL (Optional)
                                    </label>
                                    <Input
                                        value={formData.avatar}
                                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                        placeholder="https://..."
                                        className="h-11 rounded-xl text-xs font-mono"
                                    />
                                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium">
                                        By default, your verified social avatar from Google / Clerk is automatically linked.
                                    </p>
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button
                                        onClick={() => handleSave()}
                                        disabled={saving}
                                        className="h-11 px-6 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Personal Information
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Section 2: Identity & KYC Verification */}
                        {(activeSection === "all" || activeSection === "kyc") && (
                            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 sm:p-7 shadow-xs space-y-6">
                                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                                            <FileCheck2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-[var(--text-primary)]">
                                                Government Identity (KYC)
                                            </h3>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                                Verify your identity to earn the Trusted Badge and unlock 100% escrow protection
                                            </p>
                                        </div>
                                    </div>
                                    {dbUser?.verified && (
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                            Approved
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                                            ID Document Type
                                        </label>
                                        <select
                                            className="w-full flex h-11 rounded-xl border border-[var(--border-color)] bg-[var(--select-bg)] px-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] transition-all"
                                            value={formData.idType}
                                            onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                                        >
                                            <option value="">Select ID Type</option>
                                            <option value="NIN">National Identity Number (NIN Slip)</option>
                                            <option value="VOTERS_CARD">Voter&apos;s Card (INEC PVC)</option>
                                            <option value="DRIVERS_LICENSE">Driver&apos;s License (FRSC)</option>
                                            <option value="PASSPORT">International Passport</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                                            Document / ID Number
                                        </label>
                                        <Input
                                            value={formData.idNumber}
                                            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                            placeholder="e.g. 11-digit NIN or Passport No."
                                            className="h-11 rounded-xl font-mono text-xs font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                                        Upload ID Document (Image or PDF)
                                    </label>
                                    <DocumentUploader
                                        userId={dbUser?.id}
                                        currentUrl={dbUser?.idDocumentUrl}
                                        onUploadSuccess={() => {
                                            fetchUserProfile();
                                        }}
                                    />
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button
                                        onClick={() => handleSave()}
                                        disabled={saving}
                                        className="h-11 px-6 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Identification Details
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Section 3: AfriExchange Payout Settlement (Landlords Only) */}
                        {isLandlord && (activeSection === "all" || activeSection === "settlement") && (
                            <div className="space-y-4">
                                <AfriExchangeLinkingCard dbUser={dbUser} onRefresh={fetchUserProfile} />
                            </div>
                        )}
                    </div>

                    {/* Right Column (Sidebar: Trust Score & Benefits) */}
                    <div className="space-y-6 lg:sticky lg:top-36">
                        {/* Trust Score Card */}
                        <TrustScore user={dbUser} />

                        {/* Why Verification Matters Card */}
                        <div className="rounded-3xl bg-gradient-to-br from-blue-500/10 via-emerald-500/5 to-transparent border border-blue-500/20 p-6 shadow-xs space-y-4">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
                                    RentHub Verified Perks
                                </h4>
                            </div>

                            <ul className="space-y-3 text-xs text-[var(--text-secondary)] font-medium">
                                <li className="flex items-start gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)] shrink-0 mt-0.5" />
                                    <span>
                                        <strong className="text-[var(--text-primary)]">3x Faster Application Approvals:</strong> Verified tenants receive top placement on landlord review dashboards.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)] shrink-0 mt-0.5" />
                                    <span>
                                        <strong className="text-[var(--text-primary)]">Direct WhatsApp & In-App Chat:</strong> Communicate safely with verified property owners without intermediary agent delays.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)] shrink-0 mt-0.5" />
                                    <span>
                                        <strong className="text-[var(--text-primary)]">100% Escrow Protection:</strong> Funds are locked safely in escrow until you inspect the property on move-in day.
                                    </span>
                                </li>
                                {isLandlord && (
                                    <li className="flex items-start gap-2.5">
                                        <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                        <span>
                                            <strong className="text-[var(--text-primary)]">Instant Payouts:</strong> Automated disbursement into your Nigerian bank or AfriExchange wallet.
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Security Notice */}
                        <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/60 border border-[var(--border-color)] flex items-start gap-3 text-xs text-[var(--text-secondary)]">
                            <Lock className="h-4 w-4 text-[var(--color-brand-green)] shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold text-[var(--text-primary)]">Bank-Grade Privacy</p>
                                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                    Your government identification data is strictly encrypted and will never be sold or shared with street agents.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Phone Verification OTP Modal */}
            <PhoneVerificationModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
                clerkId={user?.id || ""}
                phone={formData.phone}
                onVerified={() => {
                    fetchUserProfile();
                    toast.success("Phone verified successfully!");
                }}
            />
        </div>
    );
}
