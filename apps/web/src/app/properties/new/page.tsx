"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import api from "@/lib/api";
import MapPicker from "@/components/map/MapPicker";
import { PROPERTY_TYPES } from "@/lib/constants";
import { NIGERIAN_LOCATIONS, ALL_STATES } from "@/lib/locations";
import { PropertySuccessModal } from "@/components/property/PropertySuccessModal";

// Shared constants moved to @/lib/constants

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
    { value: "ONE_YEAR", label: "One Year" },
    { value: "TWO_YEARS", label: "Two Years" },
    { value: "THREE_YEARS", label: "Three Years" },
    { value: "FLEXIBLE", label: "Flexible" },
];

const POWER_SUPPLY_TYPES = [
    { value: "GRID_ONLY", label: "Grid Only" },
    { value: "GRID_AND_GENERATOR", label: "Grid & Generator" },
    { value: "GRID_AND_SOLAR", label: "Grid & Solar" },
    { value: "GENERATOR_ONLY", label: "Generator Only" },
    { value: "SOLAR_ONLY", label: "Solar Only" },
    { value: "MIXED", label: "Mixed Supply" },
];

const WATER_SUPPLY_TYPES = [
    { value: "BOREHOLE", label: "Borehole" },
    { value: "TREATED_WATER", label: "Treated Water" },
    { value: "BOTH", label: "Both (Borehole & Treated)" },
    { value: "TANK_ONLY", label: "Water Tank Only" },
];

interface FormData {
    // Step 1: Basics
    title: string;
    propertyType: string;
    pricePerYear: string;
    description: string;

    // Step 2: Location
    address: string;
    city: string;
    state: string;
    zipCode: string;

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

    // Step 4: Images (URLs from Cloudinary)
    images: string[];

    // Additional Fields (Manifesto & Schema Alignment)
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

    // Contact (optional)
    email: string;
    phone: string;
}

