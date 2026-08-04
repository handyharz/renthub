"use client";

import { useState, useEffect, use } from "react";
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
import { PROPERTY_TYPES } from "@/lib/constants";
import { NIGERIAN_LOCATIONS, ALL_STATES } from "@/lib/locations";

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

    // Contact (optional)
    email: string;
    phone: string;
}

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useUser();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
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
        email: "",
        phone: "",
    });

    useEffect(() => {
        fetchProperty();
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
                    amenities: property.amenities?.map((a: any) => a.amenity.name) || [],
                    images: property.images?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((img: any) => img.url) || [],
                    email: property.contactEmail || "",
                    phone: property.contactPhone || "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch property:", error);
            alert("Failed to load property details");
        } finally {
            setFetching(false);
        }
    };

    const updateField = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Update property via API
            const payload = {
                ...formData,
                pricePerYear: parseInt(formData.pricePerYear),
                bedrooms: parseInt(formData.bedrooms),
                bathrooms: parseInt(formData.bathrooms),
                toilets: parseInt(formData.toilets || formData.bathrooms),
                parkingSpaces: parseInt(formData.parkingSpaces || "0"),
                floorArea: formData.floorArea ? parseFloat(formData.floorArea) : undefined,
                contactEmail: formData.email,
                contactPhone: formData.phone,
            };

            const res = await api.patch(`/properties/${id}`, payload);

            if (res.data.success) {
                alert("Property updated successfully!");
                router.push("/dashboard");
            }
        } catch (error: any) {
            console.error("Failed to update property:", error);
            alert(error.response?.data?.message || "Failed to update property");
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

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-brand-blue)]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-8 pb-20">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--color-brand-blue)] mb-2">
                        Edit Property
                    </h1>
                    <p className="text-gray-600">
                        Update the details of your property listing
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        {steps.map((s, idx) => {
                            const Icon = s.icon;
                            const isActive = step === s.number;
                            const isCompleted = step > s.number;

                            return (
                                <div key={s.number} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${isCompleted
                                                ? "bg-[var(--color-brand-green)] text-white"
                                                : isActive
                                                    ? "bg-[var(--color-brand-blue)] text-white"
                                                    : "bg-gray-200 text-gray-500"
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <Check className="h-6 w-6" />
                                            ) : (
                                                <Icon className="h-6 w-6" />
                                            )}
                                        </div>
                                        <p
                                            className={`text-sm font-medium ${isActive ? "text-[var(--color-brand-blue)]" : "text-gray-600"
                                                }`}
                                        >
                                            {s.title}
                                        </p>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div
                                            className={`h-1 flex-1 mx-4 rounded ${step > s.number ? "bg-[var(--color-brand-green)]" : "bg-gray-200"
                                                }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                    {step === 1 && <Step1Basics formData={formData} updateField={updateField} />}
                    {step === 2 && <Step2Location formData={formData} updateField={updateField} />}
                    {step === 3 && <Step3Details formData={formData} updateField={updateField} />}
                    {step === 4 && <Step4Photos formData={formData} updateField={updateField} />}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setStep((s) => Math.max(1, s - 1))}
                            disabled={step === 1}
                            className="gap-2 text-gray-700 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        {step < 4 ? (
                            <Button
                                onClick={() => setStep((s) => s + 1)}
                                className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 gap-2"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 gap-2"
                            >
                                {loading ? "Updating..." : "Update Property"}
                                <Check className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reuse Step components from AddPropertyPage or re-implement if they were just local
// Since they were local to AddPropertyPage, I'll re-implement them or I should have moved them to components
// For now, I'll copy them to keep it simple and independent

function Step1Basics({ formData, updateField }: any) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Property Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {PROPERTY_TYPES.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => updateField("propertyType", type.value)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${formData.propertyType === type.value
                                ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)] text-white"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe your property..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-gray-900 placeholder:text-gray-400"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State *
                    </label>
                    <select
                        value={formData.state}
                        onChange={(e) => {
                            updateField("state", e.target.value);
                            updateField("city", ""); // Reset city when state changes
                        }}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-gray-900"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        LGA / City / Area *
                    </label>
                    <select
                        value={formData.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        disabled={!formData.state}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] text-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Property Features
                </label>
                <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.furnished}
                            onChange={(e) => updateField("furnished", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded"
                        />
                        <span className="text-sm text-gray-700 font-medium">Furnished</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.serviced}
                            onChange={(e) => updateField("serviced", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded"
                        />
                        <span className="text-sm text-gray-700 font-medium">Serviced</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.petsAllowed}
                            onChange={(e) => updateField("petsAllowed", e.target.checked)}
                            className="w-4 h-4 text-[var(--color-brand-green)] rounded"
                        />
                        <span className="text-sm text-gray-700 font-medium">Pets Allowed</span>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AMENITIES.map((amenity) => (
                        <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all text-left ${formData.amenities?.includes(amenity)
                                ? "border-[var(--color-brand-green)] bg-[var(--color-brand-green)] text-white"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
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
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Property Photos
                </label>
                <p className="text-sm text-gray-600 mb-4">
                    Upload high-quality photos. Click "Set as Cover" to choose your cover photo, or use arrows to reorder.
                </p>

                <label className="block w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[var(--color-brand-green)] transition-colors cursor-pointer">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                    />
                    <div className="text-center">
                        <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">
                            {uploading ? "Uploading..." : "Click to upload photos"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
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
