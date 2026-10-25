"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Download,
    Printer,
    CheckCircle2,
    Shield,
    Sparkles,
    Building2,
    Calendar,
    User,
    CreditCard,
    X,
    Loader2,
    Award,
    Hash
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface DocumentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    initialTab?: "receipt" | "agreement" | "tax-pack";
}

export function DocumentViewerModal({
    isOpen,
    onClose,
    transactionId,
    initialTab = "tax-pack",
}: DocumentViewerModalProps) {
    const [activeTab, setActiveTab] = useState<"receipt" | "agreement" | "tax-pack">(initialTab);
    const [loading, setLoading] = useState(true);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [agreementData, setAgreementData] = useState<any>(null);
    const [taxPackData, setTaxPackData] = useState<any>(null);

    useEffect(() => {
        if (!isOpen || !transactionId) return;

        setLoading(true);
        Promise.allSettled([
            api.get(`/api/transactions/${transactionId}/receipt`).then((r) => r.data.data),
            api.get(`/api/transactions/${transactionId}/agreement`).then((r) => r.data.data),
            api.get(`/api/transactions/${transactionId}/tax-pack`).then((r) => r.data.data),
        ])
            .then(([rRes, aRes, tRes]) => {
                if (rRes.status === "fulfilled") setReceiptData(rRes.value);
                if (aRes.status === "fulfilled") setAgreementData(aRes.value);
                if (tRes.status === "fulfilled") setTaxPackData(tRes.value);
            })
            .catch((err) => {
                console.error("Error loading documents:", err);
                toast.error("Failed to load documents");
            })
            .finally(() => setLoading(false));
    }, [isOpen, transactionId]);

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)] bg-[var(--bg-muted)]/30">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] flex items-center justify-center border border-[var(--color-brand-green)]/20 shadow-xs">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
                                Institutional Tenancy & Tax Records
                            </h2>
                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                Audit-grade documentation compliant with the Nigeria Tax Act 2025
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="hidden sm:flex h-9 px-3 rounded-xl gap-1.5 text-xs font-bold border-[var(--border-color)]"
                        >
                            <Printer className="h-4 w-4" />
                            <span>Print / PDF</span>
                        </Button>
                        <button
                            onClick={onClose}
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] shrink-0 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("tax-pack")}
                        className={`pb-3 px-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === "tax-pack"
                                ? "border-[var(--color-brand-green)] text-[var(--color-brand-green)]"
                                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <Award className="h-4 w-4" />
                        <span>Nigeria Tax Act 2025 Relief Pack</span>
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-black">
                            ₦500k Relief
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab("receipt")}
                        className={`pb-3 px-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === "receipt"
                                ? "border-[var(--color-brand-green)] text-[var(--color-brand-green)]"
                                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <CreditCard className="h-4 w-4" />
                        <span>Official Escrow Receipt</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("agreement")}
                        className={`pb-3 px-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === "agreement"
                                ? "border-[var(--color-brand-green)] text-[var(--color-brand-green)]"
                                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <Shield className="h-4 w-4" />
                        <span>Digital Tenancy Agreement</span>
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--bg-muted)]/10 print:p-0">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-green)] mb-3" />
                            <p className="text-sm font-bold text-[var(--text-primary)]">Generating Verified Documents...</p>
                        </div>
                    ) : (
                        <div>
                            {/* TAB 1: TAX RELIEF PACK */}
                            {activeTab === "tax-pack" && taxPackData && (
                                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm print:border-none print:shadow-none">
                                    {/* Institutional Banner */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-black text-[var(--color-brand-green)] tracking-tight">RentHub</span>
                                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border-emerald-500/20">
                                                    Statutory Tax Compliance
                                                </Badge>
                                            </div>
                                            <h1 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] mt-1">
                                                Certificate of Rental Tax Relief
                                            </h1>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                                {taxPackData.statutoryAuthority}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Certificate No.</span>
                                            <span className="font-mono text-xs font-black text-[var(--text-primary)] block mt-0.5">
                                                {taxPackData.certificateNumber}
                                            </span>
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                                                Tax Assessment Year {taxPackData.taxYear}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Certified Deduction Hero Card */}
                                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                                        <div>
                                            <span className="text-[11px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-wider block">
                                                Certified Allowable Employment Tax Deduction
                                            </span>
                                            <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 block mt-1">
                                                {formatPrice(taxPackData.taxCalculation?.certifiedAllowableTaxDeductionNgn)}
                                            </span>
                                            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                                                Calculated as 20% of annual rent (₦{taxPackData.taxCalculation?.annualRentPaidNgn?.toLocaleString()}), capped at ₦500,000 max statutory deduction.
                                            </p>
                                        </div>
                                        <div className="shrink-0 bg-emerald-600 text-white rounded-2xl p-3 px-4 shadow-sm text-center">
                                            <CheckCircle2 className="h-6 w-6 mx-auto mb-1" />
                                            <span className="text-[10px] font-black uppercase tracking-wider block">Audit Verified</span>
                                        </div>
                                    </div>

                                    {/* Tenant & Property Details Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                        <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] space-y-2">
                                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Claimant (Employee / Tenant)</span>
                                            <p className="text-sm font-extrabold text-[var(--text-primary)]">{taxPackData.claimant?.legalName}</p>
                                            <p className="text-[var(--text-secondary)]">{taxPackData.claimant?.email}</p>
                                            <p className="text-[var(--text-secondary)]">{taxPackData.claimant?.phone || "Verified Contact"}</p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/40 border border-[var(--border-color)] space-y-2">
                                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Leased Property & Landlord</span>
                                            <p className="text-sm font-extrabold text-[var(--text-primary)]">{taxPackData.tenancyDetails?.propertyAddress}</p>
                                            <p className="text-[var(--text-secondary)]">Landlord: {taxPackData.tenancyDetails?.landlordName}</p>
                                            <p className="text-[var(--text-secondary)]">Tenancy Duration: {taxPackData.tenancyDetails?.leaseDurationMonths} Months</p>
                                        </div>
                                    </div>

                                    {/* Proof of Escrow Payment Trail */}
                                    <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/20 border border-[var(--border-color)] space-y-2 text-xs">
                                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Escrow Audit Trail</span>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                            <div>
                                                <span className="text-[10px] text-[var(--text-muted)] block">Payment Reference</span>
                                                <span className="font-mono font-bold text-[var(--text-primary)]">{taxPackData.escrowProof?.paymentReference}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[var(--text-muted)] block">Gateway Rail</span>
                                                <span className="font-bold text-[var(--text-primary)]">{taxPackData.escrowProof?.paymentGateway}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[var(--text-muted)] block">Escrow Status</span>
                                                <span className="font-bold text-emerald-600">{taxPackData.escrowProof?.escrowStatus}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[var(--text-muted)] block">Effective Year</span>
                                                <span className="font-bold text-[var(--text-primary)]">2026 Tax Act</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Audit Stamp Footer */}
                                    <div className="pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-[var(--text-muted)]">
                                        <div className="flex items-center gap-2">
                                            <Hash className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                                            <span className="font-mono truncate max-w-sm">
                                                Digital Stamp: {taxPackData.auditVerification?.certificateHash}
                                            </span>
                                        </div>
                                        <span className="font-bold text-[var(--text-secondary)]">
                                            RentHub Digital Registry Seal • Nigeria
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: OFFICIAL RECEIPT */}
                            {activeTab === "receipt" && receiptData && (
                                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm print:border-none print:shadow-none">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
                                        <div>
                                            <span className="text-xl font-black text-[var(--color-brand-green)]">RentHub</span>
                                            <h1 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] mt-1">
                                                Official Escrow Payment Receipt
                                            </h1>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                                Issued by RentHub Segregated Escrow Protocol
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Receipt No.</span>
                                            <span className="font-mono text-xs font-black text-[var(--text-primary)] block mt-0.5">
                                                {receiptData.receiptNumber}
                                            </span>
                                            <span className="text-[10px] text-[var(--text-muted)] block mt-1">
                                                {new Date(receiptData.issuedAt).toLocaleDateString("en-NG", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Breakdown Table */}
                                    <div className="border border-[var(--border-color)] rounded-2xl overflow-hidden text-xs">
                                        <div className="bg-[var(--bg-muted)] p-3 font-bold text-[var(--text-secondary)] grid grid-cols-2">
                                            <span>Description</span>
                                            <span className="text-right">Amount (NGN)</span>
                                        </div>
                                        <div className="p-3.5 space-y-2.5 divide-y divide-[var(--border-color)]">
                                            <div className="flex justify-between pt-1">
                                                <div>
                                                    <span className="font-bold text-[var(--text-primary)] block">Annual Residential Rent</span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">Held in escrow until key handover OTP release</span>
                                                </div>
                                                <span className="font-extrabold text-[var(--text-primary)]">{formatPrice(receiptData.breakdown?.rentAmount)}</span>
                                            </div>
                                            <div className="flex justify-between pt-2">
                                                <div>
                                                    <span className="font-bold text-[var(--text-primary)] block">Caution Deposit (Protected)</span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">Held in escrow for move-out damage protection; ₦0 renewal rollover</span>
                                                </div>
                                                <span className="font-extrabold text-[var(--text-primary)]">{formatPrice(receiptData.breakdown?.cautionFee)}</span>
                                            </div>
                                            <div className="flex justify-between pt-2">
                                                <div>
                                                    <span className="font-bold text-[var(--text-primary)] block">RentHub Escrow Protection Fee (2%)</span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">Platform escrow vaults & 7-stage trust protocol</span>
                                                </div>
                                                <span className="font-extrabold text-[var(--text-primary)]">{formatPrice(receiptData.breakdown?.platformFee)}</span>
                                            </div>
                                            <div className="flex justify-between pt-2">
                                                <div>
                                                    <span className="font-bold text-[var(--text-primary)] block">Standard Digital Tenancy Lease</span>
                                                    <span className="text-[10px] text-emerald-600 font-bold">₦0 Standard Agreement Included</span>
                                                </div>
                                                <span className="font-extrabold text-emerald-600">₦0</span>
                                            </div>
                                            <div className="flex justify-between pt-3 border-t-2 border-[var(--border-color)]">
                                                <span className="text-sm font-black text-[var(--text-primary)]">Total Paid into Escrow</span>
                                                <span className="text-base font-black text-[var(--color-brand-green)]">{formatPrice(receiptData.breakdown?.totalAmountPaid)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Details */}
                                    <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border-color)] text-xs space-y-1">
                                        <p><span className="text-[var(--text-muted)]">Payment Reference:</span> <span className="font-mono font-bold text-[var(--text-primary)]">{receiptData.paymentReference}</span></p>
                                        <p><span className="text-[var(--text-muted)]">Payment Rail:</span> <span className="font-bold text-[var(--text-primary)]">{receiptData.paymentGateway} ({receiptData.paymentMethod})</span></p>
                                        <p><span className="text-[var(--text-muted)]">Escrow Status:</span> <span className="font-bold text-emerald-600">{receiptData.escrowStatus}</span></p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: DIGITAL TENANCY AGREEMENT */}
                            {activeTab === "agreement" && agreementData && (
                                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm print:border-none print:shadow-none text-xs leading-relaxed">
                                    <div className="text-center pb-6 border-b border-[var(--border-color)] space-y-1">
                                        <span className="text-lg font-black text-[var(--color-brand-green)]">RentHub</span>
                                        <h1 className="text-base sm:text-lg font-black text-[var(--text-primary)] uppercase tracking-wide">
                                            Standard Residential Tenancy Agreement
                                        </h1>
                                        <p className="text-[11px] text-[var(--text-secondary)]">
                                            Governed by {agreementData.governingLaw}
                                        </p>
                                        <span className="font-mono text-[10px] text-[var(--text-muted)] block">
                                            Agreement Ref: {agreementData.agreementNumber}
                                        </span>
                                    </div>

                                    {/* Parties */}
                                    <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border-color)] space-y-2">
                                        <p><strong className="text-[var(--text-primary)]">LANDLORD:</strong> {agreementData.parties?.landlord?.fullName} ({agreementData.parties?.landlord?.email})</p>
                                        <p><strong className="text-[var(--text-primary)]">TENANT:</strong> {agreementData.parties?.tenant?.fullName} ({agreementData.parties?.tenant?.email})</p>
                                        <p><strong className="text-[var(--text-primary)]">DEMISED PREMISES:</strong> {agreementData.premises?.title}, {agreementData.premises?.address}, {agreementData.premises?.city}, {agreementData.premises?.state}</p>
                                        <p><strong className="text-[var(--text-primary)]">TERM:</strong> {agreementData.durationMonths} Months (Commencing {new Date(agreementData.commencementDate).toLocaleDateString("en-NG")} to {new Date(agreementData.expiryDate).toLocaleDateString("en-NG")})</p>
                                    </div>

                                    {/* Covenants */}
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-black uppercase text-[var(--text-primary)]">Statutory & Operational Covenants</h3>
                                        <div className="space-y-2 text-[var(--text-secondary)]">
                                            {agreementData.statutoryCovenants?.map((cov: string, idx: number) => (
                                                <p key={idx} className="p-2.5 rounded-xl bg-[var(--bg-muted)]/20 border border-[var(--border-color)]">
                                                    {cov}
                                                </p>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Signatures */}
                                    <div className="pt-6 border-t border-[var(--border-color)] grid grid-cols-2 gap-4 text-center">
                                        <div className="p-4 rounded-2xl border border-dashed border-[var(--border-color)]">
                                            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Landlord Digital Seal</span>
                                            <span className="font-bold text-[var(--text-primary)] block mt-1">{agreementData.parties?.landlord?.fullName}</span>
                                            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Digitally Executed</span>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-dashed border-[var(--border-color)]">
                                            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Tenant Digital Seal</span>
                                            <span className="font-bold text-[var(--text-primary)] block mt-1">{agreementData.parties?.tenant?.fullName}</span>
                                            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Digitally Executed</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
