"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";

interface UserRow {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    verified: boolean;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string>("");
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchUsers = () => {
        setLoading(true);
        const params = roleFilter ? { role: roleFilter, limit: 50 } : { limit: 50 };
        api.get("/users", { params })
            .then((res) => {
                const data = res.data.data;
                setUsers(Array.isArray(data) ? data : data.users ?? []);
            })
            .catch(() => toast.error("Failed to load users"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, [roleFilter]);

    const handleVerify = async (id: string) => {
        setActionId(id);
        try {
            await api.post(`/users/${id}/verify`);
            toast.success("User verified");
            setUsers((prev) =>
                prev.map((u) => (u.id === id ? { ...u, verified: true } : u))
            );
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Verification failed");
        } finally {
            setActionId(null);
        }
    };

    const roleBadgeColor = (role: string) => {
        switch (role) {
            case "ADMIN": return "border-purple-500/40 text-purple-400";
            case "LANDLORD": return "border-[var(--color-brand-blue)]/40 text-[var(--color-brand-blue)]";
            case "TENANT": return "border-[var(--color-brand-green)]/40 text-[var(--color-brand-green)]";
            default: return "";
        }
    };

    return (
        <>
            <AdminHeader
                title="User Management"
                description="View and verify platform users"
                actions={
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="h-8 rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-2 text-xs font-semibold text-[var(--text-primary)]"
                    >
                        <option value="">All roles</option>
                        <option value="TENANT">Tenants</option>
                        <option value="LANDLORD">Landlords</option>
                        <option value="ADMIN">Admins</option>
                    </select>
                }
            />
            <div className="flex-1 p-6 overflow-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-green)] border-t-transparent" />
                    </div>
                ) : (
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-muted)]">
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Contact</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Role</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-[var(--bg-muted)]/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <p className="font-semibold text-[var(--text-primary)]">
                                                    {user.firstName} {user.lastName}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    Joined {new Date(user.createdAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-[var(--text-secondary)]">{user.email}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{user.phone}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant="outline" className={roleBadgeColor(user.role)}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4">
                                                {user.verified ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-green)]">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-[var(--text-muted)]">Unverified</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                {!user.verified && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={actionId === user.id}
                                                        onClick={() => handleVerify(user.id)}
                                                        className="gap-1 text-xs"
                                                    >
                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                        Verify
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
