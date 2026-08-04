"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { useUser } from "@clerk/nextjs";
import { StatusModal } from "@/components/ui/StatusModal";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    MessageCircle,
    CheckCircle2,
    CalendarDays,
    ChevronRight
} from "lucide-react";

export default function ScheduleTourPage() {
    const { id } = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { user } = useUser();

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
                title: "Incomplete Details",
                message: "Please select both a preferred date and time for your tour.",
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
        } catch (error) {
            console.error("Failed to schedule tour:", error);
            setModal({
                open: true,
                title: "Request Failed",
                message: "We couldn't send your request. Please check your connection and try again.",
                type: "error"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="h-12 w-12 border-4 border-[var(--color-brand-blue)] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!property) return <div className="p-20 text-center">Property not found</div>;

    if (submitted) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="h-12 w-12 text-[var(--color-brand-green)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Request Sent!</h1>
                        <p className="text-gray-600 leading-relaxed">
                            Landlord <strong>{property.landlord?.firstName}</strong> has been notified. We'll message you once they confirm.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button className="w-full h-14 bg-[var(--color-brand-blue)] font-black text-lg rounded-xl" onClick={() => router.push("/dashboard")}>
                            Back to Dashboard
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-14 border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-all"
                            onClick={() => router.push(`/properties/${property.id}`)}
                        >
                            Return to Property
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Generate next 14 days for the custom date picker
    const getNextDays = () => {
        const days = [];
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.push({
                full: date.toISOString().split("T")[0],
                day: date.toLocaleDateString("en-US", { weekday: "short" }),
                date: date.getDate(),
                month: date.toLocaleDateString("en-US", { month: "short" }),
            });
        }
        return days;
    };

    const timeSlots = [
        "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
    ];

    const nextDays = getNextDays();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-16 z-30 shadow-subtle">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-extrabold text-[var(--color-brand-blue)]">Schedule a Physical Tour</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Header info card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-5 items-center">
                        <div className="h-20 w-20 bg-gray-100 rounded-xl overflow-hidden relative flex-shrink-0 shadow-inner border border-gray-50">
                            <img
                                src={property.images?.[0]?.url || "https://images.unsplash.com/photo-1600585154340-be6191da96a0?auto=format&fit=crop&w=800&q=80"}
                                className="object-cover w-full h-full"
                                alt={property.title}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-extrabold text-lg text-gray-900 truncate">{property.title}</h2>
                            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                                <MapPin className="h-3.5 w-3.5 text-orange-500" />
                                {property.city}, {property.state}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs font-bold px-2 py-1 bg-green-50 text-[var(--color-brand-green)] rounded-md border border-[var(--color-brand-green)]/10">Hosted by {property.landlord?.firstName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-10 relative overflow-hidden">
                        {/* Custom Date Picker */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-[var(--color-brand-green)]" />
                                    Choose Date
                                </h3>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Next 14 Days</span>
                            </div>

                            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 scroll-smooth">
                                {nextDays.map((day) => (
                                    <button
                                        key={day.full}
                                        onClick={() => setFormData({ ...formData, preferredDate: day.full })}
                                        className={cn(
                                            "flex flex-col items-center justify-center min-w-[70px] h-[90px] rounded-2xl border-2 transition-all p-2",
                                            formData.preferredDate === day.full
                                                ? "bg-[var(--color-brand-blue)] border-[var(--color-brand-blue)] text-white shadow-lg shadow-blue-100 scale-105"
                                                : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-white"
                                        )}
                                    >
                                        <span className={cn("text-[10px] font-black uppercase tracking-tighter mb-1", formData.preferredDate === day.full ? "text-white/70" : "text-gray-400")}>
                                            {day.month}
                                        </span>
                                        <span className="text-xl font-black">{day.date}</span>
                                        <span className={cn("text-[10px] font-bold", formData.preferredDate === day.full ? "text-white/80" : "text-gray-500")}>
                                            {day.day}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Time Picker */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-500" />
                                Select Preferred Time
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {timeSlots.map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => setFormData({ ...formData, preferredTime: time })}
                                        className={cn(
                                            "h-12 rounded-xl border-2 text-sm font-black transition-all",
                                            formData.preferredTime === time
                                                ? "bg-[var(--color-brand-green)] border-[var(--color-brand-green)] text-white shadow-lg shadow-green-50"
                                                : "bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-white"
                                        )}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Message Box */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-gray-900">Add a Message <span className="text-sm font-medium text-gray-400">(Optional)</span></h3>
                            <textarea
                                className="w-full h-32 p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-[var(--color-brand-green)] text-gray-900 placeholder:text-gray-400 font-bold leading-relaxed shadow-inner transition-all"
                                placeholder="Example: I'd like to check the kitchen and parking space."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="pt-6">
                            <Button
                                className="w-full h-16 bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90 font-black text-xl rounded-2xl shadow-xl shadow-blue-100 transform active:scale-[0.98] transition-all disabled:opacity-50"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                <MessageCircle className="h-6 w-6 mr-3" />
                                {submitting ? "Sending Request..." : "Request Physical Tour"}
                            </Button>
                            <div className="mt-8 flex items-center justify-center gap-3 py-3 border-t border-gray-50">
                                <div className="flex items-center gap-1.5 transition-all hover:scale-105 cursor-default">
                                    <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Escrow Protected Visit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
