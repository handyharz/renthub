"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TrustScore } from "@/components/profile/TrustScore";
import { PhoneVerificationModal } from "@/components/profile/PhoneVerificationModal";
import { DocumentUploader } from "@/components/profile/DocumentUploader";
import api from "@/lib/api";
import { Loader2, CheckCircle2, AlertTriangle, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const { user, isLoaded } = useUser();
    const [dbUser, setDbUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [afriExchangeEmail, setAfriExchangeEmail] = useState("");
    const [afriExchangeWallet, setAfriExchangeWallet] = useState("");
    const [savingAfriExchange, setSavingAfriExchange] = useState(false);

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
            setAfriExchangeEmail(data.afriExchangeAccountEmail || "");
            setAfriExchangeWallet(data.afriExchangeWalletAddress || "");
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

    const handleSaveAfriExchange = async () => {
        if (!afriExchangeEmail.trim() && !afriExchangeWallet.trim()) {
            alert("Please enter an AfriExchange account email or wallet address");
            return;
        }
        setSavingAfriExchange(true);
        try {
            await api.put("/payouts/link-afriexchange", {
                afriExchangeAccountEmail: afriExchangeEmail.trim() || undefined,
                afriExchangeWalletAddress: afriExchangeWallet.trim() || undefined,
            });
            await fetchUserProfile();
            alert("AfriExchange settlement account saved successfully!");
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to link AfriExchange account");
        } finally {
            setSavingAfriExchange(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch(`/users/me?clerkId=${user?.id}`, formData);
            // Re-fetch to get updated verifications status (e.g. if phone changed, verified becomes false)
            await fetchUserProfile();
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200">
                <div className="container-wide py-8">
                    <h1 className="text-3xl font-bold text-[var(--color-brand-blue)] mb-2">My Profile</h1>
                    <p className="text-gray-600">Complete your profile to build trust and unlock features.</p>
                </div>
            </div>

            <div className="container-wide py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                                    <Input
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                                    <Input
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                        placeholder="080..."
                                        className="flex-1"
                                    />
                                    {dbUser.phoneVerified ? (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 font-bold">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Verified
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                            onClick={() => setShowVerifyModal(true)}
                                            disabled={!formData.phone || formData.phone.length < 10}
                                        >
                                            Verify Now
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Required for contacting landlords.</p>
                            </div>

                            <Button
                                className="w-full md:w-auto bg-[var(--color-brand-blue)] font-bold"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-blue-50 rounded-full">
                                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Identity Verification</h3>
                                    <p className="text-sm text-gray-600">Upload your government ID to get the Verified Badge.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">ID Type</label>
                                        <select
                                            className="w-full flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
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
                                        <label className="block text-sm font-bold text-gray-700 mb-2">ID Number</label>
                                        <Input
                                            value={formData.idNumber}
                                            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                            placeholder="Enter your ID number"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">ID Document (Image or PDF)</label>
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

                        {/* AfriExchange Payout Settlement Setup (Kaalis Style) */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">AfriExchange Rent Payout Setup</h3>
                                    <p className="text-sm text-gray-600">
                                        Link your AfriExchange account or wallet to receive released rent escrow directly.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        AfriExchange Account Email
                                    </label>
                                    <Input
                                        type="email"
                                        value={afriExchangeEmail}
                                        onChange={(e) => setAfriExchangeEmail(e.target.value)}
                                        placeholder="e.g. your_afrix_email@gmail.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        The email associated with your AfriX mobile app account.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        AfriExchange Wallet Address (Optional)
                                    </label>
                                    <Input
                                        value={afriExchangeWallet}
                                        onChange={(e) => setAfriExchangeWallet(e.target.value)}
                                        placeholder="0x..."
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-between">
                                    <Button
                                        className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold"
                                        onClick={handleSaveAfriExchange}
                                        disabled={savingAfriExchange}
                                    >
                                        {savingAfriExchange ? "Saving..." : "Save Payout Account"}
                                    </Button>

                                    {dbUser?.settlementLinkedAt && (
                                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Linked on {new Date(dbUser.settlementLinkedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Score & Tips */}
                    <div className="space-y-6">
                        <TrustScore user={dbUser} />

                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Why complete your profile?
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
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
                    alert("Phone verified successfully!");
                }}
            />
        </div>
    );
}
