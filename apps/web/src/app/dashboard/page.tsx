"use client";

import { useState, useEffect, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Home,
    MessageSquare,
    BarChart3,
    Plus,
    Eye,
    MapPin,
    Calendar,
    TrendingUp,
    Edit,
    Trash2,
    ShieldCheck,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    Receipt,
    FileText,
    Wallet,
    AlertCircle,
    AlertTriangle,
    User,
    Phone,
    Building2,
    Sparkles,
    ArrowUpRight,
    ArrowRight,
    Lock,
    Key,
    Shield,
    Check,
    ExternalLink,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { formatPrice, cn, calculateTrustScore } from "@/lib/utils";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Inbox } from "@/components/messaging/Inbox";
import { ApplicationsTab } from "@/components/dashboard/ApplicationsTab";
import { LandlordApplicationsTab } from "@/components/dashboard/LandlordApplicationsTab";
import { TransactionsTab } from "@/components/dashboard/TransactionsTab";
import { MonetizationModal } from "@/components/landlord/MonetizationModal";
import { AfriExchangeLinkingCard } from "@/components/payouts/AfriExchangeLinkingCard";
import { LandlordPayoutHistory } from "@/components/payouts/LandlordPayoutHistory";
import { Rocket } from "lucide-react";
import { toast } from "sonner";

interface Property {
    id: string;
    title: string;
    address: string;
    city: string;
    pricePerYear: number;
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    status: string;
    viewCount: number;
    images: { url: string; isPrimary: boolean }[];
    featured: boolean;
    featuredExpiresAt?: string;
    verified: boolean;
    landlord?: {
        verified: boolean;
    };
    createdAt: string;
}

interface Activity {
    id: string;
    type: "PROPERTY_LISTED" | "PROPERTY_UPDATED" | "PROPERTY_VIEWED";
    title: string;
    description: string;
    timestamp: string;
    propertyId: string;
}