export default function AddPropertyPage() {
    const { user } = useUser();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
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

    const updateField = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const [stepError, setStepError] = useState<string | null>(null);

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
                setStepError("Please enter a valid Rent Per Year amount.");
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
                setStepError("Please upload at least 1 Property Photo before publishing.");
                return false;
            }
        }

        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep((s) => Math.min(4, s + 1));
        }
    };

    const handleStepClick = (targetStep: number) => {
        if (targetStep < step) {
            // Can always go back to previous steps
            setStepError(null);
            setStep(targetStep);
        } else {
            // Going forward requires validating all steps up to targetStep
            for (let s = 1; s < targetStep; s++) {
                if (!validateStep(s)) {
                    setStep(s);
                    return;
                }
            }
            setStep(targetStep);
        }
    };

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdPropertyId, setCreatedPropertyId] = useState<string | undefined>(undefined);

    const handleSubmit = async () => {
        if (!user) return;

        // Validate all 4 steps
        for (let s = 1; s <= 4; s++) {
            if (!validateStep(s)) {
                setStep(s);
                return;
            }
        }

        setLoading(true);
        try {
            // First, ensure user exists in database and get their database ID
            let dbUserId = "";
            try {
                const userRes = await api.post("/users", {
                    clerkId: user.id,
                    email: formData.email || user.emailAddresses[0]?.emailAddress,
                    phone: formData.phone || user.phoneNumbers[0]?.phoneNumber || "0000000000",
                    firstName: user.firstName || "User",
                    lastName: user.lastName || "",
                    avatar: user.imageUrl,
                    role: "LANDLORD",
                });
                dbUserId = userRes.data.data.id;
            } catch (userError: any) {
                if (userError.response?.status === 409) {
                    dbUserId = userError.response.data.data.id;
                } else {
                    console.error("User creation error:", userError.response?.data?.message);
                    throw userError;
                }
            }

            // Create property via API
            const payload = {
                ...formData,
                pricePerYear: parseInt(formData.pricePerYear),
                bedrooms: parseInt(formData.bedrooms),
                bathrooms: parseInt(formData.bathrooms),
                toilets: parseInt(formData.toilets || formData.bathrooms),
                parkingSpaces: parseInt(formData.parkingSpaces || "0"),
                floorArea: formData.floorArea ? parseFloat(formData.floorArea) : undefined,
                landlordId: dbUserId,
                agentFee: parseInt(formData.agentFee || "0"),
                cautionFee: parseInt(formData.cautionFee || "0"),
                legalFee: parseInt(formData.legalFee || "0"),
                serviceFee: parseInt(formData.serviceFee || "0"),
                negotiable: formData.negotiable,
                paymentTerms: formData.paymentTerms,
                powerSupply: formData.powerSupply,
                waterSupply: formData.waterSupply,
                latitude: formData.latitude,
                longitude: formData.longitude,
            };

            const res = await api.post("/properties", payload);

            if (res.data.success) {
                setCreatedPropertyId(res.data.data?.id);
                setShowSuccessModal(true);
            }
        } catch (error: any) {
            console.error("Failed to create property:", error);
            alert(error.response?.data?.message || "Failed to create property");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, title: "Basics", icon: Home },
        { number: 2, title: "Location", icon: MapPin },
        { number: 3, title: "Details", icon: DollarSign },
        { number: 4, title: "Photos", icon: ImageIcon },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-6 sm:pt-8 pb-16 sm:pb-20">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
                        List Your Property
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                        Fill in the details to list your property on RentHub
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-6 mb-6 shadow-[var(--shadow-sm)] border border-[var(--border-color)]">
                    <div className="flex items-center justify-between">
                        {steps.map((s, idx) => {
                            const Icon = s.icon;
                            const isActive = step === s.number;
                            const isCompleted = step > s.number;

                            return (
                                <div key={s.number} className="flex items-center flex-1">
                                    <button
                                        type="button"
                                        onClick={() => handleStepClick(s.number)}
                                        className="flex flex-col items-center flex-1 group cursor-pointer focus:outline-none"
                                    >
                                        <div
                                            className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-1.5 sm:mb-2 transition-all ${isCompleted
                                                ? "bg-[var(--color-brand-green)] text-white group-hover:scale-105"
                                                : isActive
                                                    ? "bg-[var(--color-brand-green)] text-white shadow-md scale-105"
                                                    : "bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-color)] group-hover:border-[var(--color-brand-green)]"
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <Check className="h-4 w-4 sm:h-6 sm:w-6" />
                                            ) : (
                                                <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                                            )}
                                        </div>
                                        <p
                                            className={`text-[10px] sm:text-sm font-bold ${isActive ? "text-[var(--color-brand-green)] font-extrabold" : "text-[var(--text-secondary)]"
                                                }`}
                                        >
                                            {s.title}
                                        </p>
                                    </button>
                                    {idx < steps.length - 1 && (
                                        <div
                                            className={`h-0.5 sm:h-1 flex-1 mx-1 sm:mx-4 rounded transition-colors ${step > s.number ? "bg-[var(--color-brand-green)]" : "bg-[var(--border-color)]"
                                                }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-8 shadow-[var(--shadow-sm)] border border-[var(--border-color)]">
                    {step === 1 && <Step1Basics formData={formData} updateField={updateField} />}
                    {step === 2 && <Step2Location formData={formData} updateField={updateField} />}
                    {step === 3 && <Step3Details formData={formData} updateField={updateField} />}
                    {step === 4 && <Step4Photos formData={formData} updateField={updateField} />}

                    {/* Step Error Banner */}
                    {stepError && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-bold rounded-xl flex items-center gap-3 animate-shake">
                            <X className="h-5 w-5 shrink-0" />
                            <span>{stepError}</span>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-[var(--border-color)]">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStepError(null);
                                setStep((s) => Math.max(1, s - 1));
                            }}
                            disabled={step === 1}
                            className="gap-2 text-[var(--text-primary)] border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] rounded-xl font-bold"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        {step < 4 ? (
                            <Button
                                onClick={handleNext}
                                className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold gap-2 rounded-xl px-6"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold gap-2 rounded-xl px-6"
                            >
                                {loading ? "Publishing..." : "Publish Property"}
                                <Check className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <PropertySuccessModal
                isOpen={showSuccessModal}
                propertyId={createdPropertyId}
            />
        </div>
    );
}

function Step1Basics({ formData, updateField }: any) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                    Property Title *
                </label>
                <Input
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="e.g., Luxury 3-Bedroom Apartment in Lekki"
                    className="w-full"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                    Property Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {PROPERTY_TYPES.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => updateField("propertyType", type.value)}
                            className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${formData.propertyType === type.value
                                ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)] text-white shadow-sm"
                                : "border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]"
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                        Rent Per Year (₦) *
                    </label>
                    <Input
                        type="number"
                        value={formData.pricePerYear}
                        onChange={(e) => updateField("pricePerYear", e.target.value)}
                        placeholder="e.g., 2000000"
                        className="w-full"
                    />
                </div>
                <div className="pb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.negotiable}
                            onChange={(e) => updateField("negotiable", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded accent-[var(--color-brand-green)]"
                        />
                        <span className="text-sm font-bold text-[var(--text-primary)]">Negotiable</span>
                    </label>
                </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)]">
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[var(--color-brand-green)]" />
                    Fees & Charges (Transparency First)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">
                            Caution Fee (₦)
                        </label>
                        <p className="text-xs text-[var(--text-secondary)] font-medium mb-2">Refundable deposit for damages</p>
                        <Input
                            type="number"
                            value={formData.cautionFee}
                            onChange={(e) => updateField("cautionFee", e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">
                            Legal Fee (₦)
                        </label>
                        <p className="text-xs text-[var(--text-secondary)] font-medium mb-2">Tenancy agreement & documentation</p>
                        <Input
                            type="number"
                            value={formData.legalFee}
                            onChange={(e) => updateField("legalFee", e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">
                            Agent Fee (₦)
                        </label>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-[var(--text-secondary)] font-medium">Commission for viewing/closing</p>
                            <Badge variant="outline" className="text-[10px] py-0 border-[var(--color-brand-green)] text-[var(--color-brand-green)] font-bold">
                                Manifesto: Aim for ₦0
                            </Badge>
                        </div>
                        <Input
                            type="number"
                            value={formData.agentFee}
                            onChange={(e) => updateField("agentFee", e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">
                            Service Charge (₦)
                        </label>
                        <p className="text-xs text-[var(--text-secondary)] font-medium mb-2">For security, cleaning, etc (if applicable)</p>
                        <Input
                            type="number"
                            value={formData.serviceFee}
                            onChange={(e) => updateField("serviceFee", e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Description *
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe your property..."
                    rows={5}
                    className="w-full px-4 py-3 border border-[var(--border-color)] bg-[var(--bg-input)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] transition-colors"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Contact Email (Optional)
                    </label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="your@email.com"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Contact Phone (Optional)
                    </label>
                    <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="08012345678"
                        className="w-full"
                    />
                </div>
            </div>
        </div>
    );
}

function Step2Location({ formData, updateField }: any) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Address *
                </label>
                <Input
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="e.g., 15, Admiralty Way"
                    className="w-full"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        State *
                    </label>
                    <select
                        value={formData.state}
                        onChange={(e) => {
                            updateField("state", e.target.value);
                            updateField("city", "");
                        }}
                        className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] text-[var(--text-primary)] transition-colors"
                    >
                        <option value="">Select State</option>
                        {ALL_STATES.map((state) => (
                            <option key={state} value={state}>
                                {state === "FCT" ? "Abuja (FCT)" : state}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        LGA / City / Area *
                    </label>
                    <select
                        value={formData.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        disabled={!formData.state}
                        className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] text-[var(--text-primary)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-muted)] transition-colors"
                    >
                        <option value="">Select Area</option>
                        {formData.state && NIGERIAN_LOCATIONS[formData.state]?.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Zip Code (Optional)
                </label>
                <Input
                    value={formData.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    placeholder="e.g., 101245"
                    className="w-full"
                />
            </div>

            <div className="pt-6 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Set Precise Location *
                </label>
                <p className="text-sm text-gray-600 mb-4">
                    Click on the map to mark the exact building location. This helps tenants find your property and improves trust.
                </p>
                <MapPicker
                    onLocationSelect={(lat, lng) => {
                        updateField("latitude", lat);
                        updateField("longitude", lng);
                    }}
                    initialLocation={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : undefined}
                />
                {(formData.latitude && formData.longitude) && (
                    <p className="mt-2 text-xs font-mono text-gray-500">
                        Coordinates set: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </p>
                )}
            </div>
        </div>
    );
}

function Step3Details({ formData, updateField }: any) {
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                        Bedrooms *
                    </label>
                    <Input
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => updateField("bedrooms", e.target.value)}
                        placeholder="e.g., 3"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                        Bathrooms *
                    </label>
                    <Input
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => updateField("bathrooms", e.target.value)}
                        placeholder="e.g., 2"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                        Toilets
                    </label>
                    <Input
                        type="number"
                        value={formData.toilets}
                        onChange={(e) => updateField("toilets", e.target.value)}
                        placeholder="e.g., 2"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                        Parking
                    </label>
                    <Input
                        type="number"
                        value={formData.parkingSpaces}
                        onChange={(e) => updateField("parkingSpaces", e.target.value)}
                        placeholder="e.g., 2"
                        className="w-full"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                    Floor Area (sqm) - Optional
                </label>
                <Input
                    type="number"
                    value={formData.floorArea}
                    onChange={(e) => updateField("floorArea", e.target.value)}
                    placeholder="e.g., 120"
                    className="w-full"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-3">
                    Property Features
                </label>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.furnished}
                            onChange={(e) => updateField("furnished", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded accent-[var(--color-brand-green)]"
                        />
                        <span className="text-sm font-bold text-[var(--text-primary)]">Furnished</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.serviced}
                            onChange={(e) => updateField("serviced", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded accent-[var(--color-brand-green)]"
                        />
                        <span className="text-sm font-bold text-[var(--text-primary)]">Serviced</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.petsAllowed}
                            onChange={(e) => updateField("petsAllowed", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded accent-[var(--color-brand-green)]"
                        />
                        <span className="text-sm font-bold text-[var(--text-primary)]">Pets Allowed</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-color)]">
                <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Payment Terms *
                    </label>
                    <select
                        value={formData.paymentTerms}
                        onChange={(e) => updateField("paymentTerms", e.target.value)}
                        className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] text-[var(--text-primary)] transition-colors"
                    >
                        {PAYMENT_TERMS.map((term) => (
                            <option key={term.value} value={term.value}>
                                {term.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Power Supply *
                    </label>
                    <select
                        value={formData.powerSupply}
                        onChange={(e) => updateField("powerSupply", e.target.value)}
                        className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] text-[var(--text-primary)] transition-colors"
                    >
                        {POWER_SUPPLY_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Water Supply *
                    </label>
                    <select
                        value={formData.waterSupply}
                        onChange={(e) => updateField("waterSupply", e.target.value)}
                        className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:border-[var(--color-brand-green)] text-[var(--text-primary)] transition-colors"
                    >
                        {WATER_SUPPLY_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)]">
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                    Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AMENITIES.map((amenity) => (
                        <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left cursor-pointer ${formData.amenities?.includes(amenity)
                                ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)] text-white"
                                : "border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]"
                                }`}
                        >
                            {amenity}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Step4Photos({ formData, updateField }: any) {
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
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", uploadPreset!);
                formData.append("folder", "renthub-properties");

                const res = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                const data = await res.json();
                uploadedUrls.push(data.secure_url);
            }

            updateField("images", [...formData.images, ...uploadedUrls]);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload images");
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
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
                    Property Photos
                </label>
                <p className="text-sm text-[var(--text-secondary)] mb-4 font-medium">
                    Upload high-quality photos. Click "Set as Cover" to choose your cover photo, or drag to reorder.
                </p>

                <label className="block w-full p-8 border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-muted)]/50 rounded-2xl hover:border-[var(--color-brand-green)] transition-colors cursor-pointer">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                    />
                    <div className="text-center">
                        <Upload className="h-12 w-12 mx-auto mb-3 text-[var(--text-muted)]" />
                        <p className="text-sm font-bold text-[var(--text-primary)]">
                            {uploading ? "Uploading..." : "Click to upload photos"}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                            PNG, JPG up to 10MB each
                        </p>
                    </div>
                </label>
            </div>

            {formData.images.length > 0 && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        {formData.images.length} photo{formData.images.length > 1 ? "s" : ""} uploaded
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {formData.images.map((url: string, index: number) => (
                            <div key={index} className="relative group">
                                <img
                                    src={url}
                                    alt={`Property ${index + 1}`}
                                    className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                                />

                                {/* Cover Photo Badge */}
                                {index === 0 && (
                                    <Badge className="absolute top-2 left-2 bg-[var(--color-brand-green)]">
                                        Cover Photo
                                    </Badge>
                                )}

                                {/* Hover Controls */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                    {index !== 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setCoverPhoto(index)}
                                            className="px-3 py-1 bg-[var(--color-brand-green)] text-white text-xs font-medium rounded hover:bg-[var(--color-brand-green)]/90"
                                        >
                                            Set as Cover
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Reorder Arrows */}
                                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => moveImage(index, "left")}
                                            className="p-1 bg-white rounded shadow hover:bg-gray-100"
                                            title="Move left"
                                        >
                                            <ArrowLeft className="h-3 w-3 text-gray-700" />
                                        </button>
                                    )}
                                    {index < formData.images.length - 1 && (
                                        <button
                                            type="button"
                                            onClick={() => moveImage(index, "right")}
                                            className="p-1 bg-white rounded shadow hover:bg-gray-100"
                                            title="Move right"
                                        >
                                            <ArrowRight className="h-3 w-3 text-gray-700" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
