"use client";

import React, { useState } from "react";
import { RevenueCard } from "./RevenueCard";
import api from "@/lib/api";
import { Sparkles, ShieldCheck, X, CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface MonetizationModalProps {
    propertyId: string;
    isOpen: boolean;
    isVerified?: boolean;
    isFeatured?: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({
    propertyId,
    isOpen,
    isVerified = false,
    isFeatured = false,
    onClose,
    onSuccess,
}) => {
    const [loadingType, setLoadingType] = useState<"PROPERTY_VERIFICATION" | "FEATURED_LISTING" | null>(null);

    if (!isOpen) return null;

    const handlePayment = async (type: "PROPERTY_VERIFICATION" | "FEATURED_LISTING") => {
        setLoadingType(type);
        try {
            const response = await api.post("/services/pay", { type, propertyId });

            if (response.data?.data?.authorizationUrl) {
                // Redirect to Paystack
                window.location.href = response.data.data.authorizationUrl;
            } else {
                throw new Error("Authorization URL not received");
            }
        } catch (error: any) {
            console.error("Payment failed", error);
            const message =
                error.response?.data?.error ||
                error.message ||
                "Payment initiation failed. Please try again.";
            toast.error("Payment Initiation Failed", {
                description: message,
            });
        } finally {
            setLoadingType(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 sm:p-7 border-b border-[var(--border-color)] flex justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                <Sparkles className="h-5 w-5" />
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                                Boost Your Listing
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                            Attract 3x more tenants faster with verified badges and prominent homepage placement.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors shrink-0"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Cards Grid */}
                <div className="p-6 sm:p-8 grid md:grid-cols-2 gap-6 sm:gap-8">
                    <RevenueCard
                        title="Get Verified"
                        description="Build instant tenant trust. Our physical inspectors visit your property, verify legal ownership documents, and award the Official Verified Badge."
                        price="₦20,000"
                        buttonText={
                            isVerified
                                ? "Already Verified"
                                : loadingType === "PROPERTY_VERIFICATION"
                                ? "Processing..."
                                : "Verify Property"
                        }
                        disabled={loadingType !== null || isVerified}
                        loading={loadingType === "PROPERTY_VERIFICATION"}
                        icon={<ShieldCheck className="h-6 w-6" />}
                        onClick={() => handlePayment("PROPERTY_VERIFICATION")}
                    />

                    <RevenueCard
                        title="Feature Listing"
                        description="Skyrocket listing impressions. Get pinned right at the top of search results and featured on the RentHub homepage for 30 consecutive days."
                        price="₦50,000"
                        buttonText={
                            isFeatured
                                ? "Already Featured"
                                : loadingType === "FEATURED_LISTING"
                                ? "Processing..."
                                : "Feature Property"
                        }
                        disabled={loadingType !== null || isFeatured}
                        loading={loadingType === "FEATURED_LISTING"}
                        isPopular={true}
                        icon={<Sparkles className="h-6 w-6" />}
                        onClick={() => handlePayment("FEATURED_LISTING")}
                    />
                </div>

                {/* Security & Payment Notice Footer */}
                <div className="p-5 sm:p-6 bg-[var(--bg-muted)]/70 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2 font-medium">
                        <Lock className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                        <span>Secure 256-bit payment via Paystack (Debit Card, USSD, Bank Transfer)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>Instant activation upon payment confirmation</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
