"use client";

import { useEffect, useState } from "react";
import { Star, User, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: {
        firstName: string;
        lastName: string;
        avatar: string | null;
    };
    verified: boolean;
}

export function ReviewList({ propertyId }: { propertyId: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (propertyId) {
            fetchReviews();
        }
    }, [propertyId]);

    const fetchReviews = async () => {
        try {
            const res = await api.get(`/reviews/properties/${propertyId}`);
            setReviews(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse h-20 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)]"></div>;
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-10 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-color)]">
                <p className="text-[var(--text-secondary)] font-medium">No reviews yet. Be the first to review!</p>
            </div>
        );
    }

    const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 bg-[var(--bg-muted)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="text-4xl font-extrabold text-[var(--text-primary)]">{averageRating.toFixed(1)}</div>
                <div>
                    <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-5 h-5 ${star <= Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-[var(--text-muted)] opacity-30"}`}
                            />
                        ))}
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium mt-1">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
                </div>
            </div>

            <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b border-[var(--border-color)] pb-6 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-[var(--bg-muted)] flex items-center justify-center overflow-hidden border border-[var(--border-color)]">
                                    {review.reviewer.avatar ? (
                                        <img src={review.reviewer.avatar} alt="User" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-5 w-5 text-[var(--text-muted)]" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-[var(--text-primary)]">
                                        {review.reviewer.firstName} {review.reviewer.lastName}
                                    </h4>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                        {new Date(review.createdAt).toLocaleDateString(undefined, {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-[var(--text-muted)] opacity-30"}`}
                                    />
                                ))}
                            </div>
                        </div>
                        {review.comment && (
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mt-2 font-medium">{review.comment}</p>
                        )}
                        {review.verified && (
                            <div className="mt-2 text-xs text-[var(--color-brand-green)] font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Verified Resident
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
