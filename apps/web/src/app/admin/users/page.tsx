"use client";

import { useEffect, useState, useMemo } from "react";
import {
    CheckCircle2,
    ShieldCheck,
    Search,
    ChevronDown,
    Building2,
    Users,
    UserCheck,
    Shield,
    RefreshCcw,
    Wallet,
    X,
    Eye,
    Phone,
    Mail,
    Calendar,
    ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";

interface UserRow {
    id: string;
    clerkId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: "TENANT" | "LANDLORD" | "ADMIN";
    status: string;
    verified: boolean;
    createdAt: string;
    lastLoginAt?: string;
    afriExchangeAccountEmail?: string;
    afriExchangeWalletAddress?: string;
    settlementLinkedAt?: string;
    _count?: {
        propertiesOwned: number;
        transactions: number;
    };
}

interface UserStats {
    totalUsers: number;
    tenants: number;
    landlords: number;
    admins: number;
    verifiedCount: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [stats, setStats] = useState<UserStats>({
        totalUsers: 0,
        tenants: 0,
        landlords: 0,
        admins: 0,
        verifiedCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string>("");
    const [verifiedFilter, setVerifiedFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [actionId, setActionId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

    const fetchUsers = () => {
        setLoading(true);
        const params: Record<string, any> = { limit: 50 };
        if (roleFilter) params.role = roleFilter;
        if (verifiedFilter !== "") params.verified = verifiedFilter;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        api.get("/users", { params })
            .then((res) => {
                const data = res.data.data;
                if (Array.isArray(data)) {
                    setUsers(data);
                } else if (data?.users) {
                    setUsers(data.users);
                    if (data.stats) setStats(data.stats);
                }
            })
            .catch(() => toast.error("Failed to load users"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter, verifiedFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers();
    };

    const handleVerify = async (id: string) => {
        setActionId(id);
        try {
            await api.post(`/users/${id}/verify`);
            toast.success("User verified successfully");
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Verification failed");
        } finally {
            setActionId(null);
        }
    };

    const roleBadgeColor = (role: string) => {
        switch (role) {
            case "ADMIN":
                return "border-purple-500/40 text-purple-400 bg-purple-500/10";
            case "LANDLORD":
                return "border-[var(--color-brand-blue)]/40 text-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/10";
            case "TENANT":
                return "border-[var(--color-brand-green)]/40 text-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10";
            default:
                return "";
        }
    };

    return (
        <>
            <AdminHeader
                title="User Management"
                description="View and verify platform users, monitor landlord settlement readiness, and manage permissions"
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchUsers}
                        disabled={loading}
                        className="gap-2 h-9 border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]"
                    >
                        <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                }
            />

            <div className="flex-1 p-6 space-y-6 overflow-auto">
                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Registered Users"
                        value={stats.totalUsers}
                        icon={Users}
                        accent="blue"
                        trend={`${stats.verifiedCount} verified platform accounts`}
                    />
                    <StatCard
                        label="Tenants"
                        value={stats.tenants}
                        icon={UserCheck}
                        accent="green"
                        trend="Active renters & escrow depositors"
                    />
                    <StatCard
                        label="Landlords"
                        value={stats.landlords}
                        icon={Building2}
                        accent="blue"
                        trend="Property owners & payout beneficiaries"
                    />
                    <StatCard
                        label="Platform Admins"
                        value={stats.admins}
                        icon={Shield}
                        accent="blue"
                        trend="System operators & staff moderators"
                    />
                </div>

                {/* Filter and Search Bar */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)]">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Search Users
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, email, or phone..."
                                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Role Filter
                            </label>
                            <div className="relative">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                                >
                                    <option value="">All Roles ({stats.totalUsers})</option>
                                    <option value="TENANT">Tenants ({stats.tenants})</option>
                                    <option value="LANDLORD">Landlords ({stats.landlords})</option>
                                    <option value="ADMIN">Admins ({stats.admins})</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Verification
                            </label>
                            <div className="relative">
                                <select
                                    value={verifiedFilter}
                                    onChange={(e) => setVerifiedFilter(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                                >
                                    <option value="">All Accounts</option>
                                    <option value="true">Verified Only</option>
                                    <option value="false">Unverified Only</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                            </div>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button
                                type="submit"
                                size="sm"
                                className="flex-1 bg-[var(--color-brand-blue)] text-white hover:bg-[var(--color-brand-blue)]/90 h-[38px] text-xs font-semibold"
                            >
                                Search
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setRoleFilter("");
                                    setVerifiedFilter("");
                                    setSearchQuery("");
                                    fetchUsers();
                                }}
                                className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] h-[38px] text-xs font-semibold"
                            >
                                Reset
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-green)] border-t-transparent" />
                    </div>
                ) : (
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-[var(--shadow-sm)]">
                        <div className="border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">User Accounts</h2>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Showing {users.length} registered accounts
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            User / Identity
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Role
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            AfriExchange Settlement
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Portfolio / Activity
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Status
                                        </th>
                                        <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)] font-bold text-xs flex items-center justify-center shrink-0">
                                                        {user.firstName?.[0] || user.email?.[0] || "U"}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[var(--text-primary)]">
                                                            {user.firstName} {user.lastName}
                                                        </p>
                                                        <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                                                        <p className="text-[11px] text-[var(--text-muted)]">{user.phone || "No phone"}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="outline" className={roleBadgeColor(user.role)}>
                                                    {user.role}
                                                </Badge>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.afriExchangeAccountEmail ? (
                                                    <div className="space-y-0.5">
                                                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-mono font-semibold">
                                                            <Wallet className="h-3 w-3" />
                                                            {user.afriExchangeAccountEmail}
                                                        </span>
                                                        {user.afriExchangeWalletAddress && (
                                                            <p className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-[180px]">
                                                                {user.afriExchangeWalletAddress}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : user.role === "LANDLORD" ? (
                                                    <span className="text-xs text-amber-400/80">⚠️ Wallet unlinked</span>
                                                ) : (
                                                    <span className="text-xs text-[var(--text-muted)]">—</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--text-secondary)]">
                                                {user.role === "LANDLORD" ? (
                                                    <span>{user._count?.propertiesOwned ?? 0} properties listed</span>
                                                ) : (
                                                    <span>{user._count?.transactions ?? 0} lease transactions</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.verified ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-green)]">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-[var(--text-muted)]">Unverified</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedUser(user)}
                                                    className="h-8 text-xs border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                                    Audit
                                                </Button>
                                                {!user.verified && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={actionId === user.id}
                                                        onClick={() => handleVerify(user.id)}
                                                        className="h-8 gap-1 text-xs border-[var(--color-brand-green)]/40 text-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/10"
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

            {/* User Profile Audit Drawer */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">User Profile Audit</h3>
                                <p className="text-xs text-[var(--text-muted)] font-mono">
                                    ID: {selectedUser.id}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="h-8 w-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Identity Card */}
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                            <div className="h-12 w-12 rounded-full bg-[var(--color-brand-blue)]/20 text-[var(--color-brand-blue)] font-bold text-base flex items-center justify-center shrink-0">
                                {selectedUser.firstName?.[0] || selectedUser.email?.[0] || "U"}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-base text-[var(--text-primary)]">
                                        {selectedUser.firstName} {selectedUser.lastName}
                                    </h4>
                                    <Badge variant="outline" className={roleBadgeColor(selectedUser.role)}>
                                        {selectedUser.role}
                                    </Badge>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">{selectedUser.email}</p>
                            </div>
                        </div>

                        {/* Account Details */}
                        <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4 text-xs">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Account Information
                            </h4>
                            <div className="flex justify-between py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-muted)]">Verification Status:</span>
                                <span>
                                    {selectedUser.verified ? (
                                        <span className="font-semibold text-emerald-400">Verified</span>
                                    ) : (
                                        <span className="text-amber-400">Unverified</span>
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-muted)]">Contact Phone:</span>
                                <span className="text-[var(--text-primary)]">{selectedUser.phone || "None registered"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-muted)]">Registered Date:</span>
                                <span className="text-[var(--text-primary)]">
                                    {new Date(selectedUser.createdAt).toLocaleDateString("en-NG", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            {selectedUser.lastLoginAt && (
                                <div className="flex justify-between py-1">
                                    <span className="text-[var(--text-muted)]">Last Login:</span>
                                    <span className="text-[var(--text-primary)]">
                                        {new Date(selectedUser.lastLoginAt).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* AfriExchange Settlement Info */}
                        <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4 text-xs bg-[var(--bg-primary)]/40">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                AfriExchange Settlement Account
                            </h4>
                            {selectedUser.afriExchangeAccountEmail ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]/60">
                                        <span className="text-[var(--text-muted)]">AfriX Email:</span>
                                        <span className="font-mono font-semibold text-emerald-400">
                                            {selectedUser.afriExchangeAccountEmail}
                                        </span>
                                    </div>
                                    {selectedUser.afriExchangeWalletAddress && (
                                        <div className="py-1">
                                            <span className="text-[var(--text-muted)] block mb-1">Wallet Address:</span>
                                            <span className="font-mono text-[10px] text-[var(--text-secondary)] break-all bg-[var(--bg-muted)] p-2 rounded block border border-[var(--border-color)]">
                                                {selectedUser.afriExchangeWalletAddress}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-amber-400">
                                    ⚠️ No AfriExchange account linked. Landlord payouts will be skipped until an account is attached.
                                </p>
                            )}
                        </div>

                        {/* Portfolio Summary */}
                        <div className="space-y-3 rounded-lg border border-[var(--border-color)] p-4 text-xs">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                Platform Portfolio
                            </h4>
                            <div className="flex justify-between py-1 border-b border-[var(--border-color)]/60">
                                <span className="text-[var(--text-muted)]">Properties Listed:</span>
                                <span className="font-bold text-[var(--text-primary)]">
                                    {selectedUser._count?.propertiesOwned ?? 0}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-[var(--text-muted)]">Transactions:</span>
                                <span className="font-bold text-[var(--text-primary)]">
                                    {selectedUser._count?.transactions ?? 0}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            {!selectedUser.verified && (
                                <Button
                                    size="sm"
                                    onClick={() => handleVerify(selectedUser.id)}
                                    className="flex-1 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white text-xs"
                                >
                                    Verify Account
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => setSelectedUser(null)}
                                className="flex-1 border-[var(--border-color)] text-xs"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
