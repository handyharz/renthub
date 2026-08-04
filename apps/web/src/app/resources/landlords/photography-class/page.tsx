"use client";

import {
    Camera,
    ArrowRight,
    CheckCircle2,
    Sun,
    Maximize,
    Smartphone,
    Layout,
    ArrowLeft,
    Zap,
    Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function PhotographyMasterclassPage() {
    const tips = [
        {
            title: "Let There Be Light",
            icon: Sun,
            text: "Natural light is your best friend. Open all curtains, blinds, and doors. The best time to photograph is usually mid-morning or late afternoon when the sun is not directly overhead.",
            pro: "Avoid using the built-in flash; it creates harsh shadows and makes rooms look smaller."
        },
        {
            title: "Think Wide, Not High",
            icon: Maximize,
            text: "Take horizontal (landscape) photos. This is how the human eye naturally sees rooms and how our platform is optimized. Shoot from the corners of the room to capture as much space as possible.",
            pro: "Keep your camera at chest height—not eye level—to make the space feel grounded and spacious."
        },
        {
            title: "De-clutter the Frame",
            icon: Layout,
            text: "A clean space sells faster. Remove personal items, laundry, or messy cables from the view. A 'staged' look—even with just minimal furniture—helps tenants visualize themselves living there.",
            pro: "If the house is empty, focus on the cleanliness of the tiles and the quality of the finishing."
        },
        {
            title: "The Cover Shot",
            icon: ImageIcon,
            text: "Your primary photo should be the 'Wow' factor. Usually, this is the building's exterior or a spacious living room. Make sure it's bright and perfectly straight.",
            pro: "Ensure your primary image has no people or cars blocking the view of the building."
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header / Nav context */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] py-4">
                <div className="container-wide flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                    <Link href="/resources" className="hover:text-[var(--color-brand-green)] flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" /> Resources
                    </Link>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-[var(--text-primary)] font-bold">Photography Masterclass</span>
                </div>
            </div>

            <section className="py-20 bg-[var(--bg-primary)]">
                <div className="container-wide">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 text-[var(--color-brand-green)] font-black text-xs uppercase tracking-widest mb-6">
                            <Camera className="h-4 w-4" /> Visual Excellence
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-8 leading-tight">
                            Photography <span className="text-[var(--color-brand-green)]">Masterclass</span>
                        </h1>
                        <p className="text-xl text-[var(--text-secondary)] mb-12 leading-relaxed font-medium">
                            Better photos lead to better tenants. Listings with high-quality, bright photos
                            get **3x more clicks** and rent out **50% faster** on RentHub.
                        </p>

                        <div className="grid gap-8 mb-16">
                            {tips.map((tip) => (
                                <div key={tip.title} className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm group hover:shadow-xl transition-all">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        <div className="h-16 w-16 rounded-2xl bg-[var(--color-brand-green)]/15 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-brand-green)] group-hover:transition-colors">
                                            <tip.icon className="h-8 w-8 text-[var(--color-brand-green)] group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4">{tip.title}</h3>
                                            <p className="text-[var(--text-primary)] font-medium leading-relaxed mb-6">
                                                {tip.text}
                                            </p>
                                            <div className="p-4 bg-[var(--color-brand-green)]/15 rounded-2xl border border-green-100 flex items-start gap-3">
                                                <Zap className="h-5 w-5 text-[var(--color-brand-green)] shrink-0 mt-0.5" />
                                                <p className="text-sm text-green-900 font-bold italic">
                                                    Pro Tip: {tip.pro}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Smartphone Advice */}
                        <div className="bg-gray-900 rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden mb-16 shadow-2xl">
                            <div className="relative z-10">
                                <Smartphone className="h-12 w-12 text-purple-400 mb-6" />
                                <h2 className="text-3xl font-black mb-6">No DSLR? No Problem.</h2>
                                <p className="text-[var(--text-muted)] text-lg leading-relaxed font-medium mb-8">
                                    Modern smartphones can take incredible property photos. Just ensure your lens is clean
                                    (wipe it with a soft cloth!) and use the 'Grid' feature in your camera app to
                                    keep your horizons straight.
                                </p>
                                <ul className="grid md:grid-cols-2 gap-4">
                                    {[
                                        "Clean the lens before every shoot",
                                        "Use the wide-angle lens (0.5x) if available",
                                        "Lock the exposure on the bright areas",
                                        "Always hold the phone horizontally"
                                    ].map((check) => (
                                        <li key={check} className="flex items-center gap-3 font-bold text-sm text-gray-300">
                                            <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-green)]" />
                                            {check}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Camera className="absolute -bottom-10 -right-10 h-64 w-64 text-white/5" />
                        </div>

                        <div className="mt-16 text-center">
                            <Link href="/properties/new">
                                <Button className="bg-[var(--color-brand-green)] text-white font-black h-14 px-10 rounded-xl text-lg hover:shadow-xl hover:shadow-green-200 transition-all">
                                    Add New Listing
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