function DashboardContent() {
    const { user, isLoaded } = useUser();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "overview");
    const [activeConversationId, setActiveConversationId] = useState<string | null>(searchParams.get("convId"));
    const [properties, setProperties] = useState<Property[]>([]);
    const [favorites, setFavorites] = useState<Property[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const tab = searchParams.get("tab");
        const convId = searchParams.get("convId");
        const paymentStatus = searchParams.get("payment");
        const reference = searchParams.get("reference");

        if (tab) setActiveTab(tab);
        if (convId) setActiveConversationId(convId);

        if (paymentStatus === "success" && reference && isLoaded && user) {
            const verifyPayment = async () => {
                try {
                    try {
                        const rentalRes = await api.get(`/payments/verify/${reference}`);
                        if (rentalRes.data?.success) {
                            toast.success("Escrow Payment Secured!", {
                                description: "Your rent payment is safely held in RentHub Escrow.",
                            });
                            fetchDashboardData();
                            return;
                        }
                    } catch (rentalErr) {}

                    await api.post("/services/verify", { reference });
                    toast.success("Payment Verified!", {
                        description: "Benefits have been activated for your property.",
                    });
                    fetchDashboardData();
                } catch (error: any) {
                    console.error("Verification failed:", error);
                    if (error.response?.status !== 400 && error.response?.status !== 404) {
                        toast.error("Verification pending", {
                            description: "We're still processing your payment. It should reflect shortly.",
                        });
                    }
                }
            };

            verifyPayment();

            const url = new URL(window.location.href);
            url.searchParams.delete("payment");
            url.searchParams.delete("reference");
            url.searchParams.delete("trxref");
            window.history.replaceState({}, "", url.toString());
        }
    }, [searchParams, isLoaded, user]);

    const [loading, setLoading] = useState(true);
    const [dbUser, setDbUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [userVerified, setUserVerified] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        views: 0,
        active: 0,
        messages: 0,
        favorites: 0,
        tours: 0,
        applications: 0,
    });

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user, isLoaded]);

    const fetchDashboardData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            let fetchedUser;
            try {
                const userRes = await api.get(`/users/me?clerkId=${user.id}`);
                fetchedUser = userRes.data.data;
            } catch (err: any) {
                if (err.response?.status === 404) {
                    const createRes = await api.post("/users", {
                        clerkId: user.id,
                        email: user.emailAddresses[0]?.emailAddress,
                        phone: user.phoneNumbers[0]?.phoneNumber,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        avatar: user.imageUrl,
                    });
                    fetchedUser = createRes.data.data;
                } else {
                    throw err;
                }
            }

            const dbUserId = fetchedUser.id;
            setDbUser(fetchedUser);
            
            // If the user owns properties, treat them as LANDLORD even if DB role was default TENANT
            const effectiveRole = (fetchedUser.propertiesOwned && fetchedUser.propertiesOwned.length > 0) || fetchedUser.role === "LANDLORD"
                ? "LANDLORD"
                : fetchedUser.role;
            setRole(effectiveRole);
            setUserVerified(fetchedUser.verified);

            if (effectiveRole === "LANDLORD") {
                const res = await api.get(`/properties?landlordId=${dbUserId}`);
                const userProperties = res.data.data.properties || [];
                setProperties(userProperties);

                let unreadCount = 0;
                let toursCount = 0;
                let appCount = 0;

                try {
                    const [unreadRes, toursRes, appRes] = await Promise.allSettled([
                        api.get(`/messages/unread-count?clerkId=${user.id}`),
                        api.get(`/tours?clerkId=${user.id}&role=LANDLORD`),
                        api.get("/applications/landlord"),
                    ]);
                    if (unreadRes.status === "fulfilled") unreadCount = unreadRes.value.data?.data?.count || 0;
                    if (toursRes.status === "fulfilled") toursCount = toursRes.value.data?.data?.length || 0;
                    if (appRes.status === "fulfilled") appCount = appRes.value.data?.data?.length || 0;
                } catch (e) {
                    console.warn("Extra landlord stats fetch error:", e);
                }

                const totalViews = userProperties.reduce((sum: number, p: Property) => sum + (p.viewCount || 0), 0);
                const activeCount = userProperties.filter((p: Property) => p.status === "AVAILABLE").length;

                setStats({
                    total: userProperties.length,
                    views: totalViews,
                    active: activeCount,
                    messages: unreadCount,
                    favorites: 0,
                    tours: toursCount,
                    applications: appCount,
                });
            } else {
                const favRes = await api.get(`/favorites/me?clerkId=${user.id}`);
                const favProperties = favRes.data.data.map((f: any) => ({
                    ...f.property,
                    isFavorited: true
                })) || [];
                setFavorites(favProperties);

                let unreadCount = 0;
                let toursCount = 0;
                let appCount = 0;

                try {
                    const [unreadRes, toursRes, appRes] = await Promise.allSettled([
                        api.get(`/messages/unread-count?clerkId=${user.id}`),
                        api.get(`/tours?clerkId=${user.id}&role=TENANT`),
                        api.get("/applications/tenant"),
                    ]);
                    if (unreadRes.status === "fulfilled") unreadCount = unreadRes.value.data?.data?.count || 0;
                    if (toursRes.status === "fulfilled") toursCount = toursRes.value.data?.data?.length || 0;
                    if (appRes.status === "fulfilled") appCount = appRes.value.data?.data?.length || 0;
                } catch (e) {
                    console.warn("Extra tenant stats fetch error:", e);
                }

                setStats({
                    total: 0,
                    views: 0,
                    active: 0,
                    messages: unreadCount,
                    favorites: favProperties.length,
                    tours: toursCount,
                    applications: appCount,
                });
            }

            const activityRes = await api.get(`/users/${dbUserId}/activity`);
            setActivities(activityRes.data.data || []);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const landlordTabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "properties", label: "My Properties", icon: Home },
        { id: "applications", label: "Applications", icon: FileText },
        { id: "tours", label: "Physical Tours", icon: Calendar },
        { id: "transactions", label: "Transactions", icon: Receipt },
        { id: "payouts", label: "Payouts & Settlements", icon: Wallet },
        { id: "messages", label: "Messages", icon: MessageSquare },
    ];

    const tenantTabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "favorites", label: "Saved Homes", icon: Home },
        { id: "tours", label: "Physical Tours", icon: Calendar },
        { id: "applications", label: "Applications", icon: FileText },
        { id: "messages", label: "Messages", icon: MessageSquare },
    ];

    const tabs = role === "LANDLORD" ? landlordTabs : tenantTabs;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-6 sm:pt-8 pb-16 sm:pb-20">
            <div className="container-wide">
                {/* Header */}
                <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                                Welcome back, {user?.firstName}!
                            </h1>
                            {userVerified && (
                                <Badge className="bg-[var(--color-brand-green)] text-white border-none px-2.5 py-0.5 text-xs font-bold flex items-center gap-1 rounded-full shadow-sm">
                                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Landlord
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                            {role === "LANDLORD"
                                ? "Manage your properties and track performance"
                                : "Manage your home search, applications, and messages"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link href="/dashboard/profile" className="flex-1 sm:flex-initial">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-bold text-xs sm:text-sm h-11 px-4 rounded-xl gap-2 shadow-xs transition-colors"
                            >
                                <User className="h-4 w-4 text-[var(--color-brand-blue)]" />
                                My Profile
                            </Button>
                        </Link>
                        {role === "TENANT" && (
                            <Link href="/search" className="flex-1 sm:flex-initial">
                                <Button className="w-full sm:w-auto bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold h-11 px-5 rounded-xl">
                                    <Search className="mr-2 h-4 w-4" />
                                    Find a Home
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Landlord Unlinked Settlement Notice Banner */}
                {role === "LANDLORD" && dbUser && !dbUser.settlementLinkedAt && (
                    <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 sm:p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-3.5">
                                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-amber-950 text-sm sm:text-base flex items-center gap-2">
                                        AfriExchange Settlement Account Required
                                        <Badge className="bg-amber-200 text-amber-900 border-none text-[10px] font-bold">Action Needed</Badge>
                                    </h3>
                                    <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                                        Link your verified AfriExchange account to receive released rent escrow payments directly to your mobile wallet.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setActiveTab("payouts")}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm h-10 px-5 rounded-xl shrink-0 shadow-sm"
                            >
                                Link Account Now
                            </Button>
                        </div>
                    </div>
                )}

                {/* Mobile & Desktop Scrollable Tabs */}
                <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border-color)] mb-6 font-bold overflow-hidden">
                    <div className="border-b border-[var(--border-color)] px-2 sm:px-6">
                        <div className="flex gap-2 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex items-center gap-2 py-3.5 px-3 sm:px-4 text-xs sm:text-sm border-b-2 font-bold transition-all whitespace-nowrap cursor-pointer rounded-t-lg",
                                            isActive
                                                ? "border-[var(--color-brand-green)] text-[var(--color-brand-green)] bg-[var(--bg-muted)]/50"
                                                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]/30"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4 sm:p-6">
                        {activeTab === "overview" && (
                            role === "LANDLORD"
                                ? <OverviewTab stats={stats} activities={activities} loading={loading} onTabChange={setActiveTab} dbUser={dbUser} properties={properties} />
                                : <TenantOverviewTab stats={stats} activities={activities} loading={loading} onTabChange={setActiveTab} favorites={favorites} dbUser={dbUser} />
                        )}
                        {activeTab === "properties" && role === "LANDLORD" && <PropertiesTab properties={properties} loading={loading} onRefresh={fetchDashboardData} />}
                        {activeTab === "tours" && <ToursTab role={role as "LANDLORD" | "TENANT"} />}
                        {activeTab === "favorites" && role === "TENANT" && <FavoritesTab favorites={favorites} loading={loading} />}
                        {activeTab === "applications" && (role === "LANDLORD" ? <LandlordApplicationsTab /> : <ApplicationsTab />)}
                        {activeTab === "transactions" && role === "LANDLORD" && <TransactionsTab />}
                        {activeTab === "payouts" && role === "LANDLORD" && (
                            <div className="space-y-6">
                                <AfriExchangeLinkingCard dbUser={dbUser} onRefresh={fetchDashboardData} />
                                <LandlordPayoutHistory />
                            </div>
                        )}
                        {activeTab === "messages" && <Inbox initialConversationId={activeConversationId} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

function OverviewTab({
    stats,
    activities,
    loading,
    onTabChange,
    dbUser,
    properties = [],
}: {
    stats: any;
    activities: Activity[];
    loading: boolean;
    onTabChange: (tab: string) => void;
    dbUser: any;
    properties?: Property[];
}) {
    const trustScore = calculateTrustScore(dbUser);
    const activeRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
    const userProperties = properties || [];

    const statCards = [
        {
            label: "Listed Properties",
            value: stats.total,
            sub: `${stats.active} live in market`,
            icon: Building2,
            bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
            iconColor: "text-blue-500 dark:text-blue-400",
            badge: stats.active > 0 ? `${activeRate}% active` : "0 active",
            badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
            onClick: () => onTabChange("properties"),
        },
        {
            label: "Total Listing Views",
            value: stats.views.toLocaleString(),
            sub: "Tenant reach across Nigeria",
            icon: Eye,
            bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
            iconColor: "text-emerald-500 dark:text-emerald-400",
            badge: "Market Reach",
            badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        },
        {
            label: "Inquiries & Tours",
            value: (stats.tours || 0) + (stats.applications || 0),
            sub: `${stats.tours || 0} tours · ${stats.applications || 0} applications`,
            icon: Calendar,
            bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
            iconColor: "text-purple-500 dark:text-purple-400",
            badge: (stats.tours || 0) + (stats.applications || 0) > 0 ? "Active Leads" : "No Leads",
            badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
            onClick: () => onTabChange((stats.applications || 0) > 0 ? "applications" : "tours"),
        },
        {
            label: "AfriExchange Escrow",
            value: dbUser?.settlementLinkedAt ? "Connected" : "Action Needed",
            sub: dbUser?.settlementLinkedAt ? "Instant 98% payout ready" : "Link settlement wallet",
            icon: Wallet,
            bgColor: dbUser?.settlementLinkedAt ? "bg-emerald-500/10 dark:bg-emerald-500/20" : "bg-amber-500/10 dark:bg-amber-500/20",
            iconColor: dbUser?.settlementLinkedAt ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400",
            badge: dbUser?.settlementLinkedAt ? "Instant Payout" : "Setup",
            badgeColor: dbUser?.settlementLinkedAt
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
            onClick: () => onTabChange("payouts"),
        },
    ];

    const quickActions = [
        {
            title: "Add New Property",
            desc: "List apartment or house in 2 mins",
            href: "/properties/new",
            icon: Plus,
            badge: "0% Broker Fee",
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        },
        {
            title: "AfriExchange Settlement",
            desc: dbUser?.settlementLinkedAt ? "Manage settlement wallet" : "Link wallet for rent escrow",
            onClick: () => onTabChange("payouts"),
            icon: Wallet,
            badge: dbUser?.settlementLinkedAt ? "Active" : "Action Needed",
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10 dark:bg-amber-500/20",
        },
        {
            title: "Rental Applications",
            desc: "Screen prospective renters & lock leases",
            onClick: () => onTabChange("applications"),
            icon: FileText,
            badge: stats.applications > 0 ? `${stats.applications} pending` : "Screening",
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500/10 dark:bg-blue-500/20",
        },
        {
            title: "Physical Tours",
            desc: "Manage walkthrough visits & calls",
            onClick: () => onTabChange("tours"),
            icon: Calendar,
            badge: stats.tours > 0 ? `${stats.tours} tours` : "Schedule",
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-500/10 dark:bg-purple-500/20",
        },
    ];

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Hero / Overview Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[var(--bg-muted)] border border-[var(--border-color)] p-5 sm:p-7 shadow-xs">
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            {dbUser?.verified ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Landlord
                                </Badge>
                            ) : (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5" /> Verification In Progress
                                </Badge>
                            )}

                            {dbUser?.settlementLinkedAt ? (
                                <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                                    <Wallet className="h-3.5 w-3.5" /> AfriExchange Payouts Active
                                </Badge>
                            ) : (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Settlement Link Required
                                </Badge>
                            )}

                            <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5" /> 100% Escrow Protected
                            </Badge>
                        </div>

                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                                Landlord Command Center
                            </h2>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium max-w-2xl mt-1 leading-relaxed">
                                Monitor listing reach, review prospective tenant offers, and receive direct 98% net rent disbursements securely into your account upon physical key inspection.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                        <Link href="/properties/new" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold h-11 px-5 rounded-xl shadow-xs gap-2">
                                <Plus className="h-4 w-4" />
                                List New Property
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => onTabChange("payouts")}
                            className="w-full sm:w-auto border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-bold h-11 px-4 rounded-xl gap-2"
                        >
                            <Wallet className="h-4 w-4 text-emerald-500" />
                            Settlement Wallet
                        </Button>
                    </div>
                </div>
            </div>

            {/* Performance Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        onClick={stat.onClick}
                        className={cn(
                            "relative overflow-hidden bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] transition-all",
                            stat.onClick ? "cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-green)]/50 group" : ""
                        )}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                            </div>
                            {stat.badge && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${stat.badgeColor}`}>
                                    {stat.badge}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-1">
                            {loading ? "..." : stat.value}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">{stat.label}</p>
                        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Quick Action Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {quickActions.map((action) => {
                    const Content = (
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40 transition-all h-full group">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`p-2.5 rounded-xl ${action.bg} ${action.color} shrink-0`}>
                                    <action.icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{action.title}</h4>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-secondary)] truncate font-medium mt-0.5">{action.desc}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--color-brand-green)] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </div>
                    );

                    if (action.href) {
                        return (
                            <Link key={action.title} href={action.href} className="block">
                                {Content}
                            </Link>
                        );
                    }

                    return (
                        <div key={action.title} onClick={action.onClick} className="cursor-pointer">
                            {Content}
                        </div>
                    );
                })}
            </div>

            {/* Main Content Split: Left (Spotlight + Activity) & Right (Escrow + Trust + Protocol) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2 Cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Properties Spotlight */}
                    <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-xs">
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-500 dark:text-blue-400">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">My Listings</h3>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">Your properties on RentHub</p>
                                </div>
                                <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                                    {userProperties.length}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onTabChange("properties")}
                                className="text-xs sm:text-sm font-bold text-[var(--color-brand-green)] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                View all ({userProperties.length})
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {userProperties.length === 0 ? (
                            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-muted)]/30">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                                    <Home className="h-6 w-6" />
                                </div>
                                <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-1">No properties listed yet</h4>
                                <p className="text-xs text-[var(--text-secondary)] font-medium max-w-sm mx-auto mb-4">
                                    List your apartment, flat, or commercial space with 0% broker fee and automated escrow disbursements.
                                </p>
                                <Link href="/properties/new">
                                    <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs h-9 px-4 rounded-xl gap-2">
                                        <Plus className="h-4 w-4" />
                                        List Your First Property
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {userProperties.slice(0, 3).map((property) => (
                                    <div
                                        key={property.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-muted)]/40 hover:bg-[var(--bg-muted)]/70 border border-[var(--border-color)] transition-all gap-3.5 group"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="relative h-16 w-16 sm:h-18 sm:w-18 rounded-xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 border border-[var(--border-color)]">
                                                <Image
                                                    src={property.images?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-e32c53048057?auto=format&fit=crop&w=400&q=80"}
                                                    alt={property.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <Badge
                                                        className={cn(
                                                            "text-[10px] font-bold px-2 py-0.2 rounded-md border-none",
                                                            property.status === "AVAILABLE"
                                                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                                : property.status === "RENTED"
                                                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                                        )}
                                                    >
                                                        {property.status}
                                                    </Badge>
                                                    <span className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                                                        <Eye className="h-3 w-3 text-emerald-500" />
                                                        {property.viewCount || 0} views
                                                    </span>
                                                </div>
                                                <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{property.title}</h4>
                                                <p className="text-[11px] text-[var(--text-secondary)] truncate flex items-center gap-1 font-medium mt-0.5">
                                                    <MapPin className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                                                    {property.address}, {property.city}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border-color)]">
                                            <div className="text-left sm:text-right">
                                                <p className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">{formatPrice(property.pricePerYear)}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-medium">per year</p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Link href={`/properties/${property.id}/edit`}>
                                                    <Button size="sm" variant="outline" className="h-8 px-2.5 rounded-lg border-[var(--border-color)] text-xs font-bold hover:bg-[var(--bg-card)]">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/properties/${property.id}`}>
                                                    <Button size="sm" variant="outline" className="h-8 px-2.5 rounded-lg border-[var(--border-color)] text-xs font-bold hover:bg-[var(--bg-card)]">
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Activity Section */}
                    <ActivitySection activities={activities} loading={loading} />
                </div>

                {/* Right Column (1 Col Sidebar) */}
                <div className="space-y-6">
                    {/* AfriExchange Settlement Card */}
                    <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl text-amber-500">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">Escrow Settlement</h3>
                                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">AfriExchange Automated</p>
                                </div>
                            </div>
                            {dbUser?.settlementLinkedAt ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                                    Connected
                                </Badge>
                            ) : (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                                    Action Needed
                                </Badge>
                            )}
                        </div>

                        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                            RentHub Escrow holds 100% of tenant rent securely. Upon validating the tenant's 6-digit Key Handover OTP, your 98% net rent is disbursed automatically in seconds.
                        </p>

                        <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)] space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[var(--text-secondary)] font-medium">Settlement Status</span>
                                <span className="font-bold text-[var(--text-primary)]">
                                    {dbUser?.settlementLinkedAt ? "AfriExchange Linked" : "Unlinked Wallet"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[var(--text-secondary)] font-medium">Platform Escrow Fee</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">2.0%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[var(--text-secondary)] font-medium">Disbursement Speed</span>
                                <span className="font-bold text-[var(--text-primary)]">Instant (&lt;60s)</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => onTabChange("payouts")}
                            className="w-full bg-[var(--bg-muted)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs h-10 rounded-xl border border-[var(--border-color)]"
                        >
                            {dbUser?.settlementLinkedAt ? "Manage Settlement Account" : "Link AfriExchange Account"}
                        </Button>
                    </div>

                    {/* Landlord Trust Score Card */}
                    <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl text-emerald-500">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">Trust Score</h3>
                                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">Landlord credibility</p>
                                </div>
                            </div>
                            <span className="text-base font-extrabold text-[var(--color-brand-green)]">{trustScore}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[var(--bg-muted)] h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-[var(--color-brand-green)] h-full rounded-full transition-all duration-500"
                                style={{ width: `${trustScore}%` }}
                            />
                        </div>

                        <div className="space-y-2 pt-1 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                    {dbUser?.verified ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                    ID & Identity Verification
                                </span>
                                <span className="font-bold text-[var(--text-primary)]">
                                    {dbUser?.verified ? "Verified" : "Pending"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                    {dbUser?.phone ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                    Direct Phone Verified
                                </span>
                                <span className="font-bold text-[var(--text-primary)]">
                                    {dbUser?.phone ? "Active" : "Add Phone"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    RentHub Escrow Guaranteed
                                </span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">100%</span>
                            </div>
                        </div>

                        {trustScore < 100 && (
                            <Link href="/dashboard/profile" className="block">
                                <Button variant="outline" className="w-full text-xs font-bold h-9 rounded-xl border-[var(--border-color)]">
                                    Improve Trust Score
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Safe Handover Security Reminder */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                <Key className="h-4 w-4" />
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                                Safe Handover Protocol
                            </h4>
                        </div>
                        <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed font-medium">
                            Never hand over physical keys without entering the tenant's 6-digit Key Handover OTP in person. The OTP unlocks your 98% escrow payout instantly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TenantOverviewTab({
    stats,
    activities,
    loading,
    onTabChange,
    favorites = [],
    dbUser,
}: {
    stats: any;
    activities: Activity[];
    loading: boolean;
    onTabChange: (tab: string) => void;
    favorites?: Property[];
    dbUser: any;
}) {
    const trustScore = calculateTrustScore(dbUser);
    const userFavorites = favorites || [];

    const statCards = [
        {
            label: "Saved Homes",
            value: stats.favorites,
            sub: "Wishlist properties",
            icon: Home,
            bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
            iconColor: "text-blue-500 dark:text-blue-400",
            badge: "Wishlist",
            badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
            onClick: () => onTabChange("favorites"),
        },
        {
            label: "Physical Tours",
            value: stats.tours || 0,
            sub: "Scheduled walkthroughs",
            icon: Calendar,
            bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
            iconColor: "text-purple-500 dark:text-purple-400",
            badge: stats.tours > 0 ? "Upcoming" : "Schedule",
            badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
            onClick: () => onTabChange("tours"),
        },
        {
            label: "Rental Applications",
            value: stats.applications || 0,
            sub: "Offers & escrow locks",
            icon: FileText,
            bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
            iconColor: "text-emerald-500 dark:text-emerald-400",
            badge: stats.applications > 0 ? "Active" : "Apply",
            badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
            onClick: () => onTabChange("applications"),
        },
        {
            label: "Messages",
            value: stats.messages,
            sub: "Direct landlord chats",
            icon: MessageSquare,
            bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
            iconColor: "text-orange-500 dark:text-orange-400",
            badge: stats.messages > 0 ? "Unread" : "All read",
            badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
            onClick: () => onTabChange("messages"),
        },
    ];

    const quickActions = [
        {
            title: "Browse Verified Homes",
            desc: "Explore homes directly from owners",
            href: "/search",
            icon: Search,
            badge: "0% Broker Fee",
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        },
        {
            title: "My Applications & Escrow",
            desc: "Track approvals & Key Handover OTP",
            onClick: () => onTabChange("applications"),
            icon: FileText,
            badge: "Escrow Locked",
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500/10 dark:bg-blue-500/20",
        },
        {
            title: "Physical Tours",
            desc: "Manage visits & call landlords",
            onClick: () => onTabChange("tours"),
            icon: Calendar,
            badge: "Walkthrough",
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-500/10 dark:bg-purple-500/20",
        },
        {
            title: "Trust & Safety Hub",
            desc: "How RentHub protects your rent money",
            href: "/resources",
            icon: ShieldCheck,
            badge: "Protection",
            color: "text-orange-600 dark:text-orange-400",
            bg: "bg-orange-500/10 dark:bg-orange-500/20",
        },
    ];

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Hero / Overview Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[var(--bg-muted)] border border-[var(--border-color)] p-5 sm:p-7 shadow-xs">
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5" /> Zero Broker Scams
                            </Badge>
                            <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5" /> 100% Escrow Protection
                            </Badge>
                            <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5" /> Direct Landlord Access
                            </Badge>
                        </div>

                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                                Find & Secure Your Next Home
                            </h2>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium max-w-2xl mt-1 leading-relaxed">
                                Explore verified homes across Nigeria, schedule physical tours, and lock leases with zero agent extortion. Your money stays protected in escrow until you inspect the keys.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                        <Link href="/search" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold h-11 px-5 rounded-xl shadow-xs gap-2">
                                <Search className="h-4 w-4" />
                                Browse Verified Homes
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => onTabChange("applications")}
                            className="w-full sm:w-auto border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-bold h-11 px-4 rounded-xl gap-2"
                        >
                            <FileText className="h-4 w-4 text-[var(--color-brand-blue)]" />
                            My Applications
                        </Button>
                    </div>
                </div>
            </div>

            {/* Performance Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        onClick={stat.onClick}
                        className="relative overflow-hidden bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] transition-all cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-green)]/50 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                            </div>
                            {stat.badge && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${stat.badgeColor}`}>
                                    {stat.badge}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-1">
                            {loading ? "..." : stat.value}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">{stat.label}</p>
                        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {quickActions.map((action) => {
                    const Content = (
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[var(--color-brand-green)]/40 transition-all h-full group">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`p-2.5 rounded-xl ${action.bg} ${action.color} shrink-0`}>
                                    <action.icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{action.title}</h4>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-secondary)] truncate font-medium mt-0.5">{action.desc}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--color-brand-green)] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </div>
                    );

                    if (action.href) {
                        return (
                            <Link key={action.title} href={action.href} className="block">
                                {Content}
                            </Link>
                        );
                    }

                    return (
                        <div key={action.title} onClick={action.onClick} className="cursor-pointer">
                            {Content}
                        </div>
                    );
                })}
            </div>

            {/* Main Content Split: Left (Saved Homes + Activity) & Right (Escrow Protection + Trust Profile) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2 Cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Saved Homes Spotlight */}
                    <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-xs">
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-500 dark:text-blue-400">
                                    <Home className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Saved Properties</h3>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">Homes you bookmarked while browsing</p>
                                </div>
                                <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                                    {userFavorites.length}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onTabChange("favorites")}
                                className="text-xs sm:text-sm font-bold text-[var(--color-brand-green)] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                View all ({userFavorites.length})
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {userFavorites.length === 0 ? (
                            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-muted)]/30">
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3">
                                    <Home className="h-6 w-6" />
                                </div>
                                <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-1">No saved homes yet</h4>
                                <p className="text-xs text-[var(--text-secondary)] font-medium max-w-sm mx-auto mb-4">
                                    Save verified properties while browsing to quickly compare features, prices, and schedule physical walkthroughs.
                                </p>
                                <Link href="/search">
                                    <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs h-9 px-4 rounded-xl gap-2">
                                        <Search className="h-4 w-4" />
                                        Explore Marketplace
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {userFavorites.slice(0, 3).map((property) => (
                                    <div
                                        key={property.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-muted)]/40 hover:bg-[var(--bg-muted)]/70 border border-[var(--border-color)] transition-all gap-3.5 group"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="relative h-16 w-16 sm:h-18 sm:w-18 rounded-xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 border border-[var(--border-color)]">
                                                <Image
                                                    src={property.images?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-e32c53048057?auto=format&fit=crop&w=400&q=80"}
                                                    alt={property.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.2 rounded-md border-none">
                                                        {property.propertyType?.replace(/_/g, " ") || "Residential"}
                                                    </Badge>
                                                    <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                                                        {property.bedrooms} beds · {property.bathrooms} baths
                                                    </span>
                                                </div>
                                                <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{property.title}</h4>
                                                <p className="text-[11px] text-[var(--text-secondary)] truncate flex items-center gap-1 font-medium mt-0.5">
                                                    <MapPin className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                                                    {property.address}, {property.city}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border-color)]">
                                            <div className="text-left sm:text-right">
                                                <p className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">{formatPrice(property.pricePerYear)}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-medium">per year</p>
                                            </div>
                                            <Link href={`/properties/${property.id}`}>
                                                <Button size="sm" className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold h-8 px-3 rounded-lg text-xs gap-1.5">
                                                    View Details
                                                    <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Activity Section */}
                    <ActivitySection activities={activities} loading={loading} />
                </div>

                {/* Right Column (1 Col Sidebar) */}
                <div className="space-y-6">
                    {/* RentHub 100% Escrow Protection Card */}
                    <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl text-emerald-500">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">Escrow Guarantee</h3>
                                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">Zero Broker Extortion</p>
                                </div>
                            </div>
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                                100% Protected
                            </Badge>
                        </div>

                        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                            How RentHub safeguards your rent payment against scammers:
                        </p>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)]">
                                <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">1</span>
                                <div>
                                    <p className="font-bold text-[var(--text-primary)]">Lock Rental in Escrow</p>
                                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">Your rent is held safely in escrow, not sent to the landlord upfront.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)]">
                                <span className="h-5 w-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">2</span>
                                <div>
                                    <p className="font-bold text-[var(--text-primary)]">Physical Inspection & Keys</p>
                                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">Inspect condition and receive keys physically from the landlord.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)]">
                                <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">3</span>
                                <div>
                                    <p className="font-bold text-[var(--text-primary)]">Share 6-Digit OTP</p>
                                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">Disclose your OTP code only when completely satisfied.</p>
                                </div>
                            </div>
                        </div>

                        <Link href="/resources" className="block">
                            <Button variant="outline" className="w-full text-xs font-bold h-9 rounded-xl border-[var(--border-color)]">
                                Learn More in Safety Hub
                            </Button>
                        </Link>
                    </div>

                    {/* Tenant Profile Readiness Card */}
                    <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-500">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">Renter Profile</h3>
                                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">Verification checklist</p>
                                </div>
                            </div>
                            <span className="text-base font-extrabold text-[var(--color-brand-blue)]">{trustScore}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[var(--bg-muted)] h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-[var(--color-brand-blue)] h-full rounded-full transition-all duration-500"
                                style={{ width: `${trustScore}%` }}
                            />
                        </div>

                        <div className="space-y-2 pt-1 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    Email Account Verified
                                </span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">Complete</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                    {dbUser?.phone ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                    Direct Phone Number
                                </span>
                                <span className="font-bold text-[var(--text-primary)]">
                                    {dbUser?.phone ? "Added" : "Action Needed"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                    {dbUser?.verified ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                    Government ID Verified
                                </span>
                                <span className="font-bold text-[var(--text-primary)]">
                                    {dbUser?.verified ? "Verified" : "Optional"}
                                </span>
                            </div>
                        </div>

                        <Link href="/dashboard/profile" className="block">
                            <Button variant="outline" className="w-full text-xs font-bold h-9 rounded-xl border-[var(--border-color)]">
                                Update Renter Profile
                            </Button>
                        </Link>
                    </div>

                    {/* Direct Contact Tip */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                <Phone className="h-4 w-4" />
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-200">
                                Direct Landlord Contact
                            </h4>
                        </div>
                        <p className="text-[11px] sm:text-xs text-blue-900 dark:text-blue-300/90 leading-relaxed font-medium">
                            Once your physical tour is scheduled, you can call or message the verified landlord directly in RentHub without third-party interference.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FavoritesTab({ favorites, loading }: { favorites: Property[]; loading: boolean }) {
    if (loading) {
        return (
            <div className="space-y-6">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Saved Properties</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map((i) => (<div key={i} className="bg-[var(--bg-card)] rounded-2xl h-80 animate-pulse border border-[var(--border-color)]" />))}
                </div>
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="space-y-6">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Saved Properties</h3>
                <div className="bg-[var(--bg-card)] p-8 sm:p-12 rounded-2xl border border-[var(--border-color)] text-center">
                    <div className="max-w-md mx-auto">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center mx-auto mb-4">
                            <Home className="h-8 w-8 sm:h-10 sm:w-10 text-[var(--text-muted)] opacity-60" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-2">No saved homes yet</h3>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 font-medium">Properties you favorite while browsing will appear here for easy access</p>
                        <Link href="/search">
                            <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold rounded-xl px-6">Start Browsing</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Saved Properties ({favorites.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {favorites.map((property) => (
                    <PropertyCard
                        key={property.id}
                        property={{
                            id: property.id,
                            title: property.title,
                            address: property.address,
                            price: property.pricePerYear,
                            bedrooms: property.bedrooms,
                            bathrooms: property.bathrooms,
                            image: property.images?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-e32c53048057?auto=format&fit=crop&w=800&q=80",
                            verified: property.status === "VERIFIED",
                            type: property.propertyType.replace(/_/g, " "),
                            status: property.status,
                            isFavorited: true
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function ActivitySection({ activities, loading }: { activities: Activity[]; loading: boolean }) {
    return (
        <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-3xl border border-[var(--border-color)] shadow-xs">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl text-purple-500 dark:text-purple-400">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Recent Activity</h3>
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Real-time updates on your rental journey</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3.5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3.5 p-3 rounded-xl bg-[var(--bg-muted)]/30 animate-pulse">
                            <div className="h-10 w-10 bg-[var(--bg-muted)] rounded-xl shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3.5 bg-[var(--bg-muted)] rounded w-1/3" />
                                <div className="h-2.5 bg-[var(--bg-muted)] rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : activities.length === 0 ? (
                <div className="text-center py-8 sm:py-10 text-[var(--text-secondary)] rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-muted)]/20">
                    <Calendar className="h-10 w-10 mx-auto mb-2.5 text-[var(--text-muted)] opacity-50" />
                    <p className="font-bold text-sm text-[var(--text-primary)]">No recent activity</p>
                    <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">Your property updates, tour events, and views will reflect here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((activity) => {
                        let Icon = Calendar;
                        let iconBg = "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400";
                        if (activity.type === "PROPERTY_LISTED") {
                            Icon = Home;
                            iconBg = "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400";
                        } else if (activity.type === "PROPERTY_VIEWED") {
                            Icon = Eye;
                            iconBg = "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400";
                        } else if (activity.type === "PROPERTY_UPDATED") {
                            Icon = TrendingUp;
                            iconBg = "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400";
                        }

                        return (
                            <div
                                key={activity.id}
                                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-muted)]/30 hover:bg-[var(--bg-muted)]/60 border border-[var(--border-color)]/60 transition-all group"
                            >
                                <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{activity.title}</p>
                                    <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate font-medium mt-0.5">{activity.description}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium">
                                        {new Date(activity.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ToursTab({ role }: { role: "LANDLORD" | "TENANT" }) {
    const { user } = useUser();
    const router = useRouter();
    const [tours, setTours] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchTours();
    }, [user, role]);

    const fetchTours = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/tours?clerkId=${user?.id}&role=${role}`);
            setTours(res.data.data);
        } catch (error) {
            console.error("Failed to fetch tours:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (tourId: string, status: string) => {
        try {
            await api.patch(`/tours/${tourId}/status`, { status });
            fetchTours();
        } catch (error) {
            console.error("Failed to update tour status:", error);
            alert("Failed to update status");
        }
    };

    const handleMessageClick = async (recipientId: string, propertyId: string) => {
        try {
            const res = await api.post(`/messages/initiate?clerkId=${user?.id}`, {
                receiverId: recipientId,
                propertyId: propertyId
            });
            const convId = res.data.data.id;
            router.push(`/dashboard?tab=messages&convId=${convId}`);
        } catch (error) {
            console.error("Failed to initiate conversation:", error);
            alert("Failed to open conversation");
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-[var(--bg-muted)] animate-pulse rounded-2xl border border-[var(--border-color)]" />
                ))}
            </div>
        );
    }

    if (tours.length === 0) {
        return (
            <div className="text-center py-12 sm:py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)] p-6">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-[var(--text-muted)] opacity-60 mb-4" />
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1">
                    {role === "LANDLORD" ? "No tour requests yet" : "No tours scheduled"}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto">
                    {role === "LANDLORD"
                        ? "When tenants request to see your properties, they will appear here."
                        : "Browse properties and request a physical tour to see them in person."}
                </p>
                {role === "TENANT" && (
                    <Link href="/search">
                        <Button className="mt-6 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold rounded-xl px-6">Browse Properties</Button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                {role === "LANDLORD" ? "Tour Requests Received" : "My Scheduled Tours"} ({tours.length})
            </h3>
            <div className="grid gap-4">
                {tours.map((tour) => {
                    const displayUser = role === "LANDLORD" ? tour.tenant : tour.landlord;
                    const userLabel = role === "LANDLORD" ? "Requested By" : "Property Owner";

                    return (
                        <div key={tour.id} className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all">
                            <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                                {/* Property Info */}
                                <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-[var(--bg-muted)] flex-shrink-0 relative overflow-hidden">
                                        <img
                                            src={tour.property?.images?.[0]?.url || "https://images.unsplash.com/photo-1600585154340-be6191da96a0?auto=format&fit=crop&w=400&q=80"}
                                            className="object-cover w-full h-full"
                                            alt={tour.property?.title}
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">{tour.property?.title}</h4>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1 mt-1 truncate">
                                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--color-brand-orange)]" /> {tour.property?.city}, {tour.property?.state}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className={cn(
                                                "font-bold border-none text-xs px-2.5 py-0.5",
                                                tour.status === "CONFIRMED" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                                                    tour.status === "PENDING" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                                                        tour.status === "CANCELLED" ? "bg-red-500/15 text-red-600 dark:text-red-400" :
                                                            "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                                            )}>
                                                {tour.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Participants & Schedule */}
                                <div className="flex flex-wrap sm:flex-nowrap gap-4 sm:gap-6 flex-shrink-0 md:border-l md:pl-6 border-[var(--border-color)]">
                                    <div className="min-w-[120px]">
                                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1.5">{userLabel}</p>
                                        <div className="flex items-center gap-2">
                                            {displayUser?.avatar ? (
                                                <img src={displayUser.avatar} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[var(--color-brand-green)]/15 flex items-center justify-center text-xs font-bold text-[var(--color-brand-green)]">
                                                    {displayUser?.firstName?.[0]}{displayUser?.lastName?.[0]}
                                                </div>
                                            )}
                                            <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">{displayUser?.firstName} {displayUser?.lastName}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1.5">Schedule</p>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-primary)] font-bold">
                                                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                                {new Date(tour.preferredDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-primary)] font-bold">
                                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                {tour.preferredTime}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-row md:flex-col justify-center gap-2 min-w-[140px] pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-color)]">
                                    {role === "LANDLORD" && tour.status === "PENDING" && (
                                        <>
                                            <Button
                                                size="sm"
                                                className="flex-1 md:flex-initial bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold rounded-xl"
                                                onClick={() => handleStatusUpdate(tour.id, "CONFIRMED")}
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                                Confirm
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 md:flex-initial text-red-500 dark:text-red-400 hover:bg-red-500/10 border-red-500/30 font-bold rounded-xl"
                                                onClick={() => handleStatusUpdate(tour.id, "CANCELLED")}
                                            >
                                                <XCircle className="h-4 w-4 mr-1.5" />
                                                Decline
                                            </Button>
                                        </>
                                    )}
                                    {role === "TENANT" && tour.status === "PENDING" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-red-500 dark:text-red-400 hover:bg-red-500/10 border-red-500/30 font-bold rounded-xl"
                                            onClick={() => handleStatusUpdate(tour.id, "CANCELLED")}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1.5" />
                                            Cancel Request
                                        </Button>
                                    )}
                                    {tour.status === "CONFIRMED" && (
                                        <div className="flex flex-col gap-2 w-full">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full font-bold gap-1.5 rounded-xl border-[var(--border-color)] text-[var(--color-brand-orange)] hover:bg-[var(--bg-muted)]"
                                                onClick={() => handleMessageClick(displayUser?.id, tour.propertyId)}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                Message {role === "LANDLORD" ? "Tenant" : "Owner"}
                                            </Button>

                                            {displayUser?.phone && (
                                                <a
                                                    href={`tel:${displayUser.phone}`}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                >
                                                    <Phone className="h-3.5 w-3.5" />
                                                    Call {displayUser.phone}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {tour.message && (
                                <div className="mt-4 p-3.5 bg-[var(--bg-muted)] rounded-xl text-xs sm:text-sm text-[var(--text-secondary)] border border-[var(--border-color)] font-medium">
                                    <span className="font-bold text-[var(--text-primary)] mr-2 text-xs uppercase tracking-tight">Tenant Message:</span>
                                    {tour.message}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PropertiesTab({ properties, loading, onRefresh }: { properties: Property[]; loading: boolean; onRefresh: () => void }) {
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [isMonetizationOpen, setIsMonetizationOpen] = useState(false);

    const handleBoostClick = (id: string) => {
        setSelectedPropertyId(id);
        setIsMonetizationOpen(true);
    };

    const handleMonetizationSuccess = () => {
        onRefresh();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this property?")) return;
        try {
            await api.delete(`/properties/${id}`);
            onRefresh();
        } catch (error) {
            console.error("Failed to delete property:", error);
            alert("Failed to delete property");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Your Properties ({properties.length})</h3>
                <Link href="/properties/new" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold gap-2 rounded-xl">
                        <Plus className="h-4 w-4" />
                        Add Property
                    </Button>
                </Link>
            </div>
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map((i) => (<div key={i} className="bg-[var(--bg-card)] rounded-2xl h-80 animate-pulse border border-[var(--border-color)]" />))}
                </div>
            ) : properties.length === 0 ? (
                <div className="bg-[var(--bg-card)] p-8 sm:p-12 rounded-2xl border border-[var(--border-color)] text-center">
                    <div className="max-w-md mx-auto">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center mx-auto mb-4">
                            <Home className="h-8 w-8 sm:h-10 sm:w-10 text-[var(--text-muted)] opacity-60" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-2">No properties yet</h3>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 font-medium">Start listing your properties to reach thousands of potential tenants</p>
                        <Link href="/properties/new">
                            <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold gap-2 rounded-xl">
                                <Plus className="h-4 w-4" />
                                List Your First Property
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {properties.map((property) => (
                        <div key={property.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden hover:shadow-[var(--shadow-md)] transition-all flex flex-col">
                            <div className="relative aspect-[16/9] bg-[var(--bg-muted)]">
                                {property.images?.[0]?.url ? (
                                    <Image src={property.images[0].url} alt={property.title} fill className="object-cover" />
                                ) : (
                                    <div className="bg-[var(--bg-muted)] w-full h-full flex items-center justify-center">
                                        <Home className="h-10 w-10 text-[var(--text-muted)] opacity-40" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                    {property.featured && (
                                        <div className="flex flex-col gap-0.5">
                                            <Badge className="bg-[var(--color-brand-orange)] text-white border-none shadow-md font-bold text-[10px]">
                                                Featured
                                            </Badge>
                                            {property.featuredExpiresAt && (
                                                <span className="text-[8px] bg-black/70 text-white px-1.5 py-0.5 rounded backdrop-blur-sm font-bold">
                                                    Exp: {new Date(property.featuredExpiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {property.verified && (
                                        <Badge className="bg-[var(--color-brand-green)] text-white border-none shadow-md font-bold text-[10px]">
                                            Verified
                                        </Badge>
                                    )}
                                </div>
                                <div className="absolute top-3 right-3 font-bold">
                                    <Badge className={`${property.status === "AVAILABLE" ? "bg-[var(--color-brand-green)] text-white" : property.status === "RENTED" ? "bg-blue-600 text-white" : "bg-gray-600 text-white"} border-none shadow-sm text-xs`}>
                                        {property.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between font-bold">
                                <div>
                                    <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)] mb-1 truncate">{property.title}</h3>
                                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-3 flex items-center gap-1 font-medium truncate"><MapPin className="h-3.5 w-3.5 shrink-0" /> {property.city}</p>
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-lg sm:text-xl font-bold text-[var(--color-brand-green)]">{formatPrice(property.pricePerYear)}/yr</p>
                                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-secondary)] font-semibold"><Eye className="h-4 w-4" /> {property.viewCount || 0}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-[var(--border-color)]">
                                    <Link href={`/properties/${property.id}/edit`} className="flex-1">
                                        <Button variant="outline" className="w-full gap-1.5 text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border-[var(--border-color)] font-bold text-xs" size="sm">
                                            <Edit className="h-3.5 w-3.5" /> Edit
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleBoostClick(property.id)}
                                        className="text-purple-500 dark:text-purple-400 hover:bg-purple-500/10 border-purple-500/30 font-bold text-xs"
                                        title="Boost Property"
                                    >
                                        <Rocket className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(property.id)} className="text-red-500 dark:text-red-400 hover:bg-red-500/10 border-red-500/30 font-bold text-xs">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedPropertyId && (
                <MonetizationModal
                    propertyId={selectedPropertyId}
                    isOpen={isMonetizationOpen}
                    isVerified={properties.find(p => p.id === selectedPropertyId)?.verified}
                    isFeatured={properties.find(p => p.id === selectedPropertyId)?.featured}
                    onClose={() => setIsMonetizationOpen(false)}
                    onSuccess={handleMonetizationSuccess}
                />
            )}
        </div>
    );
}

function MessagesTab() {
    return (
        <div className="space-y-6">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Messages & Inquiries</h3>
            <div className="bg-[var(--bg-card)] p-8 sm:p-12 rounded-2xl border border-[var(--border-color)] text-center">
                <div className="max-w-md mx-auto">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-[var(--text-muted)] opacity-60" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-2">No messages yet</h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">When you have inquiries, they will appear here</p>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-brand-blue)] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-[var(--text-secondary)] font-semibold">Loading dashboard...</p>
                </div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
