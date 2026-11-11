"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import {
    Loader2,
    CheckCircle2,
    ShieldCheck,
    Landmark,
    Trash2,
    RefreshCw,
    Sparkles,
    AlertCircle,
    Copy,
    Check,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface BankOption {
    name: string;
    code: string;
    nipCode: string;
}

const DEFAULT_BANKS: BankOption[] = [
    { name: "Access Bank", code: "044", nipCode: "000014" },
    { name: "Guaranty Trust Bank (GTBank)", code: "058", nipCode: "000013" },
    { name: "Zenith Bank", code: "057", nipCode: "000015" },
    { name: "Providus Bank", code: "101", nipCode: "000023" },
    { name: "Kuda Bank", code: "090267", nipCode: "090267" },
    { name: "First Bank of Nigeria", code: "011", nipCode: "000016" },
    { name: "United Bank for Africa (UBA)", code: "033", nipCode: "000004" },
    { name: "Stanbic IBTC Bank", code: "221", nipCode: "000012" },
    { name: "FCMB", code: "214", nipCode: "000003" },
    { name: "PalmPay", code: "999991", nipCode: "090405" },
    { name: "OPay", code: "999992", nipCode: "090325" },
];

interface AnchorBankLinkingCardProps {
    dbUser: any;
    onRefresh?: () => void;
    title?: string;
    subtitle?: string;
}

