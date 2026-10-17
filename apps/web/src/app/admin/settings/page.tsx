"use client";

import { useEffect, useState } from "react";
import {
    Settings,
    Shield,
    DollarSign,
    Lock,
    RefreshCcw,
    CheckCircle2,
    AlertTriangle,
    Clock,
    CreditCard,
    Zap,
    ExternalLink,
    Send,
    Radio,
    Save,
    RotateCcw,
    Layers,
    Mail,
    Phone,
    Server,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";

interface SettingsData {
    afriExchange: {
        apiUrl: string;
        merchantId: string;
        merchantName: string;
        hasApiKey: boolean;
        apiKeyMasked: string;
        webhookUrl: string;
        hasWebhookSecret: boolean;
        defaultToken: "NT" | "CT" | "USDT";
        autoDisburseOnOtp: boolean;
        connectionStatus: "OPERATIONAL" | "DEGRADED" | "OFFLINE";
        lastPingLatencyMs?: number;
        lastPingAt?: string;
        rates?: {
            NT?: { token: string; name: string; ngnPerToken: number; desc: string };
            CT?: { token: string; name: string; ngnPerToken: number; desc: string };
            USDT?: { token: string; name: string; ngnPerToken: number; desc: string };
        };
        payoutStats?: {
            totalPayouts: number;
            completedPayouts: number;
            totalDisbursedAmount: number;
            totalPlatformFees: number;
        };
    };
    financial: {
        platformCommissionRateBps: number;
        inspectionFeeAmount: number;
        escrowOtpExpiryHours: number;
        disputeFilingWindowDays: number;
        autoRefundCancelledTransactions: boolean;
    };
    gateways: {
        afriExchange: { enabled: boolean; name: string; token: string; mode: string };
        paystack: { enabled: boolean; publicKeyMasked: string; testMode: boolean };
        flutterwave: { enabled: boolean; publicKeyMasked: string; testMode: boolean };
        termii: { enabled: boolean; senderId: string; hasSecret: boolean };
    };
    policies: {
        enforceLandlordWalletLinking: boolean;
        requireInspectionForCertifiedBadge: boolean;
        requireTenantPhoneVerification: boolean;
        autoDelistRejectedProperties: boolean;
    };
    support: {
        supportEmail: string;
        disputesEmail: string;
        emergencyPhone: string;
        maintenanceMode: boolean;
    };
    systemInfo: {
        environment: string;
        serverTime: string;
        nodeVersion: string;
        uptimeSeconds: number;
    };
}

type TabType = "afriexchange" | "financial" | "gateways" | "policies" | "support";

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingAfri, setTestingAfri] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("afriexchange");

    // Editable form state
    const [form, setForm] = useState({
        commissionPercent: 2.0,
        inspectionFeeNgn: 20000,
        escrowOtpHours: 48,
        disputeDays: 7,
        autoRefund: true,
        defaultToken: "NT" as "NT" | "CT" | "USDT",
        autoDisburse: true,
        enforceWalletLinking: true,
        requireInspection: true,
        requirePhoneVerification: true,
        autoDelist: true,
        supportEmail: "admin@renthub.ng",
        disputesEmail: "disputes@renthub.ng",
        emergencyPhone: "+234 (0) 800-RENTHUB",
        maintenanceMode: false,
        afriExchangeEnabled: true,
        paystackEnabled: true,
        flutterwaveEnabled: true,
        termiiEnabled: true,
    });

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/settings");
            if (res.data?.success && res.data?.data) {
                const d: SettingsData = res.data.data;
                setSettings(d);
                setForm({
                    commissionPercent: (d.financial.platformCommissionRateBps || 200) / 100,
                    inspectionFeeNgn: (d.financial.inspectionFeeAmount || 2000000) / 100,
                    escrowOtpHours: d.financial.escrowOtpExpiryHours || 48,
                    disputeDays: d.financial.disputeFilingWindowDays || 7,
                    autoRefund: d.financial.autoRefundCancelledTransactions ?? true,
                    defaultToken: d.afriExchange.defaultToken || "NT",
                    autoDisburse: d.afriExchange.autoDisburseOnOtp ?? true,
                    enforceWalletLinking: d.policies.enforceLandlordWalletLinking ?? true,
                    requireInspection: d.policies.requireInspectionForCertifiedBadge ?? true,
                    requirePhoneVerification: d.policies.requireTenantPhoneVerification ?? true,
                    autoDelist: d.policies.autoDelistRejectedProperties ?? true,
                    supportEmail: d.support.supportEmail || "admin@renthub.ng",
                    disputesEmail: d.support.disputesEmail || "disputes@renthub.ng",
                    emergencyPhone: d.support.emergencyPhone || "+234 (0) 800-RENTHUB",
                    maintenanceMode: d.support.maintenanceMode ?? false,
                    afriExchangeEnabled: d.gateways.afriExchange.enabled ?? true,
                    paystackEnabled: d.gateways.paystack.enabled ?? true,
                    flutterwaveEnabled: d.gateways.flutterwave.enabled ?? true,
                    termiiEnabled: d.gateways.termii.enabled ?? true,
                });
            }
        } catch (error: any) {
            console.error("Failed to load settings:", error);
            toast.error(error.response?.data?.message || "Failed to load platform settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                financial: {
                    platformCommissionRateBps: Math.round(form.commissionPercent * 100),
                    inspectionFeeAmount: Math.round(form.inspectionFeeNgn * 100),
                    escrowOtpExpiryHours: Number(form.escrowOtpHours),
                    disputeFilingWindowDays: Number(form.disputeDays),
                    autoRefundCancelledTransactions: form.autoRefund,
                },
                policies: {
                    enforceLandlordWalletLinking: form.enforceWalletLinking,
                    requireInspectionForCertifiedBadge: form.requireInspection,
                    requireTenantPhoneVerification: form.requirePhoneVerification,
                    autoDelistRejectedProperties: form.autoDelist,
                },
                gateways: {
                    afriExchangeEnabled: form.afriExchangeEnabled,
                    paystackEnabled: form.paystackEnabled,
                    flutterwaveEnabled: form.flutterwaveEnabled,
                    termiiEnabled: form.termiiEnabled,
                },
                support: {
                    supportEmail: form.supportEmail,
                    disputesEmail: form.disputesEmail,
                    emergencyPhone: form.emergencyPhone,
                    maintenanceMode: form.maintenanceMode,
                },
                afriExchangeSettings: {
                    defaultSettlementToken: form.defaultToken,
                    autoDisburseOnOtp: form.autoDisburse,
                },
            };

            const res = await api.patch("/admin/settings", payload);
            if (res.data?.success) {
                toast.success("Platform settings updated successfully");
                setSettings(res.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handlePingAfriExchange = async () => {
        setTestingAfri(true);
        try {
            const res = await api.post("/admin/settings/test-afriexchange");
            if (res.data?.success) {
                const data = res.data.data;
                toast.success(`AfriExchange Ping Success (${data.latencyMs}ms)`);
                if (settings) {
                    setSettings({
                        ...settings,
                        afriExchange: {
                            ...settings.afriExchange,
                            connectionStatus: data.status,
                            lastPingLatencyMs: data.latencyMs,
                            lastPingAt: data.timestamp,
                            rates: data.rates || settings.afriExchange.rates,
                        },
                    });
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "AfriExchange health ping failed");
        } finally {
            setTestingAfri(false);
        }
    };

    const handleResetDefaults = () => {
        setForm({
            commissionPercent: 2.0,
            inspectionFeeNgn: 20000,
            escrowOtpHours: 48,
            disputeDays: 7,
            autoRefund: true,
            defaultToken: "NT",
            autoDisburse: true,
            enforceWalletLinking: true,
            requireInspection: true,
            requirePhoneVerification: true,
            autoDelist: true,
            supportEmail: "admin@renthub.ng",
            disputesEmail: "disputes@renthub.ng",
            emergencyPhone: "+234 (0) 800-RENTHUB",
            maintenanceMode: false,
            afriExchangeEnabled: true,
            paystackEnabled: true,
            flutterwaveEnabled: true,
            termiiEnabled: true,
        });
        toast.info("Reset to platform default settings. Click 'Save Changes' to apply.");
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString()}`;
    };

    return (
        <>
            <AdminHeader
                title="Platform & Integration Settings"
                description="Configure AfriExchange settlement rails, platform fee schedules, escrow policies, and gateway infrastructure"
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePingAfriExchange}
                            disabled={testingAfri}
                            className="gap-2 h-9 border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]"
                        >
                            <Radio className={`h-3.5 w-3.5 text-[var(--color-brand-blue)] ${testingAfri ? "animate-pulse" : ""}`} />
                            <span>{testingAfri ? "Pinging..." : "Test AfriExchange Ping"}</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchSettings}
                            disabled={loading}
                            className="gap-2 h-9 border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]"
                        >
                            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                            <span>Reload</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="gap-2 h-9 bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90 text-white font-medium"
                        >
                            <Save className={`h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
                            <span>{saving ? "Saving..." : "Save Changes"}</span>
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 p-6 space-y-6 overflow-auto">
                {/* Top Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="AfriExchange Gateway"
                        value={settings?.afriExchange?.connectionStatus || "OPERATIONAL"}
                        icon={Zap}
                        accent={settings?.afriExchange?.connectionStatus === "OPERATIONAL" ? "green" : "orange"}
                        trend={
                            settings?.afriExchange?.lastPingLatencyMs
                                ? `${settings.afriExchange.lastPingLatencyMs}ms ping • ${settings.afriExchange.merchantName}`
                                : "Live settlement protocol connected"
                        }
                    />
                    <StatCard
                        label="Platform Commission"
                        value={`${form.commissionPercent.toFixed(1)}%`}
                        icon={DollarSign}
                        accent="blue"
                        trend={`${Math.round(form.commissionPercent * 100)} bps on escrow release`}
                    />
                    <StatCard
                        label="Inspection Fee"
                        value={formatCurrency(form.inspectionFeeNgn)}
                        icon={Shield}
                        accent="blue"
                        trend="Certified badge physical audit"
                    />
                    <StatCard
                        label="Escrow Inspection Window"
                        value={`${form.escrowOtpHours} Hours`}
                        icon={Clock}
                        accent="orange"
                        trend="Key handover OTP auto-expiry"
                    />
                </div>

                {/* Settings Navigation Tabs */}
                <div className="flex items-center gap-1 border-b border-[var(--border-color)] pb-px">
                    <button
                        onClick={() => setActiveTab("afriexchange")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                            activeTab === "afriexchange"
                                ? "border-[var(--color-brand-blue)] text-[var(--color-brand-blue)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <Zap className="h-4 w-4" />
                        <span>AfriExchange & Escrow</span>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            Live
                        </Badge>
                    </button>

                    <button
                        onClick={() => setActiveTab("financial")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                            activeTab === "financial"
                                ? "border-[var(--color-brand-blue)] text-[var(--color-brand-blue)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <DollarSign className="h-4 w-4" />
                        <span>Financials & Fees</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("gateways")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                            activeTab === "gateways"
                                ? "border-[var(--color-brand-blue)] text-[var(--color-brand-blue)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <CreditCard className="h-4 w-4" />
                        <span>Payment Gateways</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("policies")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                            activeTab === "policies"
                                ? "border-[var(--color-brand-blue)] text-[var(--color-brand-blue)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <Shield className="h-4 w-4" />
                        <span>Policies & Moderation</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("support")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                            activeTab === "support"
                                ? "border-[var(--color-brand-blue)] text-[var(--color-brand-blue)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        <Server className="h-4 w-4" />
                        <span>Support & Diagnostics</span>
                    </button>
                </div>

                {/* Tab 1: AfriExchange & Escrow */}
                {activeTab === "afriexchange" && (
                    <div className="space-y-6">
                        {/* Status Banner */}
                        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-[var(--text-primary)]">
                                            AfriExchange Integration Protocol
                                        </h3>
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                            {settings?.afriExchange?.connectionStatus || "OPERATIONAL"}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                        Automated escrow custody and landlord instant payout rail via stablecoin token transfers.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-xs text-[var(--text-muted)]">Latency</p>
                                    <p className="text-sm font-semibold text-emerald-400">
                                        {settings?.afriExchange?.lastPingLatencyMs ? `${settings.afriExchange.lastPingLatencyMs} ms` : "Active"}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePingAfriExchange}
                                    disabled={testingAfri}
                                    className="gap-2 border-[var(--border-color)]"
                                >
                                    <RefreshCcw className={`h-3.5 w-3.5 ${testingAfri ? "animate-spin" : ""}`} />
                                    <span>Ping Gateway</span>
                                </Button>
                            </div>
                        </div>

                        {/* Integration Details Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Connection Specs */}
                            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-4">
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-[var(--color-brand-blue)]" />
                                    <span>Gateway Credentials & Configuration</span>
                                </h4>

                                <div className="space-y-3 text-xs">
                                    <div>
                                        <label className="text-[var(--text-muted)] block mb-1">AfriExchange API Base URL</label>
                                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-muted)] font-mono text-[var(--text-primary)]">
                                            <span className="truncate">{settings?.afriExchange?.apiUrl || "https://afrix-iqvq.onrender.com/api/v1"}</span>
                                            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">REST v1</Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[var(--text-muted)] block mb-1">Linked Merchant ID</label>
                                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-muted)] font-mono text-[var(--text-primary)]">
                                            <span className="truncate">{settings?.afriExchange?.merchantId || "e1fb66f3-fef1-4129-9e8d-4d166be6c357"}</span>
                                            <span className="text-[10px] text-[var(--text-muted)] uppercase">{settings?.afriExchange?.merchantName}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[var(--text-muted)] block mb-1">API Key Status</label>
                                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-muted)] font-mono text-[var(--text-primary)]">
                                            <span>{settings?.afriExchange?.apiKeyMasked || "4e17••••••••824b"}</span>
                                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center gap-1">
                                                <Check className="h-3 w-3" /> Validated
                                            </Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[var(--text-muted)] block mb-1">Incoming Webhook Callback URL</label>
                                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-muted)] font-mono text-[var(--text-primary)]">
                                            <span className="truncate">{settings?.afriExchange?.webhookUrl || "https://renthub-4jhq.onrender.com/api/afriexchange/webhooks"}</span>
                                            <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">HMAC-SHA256</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Settlement Token & Protocol Controls */}
                            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-4">
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-emerald-400" />
                                    <span>Settlement Protocol Controls</span>
                                </h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-primary)] block mb-1.5">
                                            Default Settlement Token
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { token: "NT", label: "NT (Naira Token)", desc: "1 NT = ₦1.00 NGN" },
                                                { token: "CT", label: "CT (CFA Token)", desc: "1 CT ≈ ₦2.70 NGN" },
                                                { token: "USDT", label: "USDT (Tether)", desc: "1 USDT ≈ ₦1,500" },
                                            ].map((item) => (
                                                <button
                                                    key={item.token}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, defaultToken: item.token as any })}
                                                    className={`p-3 rounded-xl border text-left transition-all ${
                                                        form.defaultToken === item.token
                                                            ? "border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/10 text-[var(--text-primary)] ring-1 ring-[var(--color-brand-blue)]"
                                                            : "border-[var(--border-color)] bg-[var(--bg-muted)] hover:border-[var(--text-muted)] text-[var(--text-muted)]"
                                                    }`}
                                                >
                                                    <p className="font-semibold text-xs text-[var(--text-primary)]">{item.label}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{item.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Auto-disbursement switch */}
                                    <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-[var(--text-primary)]">
                                                Auto-Disburse on OTP Key Handover
                                            </p>
                                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                                Automatically trigger AfriExchange landlord payout immediately after tenant submits the 6-digit key handover code.
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={form.autoDisburse}
                                            onChange={(e) => setForm({ ...form, autoDisburse: e.target.checked })}
                                            className="h-4 w-4 rounded accent-[var(--color-brand-blue)] cursor-pointer"
                                        />
                                    </div>

                                    {/* Live Exchange Rates from AfriExchange */}
                                    <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] space-y-2">
                                        <p className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                                            <Radio className="h-3 w-3 text-emerald-400" />
                                            <span>Live AfriExchange Exchange Rates</span>
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                                                <p className="text-[10px] text-[var(--text-muted)] uppercase">NT (Naira)</p>
                                                <p className="font-bold text-[var(--text-primary)] mt-0.5">₦1.00</p>
                                                <p className="text-[9px] text-emerald-400">1:1 Pegged</p>
                                            </div>
                                            <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                                                <p className="text-[10px] text-[var(--text-muted)] uppercase">CT (CFA)</p>
                                                <p className="font-bold text-[var(--text-primary)] mt-0.5">₦2.70</p>
                                                <p className="text-[9px] text-[var(--text-muted)]">0.37 CT/₦</p>
                                            </div>
                                            <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                                                <p className="text-[10px] text-[var(--text-muted)] uppercase">USDT (USD)</p>
                                                <p className="font-bold text-[var(--text-primary)] mt-0.5">₦1,500</p>
                                                <p className="text-[9px] text-[var(--text-muted)]">$1.00 USD</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Financials & Fees */}
                {activeTab === "financial" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-6">
                            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-[var(--color-brand-blue)]" />
                                <span>Platform Commission & Fee Parameters</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                        Platform Commission Fee (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="15"
                                            value={form.commissionPercent}
                                            onChange={(e) => setForm({ ...form, commissionPercent: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] font-semibold"
                                        />
                                        <span className="absolute right-3.5 top-2.5 text-xs text-[var(--text-muted)]">%</span>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                                        Deducted from gross escrow upon OTP key handover ({Math.round(form.commissionPercent * 100)} bps).
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                        Physical Inspection Fee (₦)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="1000"
                                            min="0"
                                            value={form.inspectionFeeNgn}
                                            onChange={(e) => setForm({ ...form, inspectionFeeNgn: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] font-semibold"
                                        />
                                        <span className="absolute right-3.5 top-2.5 text-xs text-[var(--text-muted)]">NGN</span>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                                        Fee charged for on-site physical property audit and Certified Badge grant.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                        Escrow OTP Expiry Duration (Hours)
                                    </label>
                                    <input
                                        type="number"
                                        min="12"
                                        max="168"
                                        value={form.escrowOtpHours}
                                        onChange={(e) => setForm({ ...form, escrowOtpHours: parseInt(e.target.value) || 48 })}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] font-semibold"
                                    />
                                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                                        Time tenant has to physically inspect property before funds release or dispute filing.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                        Dispute Arbitration Window (Days)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={form.disputeDays}
                                        onChange={(e) => setForm({ ...form, disputeDays: parseInt(e.target.value) || 7 })}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] font-semibold"
                                    />
                                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                                        Maximum investigation period for admin team to arbitrate dispute before automated resolution.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--border-color)]">
                                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)]">
                                    <div>
                                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                                            Automate Refund on Cancelled Escrow Deposits
                                        </p>
                                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                            Instantly return funds to tenant&apos;s source wallet if landlord cancels before key handover inspection.
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={form.autoRefund}
                                        onChange={(e) => setForm({ ...form, autoRefund: e.target.checked })}
                                        className="h-4 w-4 rounded accent-[var(--color-brand-blue)] cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Live Payout Split Simulator */}
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-4">
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <Zap className="h-4 w-4 text-[var(--color-brand-blue)]" />
                                <span>Live Split Simulator (₦1,000,000 Rent)</span>
                            </h4>

                            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--text-muted)]">Tenant Escrow Deposit:</span>
                                    <span className="font-bold text-[var(--text-primary)]">₦1,000,000.00</span>
                                </div>

                                <div className="flex items-center justify-between text-emerald-400">
                                    <span>Landlord Net Payout ({100 - form.commissionPercent}%):</span>
                                    <span className="font-bold">
                                        ₦{(1000000 * (1 - form.commissionPercent / 100)).toLocaleString()}.00
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-purple-400">
                                    <span>RentHub Platform Fee ({form.commissionPercent}%):</span>
                                    <span className="font-bold">
                                        ₦{(1000000 * (form.commissionPercent / 100)).toLocaleString()}.00
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                                    <span>AfriExchange Disbursed In:</span>
                                    <span className="font-semibold text-[var(--text-primary)]">{form.defaultToken} Stablecoin</span>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs">
                                <p className="font-semibold mb-1">Escrow Guarantee</p>
                                <p className="text-[11px] opacity-90 leading-relaxed">
                                    Funds are held securely in AfriExchange smart escrow until the tenant inputs the 6-digit handover OTP.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 3: Payment Gateways */}
                {activeTab === "gateways" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Gateway 1: AfriExchange */}
                        <div className="p-5 rounded-xl border border-emerald-500/30 bg-[var(--bg-card)] space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                                            AfriExchange Token Escrow
                                        </h4>
                                        <p className="text-xs text-[var(--text-muted)]">Primary Stablecoin Escrow Rail</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                                    Active Rail
                                </Badge>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                Provides instant settlement in Naira Tokens (NT) and CFA Tokens (CT). Zero chargeback risk and automated cryptographic payouts.
                            </p>
                            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                                <span className="text-[var(--text-muted)]">Status</span>
                                <span className="font-semibold text-emerald-400">OPERATIONAL • 100% SLA</span>
                            </div>
                        </div>

                        {/* Gateway 2: Paystack */}
                        <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <CreditCard className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                                            Paystack Card & Bank
                                        </h4>
                                        <p className="text-xs text-[var(--text-muted)]">Cards, Bank Transfer, USSD</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10">
                                    Test Mode
                                </Badge>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                Secondary fiat gateway for traditional credit/debit cards, NIBSS virtual bank transfers, and automated recurring rent debits.
                            </p>
                            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                                <span className="text-[var(--text-muted)]">Public Key</span>
                                <span className="font-mono text-[var(--text-primary)]">
                                    {settings?.gateways?.paystack?.publicKeyMasked || "pk_test_••••••••"}
                                </span>
                            </div>
                        </div>

                        {/* Gateway 3: Flutterwave */}
                        <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                        <Layers className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                                            Flutterwave Gateway
                                        </h4>
                                        <p className="text-xs text-[var(--text-muted)]">Pan-African & Diaspora Cards</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-orange-500/40 text-orange-400 bg-orange-500/10">
                                    Test Mode
                                </Badge>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                International card acceptance for diaspora tenants and mobile money across West and East Africa.
                            </p>
                            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                                <span className="text-[var(--text-muted)]">Public Key</span>
                                <span className="font-mono text-[var(--text-primary)]">
                                    {settings?.gateways?.flutterwave?.publicKeyMasked || "FLWPUBK_TEST••••••••"}
                                </span>
                            </div>
                        </div>

                        {/* Gateway 4: Termii SMS */}
                        <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                        <Send className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                                            Termii SMS & OTP
                                        </h4>
                                        <p className="text-xs text-[var(--text-muted)]">Key Handover Verification</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-purple-500/40 text-purple-400 bg-purple-500/10">
                                    Active
                                </Badge>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                Telecommunications provider delivering the 6-digit key handover verification codes and real-time security alerts to landlords and tenants.
                            </p>
                            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                                <span className="text-[var(--text-muted)]">Sender ID</span>
                                <span className="font-semibold text-[var(--text-primary)]">
                                    {settings?.gateways?.termii?.senderId || "RentHub"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 4: Policies & Moderation */}
                {activeTab === "policies" && (
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-6">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <Shield className="h-5 w-5 text-[var(--color-brand-blue)]" />
                            <span>System Governance & Risk Mitigation Policies</span>
                        </h3>

                        <div className="space-y-4">
                            {/* Policy 1 */}
                            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                                            Enforce Landlord AfriExchange Settlement Wallet
                                        </p>
                                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                                            Risk Control
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Requires property owners to link and verify their AfriExchange account before escrow funds can be disbursed.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={form.enforceWalletLinking}
                                    onChange={(e) => setForm({ ...form, enforceWalletLinking: e.target.checked })}
                                    className="h-4 w-4 rounded accent-[var(--color-brand-blue)] cursor-pointer"
                                />
                            </div>

                            {/* Policy 2 */}
                            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                                            Certified Badge Physical Inspection Gate
                                        </p>
                                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                                            Quality Standard
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Property cannot receive the green &quot;Certified&quot; trust badge without an in-person field inspection report approved by an administrator.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={form.requireInspection}
                                    onChange={(e) => setForm({ ...form, requireInspection: e.target.checked })}
                                    className="h-4 w-4 rounded accent-[var(--color-brand-blue)] cursor-pointer"
                                />
                            </div>

                            {/* Policy 3 */}
                            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                                            Mandatory Tenant Phone Verification
                                        </p>
                                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                            KYC
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Tenants must complete SMS OTP verification on their Nigerian telephone number before scheduling tours or funding escrow.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={form.requirePhoneVerification}
                                    onChange={(e) => setForm({ ...form, requirePhoneVerification: e.target.checked })}
                                    className="h-4 w-4 rounded accent-[var(--color-brand-blue)] cursor-pointer"
                                />
                            </div>

                            {/* Policy 4 */}
                            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                                            Auto-Delist Rejected & Delinquent Listings
                                        </p>
                                        <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/30">
                                            Listing Hygiene
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Immediately withdraw properties from public search indices and recommendation feeds upon admin rejection.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={form.autoDelist}
                                    onChange={(e) => setForm({ ...form, autoDelist: e.target.checked })}
                                    className="h-4 w-4 rounded accent-[var(--color-brand-blue)] cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 5: Support & Diagnostics */}
                {activeTab === "support" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Escalation Desks */}
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-4">
                            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <Mail className="h-5 w-5 text-[var(--color-brand-blue)]" />
                                <span>Support & Escalation Contacts</span>
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                        General Admin Escalation Email
                                    </label>
                                    <input
                                        type="email"
                                        value={form.supportEmail}
                                        onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)]"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                        Dispute Arbitration Desk
                                    </label>
                                    <input
                                        type="email"
                                        value={form.disputesEmail}
                                        onChange={(e) => setForm({ ...form, disputesEmail: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)]"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                                        Emergency Hotline Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={form.emergencyPhone}
                                        onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)]"
                                    />
                                </div>

                                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-rose-400">
                                            Emergency Maintenance Mode
                                        </p>
                                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                            Halts new escrow deposits and displays maintenance notice to tenants.
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={form.maintenanceMode}
                                        onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
                                        className="h-4 w-4 rounded accent-rose-500 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* System Runtime & Environment */}
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-4">
                            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <Server className="h-5 w-5 text-emerald-400" />
                                <span>System Runtime & Node Diagnostics</span>
                            </h3>

                            <div className="space-y-3 text-xs">
                                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-muted)]">
                                    <span className="text-[var(--text-muted)]">Runtime Environment:</span>
                                    <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 font-mono">
                                        {settings?.systemInfo?.environment || "development"}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-muted)]">
                                    <span className="text-[var(--text-muted)]">Node.js Version:</span>
                                    <span className="font-mono text-[var(--text-primary)] font-semibold">
                                        {settings?.systemInfo?.nodeVersion || process.version || "v20.x"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-muted)]">
                                    <span className="text-[var(--text-muted)]">API Process Uptime:</span>
                                    <span className="font-semibold text-[var(--text-primary)]">
                                        {settings?.systemInfo?.uptimeSeconds
                                            ? `${Math.floor(settings.systemInfo.uptimeSeconds / 60)} minutes (${settings.systemInfo.uptimeSeconds}s)`
                                            : "Active"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-muted)]">
                                    <span className="text-[var(--text-muted)]">Database Driver:</span>
                                    <span className="font-semibold text-emerald-400">Prisma ORM • Neon PostgreSQL (Serverless)</span>
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleResetDefaults}
                                        className="gap-2 text-xs border-[var(--border-color)] text-[var(--text-muted)] hover:text-rose-400"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        <span>Reset All Defaults</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
