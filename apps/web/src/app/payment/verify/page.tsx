"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import Link from "next/link";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reference = searchParams.get("reference");

    const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
    const [transaction, setTransaction] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (reference) {
            verifyPayment();
        } else {
            setStatus("failed");
            setError("No payment reference provided");
        }
    }, [reference]);

    const verifyPayment = async () => {
        try {
            const res = await api.get(`/payments/verify/${reference}`);

            if (res.data.success) {
                setStatus("success");
                setTransaction(res.data.data.transaction);
            } else {
                setStatus("failed");
                setError(res.data.message || "Payment verification failed");
            }
        } catch (error: any) {
            console.error("Payment verification error:", error);
            setStatus("failed");
            setError(error.response?.data?.message || "Failed to verify payment");
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-[var(--color-brand-blue)] mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
                    <p className="text-gray-600">Please wait while we confirm your payment</p>
                </div>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
                    <p className="text-lg text-gray-600 mb-8">
                        Your payment has been received and is now held in escrow. The landlord has been notified.
                    </p>

                    <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                        <h3 className="font-bold text-gray-900 mb-4">What happens next?</h3>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-[var(--color-brand-blue)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                                <p className="text-sm text-gray-700">The landlord will contact you to arrange property viewing and key handover</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-[var(--color-brand-blue)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                                <p className="text-sm text-gray-700">Your funds remain in escrow until you confirm move-in</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-[var(--color-brand-blue)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                                <p className="text-sm text-gray-700">After successful move-in, funds are released to the landlord</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/dashboard">
                            <Button className="bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90 gap-2">
                                <Home className="h-4 w-4" />
                                Go to Dashboard
                            </Button>
                        </Link>
                        <Link href="/properties">
                            <Button className="bg-gray-900 hover:bg-gray-800 text-white gap-2">
                                Browse More Properties
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Failed state
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                    <XCircle className="h-12 w-12 text-red-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Failed</h1>
                <p className="text-lg text-gray-600 mb-8">
                    {error || "We couldn't verify your payment. Please try again."}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={() => router.back()}
                        className="bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90"
                    >
                        Try Again
                    </Button>
                    <Link href="/dashboard">
                        <Button variant="outline">
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function PaymentVerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-[var(--color-brand-blue)] mx-auto mb-4" />
                    <p className="text-gray-600">Loading payment verification...</p>
                </div>
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
