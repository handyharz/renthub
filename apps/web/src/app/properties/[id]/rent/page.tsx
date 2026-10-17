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
    AlertCircle
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
            // Step 1: Create transaction with PAYSTACK
            const transactionRes = await api.post(`/transactions?clerkId=${user?.id}`, {
                propertyId: property.id,
                paymentMethod: "CARD",
                paymentGateway: "PAYSTACK",
                leaseDuration: 12,
            });

            const transaction = transactionRes.data.data;

            // Step 2: Initialize payment with Paystack
            const paymentRes = await api.post(`/payments/initialize?clerkId=${user?.id}`, {
                transactionId: transaction.id,
                callbackUrl: `${window.location.origin}/payment/verify`,
            });

            const { authorization_url } = paymentRes.data.data;

            // Step 3: Redirect to Paystack
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
    }: {
        accountEmail: string;
        walletAddress?: string;
    }) => {
        setProcessing(true);
        setError(null);

        try {
            // Step 1: Create transaction with AFRIEXCHANGE
            const transactionRes = await api.post(`/transactions?clerkId=${user?.id}`, {
                propertyId: property.id,
                paymentMethod: "BANK_TRANSFER",
                paymentGateway: "AFRIEXCHANGE",
                leaseDuration: 12,
            });

            const transaction = transactionRes.data.data;

            // Step 2: Pay with AfriExchange
            await api.post(`/payments/afriexchange/pay?clerkId=${user?.id}`, {
                transactionId: transaction.id,
                afriExchangeAccountEmail: accountEmail,
                afriExchangeWalletAddress: walletAddress,
            });

            setIsPaymentModalOpen(false);
            router.push("/dashboard?tab=applications&payment=success");
        } catch (err: any) {
            console.error("AfriExchange payment failed:", err);
            setError(err.response?.data?.message || "Failed to process AfriExchange payment. Please try again.");
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-20 text-center">Loading...</div>;
    if (!property) return <div className="p-20 text-center">Property not found</div>;

    // Calculate platform fee (2% of annual rent)
    const platformFee = Math.round(property.pricePerYear * 0.02);

    // Traditional agent fee would be 20-24% of annual rent
    const traditionalAgentFee = Math.round(property.pricePerYear * 0.24);
    const savings = traditionalAgentFee - platformFee;

    const totalUpfront = property.pricePerYear + property.cautionFee + property.legalFee + property.serviceFee + platformFee;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-[var(--color-brand-blue)]">Rental Application</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Application Steps */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all duration-300">
                            <h2 className="text-lg font-bold text-[var(--color-brand-blue)] mb-6 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[var(--color-brand-green)]" />
                                Application Process
                            </h2>

                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="h-8 w-8 rounded-full bg-[var(--color-brand-green)] text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-0.5">Review Costs & Verification</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">Ensure you've reviewed all fees and your profile is 100% complete.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 text-gray-400">
                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center font-bold flex-shrink-0">2</div>
                                    <div>
                                        <h3 className="font-bold mb-0.5">Sign Digital Lease</h3>
                                        <p className="text-sm leading-relaxed">Review and digitally sign the RentHub standard tenancy agreement.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 text-gray-400">
                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center font-bold flex-shrink-0">3</div>
                                    <div>
                                        <h3 className="font-bold mb-0.5">Secure Escrow Payment</h3>
                                        <p className="text-sm leading-relaxed">Pay the total upfront amount to RentHub Escrow. Funds are released only after move-in.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 flex gap-4">
                            <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-blue-900 mb-1">RentHub Quality Guarantee</h3>
                                <p className="text-sm text-blue-800 leading-relaxed font-medium">Your money is held in escrow. If the property doesn't match the listing during move-in, you get a 100% refund.</p>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-red-900 mb-1">Payment Error</h4>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleOpenPaymentModal}
                            disabled={processing}
                            className="w-full h-14 text-lg font-bold bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 transform active:scale-[0.99] transition-all rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Continue to Payment
                                    <ChevronRight className="h-5 w-5 ml-2" />
                                </>
                            )}
                        </Button>

                        {!user && (
                            <p className="text-sm text-center text-gray-500">
                                Please <Link href="/sign-in" className="text-[var(--color-brand-blue)] font-bold hover:underline">sign in</Link> to continue
                            </p>
                        )}
                    </div>

                    {/* Right: Summary Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-32">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4">Payment Summary</h3>

                            <div className="space-y-4 pb-6 border-b border-gray-100">
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm text-gray-500 font-medium">Rent per annum</span>
                                    <span className="font-bold text-gray-900 tabular-nums">{formatPrice(property.pricePerYear)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm text-gray-500 font-medium">Caution Fee</span>
                                    <span className="font-bold text-gray-900 tabular-nums">{formatPrice(property.cautionFee)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm text-gray-500 font-medium">Legal Fee</span>
                                    <span className="font-bold text-gray-900 tabular-nums">{formatPrice(property.legalFee)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm text-gray-500 font-medium">Service Charge</span>
                                    <span className="font-bold text-gray-900 tabular-nums">{formatPrice(property.serviceFee)}</span>
                                </div>
                                <div className="flex justify-between items-center group bg-green-50/50 -mx-2 px-2 py-2 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-700 font-bold">Platform Fee (2%)</span>
                                        <span className="text-xs text-green-600 font-medium">vs 20-24% agent fee</span>
                                    </div>
                                    <span className="font-bold text-[var(--color-brand-green)] tabular-nums">{formatPrice(platformFee)}</span>
                                </div>
                            </div>

                            {/* Savings Badge */}
                            <div className="py-4 border-b border-gray-100">
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black text-green-700 uppercase tracking-wider">Your Savings</span>
                                        <ShieldCheck className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div className="text-2xl font-black text-green-700 mb-1">{formatPrice(savings)}</div>
                                    <p className="text-xs text-green-600 font-medium leading-tight">
                                        vs traditional agent fees (₦{formatPrice(traditionalAgentFee)})
                                    </p>
                                </div>
                            </div>

                            <div className="py-6 flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total Upfront</span>
                                <span className="text-2xl font-bold text-[var(--color-brand-green)] tabular-nums">
                                    {formatPrice(totalUpfront)}
                                </span>
                            </div>

                            <div className="p-4 bg-gray-50/80 rounded-xl space-y-3">
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                    <div className="p-1 bg-white rounded-md shadow-sm border border-gray-100">
                                        <Building2 className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <span className="truncate">{property.title}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                    <div className="p-1 bg-white rounded-md shadow-sm border border-gray-100">
                                        <FileText className="h-4 w-4 text-orange-500" />
                                    </div>
                                    12 Months Lease
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                    <div className="p-1 bg-white rounded-md shadow-sm border border-gray-100">
                                        <CreditCard className="h-4 w-4 text-green-500" />
                                    </div>
                                    Escrow Protected
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
