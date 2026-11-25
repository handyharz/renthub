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
    Lock,
    Sparkles,
    LayoutGrid,
    List,
    Info,
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
    const [costViewMode, setCostViewMode] = useState<"grid" | "list">("grid");

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

    const handleAnchorPayment = async () => {
        setProcessing(true);
        setError(null);

        try {
            const transactionRes = await api.post(`/transactions?clerkId=${user?.id}`, {
                propertyId: property.id,
                paymentMethod: "BANK_TRANSFER",
                paymentGateway: "ANCHOR",
                leaseDuration: 12,
            });

            const transaction = transactionRes.data.data;

            const payRes = await api.post(`/payments/anchor/initialize?clerkId=${user?.id}`, {
                transactionId: transaction.id,
            });

            return payRes.data?.data;
        } catch (err: any) {
            console.error("Anchor payment initialization failed:", err);
            setError(err.response?.data?.message || "Failed to initialize Anchor bank transfer. Please try again.");
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

    const isOwner = Boolean(
        user && (
            property.landlordId === user.id ||
            property.landlord?.clerkId === user.id ||
            property.landlord?.id === user.id
        )
    );

    if (isOwner) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 text-center">
                <div className="max-w-md p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black text-[var(--text-primary)]">Property Owner Notice</h2>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                        You are registered as the landlord of this property. Landlords cannot rent or pay escrow fees for their own listing.
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                        <Button asChild className="rounded-xl bg-[var(--color-brand-green)] text-white font-bold">
                            <Link href={`/properties/${property.id}`}>Back to Property Listing</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl border-[var(--border-color)]">
                            <Link href="/dashboard?tab=properties">Go to Landlord Dashboard</Link>
                        </Button>
                    </div>
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
            title: "Review Lease Terms & Verification",
            desc: "Transparent fees with zero hidden agency costs. Verified landlord.",
            status: "done",
        },
        {
            num: 2,
            title: "Secure Escrow Deposit",
            desc: "Funds are locked safely in RentHub Escrow. Landlord is NOT paid yet.",
            status: "current",
        },
        {
            num: 3,
            title: "Move-in Inspection & Key Handover",
            desc: "Inspect the home in person. Funds release only after you accept the keys.",
            status: "upcoming",
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
                    {/* Left: Application Steps, Price Clarity & Guarantee */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Price Clarity & Cost Breakdown Card */}
                        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xs space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-black text-[var(--text-primary)]">
                                            Price Clarity & Payment Breakdown
                                        </h2>
                                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                            Zero Hidden Fees
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                        Understanding the shown property rent vs. your total upfront escrow deposit
                                    </p>
                                </div>

                                {/* View Switcher Toggle: Grid View (Default) vs List View */}
                                <div className="flex items-center p-1 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)] self-start sm:self-auto shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setCostViewMode("grid")}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            costViewMode === "grid"
                                                ? "bg-[var(--bg-card)] text-[var(--color-brand-green)] shadow-xs"
                                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        }`}
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                        <span>Grid View (Default)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCostViewMode("list")}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            costViewMode === "list"
                                                ? "bg-[var(--bg-card)] text-[var(--color-brand-green)] shadow-xs"
                                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        }`}
                                    >
                                        <List className="h-3.5 w-3.5" />
                                        <span>List View</span>
                                    </button>
                                </div>
                            </div>

                            {/* Transparent Price Bridge Banner */}
                            <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/70 border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-[var(--text-secondary)] font-medium">Shown Property Rent:</span>
                                    <span className="font-extrabold text-[var(--text-primary)] tabular-nums">{formatPrice(property.pricePerYear)}</span>
                                </div>
                                <span className="text-[var(--text-muted)] font-black hidden sm:inline">+</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[var(--text-secondary)] font-medium">Refundable Caution & Fees:</span>
                                    <span className="font-extrabold text-[var(--text-primary)] tabular-nums">{formatPrice(totalUpfront - property.pricePerYear)}</span>
                                </div>
                                <span className="text-[var(--text-muted)] font-black hidden sm:inline">=</span>
                                <div className="flex items-center gap-2 bg-[var(--color-brand-green)]/10 px-3 py-1 rounded-xl border border-[var(--color-brand-green)]/20">
                                    <span className="text-[var(--color-brand-green)] font-bold">Total Escrow Deposit:</span>
                                    <span className="font-black text-sm text-[var(--color-brand-green)] tabular-nums">{formatPrice(totalUpfront)}</span>
                                </div>
                            </div>

                            {/* View Mode 1: Grid View (Default) */}
                            {costViewMode === "grid" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in fade-in duration-200">
                                    {/* Card 1: Annual Rent */}
                                    <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-[var(--text-primary)]">Annual Rent</span>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                                Shown on Listing
                                            </span>
                                        </div>
                                        <p className="text-lg font-black text-[var(--text-primary)] tabular-nums">
                                            {formatPrice(property.pricePerYear)}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                                            The base annual rent advertised on the listing. Locked into escrow for 12 months.
                                        </p>
                                    </div>

                                    {/* Card 2: Caution Deposit */}
                                    <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                                    <ShieldCheck className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-[var(--text-primary)]">Caution Deposit</span>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                                100% Refundable
                                            </span>
                                        </div>
                                        <p className="text-lg font-black text-[var(--text-primary)] tabular-nums">
                                            {formatPrice(property.cautionFee || 0)}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                                            Held safely in escrow. Returned in full to your bank upon move-out if no damages occur.
                                        </p>
                                    </div>

                                    {/* Card 3: Legal & Tenancy Agreement */}
                                    <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-[var(--text-primary)]">Legal & Agreement</span>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                                                Official Contract
                                            </span>
                                        </div>
                                        <p className="text-lg font-black text-[var(--text-primary)] tabular-nums">
                                            {formatPrice(property.legalFee || 0)}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                                            Covers digitally stamped legal tenancy agreement and statutory registration.
                                        </p>
                                    </div>

                                    {/* Card 4: Escrow Protection Fee */}
                                    <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                                    <Sparkles className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-[var(--text-primary)]">RentHub Escrow (2%)</span>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                                0% Agent Comm.
                                            </span>
                                        </div>
                                        <p className="text-lg font-black text-[var(--color-brand-green)] tabular-nums">
                                            {formatPrice(platformFee)}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                                            Powers secure escrow custody and move-in inspection protection. Saves you {formatPrice(savings)}.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode 2: List View */
                                <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] space-y-3 animate-in fade-in duration-200">
                                    <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-color)]">
                                        <div>
                                            <p className="font-bold text-[var(--text-primary)]">Annual Property Rent (12 Months)</p>
                                            <p className="text-[11px] text-[var(--text-secondary)] font-medium">Advertised listing rent</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-extrabold text-[var(--text-primary)] tabular-nums">{formatPrice(property.pricePerYear)}</p>
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Shown on Listing</span>
                                        </div>
                                    </div>

                                    {property.cautionFee > 0 && (
                                        <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-color)]">
                                            <div>
                                                <p className="font-bold text-[var(--text-primary)]">Caution Deposit</p>
                                                <p className="text-[11px] text-[var(--text-secondary)] font-medium">Security deposit for property condition</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-extrabold text-[var(--text-primary)] tabular-nums">{formatPrice(property.cautionFee)}</p>
                                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">100% Refundable</span>
                                            </div>
                                        </div>
                                    )}

                                    {property.legalFee > 0 && (
                                        <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-color)]">
                                            <div>
                                                <p className="font-bold text-[var(--text-primary)]">Legal Agreement & Stamping</p>
                                                <p className="text-[11px] text-[var(--text-secondary)] font-medium">Tenancy contract drafting and legal execution</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-extrabold text-[var(--text-primary)] tabular-nums">{formatPrice(property.legalFee)}</p>
                                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Official Contract</span>
                                            </div>
                                        </div>
                                    )}

                                    {property.serviceFee > 0 && (
                                        <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-color)]">
                                            <div>
                                                <p className="font-bold text-[var(--text-primary)]">Facility Service Charge</p>
                                                <p className="text-[11px] text-[var(--text-secondary)] font-medium">Estate security, water, and compound maintenance</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-extrabold text-[var(--text-primary)] tabular-nums">{formatPrice(property.serviceFee)}</p>
                                                <span className="text-[10px] font-bold text-[var(--text-secondary)]">Facility</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-color)]">
                                        <div>
                                            <p className="font-bold text-[var(--text-primary)]">RentHub Escrow Protection (2%)</p>
                                            <p className="text-[11px] text-[var(--text-secondary)] font-medium">Funds held safely until key handover</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-extrabold text-[var(--color-brand-green)] tabular-nums">{formatPrice(platformFee)}</p>
                                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">0% Agent Commission</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-1 text-xs">
                                        <span className="font-black text-sm text-[var(--text-primary)]">Total Upfront Escrow Deposit:</span>
                                        <span className="font-black text-base text-[var(--color-brand-green)] tabular-nums">{formatPrice(totalUpfront)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Steps Card */}
                        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xs">
                            <h2 className="text-base font-black text-[var(--text-primary)] mb-5 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[var(--color-brand-green)]" />
                                How RentHub Escrow Protects Your Money
                            </h2>

                            <div className="space-y-5">
                                {steps.map((step) => (
                                    <div key={step.num} className={`flex gap-4 items-start ${step.status === "upcoming" ? "opacity-50" : ""}`}>
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                                                step.status === "done"
                                                    ? "bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] border border-[var(--color-brand-green)]/30"
                                                    : step.status === "current"
                                                    ? "bg-[var(--color-brand-green)] text-white shadow-sm ring-4 ring-[var(--color-brand-green)]/20"
                                                    : "bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-color)]"
                                            }`}
                                        >
                                            {step.status === "done" ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-[var(--text-primary)] text-sm">{step.title}</h3>
                                                {step.status === "current" && (
                                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)]">
                                                        Current Step
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium mt-0.5">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Escrow Guarantee Banner */}
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-3xl flex gap-3.5 items-start">
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-extrabold text-[var(--text-primary)] text-sm">
                                    100% Escrow Protection Guarantee
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                                    Your money is locked in RentHub Escrow. If the property does not match the listing during your move-in inspection, you receive a full refund — guaranteed.
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
                        <div className="space-y-2">
                            <Button
                                onClick={handleOpenPaymentModal}
                                disabled={processing}
                                className="w-full h-13 text-base font-black bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                    </div>

                    {/* Right: Payment Summary Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-xs sticky top-32 space-y-4">
                            {/* Property Mini Header */}
                            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-color)]">
                                <div className="h-10 w-10 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center text-blue-500 shrink-0">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xs font-bold text-[var(--text-primary)] truncate" title={property.title}>
                                        {property.title}
                                    </h3>
                                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                                        12 Months Lease • {property.city}
                                    </p>
                                </div>
                            </div>

                            {/* Fee Breakdown */}
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[var(--text-secondary)] font-medium">Annual Rent</span>
                                    <span className="font-bold text-[var(--text-primary)] tabular-nums">{formatPrice(property.pricePerYear)}</span>
                                </div>
                                {property.cautionFee > 0 && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-[var(--text-secondary)] font-medium">Caution Deposit (Refundable)</span>
                                        <span className="font-bold text-[var(--text-primary)] tabular-nums">{formatPrice(property.cautionFee)}</span>
                                    </div>
                                )}
                                {property.legalFee > 0 && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-[var(--text-secondary)] font-medium">Legal Agreement Fee</span>
                                        <span className="font-bold text-[var(--text-primary)] tabular-nums">{formatPrice(property.legalFee)}</span>
                                    </div>
                                )}
                                {property.serviceFee > 0 && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-[var(--text-secondary)] font-medium">Service Charge</span>
                                        <span className="font-bold text-[var(--text-primary)] tabular-nums">{formatPrice(property.serviceFee)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center bg-[var(--color-brand-green)]/8 -mx-2 px-2.5 py-1.5 rounded-xl border border-[var(--color-brand-green)]/15 text-xs">
                                    <div className="flex flex-col">
                                        <span className="text-[var(--text-primary)] font-bold">RentHub Escrow Fee (2%)</span>
                                        <span className="text-[10px] text-[var(--color-brand-green)] font-semibold">0% Agent Commission</span>
                                    </div>
                                    <span className="font-black text-[var(--color-brand-green)] tabular-nums">{formatPrice(platformFee)}</span>
                                </div>
                            </div>

                            {/* Total Upfront */}
                            <div className="border-t border-[var(--border-color)] pt-3 flex justify-between items-center">
                                <div>
                                    <span className="block font-black text-[var(--text-primary)] text-sm">Total Upfront</span>
                                    <span className="block text-[10px] text-[var(--text-muted)] font-medium">
                                        (Rent: {formatPrice(property.pricePerYear)} + {formatPrice(totalUpfront - property.pricePerYear)} deposits/fees)
                                    </span>
                                </div>
                                <span className="text-xl font-black text-[var(--color-brand-green)] tabular-nums">
                                    {formatPrice(totalUpfront)}
                                </span>
                            </div>

                            {/* Sleek Savings Pill */}
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                                <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" />
                                <span>You save <strong>{formatPrice(savings)}</strong> vs traditional agent commissions</span>
                            </div>

                            {/* Trust Footer */}
                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] font-medium pt-1">
                                <Lock className="h-3 w-3" />
                                <span>Bank-grade 256-bit SSL encrypted escrow</span>
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
                    onAnchor={handleAnchorPayment}
                />
            )}
        </div>
    );
}
