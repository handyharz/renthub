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
    AlertTriangle,
    ShieldCheck,
    Wallet,
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
                firstName: data.firstName || "",
                lastName: data.lastName || "",
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

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch(`/users/me?clerkId=${user?.id}`, formData);
            await fetchUserProfile();
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-green)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20 transition-colors">
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
                <div className="container-wide py-8">
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] mb-2">My Profile</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Complete your profile to build trust and unlock features.</p>
                </div>
            </div>

            <div className="container-wide py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Personal Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">First Name</label>
                                    <Input
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Last Name</label>
                                    <Input
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Phone Number</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                        placeholder="080..."
                                        className="flex-1"
                                    />
                                    {dbUser?.phoneVerified ? (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 font-bold text-xs">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Verified
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/10 font-bold text-xs rounded-xl"
                                            onClick={() => setShowVerifyModal(true)}
                                            disabled={!formData.phone || formData.phone.length < 10}
                                        >
                                            Verify Now
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-2">Required for contacting landlords and tenants.</p>
                            </div>

                            <Button
                                className="w-full md:w-auto bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90 text-white font-bold rounded-xl"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>

                        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--text-primary)]">Identity Verification</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">Upload your government ID to get the Verified Badge.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">ID Type</label>
                                        <select
                                            className="w-full flex h-10 rounded-md border border-[var(--border-color)] bg-[var(--select-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-green)]"
                                            value={formData.idType}
                                            onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                                        >
                                            <option value="">Select ID Type</option>
                                            <option value="NIN">National Identity Number (NIN)</option>
                                            <option value="VOTERS_CARD">Voter's Card</option>
                                            <option value="DRIVERS_LICENSE">Driver's License</option>
                                            <option value="PASSPORT">International Passport</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">ID Number</label>
                                        <Input
                                            value={formData.idNumber}
                                            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                            placeholder="Enter your ID number"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">ID Document (Image or PDF)</label>
                                    <DocumentUploader
                                        userId={dbUser?.id}
                                        currentUrl={dbUser?.idDocumentUrl}
                                        onUploadSuccess={() => {
                                            fetchUserProfile();
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* AfriExchange Payout Settlement Setup (Kaalis Style with 2FA) */}
                        <AfriExchangeLinkingCard dbUser={dbUser} onRefresh={fetchUserProfile} />
                    </div>

                    {/* Right Column: Score & Tips */}
                    <div className="space-y-6">
                        <TrustScore user={dbUser} />

                        <div className="bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20">
                            <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                Why complete your profile?
                            </h4>
                            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2 list-disc list-inside">
                                <li>Landlords trust verified profiles 3x more.</li>
                                <li>Unlock direct messaging with landlords.</li>
                                <li>Get priority for property viewings.</li>
                                <li>Access rent financing options (Coming Soon).</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <PhoneVerificationModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
                clerkId={user?.id || ""}
                phone={formData.phone}
                onVerified={() => {
                    fetchUserProfile(); // Refresh state
                    toast.success("Phone verified successfully!");
                }}
            />
        </div>
    );
}
