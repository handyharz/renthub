"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Maximize2, Grid3X3, Sparkles } from "lucide-react";

interface ImageCarouselProps {
    images: { url: string; id: string }[];
    title: string;
}

export function ImageCarousel({ images, title }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const safeImages = images && images.length > 0 ? images : [];

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
    };

    const goToImage = (index: number) => {
        setCurrentIndex(index);
    };

    const openLightbox = (index = 0) => {
        setCurrentIndex(index);
        setIsLightboxOpen(true);
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
    };

    // Keyboard navigation
    useEffect(() => {
        if (!isLightboxOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") goToPrevious();
            if (e.key === "ArrowRight") goToNext();
            if (e.key === "Escape") closeLightbox();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isLightboxOpen, safeImages.length]);

    if (safeImages.length === 0) {
        return (
            <div className="w-full h-72 sm:h-96 md:h-[460px] bg-[var(--bg-muted)] border border-[var(--border-color)] flex flex-col items-center justify-center rounded-3xl text-center p-6">
                <div className="p-4 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] mb-3">
                    <Sparkles className="w-8 h-8" />
                </div>
                <p className="text-base font-bold text-[var(--text-primary)]">Photographs Pending</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
                    Verified photos are currently being curated by the landlord and listing agent.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop: Airbnb-Style 5-Photo Mosaic (md and up) */}
            <div className="hidden md:block relative rounded-3xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
                {safeImages.length >= 5 ? (
                    <div className="grid grid-cols-4 gap-2.5 h-[480px] p-2.5">
                        {/* Primary Big Photo (Left half, 2 cols) */}
                        <div
                            onClick={() => openLightbox(0)}
                            className="col-span-2 relative h-full rounded-2xl overflow-hidden cursor-pointer group"
                        >
                            <Image
                                src={safeImages[0].url}
                                alt={`${title} - Main photo`}
                                fill
                                priority
                                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        </div>

                        {/* Middle Column (2 stacked photos) */}
                        <div className="col-span-1 grid grid-rows-2 gap-2.5 h-full">
                            <div
                                onClick={() => openLightbox(1)}
                                className="relative h-full rounded-2xl overflow-hidden cursor-pointer group"
                            >
                                <Image
                                    src={safeImages[1].url}
                                    alt={`${title} - Photo 2`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </div>
                            <div
                                onClick={() => openLightbox(2)}
                                className="relative h-full rounded-2xl overflow-hidden cursor-pointer group"
                            >
                                <Image
                                    src={safeImages[2].url}
                                    alt={`${title} - Photo 3`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </div>
                        </div>

                        {/* Right Column (2 stacked photos) */}
                        <div className="col-span-1 grid grid-rows-2 gap-2.5 h-full">
                            <div
                                onClick={() => openLightbox(3)}
                                className="relative h-full rounded-2xl overflow-hidden cursor-pointer group"
                            >
                                <Image
                                    src={safeImages[3].url}
                                    alt={`${title} - Photo 4`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </div>
                            <div
                                onClick={() => openLightbox(4)}
                                className="relative h-full rounded-2xl overflow-hidden cursor-pointer group"
                            >
                                <Image
                                    src={safeImages[4].url}
                                    alt={`${title} - Photo 5`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </div>
                        </div>
                    </div>
                ) : safeImages.length >= 3 ? (
                    <div className="grid grid-cols-3 gap-2.5 h-[460px] p-2.5">
                        <div
                            onClick={() => openLightbox(0)}
                            className="col-span-2 relative h-full rounded-2xl overflow-hidden cursor-pointer group"
                        >
                            <Image
                                src={safeImages[0].url}
                                alt={`${title} - Main photo`}
                                fill
                                priority
                                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        </div>
                        <div className="col-span-1 grid grid-rows-2 gap-2.5 h-full">
                            {safeImages.slice(1, 3).map((img, i) => (
                                <div
                                    key={img.id || i}
                                    onClick={() => openLightbox(i + 1)}
                                    className="relative h-full rounded-2xl overflow-hidden cursor-pointer group"
                                >
                                    <Image
                                        src={img.url}
                                        alt={`${title} - Photo ${i + 2}`}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : safeImages.length === 2 ? (
                    <div className="grid grid-cols-2 gap-2.5 h-[460px] p-2.5">
                        {safeImages.map((img, i) => (
                            <div
                                key={img.id || i}
                                onClick={() => openLightbox(i)}
                                className="relative h-full rounded-2xl overflow-hidden cursor-pointer group"
                            >
                                <Image
                                    src={img.url}
                                    alt={`${title} - Photo ${i + 1}`}
                                    fill
                                    priority={i === 0}
                                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        onClick={() => openLightbox(0)}
                        className="relative h-[460px] p-2.5 rounded-2xl overflow-hidden cursor-pointer group"
                    >
                        <Image
                            src={safeImages[0].url}
                            alt={`${title} - Full photo`}
                            fill
                            priority
                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                    </div>
                )}

                {/* Show All Photos Floating Pill */}
                <button
                    onClick={() => openLightbox(0)}
                    className="absolute bottom-6 right-6 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black border border-[var(--border-color)] backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
                >
                    <Grid3X3 className="w-4 h-4 text-[var(--color-brand-green)]" />
                    <span>Show all {safeImages.length} photos</span>
                </button>
            </div>

            {/* Mobile View: High-res swipe slider (under md) */}
            <div className="block md:hidden relative w-full h-[320px] rounded-3xl overflow-hidden group bg-black border border-[var(--border-color)]">
                <Image
                    src={safeImages[currentIndex]?.url}
                    alt={`${title} - Mobile photo ${currentIndex + 1}`}
                    fill
                    priority
                    className="object-cover transition-opacity duration-300"
                />

                {/* Left/Right Swipe Nav */}
                {safeImages.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2.5 backdrop-blur-sm active:scale-90 transition-all"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2.5 backdrop-blur-sm active:scale-90 transition-all"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}

                {/* Counter Pill */}
                <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-black px-3 py-1.5 rounded-full backdrop-blur-md">
                    {currentIndex + 1} / {safeImages.length}
                </div>

                {/* Expand Pill */}
                <button
                    onClick={() => openLightbox(currentIndex)}
                    className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 text-white text-xs font-bold px-3.5 py-2 rounded-xl backdrop-blur-md flex items-center gap-1.5"
                >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Full View</span>
                </button>
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-8 backdrop-blur-xl animate-in fade-in duration-200"
                    tabIndex={0}
                >
                    {/* Top Bar */}
                    <div className="flex items-center justify-between text-white z-10 max-w-6xl w-full mx-auto">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black bg-white/10 px-3.5 py-1.5 rounded-full">
                                {currentIndex + 1} / {safeImages.length}
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-white/70 line-clamp-1 max-w-md hidden sm:inline">
                                {title}
                            </span>
                        </div>
                        <button
                            onClick={closeLightbox}
                            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                            aria-label="Close photo gallery"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Main Image Display */}
                    <div className="relative flex-1 w-full max-w-6xl max-h-[75vh] mx-auto my-auto flex items-center justify-center">
                        <div className="relative w-full h-full">
                            <Image
                                src={safeImages[currentIndex]?.url}
                                alt={`${title} - Photo ${currentIndex + 1}`}
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        {/* Navigation Arrows */}
                        {safeImages.length > 1 && (
                            <>
                                <button
                                    onClick={goToPrevious}
                                    className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-white/30 text-white rounded-full p-3 sm:p-4 backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                                    aria-label="Previous photo"
                                >
                                    <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
                                </button>
                                <button
                                    onClick={goToNext}
                                    className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-white/30 text-white rounded-full p-3 sm:p-4 backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                                    aria-label="Next photo"
                                >
                                    <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Bottom Thumbnail Strip */}
                    <div className="w-full max-w-4xl mx-auto overflow-x-auto py-2 flex items-center justify-center gap-2 scrollbar-none z-10">
                        {safeImages.map((image, index) => (
                            <button
                                key={image.id || index}
                                onClick={() => goToImage(index)}
                                className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border-2 transition-all ${
                                    index === currentIndex
                                        ? "border-emerald-400 shadow-lg scale-105 ring-2 ring-emerald-400/30"
                                        : "border-white/20 hover:border-white/50 opacity-50 hover:opacity-100"
                                }`}
                            >
                                <Image
                                    src={image.url}
                                    alt={`Thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
