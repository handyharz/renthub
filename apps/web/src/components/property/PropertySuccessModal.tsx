"use client";

import { CheckCircle2, ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface PropertySuccessModalProps {
    isOpen: boolean;
    propertyId?: string;
    onClose?: () => void;
}

export function PropertySuccessModal({ isOpen, propertyId }: PropertySuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Background ambient glow effect */}
                <div className="absolute -top-16 -left-16 w-32 h-32 bg-[var(--color-brand-green)]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-[var(--color-brand-green)]/20 rounded-full blur-3xl pointer-events-none" />

                {/* Animated Badge Icon */}
                <div className="mx-auto w-20 h-20 bg-[var(--color-brand-green)]/15 border border-[var(--color-brand-green)]/30 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
                    <CheckCircle2 className="w-10 h-10 text-[var(--color-brand-green)]" />
                    <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                </div>

                {/* Content Header */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">
                    Property Listed! 🎉
                </h2>
                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
                    Your property is now live on <span className="font-bold text-[var(--text-primary)]">RentHub</span>. Direct tenants can now inspect and submit zero-fee applications!
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {propertyId && (
                        <Button
                            asChild
                            className="w-full h-12 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-base rounded-xl shadow-md gap-2"
                        >
                            <Link href={`/properties/${propertyId}`}>
                                View Listing Page
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </Button>
                    )}

                    <Button
                        asChild
                        variant="outline"
                        className="w-full h-12 border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-bold text-base rounded-xl gap-2"
                    >
                        <Link href="/dashboard">
                            Go to Landlord Dashboard
                            <ArrowRight className="w-4 h-4 text-[var(--color-brand-green)]" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
