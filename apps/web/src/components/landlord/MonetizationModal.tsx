"use client";

import React, { useState } from "react";
import { RevenueCard } from "./RevenueCard";
import api from "@/lib/api";
import { Sparkles, ShieldCheck, X, Lock, CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { PaymentMethodModal, AfriExchangeTokenType } from "@/components/payment/PaymentMethodModal";

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
    const { user } = useUser();
    const [activeService, setActiveService] = useState<{
        type: "PROPERTY_VERIFICATION" | "FEATURED_LISTING";
        title: string;
        amount: number;
    } | null>(null);

    if (!isOpen) return null;

    const handlePaystackPayment = async () => {
        if (!activeService) return;
        try {
            const response = await api.post(`/services/pay?clerkId=${user?.id}`, {
                type: activeService.type,
                propertyId,
            });

            if (response.data?.data?.authorizationUrl) {
                window.location.href = response.data.data.authorizationUrl;
            } else {
                throw new Error("Authorization URL not received from Paystack");
            }
        } catch (error: any) {
            console.error("Paystack payment failed", error);
            const message =
                error.response?.data?.error ||
                error.message ||
                "Paystack initiation failed. Please try again.";
            toast.error("Paystack Payment Failed", {
                description: message,
            });
            throw error;
        }
    };

    const handleAfriExchangePayment = async ({
        accountEmail,
        walletAddress,
        tokenType,
        amountInToken,
    }: {
        accountEmail: string;
        walletAddress?: string;
        tokenType: AfriExchangeTokenType;
        amountInToken: number;
    }) => {
        if (!activeService) return;
        try {
            const response = await api.post(`/services/afriexchange/pay?clerkId=${user?.id}`, {
                type: activeService.type,
                propertyId,
                accountEmail,
                walletAddress,
                tokenType,
                amountInToken,
                returnUrl: `${window.location.origin}/dashboard?tab=properties&payment=success&service=${activeService.type}`,
            });

            const paymentUrl = response.data?.data?.paymentUrl;
            if (paymentUrl) {
                setActiveService(null);
                window.location.href = paymentUrl;
                return;
            }

            toast.success("Service Activated Successfully via AfriExchange!");
            setActiveService(null);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("AfriExchange service payment failed", error);
            const message =
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                "Failed to process AfriExchange payment.";
            toast.error("AfriExchange Payment Failed", {
                description: message,
            });
            throw error;
        }
    };

    return (
        <>
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
                                Attract 3x more tenants faster with verified badges and prominent homepage placement. Pay seamlessly with Card, Bank Transfer, or AfriExchange Wallet.
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
                                    : "Verify Property"
                            }
                            disabled={isVerified}
                            icon={<ShieldCheck className="h-6 w-6" />}
                            onClick={() =>
                                setActiveService({
                                    type: "PROPERTY_VERIFICATION",
                                    title: "Official Property Verification & Inspection Badge",
                                    amount: 20000,
                                })
                            }
                        />

                        <RevenueCard
                            title="Feature Listing"
                            description="Skyrocket listing impressions. Get pinned right at the top of search results and featured on the RentHub homepage for 30 consecutive days."
                            price="₦50,000"
                            buttonText={
                                isFeatured
                                    ? "Already Featured"
                                    : "Feature Property"
                            }
                            disabled={isFeatured}
                            isPopular={true}
                            icon={<Sparkles className="h-6 w-6" />}
                            onClick={() =>
                                setActiveService({
                                    type: "FEATURED_LISTING",
                                    title: "30-Day Featured Listing & Homepage Pin",
                                    amount: 50000,
                                })
                            }
                        />
                    </div>

                    {/* Security & Dual-Gateway Payment Notice Footer */}
                    <div className="p-5 sm:p-6 bg-[var(--bg-muted)]/70 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2 font-medium">
                            <Lock className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                            <span>Supported Gateways: Paystack (Cards & Bank) & AfriExchange (NT, CT, USDT)</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-semibold">
                            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>Dual Gateway Checkout Enabled</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dual Gateway Payment Selection Modal */}
            {activeService && (
                <PaymentMethodModal
                    isOpen={!!activeService}
                    onClose={() => setActiveService(null)}
                    totalAmount={activeService.amount}
                    propertyTitle={activeService.title}
                    defaultEmail={user?.emailAddresses?.[0]?.emailAddress || ""}
                    onPaystack={handlePaystackPayment}
                    onAfriExchange={handleAfriExchangePayment}
                />
            )}
        </>
    );
};
