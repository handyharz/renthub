"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusModal } from "@/components/ui/StatusModal";
import api from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";
import {
    ArrowLeft,
    CalendarDays,
    Clock,
    MapPin,
    CheckCircle2,
    ShieldCheck,
    ChevronRight,
    Sunrise,
    Sun,
    Sunset,
    MessageSquare,
    Bed,
    Bath,
    Home,
    AlertCircle,
    CalendarCheck,
    Check,
    Sparkles,
    User,
    Calendar,
    Flag,
} from "lucide-react";
import { ReportAgentModal } from "@/components/agent/ReportAgentModal";

export default function ScheduleTourPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useUser();
    const [reportModalOpen, setReportModalOpen] = useState(false);

    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Modal state
    const [modal, setModal] = useState({
        open: false,
        title: "",
        message: "",
        type: "info" as "success" | "error" | "info" | "warning"
    });

    const [formData, setFormData] = useState({
        preferredDate: "",
        preferredTime: "",
        message: ""
    });

    useEffect(() => {
        if (id) fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            const res = await api.get(`/properties/${id}`);
            setProperty(res.data.data);
        } catch (error) {
            console.error("Failed to fetch property:", error);
        } finally {
            setLoading(false);
        }
    };

    // Quick notes for tenants
    const quickNotes = [
        "Check water supply & plumbing 💧",
        "Inspect parking space & compound 🚗",
        "Verify electrical fittings & wiring ⚡",
        "Confirm move-in readiness & keys 🔑"
    ];

    const handleAddQuickNote = (noteText: string) => {
        setFormData((prev) => {
            const trimmed = prev.message.trim();
            if (!trimmed) return { ...prev, message: noteText };
            if (trimmed.includes(noteText)) return prev;
            return { ...prev, message: `${trimmed}\n• ${noteText}` };
        });
    };

    const handleSubmit = async () => {
        if (!user) {
            setModal({
                open: true,
                title: "Sign-In Required",
                message: "Please sign in to schedule a physical tour of this property.",
                type: "warning"
            });
            return;
        }

        if (!formData.preferredDate || !formData.preferredTime) {
            setModal({
                open: true,
                title: "Incomplete Booking Details",
                message: "Please choose both your preferred inspection date and time slot.",
                type: "warning"
            });
            return;
        }

        try {
            setSubmitting(true);
            await api.post("/tours", {
                propertyId: id,
                clerkId: user.id,
                preferredDate: formData.preferredDate,
                preferredTime: formData.preferredTime,
                message: formData.message
            });
            setSubmitted(true);
        } catch (error: any) {
            console.error("Failed to schedule tour:", error);
            setModal({
                open: true,
                title: "Request Failed",
                message: error.response?.data?.message || "We couldn't submit your tour request. Please try again.",
                type: "error"
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Generate next 14 days for the custom date picker
    const getNextDays = () => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            const isToday = i === 0;
            const isTomorrow = i === 1;
            days.push({
                full: date.toISOString().split("T")[0],
                dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
                dayFull: date.toLocaleDateString("en-US", { weekday: "long" }),
                dateNum: date.getDate(),
                monthName: date.toLocaleDateString("en-US", { month: "short" }),
                monthFull: date.toLocaleDateString("en-US", { month: "long" }),
                year: date.getFullYear(),
                isToday,
                isTomorrow,
            });
        }
        return days;
    };

    const nextDays = getNextDays();

    const timeSlotsByPeriod = [
        {
            period: "Morning",
            icon: Sunrise,
            slots: ["09:00 AM", "10:00 AM", "11:00 AM"],
        },
        {
            period: "Afternoon",
            icon: Sun,
            slots: ["12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"],
        },
        {
            period: "Evening",
            icon: Sunset,
            slots: ["04:00 PM", "05:00 PM"],
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">
                <div className="h-12 w-12 border-4 border-[var(--color-brand-green)] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-semibold text-sm">Loading tour booking details...</p>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] p-6 text-center">
                <Home className="h-12 w-12 text-[var(--text-muted)] mb-3" />
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Property Not Found</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                    This property may no longer be available for physical tours.
                </p>
                <Link href="/search">
                    <Button className="rounded-xl px-5">Browse Available Homes</Button>
                </Link>
            </div>
        );
    }

    const isOwner = Boolean(
        user && (
            property.landlordId === user.id ||
            property.landlord?.clerkId === user.id ||
            property.landlord?.id === user.id
        )
    );

    if (isOwner) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 text-center">
                <div className="max-w-md p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black text-[var(--text-primary)]">Property Owner Restriction</h2>
                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                        You are registered as the landlord of this property. Landlords cannot schedule inspection tours for their own listings.
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                        <Button asChild className="rounded-xl bg-[var(--color-brand-green)] text-white font-bold">
                            <Link href={`/properties/${property.id}`}>Back to Property Listing</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl border-[var(--border-color)]">
                            <Link href="/dashboard?tab=properties">Go to Landlord Dashboard</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const selectedDateObj = nextDays.find((d) => d.full === formData.preferredDate);
    const primaryImage = property.images?.[0]?.url || "https://images.unsplash.com/photo-1600585154340-be6191da96a0?auto=format&fit=crop&w=800&q=80";

    // SUCCESS SCREEN (Modern & Dark-Mode Optimized)
    if (submitted) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 sm:p-6">
                <div className="max-w-xl w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-10 shadow-[var(--shadow-md)] text-center space-y-8 animate-in fade-in zoom-in-95 duration-400">
                    <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 className="h-10 w-10 text-[var(--color-brand-green)]" />
                    </div>

                    <div className="space-y-2">
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 font-bold">
                            Inspection Request Submitted
                        </Badge>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                            Tour Request Sent!
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                            Your physical tour request has been forwarded to{" "}
                            <strong className="text-[var(--text-primary)]">
                                {property.landlord?.firstName} {property.landlord?.lastName}
                            </strong>
                            . You will receive an alert once confirmed.
                        </p>
                    </div>

                    {/* Booking Recap Card */}
                    <div className="bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-2xl p-5 text-left space-y-4">
                        <div className="flex items-center gap-3.5 border-b border-[var(--border-color)] pb-3.5">
                            <div className="h-14 w-14 rounded-xl overflow-hidden relative shrink-0 border border-[var(--border-color)]">
                                <Image
                                    src={primaryImage}
                                    alt={property.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">
                                    {property.title}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3.5 w-3.5 text-[var(--color-brand-orange)] shrink-0" />
                                    {property.city}, {property.state}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
                                <span className="text-[var(--text-muted)] block text-[11px] font-bold uppercase tracking-wider mb-0.5">
                                    Inspection Date
                                </span>
                                <span className="font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-[var(--color-brand-green)]" />
                                    {selectedDateObj
                                        ? `${selectedDateObj.dayName}, ${selectedDateObj.monthName} ${selectedDateObj.dateNum}`
                                        : formData.preferredDate}
                                </span>
                            </div>

                            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
                                <span className="text-[var(--text-muted)] block text-[11px] font-bold uppercase tracking-wider mb-0.5">
                                    Preferred Time
                                </span>
                                <span className="font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" />
                                    {formData.preferredTime}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Next Steps Guide */}
                    <div className="text-left bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-xs space-y-2">
                        <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 shrink-0" /> What happens next?
                        </div>
                        <ul className="text-[var(--text-secondary)] space-y-1.5 pl-5 list-disc leading-relaxed">
                            <li>The landlord will confirm or propose an alternate slot.</li>
                            <li>Track the status anytime in your dashboard under <strong>Physical Tours</strong>.</li>
                            <li>Remember: Physical tours on RentHub are <strong>100% free</strong>. Never pay viewing fees to anyone.</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            className="flex-1 h-12 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold rounded-xl"
                            onClick={() => router.push("/dashboard?tab=tours")}
                        >
                            View in Dashboard
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl font-bold"
                            onClick={() => router.push(`/properties/${property.id}`)}
                        >
                            Return to Property
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-24 text-[var(--text-primary)]">
            {/* Sticky Header & Breadcrumbs */}
            <div className="sticky top-16 z-30 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-9 w-9 rounded-xl hover:bg-[var(--bg-muted)] border border-[var(--border-color)] shrink-0"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                                <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
                                    Home
                                </Link>
                                <ChevronRight className="h-3 w-3 shrink-0" />
                                <Link
                                    href={`/properties/${property.id}`}
                                    className="hover:text-[var(--text-primary)] transition-colors truncate max-w-[120px] sm:max-w-[200px]"
                                >
                                    {property.title}
                                </Link>
                                <ChevronRight className="h-3 w-3 shrink-0" />
                                <span className="text-[var(--text-primary)] font-semibold">Schedule Tour</span>
                            </div>
                            <h1 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] truncate mt-0.5">
                                Schedule a Physical Tour
                            </h1>
                        </div>
                    </div>

                    <Badge className="hidden sm:inline-flex bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-3 py-1 items-center gap-1.5 shrink-0">
                        <ShieldCheck className="h-3.5 w-3.5" /> 100% Free Inspection
                    </Badge>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: Interactive Booking Form (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* STEP 1: Date Selection Card */}
                        <div className="bg-[var(--bg-card)] p-6 sm:p-7 rounded-3xl border border-[var(--border-color)] shadow-[var(--shadow-sm)] space-y-5">
                            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] flex items-center justify-center font-extrabold text-sm">
                                        1
                                    </div>
                                    <div>
                                        <h2 className="font-extrabold text-base sm:text-lg text-[var(--text-primary)] flex items-center gap-2">
                                            <CalendarDays className="h-5 w-5 text-[var(--color-brand-green)]" />
                                            Choose Inspection Date
                                        </h2>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium">
                                            Select any date within the next 2 weeks
                                        </p>
                                    </div>
                                </div>

                                <Badge variant="outline" className="text-[11px] font-bold text-[var(--text-muted)] border-[var(--border-color)]">
                                    14 Days Available
                                </Badge>
                            </div>

                            {/* Horizontal Date Picker Strip */}
                            <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 custom-scrollbar -mx-2 px-2 scroll-smooth">
                                {nextDays.map((day) => {
                                    const isSelected = formData.preferredDate === day.full;
                                    return (
                                        <button
                                            key={day.full}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, preferredDate: day.full })}
                                            className={cn(
                                                "flex flex-col items-center justify-between min-w-[74px] h-[98px] rounded-2xl border-2 p-2.5 transition-all text-center shrink-0 cursor-pointer",
                                                isSelected
                                                    ? "bg-[var(--color-brand-green)] border-[var(--color-brand-green)] text-white shadow-md shadow-emerald-500/20 scale-105"
                                                    : "bg-[var(--bg-muted)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--color-brand-green)]/50 hover:bg-[var(--bg-card-hover)]"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider",
                                                    isSelected ? "text-white/80" : "text-[var(--text-muted)]"
                                                )}
                                            >
                                                {day.isToday ? "Today" : day.isTomorrow ? "Tmrw" : day.monthName}
                                            </span>

                                            <span
                                                className={cn(
                                                    "text-2xl font-black leading-none my-1",
                                                    isSelected ? "text-white" : "text-[var(--text-primary)]"
                                                )}
                                            >
                                                {day.dateNum}
                                            </span>

                                            <span
                                                className={cn(
                                                    "text-[11px] font-bold",
                                                    isSelected ? "text-white/90" : "text-[var(--text-secondary)]"
                                                )}
                                            >
                                                {day.dayName}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Date Confirmation Banner */}
                            {selectedDateObj && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 flex items-center justify-between text-xs animate-in fade-in duration-300">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" /> Selected Date:
                                    </span>
                                    <span className="font-extrabold text-[var(--text-primary)]">
                                        {selectedDateObj.dayFull}, {selectedDateObj.monthFull} {selectedDateObj.dateNum}, {selectedDateObj.year}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* STEP 2: Time Selection Card */}
                        <div className="bg-[var(--bg-card)] p-6 sm:p-7 rounded-3xl border border-[var(--border-color)] shadow-[var(--shadow-sm)] space-y-5">
                            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-orange-500/15 text-[var(--color-brand-orange)] flex items-center justify-center font-extrabold text-sm">
                                        2
                                    </div>
                                    <div>
                                        <h2 className="font-extrabold text-base sm:text-lg text-[var(--text-primary)] flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-[var(--color-brand-orange)]" />
                                            Choose Preferred Time
                                        </h2>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium">
                                            Select a convenient inspection time slot
                                        </p>
                                    </div>
                                </div>

                                {formData.preferredTime && (
                                    <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 text-xs font-bold px-2.5 py-0.5">
                                        {formData.preferredTime}
                                    </Badge>
                                )}
                            </div>

                            {/* Categorized Time Slot Grid */}
                            <div className="space-y-4">
                                {timeSlotsByPeriod.map(({ period, icon: Icon, slots }) => (
                                    <div key={period} className="space-y-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                            <Icon className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" />
                                            <span>{period}</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                            {slots.map((time) => {
                                                const isSelected = formData.preferredTime === time;
                                                return (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, preferredTime: time })}
                                                        className={cn(
                                                            "h-12 rounded-xl border-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                                                            isSelected
                                                                ? "bg-[var(--color-brand-orange)] border-[var(--color-brand-orange)] text-white shadow-md shadow-orange-500/20 font-extrabold"
                                                                : "bg-[var(--bg-muted)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--color-brand-orange)]/40 hover:bg-[var(--bg-card-hover)]"
                                                        )}
                                                    >
                                                        <Clock className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-[var(--text-muted)]")} />
                                                        {time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* STEP 3: Message & Inspection Focus */}
                        <div className="bg-[var(--bg-card)] p-6 sm:p-7 rounded-3xl border border-[var(--border-color)] shadow-[var(--shadow-sm)] space-y-4">
                            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
                                <div className="h-10 w-10 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-extrabold text-sm">
                                    3
                                </div>
                                <div>
                                    <h2 className="font-extrabold text-base sm:text-lg text-[var(--text-primary)] flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-blue-500" />
                                        Inspection Notes & Questions
                                        <span className="text-xs font-normal text-[var(--text-muted)]">(Optional)</span>
                                    </h2>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                        Let the landlord know any specific areas you wish to inspect
                                    </p>
                                </div>
                            </div>

                            {/* Quick Suggestion Chips */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 uppercase tracking-wider">
                                    <Sparkles className="h-3 w-3 text-amber-500" /> Quick Add Suggestions:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {quickNotes.map((note) => (
                                        <button
                                            key={note}
                                            type="button"
                                            onClick={() => handleAddQuickNote(note)}
                                            className="text-xs bg-[var(--bg-muted)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium"
                                        >
                                            + {note}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                className="w-full h-28 p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] font-medium leading-relaxed transition-all resize-none shadow-inner"
                                placeholder="Example: I would like to check the kitchen cabinetry, parking space, and bathroom water pressure."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Property Details & Booking Summary (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
                        {/* Property Overview Card */}
                        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] shadow-[var(--shadow-sm)] overflow-hidden">
                            <div className="h-44 sm:h-52 relative w-full overflow-hidden bg-[var(--bg-muted)]">
                                <Image
                                    src={primaryImage}
                                    alt={property.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
                                    <div>
                                        <Badge className="bg-[var(--color-brand-green)] text-white font-extrabold text-xs px-2.5 py-1 mb-1 border-none shadow">
                                            {formatPrice(property.pricePerYear)} / yr
                                        </Badge>
                                        <h3 className="font-extrabold text-white text-base truncate drop-shadow">
                                            {property.title}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <p className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5 font-medium leading-relaxed">
                                    <MapPin className="h-4 w-4 text-[var(--color-brand-orange)] shrink-0 mt-0.5" />
                                    <span>
                                        {property.address ? `${property.address}, ` : ""}
                                        {property.city}, {property.state}
                                    </span>
                                </p>

                                {/* Specs Row */}
                                <div className="grid grid-cols-3 gap-2 py-3 border-y border-[var(--border-color)] text-xs text-center font-bold text-[var(--text-secondary)]">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <Bed className="h-4 w-4 text-[var(--color-brand-blue)]" />
                                        <span>{property.bedrooms || 1} Bed</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1.5 border-x border-[var(--border-color)]">
                                        <Bath className="h-4 w-4 text-[var(--color-brand-blue)]" />
                                        <span>{property.bathrooms || 1} Bath</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1.5 truncate">
                                        <Home className="h-4 w-4 text-[var(--color-brand-blue)]" />
                                        <span className="truncate">{property.propertyType || "Apartment"}</span>
                                    </div>
                                </div>

                                {/* Host / Landlord Info */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-9 w-9 rounded-full bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)]">
                                            {property.landlord?.avatar ? (
                                                <img
                                                    src={property.landlord.avatar}
                                                    alt="Host"
                                                    className="h-full w-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <User className="h-4 w-4 text-[var(--text-muted)]" />
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-[var(--text-muted)] font-medium block">
                                                Hosted By
                                            </span>
                                            <span className="text-xs font-bold text-[var(--text-primary)]">
                                                {property.landlord?.firstName} {property.landlord?.lastName}
                                            </span>
                                        </div>
                                    </div>

                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-bold">
                                        Verified Landlord
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Tour Booking Summary & Action Card */}
                        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 shadow-[var(--shadow-sm)] space-y-5">
                            <h3 className="font-extrabold text-base text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center justify-between">
                                <span>Inspection Summary</span>
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold">
                                    100% Free
                                </Badge>
                            </h3>

                            <div className="space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" /> Date:
                                    </span>
                                    <span className="font-bold text-[var(--text-primary)]">
                                        {selectedDateObj
                                            ? `${selectedDateObj.dayName}, ${selectedDateObj.monthName} ${selectedDateObj.dateNum}`
                                            : <span className="text-amber-500 font-semibold">Please select a date</span>}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" /> Time:
                                    </span>
                                    <span className="font-bold text-[var(--text-primary)]">
                                        {formData.preferredTime ? (
                                            formData.preferredTime
                                        ) : (
                                            <span className="text-amber-500 font-semibold">Please select a time</span>
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                                        <Home className="h-3.5 w-3.5" /> Tour Type:
                                    </span>
                                    <span className="font-bold text-[var(--text-primary)]">Guided In-Person Visit</span>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                                    <span className="font-extrabold text-sm text-[var(--text-primary)]">Inspection Fee:</span>
                                    <span className="font-black text-sm text-[var(--color-brand-green)]">₦0 (FREE)</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                className="w-full h-14 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-500/20 transform active:scale-[0.98] transition-all gap-2 cursor-pointer"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                <CalendarCheck className="h-5 w-5" />
                                {submitting ? "Submitting Request..." : "Request Physical Tour"}
                            </Button>

                            {/* Trust & Escrow Guarantee Box */}
                            {(() => {
                                const agentListing = property?.agentListings?.[0];
                                const agent = agentListing?.agent;
                                const agentName = agent?.agentProfile?.businessName || (agent ? `${agent.firstName} ${agent.lastName}` : "");

                                return (
                                    <div className="bg-[var(--bg-muted)] rounded-2xl p-4 border border-[var(--border-color)] space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                                                <ShieldCheck className="h-4 w-4 text-[var(--color-brand-green)] shrink-0" />
                                                <span>Zero Side-Payment Policy</span>
                                            </div>
                                            {agent && (
                                                <button
                                                    type="button"
                                                    onClick={() => setReportModalOpen(true)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-black text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline cursor-pointer transition-colors"
                                                >
                                                    <Flag className="h-3 w-3" />
                                                    Report Agent Fee
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                                            Never pay viewing or agency inspection fees. Complete your physical inspection first. Any partner agent demanding cash inspection fees, registration fees, or fuel money faces an immediate strike and ban.
                                        </p>

                                        {agent && (
                                            <ReportAgentModal
                                                isOpen={reportModalOpen}
                                                onClose={() => setReportModalOpen(false)}
                                                agentId={agent.id}
                                                agentName={agentName}
                                                propertyId={property?.id}
                                                propertyTitle={property?.title}
                                            />
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Modal for alerts */}
            <StatusModal
                open={modal.open}
                onClose={() => setModal({ ...modal, open: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </div>
    );
}

