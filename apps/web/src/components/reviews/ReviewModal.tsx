"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Star, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: {
        id: string;
        propertyId: string;
        tenantId: string;
        property: {
            title: string;
            images: { url: string }[];
        };
    };
    onSuccess: () => void;
}

export function ReviewModal({ isOpen, onClose, transaction, onSuccess }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setLoading(true);
        try {
            await api.post("/reviews", {
                rating,
                landlordRating: rating, // Use overall rating for landlord too for now
                comment,
                propertyId: transaction.propertyId,
                reviewerId: transaction.tenantId
            });
            toast.success("Review submitted successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Failed to submit review:", error);
            if (error.response?.data?.message?.includes("already reviewed")) {
                toast.info("Review Already Submitted", {
                    description: "You have already submitted a review for this property."
                });
                onSuccess();
                onClose();
                return;
            }
            toast.error(error.response?.data?.message || "Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !loading && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rate your experience</DialogTitle>
                    <DialogDescription>
                        How was your stay at {transaction.property.title}?
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    {/* Star Rating */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={cn(
                                        "w-10 h-10 transition-colors",
                                        (hoverRating || rating) >= star
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-gray-100 text-gray-300"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                        {hoverRating || rating ? (
                            <span className="text-yellow-600">
                                {["Terrible", "Bad", "Okay", "Good", "Excellent"][(hoverRating || rating) - 1]}
                            </span>
                        ) : (
                            "Select a rating"
                        )}
                    </p>

                    {/* Comment */}
                    <div className="w-full">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your thoughts (optional)"
                            className="w-full min-h-[100px] p-3 rounded-lg border border-gray-200 focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] outline-none resize-none text-sm"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || rating === 0} className="bg-[var(--color-brand-blue)]">
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Submit Review"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
