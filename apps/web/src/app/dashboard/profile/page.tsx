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
    KeyRound,
    Mail,
    RefreshCw,
    Trash2,
    Edit2,
    Lock,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ProfilePage() {
    const { user, isLoaded } = useUser();
    const [dbUser, setDbUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);

    // AfriExchange Settlement State (Kaalis Security 2FA Model)
    const [afriExchangeEmail, setAfriExchangeEmail] = useState("");
    const [afriExchangeWallet, setAfriExchangeWallet] = useState("");
    const [isEditingAfriExchange, setIsEditingAfriExchange] = useState(false);
    const [verificationStep, setVerificationStep] = useState<"idle" | "code_sent">("idle");
    const [verificationRequestId, setVerificationRequestId] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [isRequestingCode, setIsRequestingCode] = useState(false);
    const [isConfirmingCode, setIsConfirmingCode] = useState(false);
    const [isUnlinking, setIsUnlinking] = useState(false);

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

    const handleRequestLinkVerification = async () => {
        const email = afriExchangeEmail.trim();
        const wallet = afriExchangeWallet.trim();

        if (!email && !wallet) {
            toast.error("Please enter your AfriExchange email address or wallet address");
            return;
        }

        setIsRequestingCode(true);
        try {
            const res = await api.post("/payouts/link-verification/request", {
                accountEmail: email || undefined,
                walletAddress: wallet || undefined,
            });

            if (res.data?.success) {
                setVerificationRequestId(res.data.verification.requestId);
                setMaskedEmail(res.data.verification.maskedEmail || email);
                setVerificationStep("code_sent");
                toast.success("Security verification code sent!", {
                    description: `Check your email (${res.data.verification.maskedEmail || email}) for your 6-digit OTP code.`,
                });
            } else {
                toast.error(res.data?.message || "Failed to initiate verification");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send verification code. Ensure your account exists on AfriExchange.");
        } finally {
            setIsRequestingCode(false);
        }
    };

    const handleConfirmLinkVerification = async () => {
        const cleanCode = otpCode.trim();
        if (!cleanCode || cleanCode.length < 6) {
            toast.error("Please enter the complete 6-digit verification code");
            return;
        }

        setIsConfirmingCode(true);
        try {
            const res = await api.post("/payouts/link-verification/confirm", {
                requestId: verificationRequestId,
                code: cleanCode,
            });

            if (res.data?.success) {
                toast.success("AfriExchange Account Verified & Linked!", {
                    description: "Your rent escrow payouts will now be automatically disbursed to your verified AfriExchange wallet.",
                });
                await fetchUserProfile();
                setVerificationStep("idle");
                setIsEditingAfriExchange(false);
                setOtpCode("");
                setVerificationRequestId("");
            } else {
                toast.error(res.data?.message || "Failed to verify code");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Invalid or expired verification code");
        } finally {
            setIsConfirmingCode(false);
        }
    };

    const handleUnlinkAfriExchange = async () => {
        if (!confirm("Are you sure you want to unlink your AfriExchange payout account? You will need to re-verify a new account to receive rent escrow payouts.")) {
            return;
        }

        setIsUnlinking(true);
        try {
            const res = await api.delete("/payouts/unlink-afriexchange");
            if (res.data?.success) {
                toast.success("Settlement account unlinked");
                await fetchUserProfile();
                setIsEditingAfriExchange(false);
                setVerificationStep("idle");
                setVerificationRequestId("");
                setOtpCode("");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to unlink account");
        } finally {
            setIsUnlinking(false);
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

                        {/* AfriExchange Payout Settlement Setup (Kaalis Style with 2FA) */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                        <Wallet className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">AfriExchange Rent Payout Setup</h3>
                                        <p className="text-xs text-gray-500">
                                            Instant rent escrow payouts directly to your AfriExchange mobile wallet
                                        </p>
                                    </div>
                                </div>

                                {dbUser?.settlementLinkedAt && !isEditingAfriExchange && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                        Verified & Active
                                    </span>
                                )}
                            </div>

                            {/* State 1: Active & Verified */}
                            {dbUser?.settlementLinkedAt && !isEditingAfriExchange ? (
                                <div className="space-y-6">
                                    <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="p-3 bg-white rounded-lg border border-emerald-50">
                                                <span className="text-xs text-gray-500 font-medium block mb-1">AfriExchange Account Email</span>
                                                <span className="font-semibold text-gray-900 flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-emerald-600" />
                                                    {dbUser.afriExchangeAccountEmail || "—"}
                                                </span>
                                            </div>

                                            <div className="p-3 bg-white rounded-lg border border-emerald-50">
                                                <span className="text-xs text-gray-500 font-medium block mb-1">Settlement Wallet</span>
                                                <span className="font-mono text-xs text-gray-800 break-all flex items-center gap-2">
                                                    <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
                                                    {dbUser.afriExchangeWalletAddress || "Auto-routed to AfriX account wallet"}
                                                </span>
                                            </div>

                                            <div className="p-3 bg-white rounded-lg border border-emerald-50">
                                                <span className="text-xs text-gray-500 font-medium block mb-1">Security Status</span>
                                                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    2FA Ownership Verified
                                                </span>
                                            </div>

                                            <div className="p-3 bg-white rounded-lg border border-emerald-50">
                                                <span className="text-xs text-gray-500 font-medium block mb-1">Linked Date</span>
                                                <span className="text-xs text-gray-700">
                                                    {new Date(dbUser.settlementLinkedAt).toLocaleDateString(undefined, {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                            When RentHub admin releases tenant rent from escrow, your net rent tokens will be immediately deposited into this AfriExchange account.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button
                                            variant="outline"
                                            className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                            onClick={() => {
                                                setIsEditingAfriExchange(true);
                                                setVerificationStep("idle");
                                                setOtpCode("");
                                            }}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            Change Account
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-2 text-sm"
                                            onClick={handleUnlinkAfriExchange}
                                            disabled={isUnlinking}
                                        >
                                            {isUnlinking ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                            Unlink Payout Account
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* State 2: Setup or Edit Mode */
                                <div className="space-y-5">
                                    {verificationStep === "idle" ? (
                                        <>
                                            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-100 text-sm text-blue-900 space-y-1">
                                                <div className="font-semibold flex items-center gap-2">
                                                    <Lock className="h-4 w-4 text-blue-600" />
                                                    Two-Factor Security Verification
                                                </div>
                                                <p className="text-xs text-blue-800 leading-relaxed">
                                                    To protect your rent payouts, we verify account ownership via a one-time 6-digit confirmation code dispatched to the email registered on your AfriExchange mobile app.
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <label className="block text-sm font-bold text-gray-700">
                                                            AfriExchange Account Email / ID
                                                        </label>
                                                        {(user?.primaryEmailAddress?.emailAddress || dbUser?.email) && (
                                                            <button
                                                                type="button"
                                                                className="text-xs text-[var(--color-brand-blue)] hover:underline font-semibold"
                                                                onClick={() => {
                                                                    const myEmail = user?.primaryEmailAddress?.emailAddress || dbUser?.email || "";
                                                                    setAfriExchangeEmail(myEmail);
                                                                }}
                                                            >
                                                                Use my login email ({user?.primaryEmailAddress?.emailAddress || dbUser?.email})
                                                            </button>
                                                        )}
                                                    </div>
                                                    <Input
                                                        type="email"
                                                        value={afriExchangeEmail}
                                                        onChange={(e) => setAfriExchangeEmail(e.target.value)}
                                                        placeholder="e.g. harunjibs@gmail.com"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        The email registered on your AfriX mobile app.
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
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Optional. If left blank, AfriExchange automatically resolves your registered primary wallet.
                                                    </p>
                                                </div>

                                                <div className="pt-2 flex items-center gap-3">
                                                    <Button
                                                        className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold flex items-center gap-2"
                                                        onClick={handleRequestLinkVerification}
                                                        disabled={isRequestingCode}
                                                    >
                                                        {isRequestingCode ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Sending Code...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <KeyRound className="h-4 w-4" />
                                                                Send Verification Code
                                                            </>
                                                        )}
                                                    </Button>

                                                    {isEditingAfriExchange && (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setIsEditingAfriExchange(false);
                                                                setVerificationStep("idle");
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* Step 2: Enter OTP Code */
                                        <div className="space-y-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-emerald-950 text-base flex items-center gap-2">
                                                    <KeyRound className="h-5 w-5 text-emerald-600" />
                                                    Enter 6-Digit Verification Code
                                                </h4>
                                                <p className="text-xs text-emerald-900 leading-relaxed">
                                                    We have sent a 6-digit confirmation code to{" "}
                                                    <span className="font-mono font-bold text-emerald-950">{maskedEmail}</span>.
                                                    Enter the code below to authorize and link this account.
                                                </p>
                                            </div>

                                            <div className="max-w-xs">
                                                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                                                    6-Digit Security Code
                                                </label>
                                                <Input
                                                    type="text"
                                                    maxLength={6}
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    placeholder="123456"
                                                    className="text-center font-mono text-2xl font-bold tracking-[0.5em] h-12 bg-white border-2 border-emerald-300 focus:border-emerald-500"
                                                    autoFocus
                                                />
                                            </div>

                                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                                <Button
                                                    className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold flex items-center gap-2"
                                                    onClick={handleConfirmLinkVerification}
                                                    disabled={isConfirmingCode || otpCode.trim().length < 6}
                                                >
                                                    {isConfirmingCode ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Verifying Code...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldCheck className="h-4 w-4" />
                                                            Confirm & Link Account
                                                        </>
                                                    )}
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="text-gray-700 border-gray-300 hover:bg-white"
                                                    onClick={() => {
                                                        setVerificationStep("idle");
                                                        setOtpCode("");
                                                    }}
                                                >
                                                    Back / Use Different Email
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/50 text-xs flex items-center gap-1.5"
                                                    onClick={handleRequestLinkVerification}
                                                    disabled={isRequestingCode}
                                                >
                                                    <RefreshCw className={`h-3.5 w-3.5 ${isRequestingCode ? "animate-spin" : ""}`} />
                                                    Resend Code
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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
