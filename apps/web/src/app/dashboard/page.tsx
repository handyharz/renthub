"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
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
    ChevronLeft,
    RefreshCw,
    Mail,
    Grid,
    List,
    Copy,
    Bed,
    Bath,
    SlidersHorizontal,
    Share2,
    X,
    Filter,
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
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Search, filter & pagination state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "CONFIRMED" | "CANCELLED">("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        if (user) fetchTours();
    }, [user, role]);

    const fetchTours = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);

            const res = await api.get(`/tours?clerkId=${user?.id}&role=${role}`);
            setTours(res.data.data || []);
            if (isManualRefresh) {
                toast.success("Tour bookings updated");
            }
        } catch (error) {
            console.error("Failed to fetch tours:", error);
            toast.error("Failed to load tour bookings");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleStatusUpdate = async (tourId: string, status: string) => {
        try {
            setActionLoading(tourId);
            await api.patch(`/tours/${tourId}/status`, { status });
            toast.success(
                status === "CONFIRMED"
                    ? "Tour Confirmed! The attendee has been notified."
                    : "Tour Request Cancelled"
            );
            fetchTours();
        } catch (error) {
            console.error("Failed to update tour status:", error);
            toast.error("Failed to update tour status");
        } finally {
            setActionLoading(null);
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
            toast.error("Failed to open conversation");
        }
    };

    // Metric Calculations
    const stats = useMemo(() => {
        const total = tours.length;
        const confirmed = tours.filter((t) => t.status === "CONFIRMED").length;
        const pending = tours.filter((t) => t.status === "PENDING").length;
        const cancelled = tours.filter((t) => t.status === "CANCELLED").length;
        return { total, confirmed, pending, cancelled };
    }, [tours]);

    // Search and filter
    const filteredTours = useMemo(() => {
        return tours.filter((tour) => {
            const matchesStatus = statusFilter === "ALL" || tour.status === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            if (!q) return matchesStatus;

            const title = (tour.property?.title || "").toLowerCase();
            const city = (tour.property?.city || "").toLowerCase();
            const address = (tour.property?.address || "").toLowerCase();
            const displayUser = role === "LANDLORD" ? tour.tenant : tour.landlord;
            const userName = `${displayUser?.firstName || ""} ${displayUser?.lastName || ""}`.toLowerCase();
            const phone = (displayUser?.phone || "").toLowerCase();

            const matchesSearch =
                title.includes(q) ||
                city.includes(q) ||
                address.includes(q) ||
                userName.includes(q) ||
                phone.includes(q);

            return matchesStatus && matchesSearch;
        });
    }, [tours, statusFilter, searchQuery, role]);

    // Pagination
    const totalPages = Math.ceil(filteredTours.length / ITEMS_PER_PAGE) || 1;
    const paginatedTours = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTours.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredTours, currentPage]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-blue)]/10 flex items-center justify-center animate-pulse">
                        <Calendar className="h-6 w-6 text-[var(--color-brand-blue)]" />
                    </div>
                    <Clock className="h-5 w-5 animate-spin text-[var(--color-brand-blue)] absolute -bottom-1 -right-1" />
                </div>
                <p className="font-bold text-sm text-[var(--text-primary)] mt-4">Loading physical tours...</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Retrieving scheduled walkthroughs, attendees, and property inspection requests</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Title & Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                            {role === "LANDLORD" ? "Physical Tour Requests" : "My Scheduled Physical Tours"}
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1">
                        {role === "LANDLORD"
                            ? "Review, schedule, and confirm on-site property walkthroughs with prospective renters"
                            : "Manage in-person property viewings, coordinate with landlords, and prepare for inspection"}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTours(true)}
                        disabled={refreshing}
                        className="h-9 px-3.5 rounded-xl border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5 shadow-xs"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[var(--color-brand-blue)]" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Metric Overview Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div
                    onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "ALL"
                            ? "border-[var(--color-brand-blue)] ring-2 ring-[var(--color-brand-blue)]/15"
                            : "border-[var(--border-color)] hover:border-[var(--color-brand-blue)]/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            Total Tours
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                            <Calendar className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[var(--text-primary)]">{stats.total}</span>
                        <span className="text-[11px] font-semibold text-[var(--text-muted)]">bookings</span>
                    </div>
                </div>

                <div
                    onClick={() => { setStatusFilter("CONFIRMED"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "CONFIRMED"
                            ? "border-emerald-500 ring-2 ring-emerald-500/15"
                            : "border-[var(--border-color)] hover:border-emerald-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Confirmed & Upcoming
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.confirmed}</span>
                        <span className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80">ready</span>
                    </div>
                </div>

                <div
                    onClick={() => { setStatusFilter("PENDING"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "PENDING"
                            ? "border-amber-500 ring-2 ring-amber-500/15"
                            : "border-[var(--border-color)] hover:border-amber-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Pending Approval
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</span>
                        <span className="text-[11px] font-semibold text-amber-600/80 dark:text-amber-400/80">awaiting</span>
                    </div>
                </div>

                <div
                    onClick={() => { setStatusFilter("CANCELLED"); setCurrentPage(1); }}
                    className={`p-4 rounded-2xl bg-[var(--bg-card)] border transition-all cursor-pointer shadow-xs ${
                        statusFilter === "CANCELLED"
                            ? "border-red-500 ring-2 ring-red-500/15"
                            : "border-[var(--border-color)] hover:border-red-500/40"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                            Cancelled / Past
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <XCircle className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-red-600 dark:text-red-400">{stats.cancelled}</span>
                        <span className="text-[11px] font-semibold text-red-600/80 dark:text-red-400/80">closed</span>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-xs">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search className="h-4 w-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder={
                            role === "LANDLORD"
                                ? "Search by tenant name, property title, city, phone..."
                                : "Search by property title, owner name, city, address..."
                        }
                        className="w-full h-10 pl-10 pr-4 text-xs font-medium bg-[var(--bg-muted)] rounded-xl border border-transparent focus:border-[var(--color-brand-blue)] focus:bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold p-1"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Status Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {(
                        [
                            { id: "ALL", label: "All Tours", count: stats.total },
                            { id: "CONFIRMED", label: "Confirmed", count: stats.confirmed },
                            { id: "PENDING", label: "Pending", count: stats.pending },
                            { id: "CANCELLED", label: "Cancelled", count: stats.cancelled }
                        ] as const
                    ).map((filter) => {
                        const isActive = statusFilter === filter.id;
                        return (
                            <button
                                key={filter.id}
                                onClick={() => {
                                    setStatusFilter(filter.id);
                                    setCurrentPage(1);
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                                    isActive
                                        ? "bg-[var(--color-brand-blue)] text-white shadow-xs"
                                        : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)]"
                                }`}
                            >
                                <span>{filter.label}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                        isActive
                                            ? "bg-white/20 text-white"
                                            : "bg-[var(--bg-card)] text-[var(--text-muted)]"
                                    }`}
                                >
                                    {filter.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tours List */}
            {tours.length === 0 ? (
                <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-xs">
                        <Calendar className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                        {role === "LANDLORD" ? "No Physical Tour Requests Yet" : "No Tours Scheduled Yet"}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto leading-relaxed">
                        {role === "LANDLORD"
                            ? "When prospective tenants schedule in-person walkthroughs for your properties, they will appear here with requested dates and attendee profiles."
                            : "Browse verified properties across Nigeria and schedule an in-person walkthrough before making any rental decisions."}
                    </p>
                    {role === "TENANT" && (
                        <Link href="/search" className="inline-block mt-6">
                            <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold rounded-xl h-10 px-6 shadow-xs gap-1.5">
                                <Search className="h-3.5 w-3.5" />
                                Browse Properties to Tour
                            </Button>
                        </Link>
                    )}
                </div>
            ) : filteredTours.length === 0 ? (
                <div className="text-center py-14 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 shadow-xs">
                    <Search className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
                    <h3 className="text-base font-bold text-[var(--text-primary)]">No Matching Tours</h3>
                    <p className="text-xs text-[var(--text-secondary)] font-medium max-w-sm mx-auto mt-1">
                        We couldn't find any tour bookings matching your search query or active filter.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("ALL");
                            setCurrentPage(1);
                        }}
                        className="mt-4 h-9 px-4 rounded-xl text-xs font-bold border-[var(--border-color)]"
                    >
                        Clear All Filters
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4">
                        {paginatedTours.map((tour: any) => {
                            const displayUser = role === "LANDLORD" ? tour.tenant : tour.landlord;
                            const userLabel = role === "LANDLORD" ? "Prospective Renter" : "Property Owner";
                            const primaryImage =
                                tour.property?.images?.find((img: any) => img.isPrimary)?.url ||
                                tour.property?.images?.[0]?.url ||
                                "https://images.unsplash.com/photo-1600585154340-be6191da96a0?auto=format&fit=crop&w=400&q=80";

                            const tourDate = new Date(tour.preferredDate);
                            const monthShort = tourDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                            const dayNum = tourDate.toLocaleDateString("en-US", { day: "numeric" });
                            const weekday = tourDate.toLocaleDateString("en-US", { weekday: "short" });

                            return (
                                <div
                                    key={tour.id}
                                    className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] shadow-xs hover:border-[var(--color-brand-blue)]/40 transition-all duration-200 space-y-4"
                                >
                                    {/* Top Bar: Property Thumbnail, Title, Address & Status */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="h-14 w-14 rounded-2xl bg-[var(--bg-muted)] overflow-hidden relative shrink-0 border border-[var(--border-color)] shadow-xs">
                                                <Image
                                                    src={primaryImage}
                                                    alt={tour.property?.title || "Property"}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-extrabold text-[var(--text-primary)] text-sm sm:text-base leading-snug truncate">
                                                        {tour.property?.title}
                                                    </h3>
                                                    {tour.propertyId && (
                                                        <Link
                                                            href={`/properties/${tour.propertyId}`}
                                                            target="_blank"
                                                            className="text-[var(--text-muted)] hover:text-[var(--color-brand-blue)] transition-colors shrink-0"
                                                            title="View property details"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1 mt-0.5 truncate">
                                                    <MapPin className="h-3 w-3 shrink-0 text-[var(--color-brand-orange)]" />
                                                    {tour.property?.address ? `${tour.property.address}, ` : ""}
                                                    {tour.property?.city}, {tour.property?.state}
                                                </p>
                                                {tour.property?.pricePerYear && (
                                                    <div className="text-xs font-black text-[var(--color-brand-green)] mt-1">
                                                        {formatPrice(tour.property.pricePerYear)}{" "}
                                                        <span className="text-[11px] font-semibold text-[var(--text-muted)]">/ year</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 self-start sm:self-center">
                                            {tour.status === "CONFIRMED" && (
                                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed Walkthrough
                                                </Badge>
                                            )}
                                            {tour.status === "PENDING" && (
                                                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                                                    <Clock className="h-3.5 w-3.5 animate-pulse" /> Pending Approval
                                                </Badge>
                                            )}
                                            {tour.status === "CANCELLED" && (
                                                <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                                                    <XCircle className="h-3.5 w-3.5" /> Cancelled
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle: Schedule Box & Participant Card */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                                        {/* Schedule Date & Time Card */}
                                        <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/70 border border-[var(--border-color)] flex items-center gap-3.5">
                                            <div className="w-13 h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center shrink-0 shadow-2xs">
                                                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                                                    {monthShort}
                                                </span>
                                                <span className="text-lg font-black text-[var(--text-primary)] leading-none mt-0.5">
                                                    {dayNum}
                                                </span>
                                                <span className="text-[9px] font-bold text-[var(--text-muted)]">
                                                    {weekday}
                                                </span>
                                            </div>

                                            <div className="min-w-0 space-y-1">
                                                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                                                    Scheduled Inspection Slot
                                                </p>
                                                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-primary)]">
                                                    <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                    <span>{tour.preferredTime}</span>
                                                </div>
                                                <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                                                    Physical In-Person Walkthrough
                                                </p>
                                            </div>
                                        </div>

                                        {/* Participant Profile Card */}
                                        <div className="lg:col-span-2 p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {displayUser?.avatar ? (
                                                    <img
                                                        src={displayUser.avatar}
                                                        alt={displayUser.firstName}
                                                        className="h-11 w-11 rounded-2xl object-cover shrink-0 border border-[var(--border-color)] shadow-2xs"
                                                    />
                                                ) : (
                                                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm shrink-0 border border-blue-500/30 shadow-2xs">
                                                        {displayUser?.firstName?.[0]}
                                                        {displayUser?.lastName?.[0]}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-extrabold text-[var(--text-primary)] text-sm truncate">
                                                            {displayUser?.firstName} {displayUser?.lastName}
                                                        </span>
                                                        <Badge className="bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20 text-[10px] px-1.5 py-0.2 font-bold">
                                                            {userLabel}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-medium mt-1 flex-wrap">
                                                        {displayUser?.phone && (
                                                            <a
                                                                href={`tel:${displayUser.phone}`}
                                                                className="flex items-center gap-1 hover:text-[var(--color-brand-green)] transition-colors"
                                                                title="Call"
                                                            >
                                                                <Phone className="h-3 w-3 text-[var(--color-brand-green)]" />
                                                                {displayUser.phone}
                                                            </a>
                                                        )}
                                                        {displayUser?.email && (
                                                            <span className="flex items-center gap-1 text-[var(--text-muted)] truncate max-w-[180px]">
                                                                <Mail className="h-3 w-3" />
                                                                {displayUser.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                {displayUser?.phone && (
                                                    <a
                                                        href={`tel:${displayUser.phone}`}
                                                        className="h-8 px-2.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--color-brand-green)] hover:border-[var(--color-brand-green)]/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                                                    >
                                                        <Phone className="h-3 w-3" /> Call
                                                    </a>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleMessageClick(displayUser?.id, tour.propertyId)}
                                                    className="h-8 px-2.5 rounded-xl border-[var(--border-color)] text-xs font-bold gap-1.5 text-[var(--color-brand-orange)] hover:bg-[var(--bg-muted)] shadow-2xs"
                                                >
                                                    <MessageSquare className="h-3 w-3" /> Chat
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tenant Message */}
                                    {tour.message && (
                                        <div className="p-3.5 bg-blue-500/10 rounded-2xl text-xs text-[var(--text-secondary)] border border-blue-500/20 font-medium flex items-start gap-2.5">
                                            <MessageSquare className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold text-[var(--text-primary)] block mb-0.5">
                                                    Special Request / Note:
                                                </span>
                                                <span className="italic leading-relaxed">"{tour.message}"</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Decision / Action Bar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)]">
                                        <div className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                                            <ShieldCheck className="h-4 w-4 text-[var(--color-brand-green)]" />
                                            <span>
                                                {tour.status === "CONFIRMED"
                                                    ? "Confirmed walkthrough: Please arrive on time and verify keys on-site."
                                                    : tour.status === "PENDING"
                                                    ? "Pending approval: Coordinate details or confirm to lock slot on calendar."
                                                    : "This tour request was cancelled."}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                                            {/* Landlord Pending Actions */}
                                            {role === "LANDLORD" && tour.status === "PENDING" && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={actionLoading === tour.id}
                                                        onClick={() => handleStatusUpdate(tour.id, "CANCELLED")}
                                                        className="h-9 px-4 rounded-xl text-red-500 border-red-500/30 hover:bg-red-500/10 text-xs font-bold gap-1.5 shadow-xs"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        Decline
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        disabled={actionLoading === tour.id}
                                                        onClick={() => handleStatusUpdate(tour.id, "CONFIRMED")}
                                                        className="h-9 px-5 rounded-xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold text-xs shadow-xs gap-1.5"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Confirm Tour
                                                    </Button>
                                                </>
                                            )}

                                            {/* Tenant Pending Actions */}
                                            {role === "TENANT" && tour.status === "PENDING" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={actionLoading === tour.id}
                                                    onClick={() => handleStatusUpdate(tour.id, "CANCELLED")}
                                                    className="h-9 px-4 rounded-xl text-red-500 border-red-500/30 hover:bg-red-500/10 text-xs font-bold gap-1.5 shadow-xs"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Cancel Request
                                                </Button>
                                            )}

                                            {/* Confirmed Shortcuts */}
                                            {tour.status === "CONFIRMED" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleMessageClick(displayUser?.id, tour.propertyId)}
                                                    className="h-9 px-4 rounded-xl bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90 text-white text-xs font-bold gap-1.5 shadow-xs"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    Direct Message
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Strip */}
                    {filteredTours.length > ITEMS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-color)]">
                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                Showing{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredTours.length)}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    {filteredTours.length}
                                </span>{" "}
                                tours
                            </p>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-[var(--border-color)]"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                </Button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                                            currentPage === page
                                                ? "bg-[var(--color-brand-blue)] text-white shadow-xs"
                                                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-[var(--border-color)]"
                                >
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function PropertiesTab({ properties, loading, onRefresh }: { properties: Property[]; loading: boolean; onRefresh: () => void }) {
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [isMonetizationOpen, setIsMonetizationOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "RENTED" | "FEATURED">("ALL");
    const [sortBy, setSortBy] = useState<"NEWEST" | "VIEWS" | "PRICE_ASC" | "PRICE_DESC">("NEWEST");
    const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
    const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleBoostClick = (id: string) => {
        setSelectedPropertyId(id);
        setIsMonetizationOpen(true);
    };

    const handleMonetizationSuccess = () => {
        onRefresh();
    };

    const handleCopyLink = (id: string) => {
        if (typeof window !== "undefined") {
            const url = `${window.location.origin}/properties/${id}`;
            navigator.clipboard.writeText(url);
            toast.success("Listing link copied to clipboard!");
        }
    };

    const confirmDelete = async () => {
        if (!propertyToDelete) return;
        try {
            setIsDeleting(true);
            await api.delete(`/properties/${propertyToDelete.id}`);
            toast.success("Property deleted successfully");
            setPropertyToDelete(null);
            onRefresh();
        } catch (error) {
            console.error("Failed to delete property:", error);
            toast.error("Failed to delete property");
        } finally {
            setIsDeleting(false);
        }
    };

    const availableCount = properties.filter((p) => p.status === "AVAILABLE").length;
    const rentedCount = properties.filter((p) => p.status === "RENTED").length;
    const featuredCount = properties.filter((p) => p.featured).length;
    const totalViews = properties.reduce((sum, p) => sum + (p.viewCount || 0), 0);

    const filteredProperties = properties
        .filter((p) => {
            const matchesSearch =
                searchQuery.trim() === "" ||
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.city.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === "AVAILABLE") return p.status === "AVAILABLE";
            if (statusFilter === "RENTED") return p.status === "RENTED";
            if (statusFilter === "FEATURED") return p.featured;

            return true;
        })
        .sort((a, b) => {
            if (sortBy === "PRICE_ASC") return a.pricePerYear - b.pricePerYear;
            if (sortBy === "PRICE_DESC") return b.pricePerYear - a.pricePerYear;
            if (sortBy === "VIEWS") return (b.viewCount || 0) - (a.viewCount || 0);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Portfolio Header & Stats Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-color)]">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                            My Properties Portfolio
                        </h2>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                            {properties.length} Total Units
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1">
                        Manage listing status, edit rates, boost visibility, and monitor real-time renter interest.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link href="/properties/new">
                        <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold h-11 px-5 rounded-xl shadow-xs gap-2">
                            <Plus className="h-4 w-4" />
                            List New Property
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metric Overview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[var(--text-secondary)] font-bold">Total Portfolio</span>
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                            <Building2 className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-[var(--text-primary)]">{loading ? "..." : properties.length}</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">Properties listed</p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[var(--text-secondary)] font-bold">Available Now</span>
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{loading ? "..." : availableCount}</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">Live on marketplace</p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[var(--text-secondary)] font-bold">Total Views</span>
                        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                            <Eye className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-[var(--text-primary)]">{loading ? "..." : totalViews.toLocaleString()}</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">Tenant impressions</p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[var(--text-secondary)] font-bold">Featured Listings</span>
                        <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                            <Rocket className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-[var(--color-brand-orange)]">{loading ? "..." : featuredCount}</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">Priority visibility</p>
                </div>
            </div>

            {/* Filter, Search & View Controls Ribbon */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by title, address, or city..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-9 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-brand-green)]"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {(
                        [
                            { id: "ALL", label: `All (${properties.length})` },
                            { id: "AVAILABLE", label: `Available (${availableCount})` },
                            { id: "RENTED", label: `Rented (${rentedCount})` },
                            { id: "FEATURED", label: `Featured (${featuredCount})` },
                        ] as const
                    ).map((filter) => (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => setStatusFilter(filter.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                                statusFilter === filter.id
                                    ? "bg-[var(--color-brand-green)] text-white border-[var(--color-brand-green)] shadow-xs"
                                    : "bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--border-color)]/50"
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Sort & View Mode Switcher */}
                <div className="flex items-center gap-2 shrink-0">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="h-10 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand-green)] cursor-pointer"
                    >
                        <option value="NEWEST">Newest First</option>
                        <option value="VIEWS">Most Viewed</option>
                        <option value="PRICE_ASC">Price: Low to High</option>
                        <option value="PRICE_DESC">Price: High to Low</option>
                    </select>

                    <div className="flex items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] p-0.5">
                        <button
                            type="button"
                            onClick={() => setViewMode("GRID")}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === "GRID"
                                    ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                            title="Grid View"
                        >
                            <Grid className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("TABLE")}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === "TABLE"
                                    ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                            title="Table View"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Properties Display */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-[var(--bg-card)] rounded-3xl h-88 animate-pulse border border-[var(--border-color)]" />
                    ))}
                </div>
            ) : properties.length === 0 ? (
                <div className="bg-[var(--bg-card)] p-8 sm:p-14 rounded-3xl border border-[var(--border-color)] text-center shadow-xs">
                    <div className="max-w-md mx-auto">
                        <div className="h-18 w-18 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                            <Home className="h-9 w-9" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] mb-2">
                            No properties listed yet
                        </h3>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 font-medium leading-relaxed">
                            Start listing your apartments, duplexes, or commercial spaces directly to vetted renters with 0% broker commission and 100% escrow protection.
                        </p>
                        <Link href="/properties/new">
                            <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold h-11 px-6 rounded-xl gap-2 shadow-xs">
                                <Plus className="h-4 w-4" />
                                List Your First Property
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className="bg-[var(--bg-card)] p-8 sm:p-12 rounded-3xl border border-[var(--border-color)] text-center">
                    <div className="max-w-sm mx-auto">
                        <div className="h-14 w-14 rounded-2xl bg-[var(--bg-muted)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
                            <Search className="h-6 w-6 opacity-60" />
                        </div>
                        <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">No matching properties found</h3>
                        <p className="text-xs text-[var(--text-secondary)] font-medium mb-4">
                            No listings match your search for "{searchQuery}" or selected status filter.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("ALL");
                            }}
                            className="text-xs font-bold rounded-xl border-[var(--border-color)]"
                        >
                            Reset All Filters
                        </Button>
                    </div>
                </div>
            ) : viewMode === "GRID" ? (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {filteredProperties.map((property) => (
                        <div
                            key={property.id}
                            className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] overflow-hidden hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-green)]/40 transition-all flex flex-col group"
                        >
                            {/* Photo Banner with Overlays */}
                            <div className="relative aspect-[16/10] bg-[var(--bg-muted)] overflow-hidden">
                                {property.images?.[0]?.url ? (
                                    <Image
                                        src={property.images[0].url}
                                        alt={property.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="bg-[var(--bg-muted)] w-full h-full flex items-center justify-center">
                                        <Home className="h-10 w-10 text-[var(--text-muted)] opacity-40" />
                                    </div>
                                )}

                                {/* Top Left Badges */}
                                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                    <Badge
                                        className={cn(
                                            "border-none shadow-md font-bold text-[10px] px-2.5 py-0.5 rounded-full backdrop-blur-md",
                                            property.status === "AVAILABLE"
                                                ? "bg-emerald-500 text-white"
                                                : property.status === "RENTED"
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-700 text-white"
                                        )}
                                    >
                                        {property.status}
                                    </Badge>

                                    {property.featured && (
                                        <div className="flex flex-col gap-0.5">
                                            <Badge className="bg-[var(--color-brand-orange)] text-white border-none shadow-md font-bold text-[10px] flex items-center gap-1 rounded-full px-2.5 py-0.5">
                                                <Rocket className="h-3 w-3" /> Featured
                                            </Badge>
                                            {property.featuredExpiresAt && (
                                                <span className="text-[8px] bg-black/75 text-white px-2 py-0.5 rounded-full backdrop-blur-md font-bold">
                                                    Exp: {new Date(property.featuredExpiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {property.verified && (
                                        <Badge className="bg-emerald-600 text-white border-none shadow-md font-bold text-[10px] flex items-center gap-1 rounded-full px-2.5 py-0.5">
                                            <ShieldCheck className="h-3 w-3" /> Verified
                                        </Badge>
                                    )}
                                </div>

                                {/* Top Right View Counter */}
                                <div className="absolute top-3 right-3 z-10">
                                    <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        <Eye className="h-3 w-3 text-emerald-400" />
                                        {property.viewCount || 0}
                                    </span>
                                </div>

                                {/* Bottom Left Property Type */}
                                <div className="absolute bottom-3 left-3 z-10">
                                    <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize">
                                        {property.propertyType?.replace(/_/g, " ") || "Residential"}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <Link href={`/properties/${property.id}`} className="block group-hover:text-[var(--color-brand-green)] transition-colors">
                                        <h3 className="font-extrabold text-base sm:text-lg text-[var(--text-primary)] truncate" title={property.title}>
                                            {property.title}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1 font-medium truncate">
                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                                        {property.address}, {property.city}
                                    </p>

                                    {/* Specs Pills */}
                                    <div className="flex items-center gap-3 mt-3 text-xs text-[var(--text-secondary)] font-semibold">
                                        <span className="flex items-center gap-1">
                                            <Bed className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                            {property.bedrooms} Beds
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Bath className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                            {property.bathrooms} Baths
                                        </span>
                                    </div>

                                    {/* Price Section */}
                                    <div className="mt-3.5 pt-3 border-t border-[var(--border-color)]">
                                        <p className="text-lg sm:text-xl font-extrabold text-[var(--color-brand-green)]">
                                            {formatPrice(property.pricePerYear)}
                                            <span className="text-xs font-semibold text-[var(--text-muted)] ml-1">/ year</span>
                                        </p>
                                        <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
                                            ~{formatPrice(Math.round(property.pricePerYear / 12))}/mo
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons Footer */}
                                <div className="flex items-center gap-1.5 pt-4 mt-3 border-t border-[var(--border-color)]">
                                    <Link href={`/properties/${property.id}/edit`} className="flex-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-9 rounded-xl border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-muted)] gap-1.5"
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                    </Link>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleBoostClick(property.id)}
                                        className="h-9 px-3 rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 text-xs font-bold gap-1"
                                        title="Boost & Feature"
                                    >
                                        <Rocket className="h-3.5 w-3.5" />
                                        Boost
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyLink(property.id)}
                                        className="h-9 px-2.5 rounded-xl border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] text-xs"
                                        title="Copy Listing Link"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>

                                    <Link href={`/properties/${property.id}`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 px-2.5 rounded-xl border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] text-xs"
                                            title="View Live Listing"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPropertyToDelete(property)}
                                        className="h-9 px-2.5 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold"
                                        title="Delete Listing"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Table / Dense List View */
                <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-[var(--bg-muted)]/60 text-[var(--text-secondary)] font-bold border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="py-3.5 px-4 sm:px-6">Property</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4">Specs</th>
                                    <th className="py-3.5 px-4">Annual Rent</th>
                                    <th className="py-3.5 px-4">Views</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {filteredProperties.map((property) => (
                                    <tr key={property.id} className="hover:bg-[var(--bg-muted)]/30 transition-colors group">
                                        <td className="py-3.5 px-4 sm:px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-[var(--bg-muted)] shrink-0 border border-[var(--border-color)]">
                                                    <Image
                                                        src={property.images?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-e32c53048057?auto=format&fit=crop&w=200&q=80"}
                                                        alt={property.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0 max-w-xs sm:max-w-md">
                                                    <Link href={`/properties/${property.id}`} className="font-bold text-[var(--text-primary)] hover:text-[var(--color-brand-green)] truncate block">
                                                        {property.title}
                                                    </Link>
                                                    <p className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-1 font-medium mt-0.5">
                                                        <MapPin className="h-3 w-3 shrink-0" />
                                                        {property.address}, {property.city}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <Badge
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-full border-none",
                                                        property.status === "AVAILABLE"
                                                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                            : property.status === "RENTED"
                                                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                                            : "bg-gray-500/15 text-gray-600 dark:text-gray-400"
                                                    )}
                                                >
                                                    {property.status}
                                                </Badge>
                                                {property.featured && (
                                                    <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[9px] font-bold px-1.5 py-0.2 rounded-full border-none">
                                                        Boosted
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-[var(--text-secondary)] font-medium whitespace-nowrap">
                                            {property.bedrooms} Bed · {property.bathrooms} Bath
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <p className="font-extrabold text-sm text-[var(--text-primary)]">{formatPrice(property.pricePerYear)}</p>
                                            <p className="text-[10px] text-[var(--text-muted)] font-medium">/ year</p>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1">
                                                <Eye className="h-3.5 w-3.5 text-emerald-500" />
                                                {property.viewCount || 0}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link href={`/properties/${property.id}/edit`}>
                                                    <Button size="sm" variant="outline" className="h-8 px-2.5 rounded-lg border-[var(--border-color)] text-xs font-bold">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleBoostClick(property.id)}
                                                    className="h-8 px-2.5 rounded-lg border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 text-xs font-bold"
                                                    title="Boost"
                                                >
                                                    <Rocket className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCopyLink(property.id)}
                                                    className="h-8 px-2.5 rounded-lg border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
                                                    title="Copy link"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                                <Link href={`/properties/${property.id}`}>
                                                    <Button size="sm" variant="outline" className="h-8 px-2.5 rounded-lg border-[var(--border-color)] text-xs font-bold">
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setPropertyToDelete(property)}
                                                    className="h-8 px-2.5 rounded-lg border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Monetization Boost Modal */}
            {selectedPropertyId && (
                <MonetizationModal
                    propertyId={selectedPropertyId}
                    isOpen={isMonetizationOpen}
                    isVerified={properties.find((p) => p.id === selectedPropertyId)?.verified}
                    isFeatured={properties.find((p) => p.id === selectedPropertyId)?.featured}
                    onClose={() => setIsMonetizationOpen(false)}
                    onSuccess={handleMonetizationSuccess}
                />
            )}

            {/* Modern Delete Confirmation Dialog */}
            {propertyToDelete && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center gap-3.5">
                            <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                                    Delete Property Listing?
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)]/50 border border-[var(--border-color)]">
                            <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                                {propertyToDelete.title}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] font-medium truncate mt-0.5">
                                {propertyToDelete.address}, {propertyToDelete.city}
                            </p>
                            <p className="text-xs font-bold text-[var(--color-brand-green)] mt-1.5">
                                {formatPrice(propertyToDelete.pricePerYear)} / year
                            </p>
                        </div>

                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                            Deleting this property will permanently remove it from the RentHub marketplace, cancel all scheduled visits, and delete its view history.
                        </p>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setPropertyToDelete(null)}
                                disabled={isDeleting}
                                className="h-10 px-4 rounded-xl border-[var(--border-color)] text-xs font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs gap-1.5"
                            >
                                {isDeleting ? (
                                    <>
                                        <Clock className="h-3.5 w-3.5 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Yes, Delete Property
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
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
