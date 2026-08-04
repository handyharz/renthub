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
    FileText
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Inbox } from "@/components/messaging/Inbox";
import { ApplicationsTab } from "@/components/dashboard/ApplicationsTab";
import { LandlordApplicationsTab } from "@/components/dashboard/LandlordApplicationsTab";
import { TransactionsTab } from "@/components/dashboard/TransactionsTab";
import { MonetizationModal } from "@/components/landlord/MonetizationModal";
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
    const [role, setRole] = useState<string | null>(null);
    const [userVerified, setUserVerified] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        views: 0,
        active: 0,
        messages: 0,
        favorites: 0,
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

            let dbUser;
            try {
                const userRes = await api.get(`/users/me?clerkId=${user.id}`);
                dbUser = userRes.data.data;
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
                    dbUser = createRes.data.data;
                } else {
                    throw err;
                }
            }

            const dbUserId = dbUser.id;
            setRole(dbUser.role);
            setUserVerified(dbUser.verified);

            if (dbUser.role === "LANDLORD") {
                const res = await api.get(`/properties?landlordId=${dbUserId}`);
                const userProperties = res.data.data.properties || [];
                setProperties(userProperties);

                const unreadRes = await api.get(`/messages/unread-count?clerkId=${user.id}`);
                const unreadCount = unreadRes.data.data.count || 0;

                const totalViews = userProperties.reduce((sum: number, p: Property) => sum + (p.viewCount || 0), 0);
                const activeCount = userProperties.filter((p: Property) => p.status === "AVAILABLE").length;

                setStats({
                    total: userProperties.length,
                    views: totalViews,
                    active: activeCount,
                    messages: unreadCount,
                    favorites: 0,
                });
            } else {
                const favRes = await api.get(`/favorites/me?clerkId=${user.id}`);
                const favProperties = favRes.data.data.map((f: any) => ({
                    ...f.property,
                    isFavorited: true
                })) || [];
                setFavorites(favProperties);

                const unreadRes = await api.get(`/messages/unread-count?clerkId=${user.id}`);
                const unreadCount = unreadRes.data.data.count || 0;

                setStats({
                    total: 0,
                    views: 0,
                    active: 0,
                    messages: unreadCount,
                    favorites: favProperties.length,
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
                    {role === "TENANT" && (
                        <Link href="/search" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold h-11 px-5 rounded-xl">
                                <Search className="mr-2 h-4 w-4" />
                                Find a Home
                            </Button>
                        </Link>
                    )}
                </div>

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
                                ? <OverviewTab stats={stats} activities={activities} loading={loading} onTabChange={setActiveTab} />
                                : <TenantOverviewTab stats={stats} activities={activities} loading={loading} onTabChange={setActiveTab} />
                        )}
                        {activeTab === "properties" && role === "LANDLORD" && <PropertiesTab properties={properties} loading={loading} onRefresh={fetchDashboardData} />}
                        {activeTab === "tours" && <ToursTab role={role as "LANDLORD" | "TENANT"} />}
                        {activeTab === "favorites" && role === "TENANT" && <FavoritesTab favorites={favorites} loading={loading} />}
                        {activeTab === "applications" && (role === "LANDLORD" ? <LandlordApplicationsTab /> : <ApplicationsTab />)}
                        {activeTab === "transactions" && role === "LANDLORD" && <TransactionsTab />}
                        {activeTab === "messages" && <Inbox initialConversationId={activeConversationId} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

function OverviewTab({ stats, activities, loading, onTabChange }: { stats: any; activities: Activity[]; loading: boolean; onTabChange: (tab: string) => void }) {
    const statCards = [
        { label: "Total Properties", value: stats.total, icon: Home, bgColor: "bg-blue-500/10", iconColor: "text-blue-500" },
        { label: "Total Views", value: stats.views, icon: Eye, bgColor: "bg-emerald-500/10", iconColor: "text-emerald-500" },
        { label: "Active Listings", value: stats.active, icon: TrendingUp, bgColor: "bg-orange-500/10", iconColor: "text-orange-500" },
        { label: "Messages", value: stats.messages, icon: MessageSquare, bgColor: "bg-purple-500/10", iconColor: "text-purple-500", onClick: () => onTabChange("messages") },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        onClick={stat.onClick}
                        className={cn(
                            "bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)] transition-all",
                            stat.onClick ? "cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-green)]" : ""
                        )}
                    >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className={`p-2.5 sm:p-3 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-1">{loading ? "..." : stat.value}</p>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-semibold">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)]">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Link href="/properties/new">
                        <Button className="w-full bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 justify-start gap-3 h-14 rounded-xl text-white">
                            <Plus className="h-5 w-5" />
                            <div className="text-left font-bold">
                                <p className="font-bold text-sm">Add New Property</p>
                                <p className="text-xs opacity-90 font-medium">List a property in minutes</p>
                            </div>
                        </Button>
                    </Link>
                    <Link href="/search">
                        <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]">
                            <Search className="h-5 w-5 text-[var(--color-brand-orange)]" />
                            <div className="text-left font-bold">
                                <p className="font-bold text-sm text-[var(--text-primary)]">Browse Properties</p>
                                <p className="text-xs text-[var(--text-secondary)] font-medium">Explore the marketplace</p>
                            </div>
                        </Button>
                    </Link>
                </div>
            </div>

            <ActivitySection activities={activities} loading={loading} />
        </div>
    );
}

function TenantOverviewTab({ stats, activities, loading, onTabChange }: { stats: any; activities: Activity[]; loading: boolean; onTabChange: (tab: string) => void }) {
    const statCards = [
        { label: "Saved Homes", value: stats.favorites, icon: Home, bgColor: "bg-blue-500/10", iconColor: "text-blue-500", onClick: () => onTabChange("favorites") },
        { label: "Messages", value: stats.messages, icon: MessageSquare, bgColor: "bg-purple-500/10", iconColor: "text-purple-500", onClick: () => onTabChange("messages") },
        { label: "Applications", value: 0, icon: TrendingUp, bgColor: "bg-emerald-500/10", iconColor: "text-emerald-500" },
        { label: "Safety Guides", value: 4, icon: ShieldCheck, bgColor: "bg-orange-500/10", iconColor: "text-orange-500" },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        onClick={stat.onClick}
                        className={cn(
                            "bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)] transition-all",
                            stat.onClick ? "cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-green)]" : ""
                        )}
                    >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className={`p-2.5 sm:p-3 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-1">{loading ? "..." : stat.value}</p>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-semibold">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)]">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Link href="/search">
                        <Button className="w-full bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 justify-start gap-3 h-14 rounded-xl text-white">
                            <Search className="h-5 w-5" />
                            <div className="text-left font-bold">
                                <p className="font-bold text-sm">Find a Home</p>
                                <p className="text-xs opacity-90 font-medium">Browse verified properties</p>
                            </div>
                        </Button>
                    </Link>
                    <Link href="/resources">
                        <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]">
                            <ShieldCheck className="h-5 w-5 text-[var(--color-brand-orange)]" />
                            <div className="text-left font-bold">
                                <p className="font-bold text-sm text-[var(--text-primary)]">Trust & Safety Hub</p>
                                <p className="text-xs text-[var(--text-secondary)] font-medium">Learn how to rent safely</p>
                            </div>
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)]">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-4">Getting Started</h3>
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)]">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Complete your profile</p>
                            <p className="text-xs text-[var(--text-secondary)] font-medium truncate">Add your phone number and ID to get verified</p>
                        </div>
                        <Link href="/dashboard/profile">
                            <Button size="sm" className="font-bold bg-[var(--color-brand-green)] text-white rounded-xl text-xs">Complete</Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)]">
                        <div className="h-8 w-8 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-500 shrink-0">
                            <Search className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Find your dream home</p>
                            <p className="text-xs text-[var(--text-secondary)] font-medium truncate">Browse verified properties directly from landlords</p>
                        </div>
                        <Link href="/search">
                            <Button size="sm" className="font-bold bg-[var(--color-brand-green)] text-white rounded-xl text-xs">Browse</Button>
                        </Link>
                    </div>
                </div>
            </div>

            <ActivitySection activities={activities} loading={loading} />
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
        <div className="bg-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)]">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Recent Activity</h3>
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 animate-pulse">
                            <div className="h-10 w-10 bg-[var(--bg-muted)] rounded-full" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-[var(--bg-muted)] rounded w-1/4" />
                                <div className="h-3 bg-[var(--bg-muted)] rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : activities.length === 0 ? (
                <div className="text-center py-10 sm:py-12 text-[var(--text-secondary)]">
                    <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-[var(--text-muted)] opacity-60" />
                    <p className="font-bold text-sm sm:text-base text-[var(--text-primary)]">No recent activity</p>
                    <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Your property views and updates will appear here</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {activities.map((activity) => {
                        let Icon = Calendar;
                        let iconBg = "bg-blue-500/10";
                        let iconColor = "text-blue-500";
                        if (activity.type === "PROPERTY_LISTED") { Icon = Home; iconBg = "bg-emerald-500/10"; iconColor = "text-emerald-500"; }
                        else if (activity.type === "PROPERTY_VIEWED") { Icon = Eye; iconBg = "bg-blue-500/10"; iconColor = "text-blue-500"; }
                        else if (activity.type === "PROPERTY_UPDATED") { Icon = TrendingUp; iconBg = "bg-orange-500/10"; iconColor = "text-orange-500"; }
                        return (
                            <div key={activity.id} className="flex items-center gap-3 sm:gap-4 group">
                                <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{activity.title}</p>
                                    <p className="text-xs text-[var(--text-secondary)] truncate font-medium">{activity.description}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium">{new Date(activity.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
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
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full font-bold gap-1.5 rounded-xl border-[var(--border-color)] text-[var(--color-brand-orange)] hover:bg-[var(--bg-muted)]"
                                            onClick={() => handleMessageClick(displayUser.id, tour.propertyId)}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Message {role === "LANDLORD" ? "Tenant" : "Owner"}
                                        </Button>
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
