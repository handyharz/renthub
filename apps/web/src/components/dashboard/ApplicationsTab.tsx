"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    CreditCard,
    Home,
    ArrowRight,
    Loader2,
    ShieldCheck,
    Star,
    KeyRound,
    AlertTriangle,
    Calendar,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { EscrowStatusModal } from "./EscrowStatusModal";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { PaymentMethodModal } from "@/components/payment/PaymentMethodModal";

interface RentalApplication {
    id: string;
    propertyId: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    proposedMoveInDate: string;
    leaseDuration: number;
    note?: string;
    createdAt: string;
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        pricePerYear: number;
        cautionFee?: number;
        legalFee?: number;
        serviceFee?: number;
        images: { url: string; isPrimary: boolean }[];
    };
    landlord?: {
        firstName: string;
        lastName: string;
        phone?: string;
    };
}

interface Transaction {
    id: string;
    propertyId: string;
    applicationId?: string;
    rentAmount: number;
    cautionFee: number;
    legalFee: number;
    platformFee: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    escrowHeld: boolean;
    escrowReleased: boolean;
    disputed?: boolean;
    disputeReason?: string;
    releaseOtp?: string;
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        images: { url: string; isPrimary: boolean }[];
        reviews?: { id: string }[];
    };
    landlord?: {
        firstName: string;
        lastName: string;
    };
    tenantId: string;
}

