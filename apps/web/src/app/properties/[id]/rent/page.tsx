"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import {
    ArrowLeft,
    ShieldCheck,
    ChevronRight,
    Building2,
    Loader2,
    FileText,
    CreditCard,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { PaymentMethodModal } from "@/components/payment/PaymentMethodModal";

export default function RentPropertyPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useUser();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        if (id) fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            const res = await api.get(`/properties/${id}`);
            setProperty(res.data.data);
        } catch (error) {
            console.error("Failed to fetch property:", error);
            setError("Failed to load property details");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPaymentModal = () => {
        if (!user) {
            router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`);
            return;
        }
        setIsPaymentModalOpen(true);
    };

    const handlePaystackPayment = async () => {
        setProcessing(true);
        setError(null);

        try {
            const transactionRes = await api.post(`/transactions?clerkId=${user?.id}`, {
                propertyId: property.id,
                paymentMethod: "CARD",
                paymentGateway: "PAYSTACK",
                leaseDuration: 12,
            });

            const transaction = transactionRes.data.data;

            const paymentRes = await api.post(`/payments/initialize?clerkId=${user?.id}`, {
                transactionId: transaction.id,
                callbackUrl: `${window.location.origin}/payment/verify`,
            });

            const { authorization_url } = paymentRes.data.data;
            window.location.href = authorization_url;
        } catch (err: any) {
            console.error("Paystack initialization failed:", err);
            setError(err.response?.data?.message || "Failed to initialize payment. Please try again.");
            setProcessing(false);
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
        tokenType: "NT" | "CT" | "USDT";
        amountInToken?: number;
    }) => {
        setProcessing(true);
        setError(null);

        try {
            const transactionRes = await api.post(`/transactions?clerkId=${user?.id}`, {
                propertyId: property.id,
                paymentMethod: "BANK_TRANSFER",
                paymentGateway: "AFRIEXCHANGE",
                leaseDuration: 12,
            });

            const transaction = transactionRes.data.data;

            const payRes = await api.post(`/payments/afriexchange/pay?clerkId=${user?.id}`, {
                transactionId: transaction.id,
                afriExchangeAccountEmail: accountEmail,
                afriExchangeWalletAddress: walletAddress,
                tokenType: tokenType || "NT",
                amountInToken,
                returnUrl: `${window.location.origin}/dashboard?tab=applications&payment=success&txId=${transaction.id}`,
            });

            const paymentUrl = payRes.data?.data?.paymentUrl;
            if (paymentUrl) {
                setIsPaymentModalOpen(false);
                window.location.href = paymentUrl;
                return;
            }

            setIsPaymentModalOpen(false);
            router.push("/dashboard?tab=applications&payment=success");
        } catch (err: any) {
            console.error("AfriExchange payment failed:", err);
            setError(err.response?.data?.message || "Failed to process AfriExchange payment. Please try again.");
            setProcessing(false);
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-green)]" />
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">Loading property details...</p>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 text-center">
                <div>
                    <Building2 className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="font-bold text-[var(--text-primary)]">Property not found</p>
                    <Button onClick={() => router.back()} variant="outline" className="mt-4 rounded-xl border-[var(--border-color)]">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // Calculate platform fee (2% of annual rent)
    const platformFee = Math.round(property.pricePerYear * 0.02);

    // Traditional agent fee would be 20-24% of annual rent
    const traditionalAgentFee = Math.round(property.pricePerYear * 0.24);
    const savings = traditionalAgentFee - platformFee;

    const totalUpfront =
        property.pricePerYear +
        (property.cautionFee || 0) +
        (property.legalFee || 0) +
        (property.serviceFee || 0) +
        platformFee;

    const steps = [
        {
            num: 1,
            title: "Review Costs & Verification",
            desc: "Ensure you've reviewed all fees and your profile is 100% complete.",
            active: true,
        },
        {
            num: 2,
            title: "Sign Digital Lease",
            desc: "Review and digitally sign the RentHub standard tenancy agreement.",
            active: false,
        },
        {
            num: 3,
            title: "Secure Escrow Payment",
            desc: "Pay the total upfront amount to RentHub Escrow. Funds are released only after move-in.",
            active: false,
        },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
            {/* Header */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-16 z-30 backdrop-blur-md bg-[var(--bg-card)]/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-xl"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-black text-[var(--text-primary)]">Escrow Payment</h1>
                        <p className="text-xs text-[var(--text-muted)] font-medium truncate max-w-xs">{property.title}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Application Steps */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Steps Card */}
                        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-xs">
                            <h2 className="text-base font-black text-[var(--text-primary)] mb-6 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[var(--color-brand-green)]" />
                                Application Process
                            </h2>

                            <div className="space-y-6">
                                {steps.map((step) => (
                                    <div key={step.num} className={`flex gap-4 ${!step.active ? "opacity-50" : ""}`}>
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                                                step.active
                                                    ? "bg-[var(--color-brand-green)] text-white shadow-sm"
                                                    : "bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-color)]"
                                            }`}
                                        >
                                            {step.active ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[var(--text-primary)] text-sm mb-0.5">{step.title}</h3>
                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Guarantee Banner */}
                        <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex gap-4">
                            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="font-black text-blue-600 dark:text-blue-400 text-sm mb-1">
                                    RentHub 100% Escrow Quality Guarantee
                                </h3>
                                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                                    Your money is held in escrow. If the property doesn't match the listing during move-in inspection, you get a full refund — guaranteed.
                                </p>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-red-600 dark:text-red-400 text-sm mb-1">Payment Error</h4>
                                    <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* CTA Button */}
                        <Button
                            onClick={handleOpenPaymentModal}
                            disabled={processing}
                            className="w-full h-14 text-base font-black bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Continue to Secure Payment
                                    <ChevronRight className="h-5 w-5 ml-1" />
                                </>
                            )}
                        </Button>

                        {!user && (
                            <p className="text-xs text-center text-[var(--text-muted)] font-medium">
                                Please{" "}
                                <Link href="/sign-in" className="text-[var(--color-brand-green)] font-bold hover:underline">
                                    sign in
                                </Link>{" "}
                                to continue
                            </p>
                        )}
                    </div>

                    {/* Right: Payment Summary Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-xs sticky top-32 space-y-5">
                            <h3 className="text-base font-black text-[var(--text-primary)] border-b border-[var(--border-color)] pb-4">
                                Payment Summary
                            </h3>

                            {/* Fee Breakdown */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--text-secondary)] font-semibold">Rent per annum</span>
                                    <span className="font-black text-[var(--text-primary)] text-sm tabular-nums">{formatPrice(property.pricePerYear)}</span>
                                </div>
                                {property.cautionFee > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-[var(--text-secondary)] font-semibold">Caution Deposit</span>
                                        <span className="font-black text-[var(--text-primary)] text-sm tabular-nums">{formatPrice(property.cautionFee)}</span>
                                    </div>
                                )}
                                {property.legalFee > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-[var(--text-secondary)] font-semibold">Legal Agreement Fee</span>
                                        <span className="font-black text-[var(--text-primary)] text-sm tabular-nums">{formatPrice(property.legalFee)}</span>
                                    </div>
                                )}
                                {property.serviceFee > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-[var(--text-secondary)] font-semibold">Service Charge</span>
                                        <span className="font-black text-[var(--text-primary)] text-sm tabular-nums">{formatPrice(property.serviceFee)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center bg-[var(--color-brand-green)]/8 -mx-2 px-2 py-2 rounded-xl border border-[var(--color-brand-green)]/15">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-[var(--text-primary)] font-bold">RentHub Escrow Fee (2%)</span>
                                        <span className="text-[10px] text-[var(--color-brand-green)] font-semibold">vs 20–24% traditional agent fee</span>
                                    </div>
                                    <span className="font-black text-[var(--color-brand-green)] text-sm tabular-nums">{formatPrice(platformFee)}</span>
                                </div>
                            </div>

                            {/* Savings Badge */}
                            <div className="border-t border-[var(--border-color)] pt-4">
                                <div className="bg-gradient-to-br from-emerald-500/10 to-[var(--color-brand-green)]/5 border border-emerald-500/20 p-4 rounded-2xl">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                            You Save vs Agent
                                        </span>
                                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-0.5">
                                        {formatPrice(savings)}
                                    </div>
                                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                                        vs traditional agent fees ({formatPrice(traditionalAgentFee)})
                                    </p>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center border-t border-[var(--border-color)] pt-4">
                                <span className="font-black text-[var(--text-primary)] text-sm">Total Upfront (Escrow)</span>
                                <span className="text-xl font-black text-[var(--color-brand-green)] tabular-nums">
                                    {formatPrice(totalUpfront)}
                                </span>
                            </div>

                            {/* Property Details Strip */}
                            <div className="bg-[var(--bg-muted)] rounded-2xl p-4 border border-[var(--border-color)] space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-xs">
                                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                                    </div>
                                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">{property.title}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-xs">
                                        <FileText className="h-3.5 w-3.5 text-orange-500" />
                                    </div>
                                    <span className="text-xs font-bold text-[var(--text-secondary)]">12 Months Lease</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-xs">
                                        <CreditCard className="h-3.5 w-3.5 text-[var(--color-brand-green)]" />
                                    </div>
                                    <span className="text-xs font-bold text-[var(--color-brand-green)]">100% Escrow Protected</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {property && (
                <PaymentMethodModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    totalAmount={totalUpfront}
                    propertyTitle={property.title}
                    defaultEmail={user?.emailAddresses?.[0]?.emailAddress || ""}
                    onPaystack={handlePaystackPayment}
                    onAfriExchange={handleAfriExchangePayment}
                />
            )}
        </div>
    );
}
