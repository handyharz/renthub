"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
    ArrowLeft, ArrowRight, Check, Upload, X, MapPin, Home,
    DollarSign, Image as ImageIcon, Sparkles, ShieldCheck,
    Bed, Bath, Car, Zap, Droplets, Calendar, Layers,
    ChevronRight, Eye, CheckCircle2, Building2, Users,
    Clock, AlertCircle,
} from "lucide-react";
import api from "@/lib/api";
import { uploadListingImages } from "@/lib/uploadListingImages";
import MapPicker from "@/components/map/MapPicker";
import { PROPERTY_TYPES } from "@/lib/constants";
import { NIGERIAN_LOCATIONS, ALL_STATES } from "@/lib/locations";
import { formatPrice, cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const AMENITIES = [
    "24/7 Power", "Backup Generator", "Solar Inverter", "Borehole",
    "Gated Security", "CCTV Cameras", "Electric Fence", "Swimming Pool",
    "Gym", "Playground", "Fiber Internet", "DSTV Ready", "Covered Parking",
    "Fitted Kitchen", "Gas Cooker",
];

const PAYMENT_TERMS = [
    { value: "ONE_YEAR", label: "One Year (Standard)" },
    { value: "TWO_YEARS", label: "Two Years" },
    { value: "THREE_YEARS", label: "Three Years" },
    { value: "FLEXIBLE", label: "Flexible (Negotiable)" },
];

const POWER_SUPPLY_TYPES = [
    { value: "GRID_ONLY", label: "National Grid Only" },
    { value: "GRID_AND_GENERATOR", label: "Grid & Dedicated Generator" },
    { value: "GRID_AND_SOLAR", label: "Grid & Solar Inverter" },
    { value: "GENERATOR_ONLY", label: "Generator Only" },
    { value: "SOLAR_ONLY", label: "Solar Inverter Only" },
    { value: "MIXED", label: "Mixed Supply (24/7 Power)" },
];

const WATER_SUPPLY_TYPES = [
    { value: "BOREHOLE", label: "Clean Borehole" },
    { value: "TREATED_WATER", label: "Treated Pipe Water" },
    { value: "BOTH", label: "Both (Borehole & Treated Water)" },
    { value: "TANK_ONLY", label: "Storage Tank Only" },
];

// ─── Form State Interface ─────────────────────────────────────────────────────

interface FormData {
    // Step 0: Client selection
    landlordId: string;

    // Step 1: Basics
    title: string;
    propertyType: string;
    pricePerYear: string;
    cautionFee: string;
    legalFee: string;
    serviceFee: string;
    negotiable: boolean;
    description: string;

    // Step 2: Location
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number | null;
    longitude: number | null;

    // Step 3: Details
    bedrooms: string;
    bathrooms: string;
    toilets: string;
    parkingSpaces: string;
    floorArea: string;
    furnished: boolean;
    serviced: boolean;
    petsAllowed: boolean;
    amenities: string[];
    paymentTerms: string;
    powerSupply: string;
    waterSupply: string;

    // Step 4: Photos
    images: string[];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AddPropertyForClientPage() {
    const { user } = useUser();
    const router = useRouter();

    const [step, setStep] = useState(0); // 0 = client picker, 1-4 = form steps
    const [loading, setLoading] = useState(false);
    const [stepError, setStepError] = useState<string | null>(null);

    // Landlords
    const [landlords, setLandlords] = useState<any[]>([]);
    const [loadingLandlords, setLoadingLandlords] = useState(true);

    const [formData, setFormData] = useState<FormData>({
        landlordId: "",
        title: "", propertyType: "", pricePerYear: "",
        cautionFee: "0", legalFee: "0", serviceFee: "0",
        negotiable: false, description: "",
        address: "", city: "", state: "", zipCode: "",
        latitude: null, longitude: null,
        bedrooms: "", bathrooms: "", toilets: "", parkingSpaces: "0",
        floorArea: "", furnished: false, serviced: false, petsAllowed: false,
        amenities: [], paymentTerms: "ONE_YEAR",
        powerSupply: "GRID_ONLY", waterSupply: "BOREHOLE",
        images: [],
    });

    // Fetch authorized landlords
    useEffect(() => {
        if (!user) return;
        api.get(`/agents/me/authorized-landlords?clerkId=${user.id}`)
            .then(r => setLandlords(r.data.data || []))
            .catch(() => setLandlords([]))
            .finally(() => setLoadingLandlords(false));
    }, [user]);

    const updateField = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // ─── Validation ──────────────────────────────────────────────────────────

    const validateStep = (s: number): boolean => {
        setStepError(null);
        if (s === 0) {
            if (!formData.landlordId) {
                setStepError("Please select a client / landlord to list for.");
                return false;
            }
        }
        if (s === 1) {
            if (!formData.title.trim()) { setStepError("Please enter a Property Title."); return false; }
            if (!formData.propertyType) { setStepError("Please select a Property Type."); return false; }
            if (!formData.pricePerYear || Number(formData.pricePerYear) <= 0) { setStepError("Please enter a valid Annual Rent."); return false; }
            if (!formData.description.trim()) { setStepError("Please enter a Property Description."); return false; }
        }
        if (s === 2) {
            if (!formData.address.trim()) { setStepError("Please enter the Street Address."); return false; }
            if (!formData.state) { setStepError("Please select a State."); return false; }
            if (!formData.city) { setStepError("Please select an LGA / City."); return false; }
        }
        if (s === 3) {
            if (!formData.bedrooms || Number(formData.bedrooms) < 0) { setStepError("Please specify the number of Bedrooms."); return false; }
            if (!formData.bathrooms || Number(formData.bathrooms) < 0) { setStepError("Please specify the number of Bathrooms."); return false; }
        }
        if (s === 4) {
            if (formData.images.length === 0) { setStepError("Please upload at least 1 Property Photo."); return false; }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(s => Math.min(4, s + 1));
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleBack = () => {
        setStepError(null);
        setStep(s => Math.max(0, s - 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleStepClick = (target: number) => {
        if (target < step) {
            setStepError(null);
            setStep(target);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            for (let s = 0; s < target; s++) {
                if (!validateStep(s)) { setStep(s); return; }
            }
            setStep(target);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // ─── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!user) return;
        for (let s = 0; s <= 4; s++) {
            if (!validateStep(s)) { setStep(s); return; }
        }
        setLoading(true);
        try {
            await api.post(`/agents/me/properties?clerkId=${user.id}`, {
                landlordId: formData.landlordId,
                title: formData.title,
                propertyType: formData.propertyType,
                pricePerYear: parseInt(formData.pricePerYear),
                cautionFee: parseInt(formData.cautionFee || "0"),
                legalFee: parseInt(formData.legalFee || "0"),
                serviceFee: parseInt(formData.serviceFee || "0"),
                negotiable: formData.negotiable,
                description: formData.description,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                latitude: formData.latitude,
                longitude: formData.longitude,
                bedrooms: parseInt(formData.bedrooms),
                bathrooms: parseInt(formData.bathrooms),
                toilets: parseInt(formData.toilets || formData.bathrooms),
                parkingSpaces: parseInt(formData.parkingSpaces || "0"),
                floorArea: formData.floorArea ? parseFloat(formData.floorArea) : undefined,
                furnished: formData.furnished,
                serviced: formData.serviced,
                petsAllowed: formData.petsAllowed,
                amenities: formData.amenities,
                paymentTerms: formData.paymentTerms,
                powerSupply: formData.powerSupply,
                waterSupply: formData.waterSupply,
                images: formData.images,
            });
            toast.success("Property created as DRAFT!", {
                description: "The landlord has been notified to review and publish the listing.",
            });
            router.push("/dashboard?tab=agent");
        } catch (err: any) {
            setStepError(err.response?.data?.message || "Failed to create property.");
        } finally {
            setLoading(false);
        }
    };

    // ─── Step Definitions ─────────────────────────────────────────────────────

    const formSteps = [
        { number: 1, title: "Basics & Pricing", icon: Home, desc: "Title, type & rent" },
        { number: 2, title: "Location & Pin", icon: MapPin, desc: "Address & map coords" },
        { number: 3, title: "Details & Utilities", icon: Layers, desc: "Rooms, power & terms" },
        { number: 4, title: "Photos & Media", icon: ImageIcon, desc: "High-res images" },
    ];

    const tips = [
        "Accurate pricing attracts verified tenants 3x faster on RentHub.",
        "Pinning the exact building location allows tenants to schedule physical tours confidently.",
        "Highlighting reliable power supply and borehole water significantly boosts listing engagement.",
        "Listings with 4+ bright, daylight photos receive up to 80% more inspection bookings.",
    ];

    const progressPct = step === 0 ? 0 : step * 25;
    const selectedLandlord = landlords.find(l => l.id === formData.landlordId);
    const authorizedLandlords = landlords.filter(l => !l.pendingApproval);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-24">
            {/* Sticky Header */}
            <div className="sticky top-16 z-30 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/dashboard?tab=agent")}
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl hover:bg-[var(--bg-muted)] border border-[var(--border-color)] shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0">
                            {/* Breadcrumb: hidden on mobile */}
                            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                                <Link href="/dashboard?tab=agent" className="hover:text-[var(--text-primary)] transition-colors">
                                    Agent Dashboard
                                </Link>
                                <ChevronRight className="h-3 w-3 shrink-0" />
                                <span className="text-[var(--text-primary)] font-semibold">List for Client</span>
                            </div>
                            <h1 className="text-sm sm:text-lg font-extrabold text-[var(--text-primary)] truncate sm:mt-0.5">
                                Create Listing for Client
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {step > 0 && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-2.5 sm:px-3 py-1 text-xs">
                                <span className="sm:hidden">Step {step}/4</span>
                                <span className="hidden sm:inline">Step {step} of 4 • {progressPct}% Complete</span>
                            </Badge>
                        )}
                        {selectedLandlord && (
                            <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold px-3 py-1 hidden sm:flex items-center gap-1.5">
                                <Users className="h-3 w-3" />
                                {selectedLandlord.firstName} {selectedLandlord.lastName}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[var(--bg-muted)] h-1.5 overflow-hidden">
                    <div
                        className="bg-[var(--color-brand-green)] h-full transition-all duration-400 ease-out"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                {/* ── STEP 0: CLIENT PICKER ── */}
                {step === 0 && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-[var(--bg-card)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-sm)] border border-[var(--border-color)] space-y-6">
                            <div>
                                <h2 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    Select Client / Landlord
                                </h2>
                                <p className="text-xs text-[var(--text-secondary)] font-medium">
                                    Choose the landlord you're creating this listing for. Only clients who have authorized you appear below.
                                </p>
                            </div>

                            {loadingLandlords ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-20 bg-[var(--bg-muted)] rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            ) : authorizedLandlords.length === 0 ? (
                                <div className="text-center py-10 space-y-4">
                                    <Building2 className="h-12 w-12 text-[var(--text-muted)] mx-auto" />
                                    <div>
                                        <p className="font-bold text-[var(--text-secondary)]">No authorized clients yet</p>
                                        <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                                            You need at least one landlord to authorize you before you can create listings on their behalf.
                                        </p>
                                    </div>
                                    {/* Show pending */}
                                    {landlords.some(l => l.pendingApproval) && (
                                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-left">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Pending Authorizations</p>
                                            </div>
                                            <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                                                The following landlords need to go to <strong>Agent Partners</strong> tab in their dashboard and click <strong>Authorize Agent</strong>:
                                            </p>
                                            <div className="space-y-2">
                                                {landlords.filter(l => l.pendingApproval).map((l: any) => (
                                                    <div key={l.id} className="flex items-center gap-2 p-2 bg-amber-100/50 dark:bg-amber-900/30 rounded-xl">
                                                        <div className="h-7 w-7 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs font-bold text-amber-800 dark:text-amber-300">
                                                            {l.firstName?.[0]}{l.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-[var(--text-primary)]">{l.firstName} {l.lastName}</p>
                                                            {l.pendingProperties?.map((p: any) => (
                                                                <p key={p.id} className="text-[11px] text-[var(--text-muted)]">↳ {p.title}</p>
                                                            ))}
                                                        </div>
                                                        <span className="ml-auto text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-700">
                                                            Awaiting Auth
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <Button variant="outline" onClick={() => router.push("/dashboard?tab=agent")} className="w-full">
                                        Back to Dashboard
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Authorized landlord cards */}
                                    <div className="space-y-3">
                                        {authorizedLandlords.map((l: any) => (
                                            <button
                                                key={l.id}
                                                type="button"
                                                onClick={() => updateField("landlordId", l.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer",
                                                    formData.landlordId === l.id
                                                        ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 shadow-sm"
                                                        : "border-[var(--border-color)] bg-[var(--bg-muted)]/40 hover:bg-[var(--bg-muted)]"
                                                )}
                                            >
                                                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-sm shrink-0">
                                                    {l.avatar ? (
                                                        <Image src={l.avatar} alt="" width={48} height={48} className="rounded-xl object-cover" />
                                                    ) : (
                                                        `${l.firstName?.[0]}${l.lastName?.[0]}`
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-[var(--text-primary)]">{l.firstName} {l.lastName}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{l.phone || l.email}</p>
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                                                        {l.agreedCommissionPct}% commission agreed
                                                    </p>
                                                </div>
                                                <div className={cn(
                                                    "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                    formData.landlordId === l.id
                                                        ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]"
                                                        : "border-[var(--border-color)]"
                                                )}>
                                                    {formData.landlordId === l.id && <Check className="h-3.5 w-3.5 text-white" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Pending notice */}
                                    {landlords.some(l => l.pendingApproval) && (
                                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                                            <Clock className="h-3.5 w-3.5 inline mr-1" />
                                            <strong>{landlords.filter(l => l.pendingApproval).length} more</strong> landlord(s) pending authorization — not shown above.
                                        </div>
                                    )}

                                    {/* Error */}
                                    {stepError && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold rounded-2xl flex items-center gap-3">
                                            <X className="h-4 w-4 shrink-0" />
                                            <span>{stepError}</span>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-[var(--border-color)]">
                                        <Button
                                            onClick={handleNext}
                                            disabled={!formData.landlordId}
                                            className="w-full bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold h-12 rounded-xl gap-2 shadow-md shadow-emerald-500/20"
                                        >
                                            Continue to Property Details
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ── STEPS 1-4: PROPERTY FORM ── */}
                {step > 0 && (
                    <>
                        {/* Step tracker */}
                        <div className="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-5 shadow-[var(--shadow-sm)] border border-[var(--border-color)] mb-8">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                {formSteps.map(s => {
                                    const Icon = s.icon;
                                    const isActive = step === s.number;
                                    const isCompleted = step > s.number;
                                    return (
                                        <button
                                            key={s.number}
                                            type="button"
                                            onClick={() => handleStepClick(s.number)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                                                isActive
                                                    ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 text-[var(--text-primary)] shadow-sm"
                                                    : isCompleted
                                                        ? "border-emerald-500/20 bg-emerald-500/5 text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                                                        : "border-[var(--border-color)] bg-[var(--bg-muted)]/50 text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors",
                                                isActive ? "bg-[var(--color-brand-green)] text-white shadow-sm"
                                                    : isCompleted ? "bg-emerald-500 text-white"
                                                        : "bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-muted)]"
                                            )}>
                                                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={cn("text-xs font-extrabold truncate", isActive ? "text-[var(--color-brand-green)]" : "text-[var(--text-primary)]")}>
                                                    {s.title}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-muted)] truncate hidden sm:block">{s.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2-Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* LEFT: Form */}
                            <div className="lg:col-span-7 space-y-6">
                                <div className="bg-[var(--bg-card)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-sm)] border border-[var(--border-color)]">
                                    {step === 1 && <Step1Basics formData={formData} updateField={updateField} />}
                                    {step === 2 && <Step2Location formData={formData} updateField={updateField} />}
                                    {step === 3 && <Step3Details formData={formData} updateField={updateField} />}
                                    {step === 4 && <Step4Photos formData={formData} updateField={updateField} />}

                                    {/* Error banner */}
                                    {stepError && (
                                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-xs sm:text-sm font-bold rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
                                            <X className="h-4 w-4 shrink-0" />
                                            <span>{stepError}</span>
                                        </div>
                                    )}

                                    {/* Navigation */}
                                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-color)] gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleBack}
                                            className="gap-2 text-xs sm:text-sm font-bold rounded-xl h-11 px-4 sm:px-5"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            {step === 1 ? "Change Client" : "Previous"}
                                        </Button>

                                        {step < 4 ? (
                                            <Button
                                                type="button"
                                                onClick={handleNext}
                                                className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs sm:text-sm gap-2 rounded-xl h-11 px-6 shadow-md shadow-emerald-500/20"
                                            >
                                                Next: {formSteps[step]?.title}
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={handleSubmit}
                                                disabled={loading}
                                                className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs sm:text-sm gap-2 rounded-xl h-11 px-6 shadow-md shadow-emerald-500/20"
                                            >
                                                {loading ? "Creating Listing..." : "Create DRAFT Listing"}
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Preview & Tips */}
                            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
                                {/* Client Badge */}
                                {selectedLandlord && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-sm shrink-0">
                                            {selectedLandlord.avatar ? (
                                                <Image src={selectedLandlord.avatar} alt="" width={40} height={40} className="rounded-xl object-cover" />
                                            ) : `${selectedLandlord.firstName?.[0]}${selectedLandlord.lastName?.[0]}`}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">Listing for</p>
                                            <p className="font-bold text-blue-900 dark:text-blue-200 truncate">{selectedLandlord.firstName} {selectedLandlord.lastName}</p>
                                            <p className="text-[11px] text-blue-700 dark:text-blue-400">{selectedLandlord.agreedCommissionPct}% commission · Draft → Landlord publishes</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setStep(0); setStepError(null); }}
                                            className="text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:underline shrink-0"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}

                                {/* Live Preview */}
                                <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] shadow-[var(--shadow-sm)] overflow-hidden">
                                    <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-[var(--color-brand-green)]" />
                                            <span className="font-extrabold text-xs text-[var(--text-primary)]">Tenant Preview</span>
                                        </div>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                        </span>
                                    </div>

                                    <div className="h-44 sm:h-52 relative w-full bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                                        {formData.images.length > 0 ? (
                                            <Image src={formData.images[0]} alt="Preview" fill className="object-cover" />
                                        ) : (
                                            <div className="text-center p-6 text-[var(--text-muted)] space-y-2">
                                                <ImageIcon className="h-10 w-10 mx-auto opacity-40" />
                                                <p className="text-xs font-semibold">Cover photo will appear here</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <Badge className="bg-[var(--color-brand-green)] text-white font-extrabold text-xs px-2.5 py-1 mb-1 border-none shadow">
                                                {formData.pricePerYear ? `${formatPrice(Number(formData.pricePerYear))} / yr` : "₦0 / yr"}
                                            </Badge>
                                            <h3 className="font-extrabold text-white text-sm truncate drop-shadow max-w-[260px]">
                                                {formData.title || "Untitled Property"}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="p-4 sm:p-5 space-y-4">
                                        <p className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5 font-medium">
                                            <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                                            <span className="truncate">{formData.city || "City"}, {formData.state || "State, Nigeria"}</span>
                                        </p>

                                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-[var(--border-color)] text-xs text-center font-bold text-[var(--text-secondary)]">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Bed className="h-3.5 w-3.5 text-blue-500" />
                                                <span>{formData.bedrooms || 0} Bed</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-1.5 border-x border-[var(--border-color)]">
                                                <Bath className="h-3.5 w-3.5 text-blue-500" />
                                                <span>{formData.bathrooms || 0} Bath</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Car className="h-3.5 w-3.5 text-blue-500" />
                                                <span>{formData.parkingSpaces || 0} Park</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {formData.furnished && <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Furnished</Badge>}
                                            {formData.serviced && <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Serviced</Badge>}
                                            {formData.amenities?.slice(0, 3).map(a => (
                                                <Badge key={a} variant="outline" className="text-[10px] border-[var(--border-color)] text-[var(--text-secondary)]">{a}</Badge>
                                            ))}
                                            {formData.amenities?.length > 3 && (
                                                <Badge variant="outline" className="text-[10px] border-[var(--border-color)] text-[var(--text-muted)]">+{formData.amenities.length - 3} more</Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold">
                                                    {selectedLandlord?.firstName?.[0] || "L"}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-[var(--text-muted)] font-medium block leading-none">Listed by Agent for</span>
                                                    <span className="text-xs font-bold text-[var(--text-primary)]">{selectedLandlord ? `${selectedLandlord.firstName} ${selectedLandlord.lastName}` : "Client"}</span>
                                                </div>
                                            </div>
                                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">Draft</Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Tip Card */}
                                <div className="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-5 border border-[var(--border-color)] shadow-[var(--shadow-sm)] space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                                        <span>Agent Listing Tip</span>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                                        {tips[step - 1]}
                                    </p>
                                </div>

                                {/* Draft notice */}
                                <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
                                        <strong className="text-[var(--text-secondary)]">📋 How this works:</strong> Once you submit, this listing is saved as a <strong>DRAFT</strong> under {selectedLandlord ? `${selectedLandlord.firstName}'s` : "the landlord's"} account. They'll receive a notification to review the details and publish when ready. Your delegation is automatically set to AUTHORIZED at the agreed {selectedLandlord?.agreedCommissionPct}% commission.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── STEP 1: BASICS & PRICING ─────────────────────────────────────────────────

function Step1Basics({ formData, updateField }: { formData: FormData; updateField: any }) {
    const titleTemplates = [
        "Luxury 3-Bedroom Flat with 24/7 Power",
        "Spacious Semi-Detached Duplex with BQ",
        "Modern Studio Apartment in Prime Location",
        "Executive 2-Bedroom Serviced Apartment",
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                    <Home className="h-5 w-5 text-[var(--color-brand-green)]" />
                    Property Title & Basic Information
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Create an attractive and descriptive title for your client's property</p>
            </div>

            {/* Title */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Property Title *</label>
                <Input
                    value={formData.title}
                    onChange={e => updateField("title", e.target.value)}
                    placeholder="e.g., Luxury 3-Bedroom Apartment in Lekki Phase 1"
                    className="w-full h-11 text-sm font-semibold"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> Templates:</span>
                    {titleTemplates.map(t => (
                        <button key={t} type="button" onClick={() => updateField("title", t)}
                            className="text-[11px] bg-[var(--bg-muted)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 font-medium transition-all">
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Property Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {PROPERTY_TYPES.map(type => {
                        const isSelected = formData.propertyType === type.value;
                        return (
                            <button key={type.value} type="button" onClick={() => updateField("propertyType", type.value)}
                                className={cn("p-3 rounded-xl border-2 text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer",
                                    isSelected ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 text-[var(--text-primary)] shadow-sm"
                                        : "border-[var(--border-color)] bg-[var(--bg-muted)]/40 hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                                )}>
                                <span className="truncate">{type.label}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-[var(--color-brand-green)] shrink-0 ml-1.5" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Rent */}
            <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Annual Rent (₦) *</label>
                    {formData.pricePerYear && Number(formData.pricePerYear) > 0 && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-extrabold">
                            {formatPrice(Number(formData.pricePerYear))} / year
                        </Badge>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                        <Input type="number" value={formData.pricePerYear} onChange={e => updateField("pricePerYear", e.target.value)}
                            placeholder="e.g., 2500000" className="w-full h-11 text-base font-bold" />
                    </div>
                    <label className="flex items-center gap-2 p-2.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl cursor-pointer shrink-0">
                        <input type="checkbox" checked={formData.negotiable} onChange={e => updateField("negotiable", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded accent-[var(--color-brand-green)]" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Rent Negotiable</span>
                    </label>
                </div>
            </div>

            {/* Fees */}
            <div className="pt-4 border-t border-[var(--border-color)] space-y-4">
                <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[var(--color-brand-green)]" /> Additional Fees & Deposit
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: "Caution Deposit (₦)", key: "cautionFee", desc: "Refundable deposit for damages" },
                        { label: "Legal & Agreement Fee (₦)", key: "legalFee", desc: "Tenancy documentation cost" },
                        { label: "Service Charge (₦)", key: "serviceFee", desc: "Security, waste, cleaning, etc." },
                    ].map(f => (
                        <div key={f.key} className="space-y-1">
                            <label className="block text-xs font-bold text-[var(--text-primary)]">{f.label}</label>
                            <p className="text-[11px] text-[var(--text-muted)] font-medium">{f.desc}</p>
                            <Input type="number" value={(formData as any)[f.key]}
                                onChange={e => updateField(f.key as keyof FormData, e.target.value)}
                                placeholder="0" className="h-10 text-sm font-semibold" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Property Description *</label>
                <textarea
                    value={formData.description}
                    onChange={e => updateField("description", e.target.value)}
                    placeholder="Describe the property in detail. Highlight unique features like 24/7 security, reliable power supply, spacious bedrooms, and proximity to major routes..."
                    rows={4}
                    className="w-full p-3.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] font-medium leading-relaxed resize-none shadow-inner"
                />
            </div>
        </div>
    );
}

// ─── STEP 2: LOCATION & MAP ───────────────────────────────────────────────────

function Step2Location({ formData, updateField }: { formData: FormData; updateField: any }) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                    <MapPin className="h-5 w-5 text-orange-500" />
                    Property Location & Address
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Help tenants discover this home by specifying its accurate location</p>
            </div>

            <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Street Address *</label>
                <Input value={formData.address} onChange={e => updateField("address", e.target.value)}
                    placeholder="e.g., 15 Admiralty Way, Lekki Phase 1" className="w-full h-11 text-sm font-semibold" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">State *</label>
                    <select value={formData.state}
                        onChange={e => { updateField("state", e.target.value); updateField("city", ""); }}
                        className="w-full h-11 px-3.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] cursor-pointer">
                        <option value="">Select State</option>
                        {ALL_STATES.map(s => <option key={s} value={s}>{s === "FCT" ? "Abuja (FCT)" : s}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">LGA / City / Area *</label>
                    <select value={formData.city} onChange={e => updateField("city", e.target.value)} disabled={!formData.state}
                        className="w-full h-11 px-3.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-muted)] cursor-pointer">
                        <option value="">{formData.state ? "Select Area / LGA" : "Choose state first"}</option>
                        {formData.state && NIGERIAN_LOCATIONS[formData.state]?.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Postal / Zip Code <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                </label>
                <Input value={formData.zipCode} onChange={e => updateField("zipCode", e.target.value)}
                    placeholder="e.g., 105102" className="w-full h-10 text-xs sm:text-sm font-medium" />
            </div>

            <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Interactive Map Pin</label>
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Click on the map to pin the building's exact location</p>
                    </div>
                    {formData.latitude && formData.longitude && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-mono font-bold">
                            Pinned: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                        </Badge>
                    )}
                </div>
                <div className="rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-sm">
                    <MapPicker
                        onLocationSelect={(lat, lng) => { updateField("latitude", lat); updateField("longitude", lng); }}
                        initialLocation={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : undefined}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── STEP 3: DETAILS & UTILITIES ─────────────────────────────────────────────

function Step3Details({ formData, updateField }: { formData: FormData; updateField: any }) {
    const toggleAmenity = (amenity: string) => {
        const current = formData.amenities || [];
        updateField("amenities", current.includes(amenity) ? current.filter((a: string) => a !== amenity) : [...current, amenity]);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                    <Layers className="h-5 w-5 text-blue-500" />
                    Property Specifications & Utilities
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Accurate specs on rooms, utilities, and features help tenants make faster decisions</p>
            </div>

            {/* Room Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: "Bedrooms *", key: "bedrooms", icon: Bed },
                    { label: "Bathrooms *", key: "bathrooms", icon: Bath },
                    { label: "Toilets", key: "toilets", icon: Home },
                    { label: "Parking", key: "parkingSpaces", icon: Car },
                ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                        <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                            <f.icon className="h-3.5 w-3.5 text-blue-500" /> {f.label}
                        </label>
                        <Input type="number" min="0" value={(formData as any)[f.key]}
                            onChange={e => updateField(f.key as keyof FormData, e.target.value)}
                            placeholder="0" className="h-11 font-bold text-center" />
                    </div>
                ))}
            </div>

            {/* Floor Area */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Floor Area (sqm) <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                </label>
                <Input type="number" value={formData.floorArea} onChange={e => updateField("floorArea", e.target.value)}
                    placeholder="e.g., 140" className="w-full h-10 text-xs sm:text-sm font-medium" />
            </div>

            {/* Key Features */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Key Features</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { label: "Furnished Home", key: "furnished" },
                        { label: "Fully Serviced", key: "serviced" },
                        { label: "Pets Allowed", key: "petsAllowed" },
                    ].map(f => (
                        <label key={f.key} className="flex items-center gap-3 p-3 bg-[var(--bg-muted)]/50 border border-[var(--border-color)] rounded-xl cursor-pointer hover:bg-[var(--bg-muted)] transition-all">
                            <input type="checkbox" checked={(formData as any)[f.key]}
                                onChange={e => updateField(f.key as keyof FormData, e.target.checked)}
                                className="w-4 h-4 text-[var(--color-brand-green)] rounded accent-[var(--color-brand-green)]" />
                            <span className="text-xs font-bold text-[var(--text-primary)]">{f.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Utilities */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--border-color)]">
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[var(--color-brand-green)]" /> Lease Duration *
                    </label>
                    <select value={formData.paymentTerms} onChange={e => updateField("paymentTerms", e.target.value)}
                        className="w-full h-11 px-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                        {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-500" /> Power Supply *
                    </label>
                    <select value={formData.powerSupply} onChange={e => updateField("powerSupply", e.target.value)}
                        className="w-full h-11 px-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                        {POWER_SUPPLY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-blue-500" /> Water Supply *
                    </label>
                    <select value={formData.waterSupply} onChange={e => updateField("waterSupply", e.target.value)}
                        className="w-full h-11 px-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                        {WATER_SUPPLY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Amenities */}
            <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Amenities & Facilities</label>
                    <span className="text-[11px] font-bold text-[var(--color-brand-green)]">{formData.amenities?.length || 0} selected</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {AMENITIES.map(amenity => {
                        const isSelected = formData.amenities?.includes(amenity);
                        return (
                            <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                                className={cn("p-2.5 sm:p-3 rounded-xl border-2 text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer",
                                    isSelected ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 text-[var(--text-primary)] shadow-sm"
                                        : "border-[var(--border-color)] bg-[var(--bg-muted)]/40 hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                                )}>
                                <span className="truncate">{amenity}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-[var(--color-brand-green)] shrink-0 ml-1.5" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── STEP 4: PHOTOS & MEDIA ───────────────────────────────────────────────────

function Step4Photos({ formData, updateField }: { formData: FormData; updateField: any }) {
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const urls = await uploadListingImages(Array.from(files));
            updateField("images", [...formData.images, ...urls]);
        } catch {
            toast.error("Failed to upload photos. Please check your connection.");
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (i: number) => updateField("images", formData.images.filter((_: string, idx: number) => idx !== i));
    const setCover = (i: number) => {
        const imgs = [...formData.images];
        const [cover] = imgs.splice(i, 1);
        imgs.unshift(cover);
        updateField("images", imgs);
    };
    const moveImage = (from: number, dir: "left" | "right") => {
        const imgs = [...formData.images];
        const to = dir === "left" ? from - 1 : from + 1;
        if (to < 0 || to >= imgs.length) return;
        [imgs[from], imgs[to]] = [imgs[to], imgs[from]];
        updateField("images", imgs);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                    <ImageIcon className="h-5 w-5 text-[var(--color-brand-green)]" />
                    Property Photos & Gallery
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Upload high-quality photos. The first photo will be the listing cover.</p>
            </div>

            <label className="block w-full p-8 sm:p-10 border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-muted)]/40 hover:bg-[var(--bg-muted)]/80 hover:border-[var(--color-brand-green)] rounded-3xl transition-all cursor-pointer text-center">
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                <div className="space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] flex items-center justify-center mx-auto shadow-inner">
                        <Upload className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-sm font-extrabold text-[var(--text-primary)]">
                            {uploading ? "Uploading Photos to Cloud..." : "Click or drag photos here to upload"}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                            Supports PNG, JPG, WEBP up to 10MB each • 4+ photos recommended
                        </p>
                    </div>
                </div>
            </label>

            {formData.images.length > 0 && (
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                            {formData.images.length} Photo{formData.images.length > 1 ? "s" : ""} Uploaded
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] font-medium">Hover to reorder or set cover</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {formData.images.map((url: string, index: number) => (
                            <div key={index} className="relative group rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-muted)] aspect-video">
                                <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                {index === 0 && (
                                    <Badge className="absolute top-2 left-2 bg-[var(--color-brand-green)] text-white text-[10px] font-extrabold border-none shadow-md">Cover Photo</Badge>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-2.5">
                                    <div className="flex justify-between items-center">
                                        {index !== 0 ? (
                                            <button type="button" onClick={() => setCover(index)}
                                                className="px-2.5 py-1 bg-[var(--color-brand-green)] text-white text-[10px] font-bold rounded-lg shadow-sm">
                                                Set as Cover
                                            </button>
                                        ) : <div />}
                                        <button type="button" onClick={() => removeImage(index)}
                                            className="h-7 w-7 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex gap-1.5 self-end">
                                        {index > 0 && (
                                            <button type="button" onClick={() => moveImage(index, "left")}
                                                className="p-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg shadow hover:bg-[var(--bg-muted)]">
                                                <ArrowLeft className="h-3 w-3" />
                                            </button>
                                        )}
                                        {index < formData.images.length - 1 && (
                                            <button type="button" onClick={() => moveImage(index, "right")}
                                                className="p-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg shadow hover:bg-[var(--bg-muted)]">
                                                <ArrowRight className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
