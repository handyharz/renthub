"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Search,
    ShieldCheck,
    Phone,
    Mail,
    Loader2,
    User,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Ban,
    RefreshCw,
    Star
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import { toast } from "sonner";

interface PlatformUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: "TENANT" | "LANDLORD" | "ADMIN";
    status: "ACTIVE" | "SUSPENDED" | "BANNED";
    verified: boolean;
    phoneVerified?: boolean;
    createdAt: string;
    lastLoginAt?: string;
}

export function AdminUsersTab() {
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        user: PlatformUser | null;
        action: "SUSPENDED" | "BANNED" | "ACTIVE" | "verify" | null;
    }>({ open: false, user: null, action: null });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get("/admin/users");
            setUsers(res.data.data?.users || []);
        } catch (err: any) {
            const status = err.response?.status;
            const msg = err.response?.data?.message || err.message;
            console.error("Failed to fetch users:", err);
            if (status === 403 || status === 401) {
                setError("permission");
                toast.error("Access Denied", { description: "Your account does not have Admin privileges to view user management." });
            } else {
                setError(msg || "Failed to load users");
                toast.error("Failed to load users");
            }
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (user: PlatformUser, newStatus: "ACTIVE" | "SUSPENDED" | "BANNED") => {
        try {
            setActionLoading(user.id);
            await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
            const labels = { ACTIVE: "Reinstated", SUSPENDED: "Suspended", BANNED: "Banned" };
            toast.success(`User ${labels[newStatus]}`, {
                description: `${user.firstName} ${user.lastName}'s account is now ${newStatus.toLowerCase()}.`
            });
            setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus } : u));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update user status");
        } finally {
            setActionLoading(null);
            setConfirmModal({ open: false, user: null, action: null });
        }
    };

    const handleVerifyLandlord = async (user: PlatformUser) => {
        try {
            setActionLoading(user.id);
            await api.post(`/users/${user.id}/verify`);
            toast.success("Landlord Verified!", {
                description: `${user.firstName} ${user.lastName} has been granted the Verified Landlord badge.`
            });
            setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, verified: true } : u));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to verify landlord");
        } finally {
            setActionLoading(null);
            setConfirmModal({ open: false, user: null, action: null });
        }
    };

    const openConfirm = (user: PlatformUser, action: typeof confirmModal["action"]) => {
        setConfirmModal({ open: true, user, action });
    };

    const confirmAction = () => {
        if (!confirmModal.user || !confirmModal.action) return;
        if (confirmModal.action === "verify") {
            handleVerifyLandlord(confirmModal.user);
        } else {
            handleStatusChange(confirmModal.user, confirmModal.action);
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery =
            !q ||
            u.firstName?.toLowerCase().includes(q) ||
            u.lastName?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.phone?.toLowerCase().includes(q);
        return matchesRole && matchesQuery;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
                <p className="font-semibold text-sm">Loading user directory...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-red-500/30 p-8 shadow-[var(--shadow-sm)]">
                <Ban className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Access Denied</h3>
                <p className="text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto mt-1 leading-relaxed">
                    {error === "permission"
                        ? "Your account does not have Admin role in the database. You must be logged in as an Admin user to manage platform users."
                        : error}
                </p>
                <div className="mt-4 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-xs font-bold text-[var(--text-primary)] inline-block">
                    Admin account: handyharz@gmail.com
                </div>
            </div>
        );
    }

    const actionLabel: Record<string, string> = {
        ACTIVE: "Reinstate Account",
        SUSPENDED: "Suspend Account",
        BANNED: "Ban Account",
        verify: "Verify as Landlord"
    };

    const actionDescription: Record<string, string> = {
        ACTIVE: "This will restore the user's full access to RentHub.",
        SUSPENDED: "This will temporarily restrict the user from performing any platform actions.",
        BANNED: "This will permanently block the user. They will not be able to log in.",
        verify: "This will grant this landlord the Verified Landlord badge visible to all tenants."
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-500" />
                    Platform User Management ({filteredUsers.length})
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                    {["ALL", "TENANT", "LANDLORD", "ADMIN"].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRoleFilter(r)}
                            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border ${
                                roleFilter === r
                                    ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-blue-500/40"
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Input */}
            <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="pl-10 h-11 bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)] rounded-xl text-xs sm:text-sm"
                />
            </div>

            {/* Users Grid */}
            {filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-8">
                    <User className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-primary)] font-bold text-base mb-1">No users found</p>
                    <p className="text-[var(--text-secondary)] text-xs font-medium">Try clearing your search query or role filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((u) => (
                        <div
                            key={u.id}
                            className={`bg-[var(--bg-card)] rounded-2xl border shadow-[var(--shadow-sm)] space-y-4 overflow-hidden ${
                                u.status === "BANNED"
                                    ? "border-red-500/30"
                                    : u.status === "SUSPENDED"
                                        ? "border-amber-500/30"
                                        : "border-[var(--border-color)]"
                            }`}
                        >
                            {/* Status Banner */}
                            {u.status !== "ACTIVE" && (
                                <div className={`px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-center ${
                                    u.status === "BANNED"
                                        ? "bg-red-500/15 text-red-500"
                                        : "bg-amber-500/15 text-amber-500"
                                }`}>
                                    {u.status === "BANNED" ? "🚫 Account Banned" : "⏸ Account Suspended"}
                                </div>
                            )}

                            <div className="p-5 space-y-4">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-extrabold text-sm border shrink-0 ${
                                            u.status === "BANNED"
                                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                                : "bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] border-[var(--border-color)]"
                                        }`}>
                                            {u.firstName?.[0]}{u.lastName?.[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-[var(--text-primary)] text-sm">{u.firstName} {u.lastName}</h4>
                                            <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                                                Joined {new Date(u.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge className={`text-[10px] font-extrabold px-2.5 py-0.5 shrink-0 ${
                                        u.role === "ADMIN"
                                            ? "bg-purple-500/15 text-purple-500 border-purple-500/30"
                                            : u.role === "LANDLORD"
                                                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                                : "bg-blue-500/15 text-blue-500 border-blue-500/30"
                                    }`}>
                                        {u.role}
                                    </Badge>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-1.5 text-xs text-[var(--text-secondary)] font-medium pt-2 border-t border-[var(--border-color)]">
                                    <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" /> {u.phone || "—"}</div>
                                    <div className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" /> {u.email || "—"}</div>
                                </div>

                                {/* Verification Badge */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {u.verified ? (
                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3" /> Verified
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border-color)] text-[10px] font-bold">
                                            Unverified
                                        </Badge>
                                    )}
                                    {u.phoneVerified && (
                                        <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Phone ✓
                                        </Badge>
                                    )}
                                </div>

                                {/* Action Buttons — skip for ADMINs */}
                                {u.role !== "ADMIN" && (
                                    <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
                                        {u.role === "LANDLORD" && !u.verified && (
                                            <Button
                                                onClick={() => openConfirm(u, "verify")}
                                                disabled={actionLoading === u.id}
                                                className="w-full bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs rounded-xl h-9 gap-1.5"
                                            >
                                                <Star className="h-3.5 w-3.5" /> Grant Verified Badge
                                            </Button>
                                        )}

                                        {u.status === "ACTIVE" ? (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => openConfirm(u, "SUSPENDED")}
                                                    disabled={actionLoading === u.id}
                                                    variant="outline"
                                                    className="flex-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10 font-bold text-xs rounded-xl h-9 gap-1"
                                                >
                                                    <AlertCircle className="h-3.5 w-3.5" /> Suspend
                                                </Button>
                                                <Button
                                                    onClick={() => openConfirm(u, "BANNED")}
                                                    disabled={actionLoading === u.id}
                                                    variant="outline"
                                                    className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10 font-bold text-xs rounded-xl h-9 gap-1"
                                                >
                                                    <Ban className="h-3.5 w-3.5" /> Ban
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => openConfirm(u, "ACTIVE")}
                                                disabled={actionLoading === u.id}
                                                variant="outline"
                                                className="w-full text-[var(--color-brand-green)] border-emerald-500/30 hover:bg-emerald-500/10 font-bold text-xs rounded-xl h-9 gap-1.5"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" /> Reinstate Account
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.open && confirmModal.user && confirmModal.action && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
                            <AlertCircle className={`h-6 w-6 ${
                                confirmModal.action === "BANNED" ? "text-red-500" :
                                confirmModal.action === "SUSPENDED" ? "text-amber-500" :
                                "text-[var(--color-brand-green)]"
                            }`} />
                            <h3 className="font-extrabold text-[var(--text-primary)] text-lg">
                                {actionLabel[confirmModal.action]}
                            </h3>
                        </div>

                        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                            {actionDescription[confirmModal.action]}
                        </p>
                        <p className="text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-muted)] p-3 rounded-xl border border-[var(--border-color)]">
                            User: {confirmModal.user.firstName} {confirmModal.user.lastName} ({confirmModal.user.role})
                        </p>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmModal({ open: false, user: null, action: null })}
                                className="rounded-xl text-xs font-bold border-[var(--border-color)]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmAction}
                                disabled={actionLoading === confirmModal.user.id}
                                className={`text-white font-bold text-xs rounded-xl px-5 ${
                                    confirmModal.action === "BANNED" ? "bg-red-600 hover:bg-red-700" :
                                    confirmModal.action === "SUSPENDED" ? "bg-amber-600 hover:bg-amber-700" :
                                    "bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90"
                                }`}
                            >
                                {actionLoading === confirmModal.user.id ? "Processing..." : `Confirm ${actionLabel[confirmModal.action]}`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