export function ApplicationsTab() {
    const { user } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [applications, setApplications] = useState<RentalApplication[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
    const [otpLoading, setOtpLoading] = useState<string | null>(null);
    const [paymentModalApp, setPaymentModalApp] = useState<RentalApplication | null>(null);

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewedTxIds, setReviewedTxIds] = useState<string[]>([]);

    // Tab & Pagination State
    const [activeTab, setActiveTab] = useState<"applications" | "escrow">("applications");
    const [escrowFilter, setEscrowFilter] = useState<"all" | "active" | "completed">("all");
    const [appPage, setAppPage] = useState<number>(1);
    const [escrowPage, setEscrowPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        if (user) {
            fetchData();

            // Auto-verify payment if returning from AfriExchange hosted checkout
            const paymentStatus = searchParams.get("payment");
            const ref = searchParams.get("reference") || searchParams.get("ref");
            if (paymentStatus === "success") {
                if (ref) {
                    api.get(`/payments/afriexchange/verify/${encodeURIComponent(ref)}`)
                        .then(() => {
                            toast.success("Payment Verified & Escrow Secured!", {
                                description: "Your rent payment is safely held in escrow.",
                            });
                            fetchData();
                        })
                        .catch((err) => {
                            console.warn("Verification check:", err);
                        });
                } else {
                    toast.success("Escrow Payment Successful!");
                }
            }
        }
    }, [user, searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [appRes, txRes] = await Promise.all([
                api.get("/applications/tenant"),
                api.get("/transactions/tenant/all")
            ]);
            setApplications(appRes.data.data || []);
            setTransactions(txRes.data.data || []);
        } catch (error) {
            console.error("Failed to fetch tenant application data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaystackPayment = async () => {
        if (!paymentModalApp) return;
        try {
            setPaymentLoading(paymentModalApp.id);

            const txRes = await api.post("/transactions", {
                propertyId: paymentModalApp.propertyId,
                paymentMethod: "CARD",
                paymentGateway: "PAYSTACK",
                leaseDuration: paymentModalApp.leaseDuration,
                applicationId: paymentModalApp.id
            });

            const transaction = txRes.data.data;

            const payRes = await api.post("/payments/initialize", {
                transactionId: transaction.id,
                callbackUrl: `${window.location.origin}/dashboard?tab=applications&payment=success`
            });

            const { authorization_url } = payRes.data.data;

            toast.loading("Redirecting to Paystack...", { duration: 2000 });
            window.location.href = authorization_url;
        } catch (error: any) {
            console.error("Paystack escrow payment initialization failed:", error);
            toast.error(error.response?.data?.message || "Failed to initialize Paystack payment");
        } finally {
            setPaymentLoading(null);
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
        if (!paymentModalApp) return;
        try {
            setPaymentLoading(paymentModalApp.id);

            // 1. Create transaction with AFRIEXCHANGE gateway
            const txRes = await api.post("/transactions", {
                propertyId: paymentModalApp.propertyId,
                paymentMethod: "BANK_TRANSFER",
                paymentGateway: "AFRIEXCHANGE",
                leaseDuration: paymentModalApp.leaseDuration,
                applicationId: paymentModalApp.id
            });

            const transaction = txRes.data.data;

            // 2. Initialize AfriExchange hosted payment checkout session
            const payRes = await api.post("/payments/afriexchange/pay", {
                transactionId: transaction.id,
                afriExchangeAccountEmail: accountEmail,
                afriExchangeWalletAddress: walletAddress,
                tokenType: tokenType || "NT",
                amountInToken,
                returnUrl: `${window.location.origin}/dashboard?tab=applications&payment=success&txId=${transaction.id}`,
            });

            const paymentUrl = payRes.data?.data?.paymentUrl;
            if (paymentUrl) {
                toast.loading("Redirecting to AfriExchange Checkout...", { duration: 2500 });
                window.location.href = paymentUrl;
                return;
            }

            toast.success("Escrow Payment Secured!", {
                description: payRes.data?.message || "Your rent has been successfully paid into escrow via AfriExchange!"
            });

            setPaymentModalApp(null);
            await fetchData();
        } catch (error: any) {
            console.error("AfriExchange payment failed:", error);
            toast.error(error.response?.data?.message || "Failed to process AfriExchange payment");
            throw error;
        } finally {
            setPaymentLoading(null);
        }
    };

    const handleRequestOtp = async (transactionId: string) => {
        try {
            setOtpLoading(transactionId);
            const res = await api.post(`/transactions/${transactionId}/handover-otp`);
            toast.success("Handover OTP Generated!", {
                description: res.data.message || "Share your 6-digit code ONLY at key handover."
            });
            fetchData();
        } catch (error: any) {
            console.error("Failed to generate OTP:", error);
            toast.error(error.response?.data?.message || "Failed to generate Handover OTP");
        } finally {
            setOtpLoading(null);
        }
    };

    const handleRaiseDispute = async (transactionId: string) => {
        const reason = prompt("Please describe the issue (e.g. house not empty, keys do not work):");
        if (!reason) return;

        try {
            await api.post(`/transactions/${transactionId}/dispute`, { reason });
            toast.success("Dispute Raised!", {
                description: "Escrow funds have been locked. RentHub support team will contact you within 24 hours."
            });
            fetchData();
        } catch (error: any) {
            console.error("Dispute failed:", error);
            toast.error(error.response?.data?.message || "Failed to raise dispute");
        }
    };

    const handleOpenReviewModal = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsReviewModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-green)] mb-3" />
                <p className="font-semibold text-sm">Loading applications and escrow status...</p>
            </div>
        );
    }

    // Deduplicate and prioritize transactions per application/property
    const getTxForApplication = (app: RentalApplication) => {
        const matchingTxs = transactions.filter(
            (tx) =>
                (tx.applicationId === app.id || tx.propertyId === app.propertyId) &&
                tx.status !== "CANCELLED" &&
                tx.status !== "FAILED"
        );
        // Precedence: completed handover (RELEASED) > active escrow (ESCROWED/SUCCESSFUL) > pending
        const releasedTx = matchingTxs.find((tx) => tx.status === "RELEASED" || tx.escrowReleased);
        if (releasedTx) return releasedTx;
        const escrowedTx = matchingTxs.find((tx) => tx.status === "ESCROWED" || tx.status === "SUCCESSFUL");
        if (escrowedTx) return escrowedTx;
        return matchingTxs[0] || null;
    };

    // Deduplicated escrow transactions list: one entry per application/property
    const deduplicatedEscrowTxs = (() => {
        const validTxs = transactions.filter(
            (tx) =>
                (tx.status === "ESCROWED" || tx.status === "SUCCESSFUL" || tx.status === "RELEASED" || tx.escrowReleased) &&
                tx.status !== "CANCELLED" &&
                tx.status !== "FAILED"
        );

        const groupMap = new Map<string, Transaction>();
        for (const tx of validTxs) {
            const key = tx.applicationId || tx.propertyId;
            const existing = groupMap.get(key);
            if (!existing) {
                groupMap.set(key, tx);
            } else {
                // If existing is already RELEASED, keep it
                if (existing.status === "RELEASED" || existing.escrowReleased) {
                    continue;
                }
                // If current tx is RELEASED, it takes precedence over unreleased duplicate
                if (tx.status === "RELEASED" || tx.escrowReleased) {
                    groupMap.set(key, tx);
                }
            }
        }
        return Array.from(groupMap.values());
    })();

    // Filtered by sub-pill:
    const filteredEscrowTxs = deduplicatedEscrowTxs.filter((tx) => {
        if (escrowFilter === "active") {
            return (tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased;
        }
        if (escrowFilter === "completed") {
            return tx.status === "RELEASED" || tx.escrowReleased;
        }
        return true;
    });

    const activeEscrowCount = deduplicatedEscrowTxs.filter(
        (tx) => (tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased
    ).length;
    const completedEscrowCount = deduplicatedEscrowTxs.filter(
        (tx) => tx.status === "RELEASED" || tx.escrowReleased
    ).length;

    // Pagination calculations
    const totalAppPages = Math.ceil(applications.length / ITEMS_PER_PAGE) || 1;
    const paginatedApps = applications.slice((appPage - 1) * ITEMS_PER_PAGE, appPage * ITEMS_PER_PAGE);

    const totalEscrowPages = Math.ceil(filteredEscrowTxs.length / ITEMS_PER_PAGE) || 1;
    const paginatedEscrowTxs = filteredEscrowTxs.slice((escrowPage - 1) * ITEMS_PER_PAGE, escrowPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            {/* TAB NAVIGATION HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-muted)] rounded-2xl border border-[var(--border-color)] shadow-inner">
                    <button
                        onClick={() => {
                            setActiveTab("applications");
                            setAppPage(1);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                            activeTab === "applications"
                                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <FileText className="h-4 w-4 text-[var(--color-brand-green)]" />
                        <span>My Rental Applications</span>
                        <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                activeTab === "applications"
                                    ? "bg-[var(--color-brand-green)] text-white"
                                    : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                            }`}
                        >
                            {applications.length}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("escrow");
                            setEscrowPage(1);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                            activeTab === "escrow"
                                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <ShieldCheck className="h-4 w-4 text-[var(--color-brand-green)]" />
                        <span>Active Escrow & Key Handover</span>
                        <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                activeTab === "escrow"
                                    ? "bg-[var(--color-brand-green)] text-white"
                                    : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                            }`}
                        >
                            {deduplicatedEscrowTxs.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* TAB CONTENT 1: RENTAL APPLICATIONS */}
            {activeTab === "applications" && (
                <div className="space-y-4">
                    {applications.length === 0 ? (
                        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-[var(--shadow-sm)]">
                            <Home className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-2" />
                            <p className="text-[var(--text-secondary)] text-sm font-semibold">
                                You haven't submitted any rental applications yet.
                            </p>
                            <Link href="/search">
                                <Button className="mt-4 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white text-xs font-bold rounded-xl px-5 py-2.5">
                                    Find a Home to Apply
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {paginatedApps.map((app) => {
                                const primaryImage =
                                    app.property.images?.find((img) => img.isPrimary)?.url ||
                                    app.property.images?.[0]?.url;
                                const platformFee = Math.round(app.property.pricePerYear * 0.02);
                                const totalEstimated =
                                    app.property.pricePerYear +
                                    (app.property.cautionFee || 0) +
                                    (app.property.legalFee || 0) +
                                    platformFee;

                                const txForApp = getTxForApplication(app);

                                const isHandoverCompleted =
                                    txForApp && (txForApp.status === "RELEASED" || txForApp.escrowReleased);
                                const isPaidInEscrow =
                                    txForApp &&
                                    (txForApp.status === "ESCROWED" || txForApp.status === "SUCCESSFUL") &&
                                    !txForApp.escrowReleased;
                                const hasActiveTransaction = txForApp && !txForApp.escrowReleased;

                                return (
                                    <div
                                        key={app.id}
                                        className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-[var(--shadow-sm)] space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-xl bg-[var(--bg-muted)] overflow-hidden relative shrink-0 border border-[var(--border-color)]">
                                                    {primaryImage ? (
                                                        <Image
                                                            src={primaryImage}
                                                            alt="Property"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <Home className="h-6 w-6 text-[var(--text-muted)] m-auto mt-3" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[var(--text-primary)] text-sm">
                                                        {app.property.title}
                                                    </h3>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                                        {app.property.address}, {app.property.city}
                                                    </p>
                                                    <div className="text-xs font-extrabold text-[var(--color-brand-green)] mt-0.5">
                                                        Annual Rent: {formatPrice(app.property.pricePerYear)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0">
                                                {app.status === "PENDING" && (
                                                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 px-3 py-1 font-bold flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" /> Awaiting Landlord Approval
                                                    </Badge>
                                                )}
                                                {app.status === "APPROVED" && !isPaidInEscrow && !isHandoverCompleted && (
                                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 font-bold flex items-center gap-1">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Approved — Action Required
                                                    </Badge>
                                                )}
                                                {app.status === "APPROVED" && isPaidInEscrow && !isHandoverCompleted && (
                                                    <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 px-3 py-1 font-bold flex items-center gap-1">
                                                        <ShieldCheck className="h-3.5 w-3.5" /> Rent Secured in Escrow
                                                    </Badge>
                                                )}
                                                {isHandoverCompleted && (
                                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 font-bold flex items-center gap-1">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Handover Complete
                                                    </Badge>
                                                )}
                                                {app.status === "REJECTED" && (
                                                    <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 px-3 py-1 font-bold flex items-center gap-1">
                                                        <XCircle className="h-3.5 w-3.5" /> Application Declined
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Cards */}
                                        {app.status === "APPROVED" && !hasActiveTransaction && !isHandoverCompleted && (
                                            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                                                        <ShieldCheck className="h-4 w-4" /> Landlord Accepted Your Application!
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                                        Property is locked for you. Pay{" "}
                                                        <strong className="text-[var(--text-primary)]">
                                                            {formatPrice(totalEstimated)}
                                                        </strong>{" "}
                                                        into RentHub Escrow to secure your rental.
                                                    </p>
                                                </div>

                                                <Button
                                                    disabled={paymentLoading === app.id}
                                                    onClick={() => setPaymentModalApp(app)}
                                                    className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs rounded-xl shrink-0 h-10 px-4 gap-2 shadow-sm"
                                                >
                                                    <ShieldCheck className="h-4 w-4" />
                                                    {paymentLoading === app.id ? "Processing..." : "Pay Into Escrow"}
                                                </Button>
                                            </div>
                                        )}

                                        {app.status === "APPROVED" &&
                                            txForApp &&
                                            txForApp.status === "PENDING" &&
                                            !isHandoverCompleted && (
                                                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <div className="font-bold text-amber-600 dark:text-amber-400 text-sm flex items-center gap-1.5">
                                                            <AlertTriangle className="h-4 w-4" /> Payment Initiated — Awaiting Confirmation
                                                        </div>
                                                        <p className="text-xs text-[var(--text-secondary)] font-medium">
                                                            Your payment is being processed. Do not click Pay again. If it takes more than 10 minutes, contact support.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                        {app.status === "APPROVED" && isPaidInEscrow && !isHandoverCompleted && (
                                            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="font-bold text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1.5">
                                                        <ShieldCheck className="h-4 w-4" /> Payment Complete & Held in Escrow
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                                        Your funds are securely held in escrow. Switch to the{" "}
                                                        <button
                                                            onClick={() => setActiveTab("escrow")}
                                                            className="font-bold underline text-[var(--color-brand-green)]"
                                                        >
                                                            Active Escrow & Key Handover
                                                        </button>{" "}
                                                        tab to view your OTP code.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {isHandoverCompleted && (
                                            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                                                        <CheckCircle2 className="h-4 w-4" /> Key Handover Complete & Escrow Released!
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                                        You have physically received the keys. Enjoy your new home! Please rate your landlord and house.
                                                    </p>
                                                </div>

                                                {txForApp && (
                                                    reviewedTxIds.includes(txForApp.id) ||
                                                    (txForApp.property?.reviews && txForApp.property.reviews.length > 0) ? (
                                                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0">
                                                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Review Submitted ✅
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            onClick={() => handleOpenReviewModal(txForApp)}
                                                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shrink-0 flex items-center gap-1.5 h-10 px-4"
                                                        >
                                                            <Star className="h-3.5 w-3.5 fill-current" /> Write Verified Review
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination for Applications */}
                    {applications.length > ITEMS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-color)]">
                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                Showing{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {(appPage - 1) * ITEMS_PER_PAGE + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {Math.min(appPage * ITEMS_PER_PAGE, applications.length)}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {applications.length}
                                </span>{" "}
                                applications
                            </p>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={appPage === 1}
                                    onClick={() => setAppPage((p) => Math.max(1, p - 1))}
                                    className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                </Button>

                                {Array.from({ length: totalAppPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setAppPage(page)}
                                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                                            appPage === page
                                                ? "bg-[var(--color-brand-green)] text-white shadow-sm"
                                                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={appPage === totalAppPages}
                                    onClick={() => setAppPage((p) => Math.min(totalAppPages, p + 1))}
                                    className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1"
                                >
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT 2: ACTIVE ESCROW & KEY HANDOVER */}
            {activeTab === "escrow" && (
                <div className="space-y-4">
                    {/* Sub-filter Pills */}
                    <div className="flex items-center gap-2 pb-2">
                        <button
                            onClick={() => {
                                setEscrowFilter("all");
                                setEscrowPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                escrowFilter === "all"
                                    ? "bg-[var(--color-brand-green)] text-white shadow-sm"
                                    : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            All ({deduplicatedEscrowTxs.length})
                        </button>
                        <button
                            onClick={() => {
                                setEscrowFilter("active");
                                setEscrowPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                escrowFilter === "active"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            Awaiting Keys & OTP ({activeEscrowCount})
                        </button>
                        <button
                            onClick={() => {
                                setEscrowFilter("completed");
                                setEscrowPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                escrowFilter === "completed"
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            Completed Handovers ({completedEscrowCount})
                        </button>
                    </div>

                    {filteredEscrowTxs.length === 0 ? (
                        <div className="text-center py-10 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-[var(--shadow-sm)] text-xs text-[var(--text-secondary)] font-medium">
                            {escrowFilter === "active"
                                ? "No active escrow payments awaiting key handover."
                                : escrowFilter === "completed"
                                ? "No completed rental handovers yet."
                                : "No escrow payments or handovers found. Approved rentals paid into escrow will display here."}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {paginatedEscrowTxs.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-[var(--shadow-sm)] space-y-4"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                                        <div>
                                            <h3 className="font-bold text-[var(--text-primary)] text-sm">
                                                {tx.property?.title}
                                            </h3>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                                {tx.property?.city} • Paid {formatPrice(tx.totalAmount)}
                                            </p>
                                        </div>

                                        <div>
                                            {(tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased && (
                                                <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 px-3 py-1 font-bold flex items-center gap-1">
                                                    <ShieldCheck className="h-3.5 w-3.5" /> Funds Secured in Escrow
                                                </Badge>
                                            )}
                                            {(tx.status === "RELEASED" || tx.escrowReleased) && (
                                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 font-bold flex items-center gap-1">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Handover Complete & Escrow Released
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Handover OTP Card */}
                                    {(tx.status === "ESCROWED" || tx.status === "SUCCESSFUL") && !tx.escrowReleased && (
                                        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30 space-y-3">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1 text-xs">
                                                    <div className="font-bold text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1.5">
                                                        <KeyRound className="h-4 w-4" /> Physical Key Handover OTP
                                                    </div>
                                                    <p className="text-[var(--text-secondary)] font-medium">
                                                        Share your 6-digit OTP code with the landlord{" "}
                                                        <strong className="text-[var(--text-primary)]">
                                                            ONLY AFTER
                                                        </strong>{" "}
                                                        physically inspecting the keys and house condition.
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Button
                                                        disabled={otpLoading === tx.id}
                                                        onClick={() => handleRequestOtp(tx.id)}
                                                        className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs rounded-xl h-10 px-4"
                                                    >
                                                        {otpLoading === tx.id
                                                            ? "Generating..."
                                                            : tx.releaseOtp
                                                            ? "Regenerate OTP Code"
                                                            : "Get Handover OTP SMS"}
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleRaiseDispute(tx.id)}
                                                        className="text-red-500 border-red-500/30 hover:bg-red-500/10 text-xs font-bold rounded-xl h-10 px-4"
                                                    >
                                                        Raise Dispute
                                                    </Button>
                                                </div>
                                            </div>

                                            {tx.releaseOtp && (
                                                <div className="bg-[var(--bg-muted)] rounded-xl p-4 border border-[var(--border-color)] text-center space-y-1 shadow-inner">
                                                    <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                                                        Your 6-Digit Key Handover OTP Code
                                                    </div>
                                                    <div className="text-2xl font-extrabold tracking-[0.4em] text-[var(--color-brand-green)] py-1">
                                                        {tx.releaseOtp}
                                                    </div>
                                                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                                                        Provide this code to your landlord to release escrow funds once you hold the keys.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Completed Handover Card */}
                                    {(tx.status === "RELEASED" || tx.escrowReleased) && (
                                        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1 text-xs">
                                                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                                                    <CheckCircle2 className="h-4 w-4" /> Key Handover Completed!
                                                </div>
                                                <p className="text-[var(--text-secondary)] font-medium">
                                                    Escrow funds have been successfully released to the landlord. Thank you for using RentHub!
                                                </p>
                                            </div>

                                            {reviewedTxIds.includes(tx.id) ||
                                            (tx.property?.reviews && tx.property.reviews.length > 0) ? (
                                                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0">
                                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Review Submitted ✅
                                                </Badge>
                                            ) : (
                                                <Button
                                                    onClick={() => handleOpenReviewModal(tx)}
                                                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shrink-0 flex items-center gap-1.5 h-10 px-4"
                                                >
                                                    <Star className="h-3.5 w-3.5 fill-current" /> Write Verified Review
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination for Escrow */}
                    {filteredEscrowTxs.length > ITEMS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-color)]">
                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                Showing{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {(escrowPage - 1) * ITEMS_PER_PAGE + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {Math.min(escrowPage * ITEMS_PER_PAGE, filteredEscrowTxs.length)}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {filteredEscrowTxs.length}
                                </span>{" "}
                                transactions
                            </p>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={escrowPage === 1}
                                    onClick={() => setEscrowPage((p) => Math.max(1, p - 1))}
                                    className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                </Button>

                                {Array.from({ length: totalEscrowPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setEscrowPage(page)}
                                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                                            escrowPage === page
                                                ? "bg-[var(--color-brand-green)] text-white shadow-sm"
                                                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={escrowPage === totalEscrowPages}
                                    onClick={() => setEscrowPage((p) => Math.min(totalEscrowPages, p + 1))}
                                    className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1"
                                >
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Escrow Modal */}
            {selectedTransaction && isEscrowModalOpen && (
                <EscrowStatusModal
                    isOpen={isEscrowModalOpen}
                    onClose={() => setIsEscrowModalOpen(false)}
                    transaction={selectedTransaction}
                    userRole="TENANT"
                />
            )}

            {/* Review Modal */}
            {selectedTransaction && isReviewModalOpen && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    transaction={selectedTransaction as any}
                    onSuccess={() => {
                        if (selectedTransaction) {
                            setReviewedTxIds((prev) => [...prev, selectedTransaction.id]);
                        }
                        fetchData();
                    }}
                />
            )}

            {/* Payment Method Gateway Modal */}
            {paymentModalApp && (
                <PaymentMethodModal
                    isOpen={!!paymentModalApp}
                    onClose={() => setPaymentModalApp(null)}
                    totalAmount={
                        paymentModalApp.property?.pricePerYear +
                        (paymentModalApp.property?.cautionFee || 0) +
                        (paymentModalApp.property?.legalFee || 0) +
                        (paymentModalApp.property?.serviceFee || 0) +
                        Math.round(paymentModalApp.property?.pricePerYear * 0.02)
                    }
                    propertyTitle={paymentModalApp.property?.title}
                    defaultEmail={user?.emailAddresses?.[0]?.emailAddress || ""}
                    onPaystack={handlePaystackPayment}
                    onAfriExchange={handleAfriExchangePayment}
                />
            )}
        </div>
    );
}
