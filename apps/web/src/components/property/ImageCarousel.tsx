"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ImageCarouselProps {
    images: { url: string; id: string }[];
    title: string;
}

export function ImageCarousel({ images, title }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const goToImage = (index: number) => {
        setCurrentIndex(index);
    };

    const openLightbox = () => {
        setIsLightboxOpen(true);
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowLeft") goToPrevious();
        if (e.key === "ArrowRight") goToNext();
        if (e.key === "Escape") closeLightbox();
    };

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center rounded-2xl">
                <p className="text-gray-400">No images available</p>
            </div>
        );
    }

    return (
        <>
            {/* Main Carousel */}
            <div className="relative w-full h-[500px] bg-black rounded-2xl overflow-hidden group">
                {/* Main Image */}
                <div className="relative w-full h-full">
                    <Image
                        src={images[currentIndex]?.url}
                        alt={`${title} - Image ${currentIndex + 1}`}
                        fill
                        className="object-cover transition-opacity duration-500"
                        priority={currentIndex === 0}
                    />
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </>
                )}

                {/* Image Counter */}
                <div className="absolute top-4 right-4 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm">
                    {currentIndex + 1} / {images.length}
                </div>

                {/* Expand Button */}
                <button
                    onClick={openLightbox}
                    className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-900 rounded-lg px-4 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 font-semibold"
                >
                    <Maximize2 className="h-4 w-4" />
                    View Full Screen
                </button>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            onClick={() => goToImage(index)}
                            className={`relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${index === currentIndex
                                    ? "border-[var(--color-brand-blue)] shadow-lg scale-105"
                                    : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
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
            )}

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur-sm transition-all z-10"
                        aria-label="Close lightbox"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Image Counter in Lightbox */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-6 py-3 rounded-full text-lg font-semibold backdrop-blur-sm">
                        {currentIndex + 1} / {images.length}
                    </div>

                    {/* Main Lightbox Image */}
                    <div className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto px-20">
                        <Image
                            src={images[currentIndex]?.url}
                            alt={`${title} - Image ${currentIndex + 1}`}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Lightbox Navigation */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={goToPrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 backdrop-blur-sm transition-all hover:scale-110"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </button>
                            <button
                                onClick={goToNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 backdrop-blur-sm transition-all hover:scale-110"
                                aria-label="Next image"
                            >
                                <ChevronRight className="h-8 w-8" />
                            </button>
                        </>
                    )}

                    {/* Lightbox Thumbnail Strip */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 max-w-4xl overflow-x-auto px-4">
                        {images.map((image, index) => (
                            <button
                                key={image.id}
                                onClick={() => goToImage(index)}
                                className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex
                                        ? "border-white shadow-xl scale-110"
                                        : "border-white/30 hover:border-white/60 opacity-60 hover:opacity-100"
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
