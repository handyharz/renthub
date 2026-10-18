"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Upload,
    X,
    MapPin,
    Home,
    DollarSign,
    Image as ImageIcon,
    Sparkles,
    ShieldCheck,
    Bed,
    Bath,
    Car,
    Zap,
    Droplets,
    Calendar,
    Layers,
    ChevronRight,
    Eye,
    CheckCircle2,
    Info,
    Building2,
    Loader2,
    ExternalLink
} from "lucide-react";
import api from "@/lib/api";
import MapPicker from "@/components/map/MapPicker";
import { PROPERTY_TYPES } from "@/lib/constants";
import { NIGERIAN_LOCATIONS, ALL_STATES } from "@/lib/locations";
import { formatPrice, cn } from "@/lib/utils";
import { toast } from "sonner";

const AMENITIES = [
    "24/7 Power",
    "Backup Generator",
    "Solar Inverter",
    "Borehole",
    "Gated Security",
    "CCTV Cameras",
    "Electric Fence",
    "Swimming Pool",
    "Gym",
    "Playground",
    "Fiber Internet",
    "DSTV Ready",
    "Covered Parking",
    "Fitted Kitchen",
    "Gas Cooker",
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

interface FormData {
    title: string;
    propertyType: string;
    pricePerYear: string;
    description: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    bedrooms: string;
    bathrooms: string;
    toilets: string;
    parkingSpaces: string;
    floorArea: string;
    furnished: boolean;
    serviced: boolean;
    petsAllowed: boolean;
    amenities: string[];
    images: string[];
    agentFee: string;
    cautionFee: string;
    legalFee: string;
    serviceFee: string;
    negotiable: boolean;
    paymentTerms: string;
    powerSupply: string;
    waterSupply: string;
    latitude: number | null;
    longitude: number | null;
    email: string;
    phone: string;
}

export default function EditPropertyPage() {
    const params = useParams();
    const id = params?.id as string;
    const { user } = useUser();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [stepError, setStepError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        title: "",
        propertyType: "",
        pricePerYear: "",
        description: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        bedrooms: "",
        bathrooms: "",
        toilets: "",
        parkingSpaces: "0",
        floorArea: "",
        furnished: false,
        serviced: false,
        petsAllowed: false,
        amenities: [],
        images: [],
        agentFee: "0",
        cautionFee: "0",
        legalFee: "0",
        serviceFee: "0",
        negotiable: false,
        paymentTerms: "ONE_YEAR",
        powerSupply: "GRID_ONLY",
        waterSupply: "BOREHOLE",
        latitude: null,
        longitude: null,
        email: "",
        phone: "",
    });

    useEffect(() => {
        if (id) {
            fetchProperty();
        }
    }, [id]);

    const fetchProperty = async () => {
        try {
            setFetching(true);
            const res = await api.get(`/properties/${id}`);
            const property = res.data.data;

            if (property) {
                setFormData({
                    title: property.title || "",
                    propertyType: property.propertyType || "",
                    pricePerYear: property.pricePerYear?.toString() || "",
                    description: property.description || "",
                    address: property.address || "",
                    city: property.city || "",
                    state: property.state || "",
                    zipCode: property.zipCode || "",
                    bedrooms: property.bedrooms?.toString() || "",
                    bathrooms: property.bathrooms?.toString() || "",
                    toilets: property.toilets?.toString() || "",
                    parkingSpaces: property.parkingSpaces?.toString() || "0",
                    floorArea: property.floorArea?.toString() || "",
                    furnished: property.furnished || false,
                    serviced: property.serviced || false,
                    petsAllowed: property.petsAllowed || false,
                    amenities: property.amenities?.map((a: any) => a.amenity?.name || a.name || a) || [],
                    images: property.images?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((img: any) => img.url) || [],
                    agentFee: property.agentFee?.toString() || "0",
                    cautionFee: property.cautionFee?.toString() || "0",
                    legalFee: property.legalFee?.toString() || "0",
                    serviceFee: property.serviceFee?.toString() || "0",
                    negotiable: property.negotiable || false,
                    paymentTerms: property.paymentTerms || "ONE_YEAR",
                    powerSupply: property.powerSupply || "GRID_ONLY",
                    waterSupply: property.waterSupply || "BOREHOLE",
                    latitude: property.latitude || null,
                    longitude: property.longitude || null,
                    email: property.contactEmail || "",
                    phone: property.contactPhone || "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch property:", error);
            toast.error("Failed to load property details");
        } finally {
            setFetching(false);
        }
    };

    const updateField = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const validateStep = (currentStep: number): boolean => {
        setStepError(null);
        if (currentStep === 1) {
            if (!formData.title.trim()) {
                setStepError("Please enter a Property Title before proceeding.");
                return false;
            }
            if (!formData.propertyType) {
                setStepError("Please select a Property Type.");
                return false;
            }
            if (!formData.pricePerYear || isNaN(Number(formData.pricePerYear)) || Number(formData.pricePerYear) <= 0) {
                setStepError("Please enter a valid Rent Per Year amount in Naira.");
                return false;
            }
            if (!formData.description.trim()) {
                setStepError("Please enter a Property Description.");
                return false;
            }
        }

        if (currentStep === 2) {
            if (!formData.address.trim()) {
                setStepError("Please enter the street Address.");
                return false;
            }
            if (!formData.state) {
                setStepError("Please select a State.");
                return false;
            }
            if (!formData.city) {
                setStepError("Please select an LGA / City / Area.");
                return false;
            }
        }

        if (currentStep === 3) {
            if (!formData.bedrooms || isNaN(Number(formData.bedrooms)) || Number(formData.bedrooms) < 0) {
                setStepError("Please specify the number of Bedrooms.");
                return false;
            }
            if (!formData.bathrooms || isNaN(Number(formData.bathrooms)) || Number(formData.bathrooms) < 0) {
                setStepError("Please specify the number of Bathrooms.");
                return false;
            }
        }

        if (currentStep === 4) {
            if (!formData.images || formData.images.length === 0) {
                setStepError("Please ensure at least 1 Property Photo remains uploaded.");
                return false;
            }
        }

        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep((s) => Math.min(4, s + 1));
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleStepClick = (targetStep: number) => {
        if (targetStep < step) {
            setStepError(null);
            setStep(targetStep);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            for (let s = 1; s < targetStep; s++) {
                if (!validateStep(s)) {
                    setStep(s);
                    return;
                }
            }
            setStep(targetStep);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        for (let s = 1; s <= 4; s++) {
            if (!validateStep(s)) {
                setStep(s);
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                title: formData.title,
                propertyType: formData.propertyType,
                pricePerYear: parseInt(formData.pricePerYear),
                description: formData.description,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                bedrooms: parseInt(formData.bedrooms),
                bathrooms: parseInt(formData.bathrooms),
                toilets: parseInt(formData.toilets || formData.bathrooms),
                parkingSpaces: parseInt(formData.parkingSpaces || "0"),
                floorArea: formData.floorArea ? parseFloat(formData.floorArea) : undefined,
                agentFee: parseInt(formData.agentFee || "0"),
                cautionFee: parseInt(formData.cautionFee || "0"),
                legalFee: parseInt(formData.legalFee || "0"),
                serviceFee: parseInt(formData.serviceFee || "0"),
                negotiable: formData.negotiable,
                paymentTerms: formData.paymentTerms,
                powerSupply: formData.powerSupply,
                waterSupply: formData.waterSupply,
                furnished: formData.furnished,
                serviced: formData.serviced,
                petsAllowed: formData.petsAllowed,
                latitude: formData.latitude,
                longitude: formData.longitude,
                images: formData.images,
                amenities: formData.amenities,
                contactEmail: formData.email,
                contactPhone: formData.phone,
            };

            const res = await api.patch(`/properties/${id}`, payload);

            if (res.data.success) {
                toast.success("Property Updated Successfully!", {
                    description: "Your listing changes are now live."
                });
                router.push(`/properties/${id}`);
            }
        } catch (error: any) {
            console.error("Failed to update property:", error);
            setStepError(error.response?.data?.message || "Failed to update property. Please verify your details.");
            toast.error(error.response?.data?.message || "Failed to update property");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, title: "Basics & Pricing", icon: Home, desc: "Title, type & rent" },
        { number: 2, title: "Location & Pin", icon: MapPin, desc: "Address & map coords" },
        { number: 3, title: "Details & Utilities", icon: Layers, desc: "Rooms, power & terms" },
        { number: 4, title: "Photos & Media", icon: ImageIcon, desc: "High-res images" },
    ];

    const currentStepTip = [
        "Keeping pricing up-to-date and ₦0 agent fees maintains top placement in tenant search results.",
        "An accurate pin on the map ensures tenants can easily find your home during physical tours.",
        "Accurate power and water supply specifications build high trust with prospective tenants.",
        "Refreshed daylight photos can dramatically improve your listing's view-to-application conversion."
    ][step - 1];

    if (fetching) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">
                <Loader2 className="h-10 w-10 animate-spin text-[var(--color-brand-green)] mb-3" />
                <p className="font-semibold text-sm">Loading property listing details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-24">
            {/* Sticky Header with Navigation & Progress Bar */}
            <div className="sticky top-16 z-30 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/properties/${id}`)}
                            className="h-9 w-9 rounded-xl hover:bg-[var(--bg-muted)] border border-[var(--border-color)] shrink-0"
                            aria-label="Back to property"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                                <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
                                    Dashboard
                                </Link>
                                <ChevronRight className="h-3 w-3 shrink-0" />
                                <Link href={`/properties/${id}`} className="hover:text-[var(--text-primary)] transition-colors truncate max-w-[140px] sm:max-w-[200px]">
                                    {formData.title || "Listing"}
                                </Link>
                                <ChevronRight className="h-3 w-3 shrink-0" />
                                <span className="text-[var(--text-primary)] font-semibold">Edit Listing</span>
                            </div>
                            <h1 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] truncate mt-0.5">
                                Edit Property Listing
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-3 py-1">
                            Step {step} of 4 • {step * 25}% Complete
                        </Badge>
                        <Link href={`/properties/${id}`} target="_blank">
                            <Button
                                variant="outline"
                                size="sm"
                                className="hidden sm:inline-flex rounded-xl font-bold gap-1.5 h-8 text-xs border-[var(--border-color)]"
                            >
                                <ExternalLink className="h-3.5 w-3.5 text-[var(--color-brand-green)]" />
                                View Public Page
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Animated Top Progress Bar */}
                <div className="w-full bg-[var(--bg-muted)] h-1.5 overflow-hidden">
                    <div
                        className="bg-[var(--color-brand-green)] h-full transition-all duration-400 ease-out"
                        style={{ width: `${step * 25}%` }}
                    />
                </div>
            </div>

            {/* Stepper Navigation Tracker */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-5 shadow-[var(--shadow-sm)] border border-[var(--border-color)] mb-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {steps.map((s) => {
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
                                    <div
                                        className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors",
                                            isActive
                                                ? "bg-[var(--color-brand-green)] text-white shadow-sm"
                                                : isCompleted
                                                ? "bg-emerald-500 text-white"
                                                : "bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-muted)]"
                                        )}
                                    >
                                        {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={cn(
                                                "text-xs font-extrabold truncate",
                                                isActive ? "text-[var(--color-brand-green)]" : "text-[var(--text-primary)]"
                                            )}
                                        >
                                            {s.title}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-muted)] truncate hidden sm:block">
                                            {s.desc}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2-Column Responsive Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: Active Step Form (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-[var(--bg-card)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-sm)] border border-[var(--border-color)]">
                            {step === 1 && <Step1Basics formData={formData} updateField={updateField} />}
                            {step === 2 && <Step2Location formData={formData} updateField={updateField} />}
                            {step === 3 && <Step3Details formData={formData} updateField={updateField} />}
                            {step === 4 && <Step4Photos formData={formData} updateField={updateField} />}

                            {/* Step Error Banner */}
                            {stepError && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-xs sm:text-sm font-bold rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
                                    <X className="h-4 w-4 shrink-0" />
                                    <span>{stepError}</span>
                                </div>
                            )}

                            {/* Navigation Controls */}
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-color)] gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setStepError(null);
                                        setStep((s) => Math.max(1, s - 1));
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    disabled={step === 1}
                                    className="gap-2 text-xs sm:text-sm font-bold rounded-xl h-11 px-4 sm:px-5"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Previous
                                </Button>

                                {step < 4 ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs sm:text-sm gap-2 rounded-xl h-11 px-6 shadow-md shadow-emerald-500/20"
                                    >
                                        Next: {steps[step]?.title}
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold text-xs sm:text-sm gap-2 rounded-xl h-11 px-6 shadow-md shadow-emerald-500/20"
                                    >
                                        {loading ? "Saving Changes..." : "Save & Update Listing"}
                                        <Check className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Live Tenant Listing Preview & Tips (5 Cols Sticky) */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
                        {/* Live Listing Preview Card */}
                        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] shadow-[var(--shadow-sm)] overflow-hidden">
                            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-[var(--color-brand-green)]" />
                                    <span className="font-extrabold text-xs text-[var(--text-primary)]">
                                        Live Tenant Preview
                                    </span>
                                </div>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            </div>

                            {/* Preview Thumbnail */}
                            <div className="h-44 sm:h-52 relative w-full bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden">
                                {formData.images && formData.images.length > 0 ? (
                                    <Image
                                        src={formData.images[0]}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="text-center p-6 text-[var(--text-muted)] space-y-2">
                                        <ImageIcon className="h-10 w-10 mx-auto opacity-40" />
                                        <p className="text-xs font-semibold">Cover photo will appear here</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                    <div>
                                        <Badge className="bg-[var(--color-brand-green)] text-white font-extrabold text-xs px-2.5 py-1 mb-1 border-none shadow">
                                            {formData.pricePerYear
                                                ? `${formatPrice(Number(formData.pricePerYear) || 0)} / yr`
                                                : "₦0 / yr"}
                                        </Badge>
                                        <h3 className="font-extrabold text-white text-sm sm:text-base truncate drop-shadow max-w-[260px]">
                                            {formData.title || "Untitled Property Listing"}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Body */}
                            <div className="p-4 sm:p-5 space-y-4">
                                <p className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5 font-medium">
                                    <MapPin className="h-3.5 w-3.5 text-[var(--color-brand-orange)] shrink-0 mt-0.5" />
                                    <span className="truncate">
                                        {formData.city || "LGA / City"}, {formData.state || "State, Nigeria"}
                                    </span>
                                </p>

                                {/* Specs Row */}
                                <div className="grid grid-cols-3 gap-2 py-3 border-y border-[var(--border-color)] text-xs text-center font-bold text-[var(--text-secondary)]">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <Bed className="h-3.5 w-3.5 text-[var(--color-brand-blue)]" />
                                        <span>{formData.bedrooms || 0} Bed</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1.5 border-x border-[var(--border-color)]">
                                        <Bath className="h-3.5 w-3.5 text-[var(--color-brand-blue)]" />
                                        <span>{formData.bathrooms || 0} Bath</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1.5 truncate">
                                        <Car className="h-3.5 w-3.5 text-[var(--color-brand-blue)]" />
                                        <span>{formData.parkingSpaces || 0} Park</span>
                                    </div>
                                </div>

                                {/* Amenities Chips Preview */}
                                <div className="flex flex-wrap gap-1.5">
                                    {formData.furnished && (
                                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                            Furnished
                                        </Badge>
                                    )}
                                    {formData.serviced && (
                                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                                            Serviced
                                        </Badge>
                                    )}
                                    {formData.amenities?.slice(0, 3).map((amenity) => (
                                        <Badge key={amenity} variant="outline" className="text-[10px] border-[var(--border-color)] text-[var(--text-secondary)]">
                                            {amenity}
                                        </Badge>
                                    ))}
                                    {formData.amenities && formData.amenities.length > 3 && (
                                        <Badge variant="outline" className="text-[10px] border-[var(--border-color)] text-[var(--text-muted)]">
                                            +{formData.amenities.length - 3} more
                                        </Badge>
                                    )}
                                </div>

                                {/* Host Preview */}
                                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-[var(--bg-muted)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)]">
                                            {user?.imageUrl ? (
                                                <img
                                                    src={user.imageUrl}
                                                    alt="Host"
                                                    className="h-full w-full rounded-full object-cover"
                                                />
                                            ) : (
                                                user?.firstName?.[0] || "L"
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-[var(--text-muted)] font-medium block leading-none">
                                                Hosted By
                                            </span>
                                            <span className="text-xs font-bold text-[var(--text-primary)]">
                                                {user?.firstName || "Verified Landlord"}
                                            </span>
                                        </div>
                                    </div>

                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                                        Direct Listing
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Landlord Expert Tip Card */}
                        <div className="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-5 border border-[var(--border-color)] shadow-[var(--shadow-sm)] space-y-2">
                            <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                                <span>Optimization Tip</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                                {currentStepTip}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// STEP 1: BASICS & PRICING
// ==========================================
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
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                    Edit the main title, category, and annual rental pricing
                </p>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Property Title *
                </label>
                <Input
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="e.g., Luxury 3-Bedroom Apartment in Lekki Phase 1"
                    className="w-full h-11 text-sm font-semibold"
                />

                {/* Quick Title Templates */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" /> Templates:
                    </span>
                    {titleTemplates.map((template) => (
                        <button
                            key={template}
                            type="button"
                            onClick={() => updateField("title", template)}
                            className="text-[11px] bg-[var(--bg-muted)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 font-medium transition-all"
                        >
                            {template}
                        </button>
                    ))}
                </div>
            </div>

            {/* Property Type Grid */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Property Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {PROPERTY_TYPES.map((type) => {
                        const isSelected = formData.propertyType === type.value;
                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => updateField("propertyType", type.value)}
                                className={cn(
                                    "p-3 rounded-xl border-2 text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer",
                                    isSelected
                                        ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 text-[var(--text-primary)] shadow-sm"
                                        : "border-[var(--border-color)] bg-[var(--bg-muted)]/40 hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                                )}
                            >
                                <span className="truncate">{type.label}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-[var(--color-brand-green)] shrink-0 ml-1.5" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Rent Amount & Negotiable */}
            <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        Annual Rent (₦) *
                    </label>
                    {formData.pricePerYear && Number(formData.pricePerYear) > 0 && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-extrabold">
                            {formatPrice(Number(formData.pricePerYear))} / year
                        </Badge>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                        <Input
                            type="number"
                            value={formData.pricePerYear}
                            onChange={(e) => updateField("pricePerYear", e.target.value)}
                            placeholder="e.g., 2500000"
                            className="w-full h-11 text-base font-bold"
                        />
                    </div>

                    <label className="flex items-center gap-2 p-2.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded-xl cursor-pointer shrink-0">
                        <input
                            type="checkbox"
                            checked={formData.negotiable}
                            onChange={(e) => updateField("negotiable", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded accent-[var(--color-brand-green)]"
                        />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Rent Negotiable</span>
                    </label>
                </div>
            </div>

            {/* Fees & Charges (RentHub Transparency) */}
            <div className="pt-4 border-t border-[var(--border-color)] space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[var(--color-brand-green)]" />
                        Additional Fees & Deposit
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold text-[var(--color-brand-green)] border-[var(--color-brand-green)]/30">
                        Direct Rent Standard
                    </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-[var(--text-primary)]">
                            Caution Deposit (₦)
                        </label>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium">Refundable deposit for damages</p>
                        <Input
                            type="number"
                            value={formData.cautionFee}
                            onChange={(e) => updateField("cautionFee", e.target.value)}
                            placeholder="0"
                            className="h-10 text-sm font-semibold"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-[var(--text-primary)]">
                            Legal & Agreement Fee (₦)
                        </label>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium">Tenancy documentation cost</p>
                        <Input
                            type="number"
                            value={formData.legalFee}
                            onChange={(e) => updateField("legalFee", e.target.value)}
                            placeholder="0"
                            className="h-10 text-sm font-semibold"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-[var(--text-primary)]">
                                Agency Commission (₦)
                            </label>
                            <span className="text-[10px] font-extrabold text-[var(--color-brand-green)]">
                                Goal: ₦0
                            </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium">Direct listings have ₦0 agency fee</p>
                        <Input
                            type="number"
                            value={formData.agentFee}
                            onChange={(e) => updateField("agentFee", e.target.value)}
                            placeholder="0"
                            className="h-10 text-sm font-semibold"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-[var(--text-primary)]">
                            Service Charge (₦)
                        </label>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium">Security, waste, cleaning, etc.</p>
                        <Input
                            type="number"
                            value={formData.serviceFee}
                            onChange={(e) => updateField("serviceFee", e.target.value)}
                            placeholder="0"
                            className="h-10 text-sm font-semibold"
                        />
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Property Description *
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe your property in detail. Highlight unique features like 24/7 security, reliable power supply, spacious bedrooms, and proximity to major transit routes..."
                    rows={4}
                    className="w-full p-3.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] font-medium leading-relaxed resize-none shadow-inner"
                />
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-color)]">
                <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--text-primary)]">
                        Contact Email <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                    </label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="landlord@example.com"
                        className="h-10 text-xs sm:text-sm font-medium"
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--text-primary)]">
                        Contact Phone <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                    </label>
                    <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="08012345678"
                        className="h-10 text-xs sm:text-sm font-medium"
                    />
                </div>
            </div>
        </div>
    );
}

// ==========================================
// STEP 2: LOCATION & MAP
// ==========================================
function Step2Location({ formData, updateField }: { formData: FormData; updateField: any }) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                    <MapPin className="h-5 w-5 text-[var(--color-brand-orange)]" />
                    Property Location & Address
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                    Update the location and building map coordinates
                </p>
            </div>

            {/* Street Address */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Street Address *
                </label>
                <Input
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="e.g., 15 Admiralty Way, Lekki Phase 1"
                    className="w-full h-11 text-sm font-semibold"
                />
            </div>

            {/* State and LGA Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        State *
                    </label>
                    <select
                        value={formData.state}
                        onChange={(e) => {
                            updateField("state", e.target.value);
                            updateField("city", "");
                        }}
                        className="w-full h-11 px-3.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                        <option value="">Select State</option>
                        {ALL_STATES.map((state) => (
                            <option key={state} value={state}>
                                {state === "FCT" ? "Abuja (FCT)" : state}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        LGA / City / Area *
                    </label>
                    <select
                        value={formData.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        disabled={!formData.state}
                        className="w-full h-11 px-3.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-muted)] transition-colors cursor-pointer"
                    >
                        <option value="">{formData.state ? "Select Area / LGA" : "Choose state first"}</option>
                        {formData.state && NIGERIAN_LOCATIONS[formData.state]?.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Postal / Zip Code <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                </label>
                <Input
                    value={formData.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    placeholder="e.g., 105102"
                    className="w-full h-10 text-xs sm:text-sm font-medium"
                />
            </div>

            {/* Map Picker */}
            <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                            Interactive Map Pin
                        </label>
                        <p className="text-xs text-[var(--text-secondary)] font-medium">
                            Click directly on the map to pin or update building location
                        </p>
                    </div>

                    {formData.latitude && formData.longitude && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-mono font-bold">
                            Pinned: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                        </Badge>
                    )}
                </div>

                <div className="rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-sm">
                    <MapPicker
                        onLocationSelect={(lat, lng) => {
                            updateField("latitude", lat);
                            updateField("longitude", lng);
                        }}
                        initialLocation={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : undefined}
                    />
                </div>
            </div>
        </div>
    );
}

// ==========================================
// STEP 3: DETAILS & UTILITIES
// ==========================================
function Step3Details({ formData, updateField }: { formData: FormData; updateField: any }) {
    const toggleAmenity = (amenity: string) => {
        const current = formData.amenities || [];
        if (current.includes(amenity)) {
            updateField(
                "amenities",
                current.filter((a: string) => a !== amenity)
            );
        } else {
            updateField("amenities", [...current, amenity]);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                    <Layers className="h-5 w-5 text-blue-500" />
                    Property Specifications & Utilities
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                    Adjust specifications, utilities, and included amenities
                </p>
            </div>

            {/* Room Counters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Bed className="h-3.5 w-3.5 text-[var(--color-brand-blue)]" /> Bedrooms *
                    </label>
                    <Input
                        type="number"
                        min="0"
                        value={formData.bedrooms}
                        onChange={(e) => updateField("bedrooms", e.target.value)}
                        placeholder="e.g., 3"
                        className="h-11 font-bold text-center"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Bath className="h-3.5 w-3.5 text-[var(--color-brand-blue)]" /> Bathrooms *
                    </label>
                    <Input
                        type="number"
                        min="0"
                        value={formData.bathrooms}
                        onChange={(e) => updateField("bathrooms", e.target.value)}
                        placeholder="e.g., 2"
                        className="h-11 font-bold text-center"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Home className="h-3.5 w-3.5 text-[var(--color-brand-blue)]" /> Toilets
                    </label>
                    <Input
                        type="number"
                        min="0"
                        value={formData.toilets}
                        onChange={(e) => updateField("toilets", e.target.value)}
                        placeholder="e.g., 2"
                        className="h-11 font-bold text-center"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Car className="h-3.5 w-3.5 text-[var(--color-brand-blue)]" /> Parking
                    </label>
                    <Input
                        type="number"
                        min="0"
                        value={formData.parkingSpaces}
                        onChange={(e) => updateField("parkingSpaces", e.target.value)}
                        placeholder="e.g., 2"
                        className="h-11 font-bold text-center"
                    />
                </div>
            </div>

            {/* Floor Area */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Floor Area (sqm) <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                </label>
                <Input
                    type="number"
                    value={formData.floorArea}
                    onChange={(e) => updateField("floorArea", e.target.value)}
                    placeholder="e.g., 140"
                    className="w-full h-10 text-xs sm:text-sm font-medium"
                />
            </div>

            {/* Property Key Features Toggles */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Key Features
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-3 p-3 bg-[var(--bg-muted)]/50 border border-[var(--border-color)] rounded-xl cursor-pointer hover:bg-[var(--bg-muted)] transition-all">
                        <input
                            type="checkbox"
                            checked={formData.furnished}
                            onChange={(e) => updateField("furnished", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded accent-[var(--color-brand-green)]"
                        />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Furnished Home</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-[var(--bg-muted)]/50 border border-[var(--border-color)] rounded-xl cursor-pointer hover:bg-[var(--bg-muted)] transition-all">
                        <input
                            type="checkbox"
                            checked={formData.serviced}
                            onChange={(e) => updateField("serviced", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded accent-[var(--color-brand-green)]"
                        />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Fully Serviced</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-[var(--bg-muted)]/50 border border-[var(--border-color)] rounded-xl cursor-pointer hover:bg-[var(--bg-muted)] transition-all">
                        <input
                            type="checkbox"
                            checked={formData.petsAllowed}
                            onChange={(e) => updateField("petsAllowed", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded accent-[var(--color-brand-green)]"
                        />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Pets Allowed</span>
                    </label>
                </div>
            </div>

            {/* Utilities: Power, Water & Lease Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--border-color)]">
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[var(--color-brand-green)]" /> Lease Duration *
                    </label>
                    <select
                        value={formData.paymentTerms}
                        onChange={(e) => updateField("paymentTerms", e.target.value)}
                        className="w-full h-11 px-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                    >
                        {PAYMENT_TERMS.map((term) => (
                            <option key={term.value} value={term.value}>
                                {term.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-500" /> Power Supply *
                    </label>
                    <select
                        value={formData.powerSupply}
                        onChange={(e) => updateField("powerSupply", e.target.value)}
                        className="w-full h-11 px-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                    >
                        {POWER_SUPPLY_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Droplets className="h-3.5 w-3.5 text-blue-500" /> Water Supply *
                    </label>
                    <select
                        value={formData.waterSupply}
                        onChange={(e) => updateField("waterSupply", e.target.value)}
                        className="w-full h-11 px-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                    >
                        {WATER_SUPPLY_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Amenities Grid */}
            <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        Amenities & Facilities
                    </label>
                    <span className="text-[11px] font-bold text-[var(--color-brand-green)]">
                        {formData.amenities?.length || 0} selected
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {AMENITIES.map((amenity) => {
                        const isSelected = formData.amenities?.includes(amenity);
                        return (
                            <button
                                key={amenity}
                                type="button"
                                onClick={() => toggleAmenity(amenity)}
                                className={cn(
                                    "p-2.5 sm:p-3 rounded-xl border-2 text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer",
                                    isSelected
                                        ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)]/10 text-[var(--text-primary)] shadow-sm"
                                        : "border-[var(--border-color)] bg-[var(--bg-muted)]/40 hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                                )}
                            >
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

// ==========================================
// STEP 4: PHOTOS & MEDIA
// ==========================================
function Step4Photos({ formData, updateField }: { formData: FormData; updateField: any }) {
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const uploadedUrls: string[] = [];
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

            for (const file of Array.from(files)) {
                const uploadFormData = new window.FormData();
                uploadFormData.append("file", file);
                uploadFormData.append("upload_preset", uploadPreset!);
                uploadFormData.append("folder", "renthub-properties");

                const res = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    {
                        method: "POST",
                        body: uploadFormData,
                    }
                );

                const data = await res.json();
                if (data.secure_url) {
                    uploadedUrls.push(data.secure_url);
                }
            }

            updateField("images", [...formData.images, ...uploadedUrls]);
            toast.success("Photos Uploaded Successfully!");
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload photos. Please check your network connection.");
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        updateField(
            "images",
            formData.images.filter((_: string, i: number) => i !== index)
        );
    };

    const setCoverPhoto = (index: number) => {
        const images = [...formData.images];
        const [coverImage] = images.splice(index, 1);
        images.unshift(coverImage);
        updateField("images", images);
        toast.success("Cover Photo Updated");
    };

    const moveImage = (fromIndex: number, direction: "left" | "right") => {
        const images = [...formData.images];
        const toIndex = direction === "left" ? fromIndex - 1 : fromIndex + 1;

        if (toIndex < 0 || toIndex >= images.length) return;

        [images[fromIndex], images[toIndex]] = [images[toIndex], images[fromIndex]];
        updateField("images", images);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-1">
                    <ImageIcon className="h-5 w-5 text-[var(--color-brand-green)]" />
                    Property Photos & Gallery
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                    Upload or replace listing photos. Reorder photos or set a new cover.
                </p>
            </div>

            {/* Upload Dropzone */}
            <label className="block w-full p-8 sm:p-10 border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-muted)]/40 hover:bg-[var(--bg-muted)]/80 hover:border-[var(--color-brand-green)] rounded-3xl transition-all cursor-pointer text-center">
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                />
                <div className="space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] flex items-center justify-center mx-auto shadow-inner">
                        <Upload className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-sm font-extrabold text-[var(--text-primary)]">
                            {uploading ? "Uploading Photos to Cloud..." : "Click or drag new photos here to upload"}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                            Supports PNG, JPG, WEBP up to 10MB each
                        </p>
                    </div>
                </div>
            </label>

            {/* Uploaded Gallery Grid */}
            {formData.images.length > 0 && (
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                            {formData.images.length} Photo{formData.images.length > 1 ? "s" : ""} in Gallery
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] font-medium">
                            Hover over photos to reorder or set cover
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {formData.images.map((url: string, index: number) => (
                            <div
                                key={index}
                                className="relative group rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-muted)] aspect-video"
                            >
                                <img
                                    src={url}
                                    alt={`Property ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />

                                {/* Cover Photo Badge */}
                                {index === 0 && (
                                    <Badge className="absolute top-2 left-2 bg-[var(--color-brand-green)] text-white text-[10px] font-extrabold border-none shadow-md">
                                        Cover Photo
                                    </Badge>
                                )}

                                {/* Hover Overlay Controls */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-2.5">
                                    <div className="flex justify-between items-center">
                                        {index !== 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setCoverPhoto(index)}
                                                className="px-2.5 py-1 bg-[var(--color-brand-green)] text-white text-[10px] font-bold rounded-lg hover:bg-[var(--color-brand-green)]/90 shadow-sm"
                                            >
                                                Set as Cover
                                            </button>
                                        ) : <div />}

                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="h-7 w-7 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition-colors"
                                            aria-label="Delete photo"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {/* Reorder Arrows */}
                                    <div className="flex gap-1.5 self-end">
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => moveImage(index, "left")}
                                                className="p-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg shadow hover:bg-[var(--bg-muted)] transition-colors"
                                                title="Move left"
                                            >
                                                <ArrowLeft className="h-3 w-3" />
                                            </button>
                                        )}
                                        {index < formData.images.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={() => moveImage(index, "right")}
                                                className="p-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg shadow hover:bg-[var(--bg-muted)] transition-colors"
                                                title="Move right"
                                            >
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
