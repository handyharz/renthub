"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface DisputeTransaction {
    id: string;
    totalAmount: number;
    status: string;
    disputeReason: string | null;
    createdAt: string;
    tenant: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    property: {
        id: string;
        title: string;
        address: string;
        city: string;
        landlord: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
        };
    };
}

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState<DisputeTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchDisputes = () => {
        setLoading(true);
        api.get("/admin/disputes")
            .then((res) => setDisputes(res.data.data))
            .catch(() => toast.error("Failed to load disputes"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDisputes(); }, []);

    const handleResolve = async (id: string, action: "release" | "refund") => {
        const label = action === "refund" ? "refund to tenant" : "release to landlord";
        if (!window.confirm(`Confirm: ${label}? This cannot be undone.`)) return;

        const note = window.prompt("Admin note (optional):");
        setActionId(id);
        try {
            await api.post(`/admin/disputes/${id}/resolve`, { action, note });
            toast.success(`Dispute resolved — ${label}`);
            setDisputes((prev) => prev.filter((d) => d.id !== id));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Resolution failed");
        } finally {
            setActionId(null);
        }
    };

    return (
        <>
            <AdminHeader
                title="Escrow Disputes"
                description="Review and resolve locked escrow transactions"
            />
            <div className="flex-1 p-6 overflow-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-green)] border-t-transparent" />
                    </div>
                ) : disputes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <AlertTriangle className="h-12 w-12 text-[var(--text-muted)] mb-4 opacity-40" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">No active disputes</h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">All escrow transactions are clear.</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-muted)]">
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Property</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Tenant</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Landlord</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Reason</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {disputes.map((d) => {
                                        const isActing = actionId === d.id;
                                        return (
                                            <tr key={d.id} className="hover:bg-[var(--bg-muted)]/50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-[var(--text-primary)]">{d.property.title}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{d.property.city}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-bold text-[var(--text-primary)] tabular-nums">{formatPrice(d.totalAmount)}</p>
                                                    <Badge variant="outline" className="mt-1 text-[10px] border-[var(--color-brand-orange)]/40 text-[var(--color-brand-orange)]">
                                                        {d.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-[var(--text-primary)]">{d.tenant.firstName} {d.tenant.lastName}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{d.tenant.phone}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-[var(--text-primary)]">{d.property.landlord.firstName} {d.property.landlord.lastName}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{d.property.landlord.phone}</p>
                                                </td>
                                                <td className="px-4 py-4 max-w-[200px]">
                                                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3">{d.disputeReason || "—"}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={isActing}
                                                            onClick={() => handleResolve(d.id, "refund")}
                                                            className="gap-1 text-xs"
                                                        >
                                                            <ArrowDownLeft className="h-3.5 w-3.5" />
                                                            Refund
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            disabled={isActing}
                                                            onClick={() => handleResolve(d.id, "release")}
                                                            className="gap-1 text-xs"
                                                        >
                                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                                            Release
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