export function AnchorBankLinkingCard({
    dbUser,
    onRefresh,
    title = "Nigerian Commercial Bank Settlement",
    subtitle = "Escrow releases are disbursed directly to your Nigerian commercial bank account via Anchor BaaS / NIBSS inter-bank transfer.",
}: AnchorBankLinkingCardProps) {
    const { user } = useUser();
    const [banks, setBanks] = useState<BankOption[]>(DEFAULT_BANKS);
    const [selectedBankCode, setSelectedBankCode] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [resolving, setResolving] = useState(false);
    const [saving, setSaving] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    const [showUnlinkModal, setShowUnlinkModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const isLinked = Boolean(dbUser?.bankLinkedAt && dbUser?.accountNumber);

    useEffect(() => {
        api.get("/payouts/bank/supported")
            .then((res) => {
                if (res.data?.data?.length) setBanks(res.data.data);
            })
            .catch(() => {});
    }, []);

    const selectedBank = banks.find(
        (b) => b.code === selectedBankCode || b.nipCode === selectedBankCode
    );

    const handleFillTestDetails = () => {
        const testBank = banks.find((b) => b.nipCode === "000014") || banks[0];
        setSelectedBankCode(testBank.nipCode || testBank.code);
        setAccountNumber("0123456789");
        setAccountName(user?.fullName || dbUser?.firstName ? `${dbUser?.firstName || ""} ${dbUser?.lastName || ""}`.trim() : "Harun Kane");
        toast.info("Sandbox test bank details filled!");
    };

    const handleResolve = async () => {
        if (!accountNumber || accountNumber.length !== 10) {
            toast.error("Please enter a valid 10-digit NUBAN account number");
            return;
        }
        if (!selectedBankCode) {
            toast.error("Please select a bank first");
            return;
        }

        try {
            setResolving(true);
            const res = await api.post("/payouts/bank/resolve", {
                accountNumber,
                bankCode: selectedBankCode,
            });
            if (res.data?.data?.accountName) {
                setAccountName(res.data.data.accountName);
                toast.success("Account name verified!");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to resolve account name");
        } finally {
            setResolving(false);
        }
    };

    const handleSave = async () => {
        if (!selectedBankCode || !accountNumber || accountNumber.length !== 10) {
            toast.error("Please complete bank selection and 10-digit account number");
            return;
        }

        const bank = selectedBank || banks[0];

        try {
            setSaving(true);
            await api.post("/payouts/bank/link", {
                bankName: bank.name,
                bankCode: bank.code,
                nipCode: bank.nipCode,
                accountNumber,
                accountName: accountName || `${dbUser?.firstName || ""} ${dbUser?.lastName || ""}`.trim() || "Verified Landlord",
            });
            toast.success("Nigerian bank account linked successfully!");
            setIsEditing(false);
            onRefresh?.();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to link bank account");
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmUnlink = async () => {
        try {
            setUnlinking(true);
            await api.delete("/payouts/bank/unlink");
            toast.success("Bank account unlinked");
            setShowUnlinkModal(false);
            setIsEditing(false);
            setAccountNumber("");
            setSelectedBankCode("");
            setAccountName("");
            onRefresh?.();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to unlink account");
        } finally {
            setUnlinking(false);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-color)]">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                        <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                                {title}
                            </h3>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                Direct NIP Rail
                            </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {subtitle}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {isLinked && !isEditing ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active Settlement Account
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Action Required: Unlinked
                        </span>
                    )}
                </div>
            </div>

            {/* Sandbox Testing Hint Box */}
            <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                            Sandbox Test Mode Hint
                        </p>
                        <p className="text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                            Anchor Sandbox accepts any 10-digit account (e.g. <code className="font-mono bg-[var(--bg-card)] px-1 rounded border">0123456789</code>) with Access Bank (<code className="font-mono bg-[var(--bg-card)] px-1 rounded border">000014</code>) or GTBank (<code className="font-mono bg-[var(--bg-card)] px-1 rounded border">000013</code>).
                        </p>
                    </div>
                </div>
                {!isLinked && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleFillTestDetails}
                        className="text-xs font-bold border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 shrink-0 h-8 px-3"
                    >
                        Fill Test Details ⚡
                    </Button>
                )}
            </div>

            {/* Body: Linked State View */}
            {isLinked && !isEditing ? (
                <div className="space-y-4">
                    <div className="bg-[var(--bg-muted)]/60 rounded-2xl p-4 sm:p-5 border border-[var(--border-color)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                Bank Name
                            </span>
                            <p className="font-bold text-sm text-[var(--text-primary)] mt-0.5">
                                {dbUser.bankName || "Commercial Bank"}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                NUBAN Account Number
                            </span>
                            <p className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {dbUser.accountNumber}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                Account Holder Name
                            </span>
                            <p className="font-semibold text-xs text-[var(--text-primary)] truncate mt-0.5">
                                {dbUser.accountName || "Verified Landlord"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            Funds disburse automatically to this bank account upon 6-digit key handover verification.
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedBankCode(dbUser.bankCode || "");
                                    setAccountNumber(dbUser.accountNumber || "");
                                    setAccountName(dbUser.accountName || "");
                                    setIsEditing(true);
                                }}
                                className="text-xs h-8 px-3 font-semibold"
                            >
                                Edit Account
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUnlinkModal(true)}
                                className="text-xs h-8 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 font-semibold"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Unlink
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Unlinked Form View */
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Bank Dropdown */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-primary)]">
                                Select Nigerian Bank
                            </label>
                            <select
                                value={selectedBankCode}
                                onChange={(e) => {
                                    setSelectedBankCode(e.target.value);
                                    setAccountName("");
                                }}
                                className="w-full text-xs rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand-green)]"
                            >
                                <option value="">-- Choose Bank --</option>
                                {banks.map((b) => (
                                    <option key={b.nipCode || b.code} value={b.nipCode || b.code}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Account Number */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-primary)]">
                                10-Digit NUBAN Account Number
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    maxLength={10}
                                    placeholder="e.g. 0123456789"
                                    value={accountNumber}
                                    onChange={(e) => {
                                        setAccountNumber(e.target.value.replace(/\D/g, ""));
                                        setAccountName("");
                                    }}
                                    className="font-mono text-xs rounded-xl h-10"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResolve}
                                    disabled={resolving || accountNumber.length !== 10 || !selectedBankCode}
                                    className="text-xs font-bold h-10 px-3 shrink-0"
                                >
                                    {resolving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Account Name Display / Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--text-primary)]">
                            Verified Account Name
                        </label>
                        <Input
                            type="text"
                            placeholder="Enter or verify account name"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="text-xs rounded-xl h-10"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        <p className="text-[11px] text-[var(--text-secondary)]">
                            Ensure the account name matches your registered identity to prevent inter-bank settlement delays.
                        </p>
                        <div className="flex items-center gap-2">
                            {isEditing && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditing(false)}
                                    className="text-xs font-semibold h-10 px-3"
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={saving || !selectedBankCode || accountNumber.length !== 10}
                                className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold text-xs rounded-xl h-10 px-6 gap-2 shadow-xs"
                            >
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                Link Bank Account
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Unlink Modal */}
            {showUnlinkModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                            <Trash2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-[var(--text-primary)]">
                                Unlink Nigerian Bank Account?
                            </h4>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                                Are you sure you want to unlink this account? Released escrow rent payments cannot be transferred via NIP until a new verified account is linked.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowUnlinkModal(false)}
                                disabled={unlinking}
                                className="text-xs font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleConfirmUnlink}
                                disabled={unlinking}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                            >
                                {unlinking ? "Unlinking..." : "Yes, Unlink"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

