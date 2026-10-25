import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const createReview = async (req: Request, res: Response) => {
    try {
        const reviewerId = req.user?.id;
        const { rating, locationRating, valueRating, landlordRating, comment, propertyId } = req.body;

        if (!reviewerId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        // Verify transaction exists and is RELEASED (ensure user actually rented it)
        const transaction = await prisma.transaction.findFirst({
            where: {
                propertyId,
                tenantId: reviewerId,
                OR: [
                    { status: 'RELEASED' },
                    { escrowReleased: true }
                ]
            },
            include: {
                property: {
                    select: { landlordId: true }
                }
            }
        });

        if (!transaction) {
            return res.status(403).json({ status: 'error', message: 'Only completed tenancies can leave a review' });
        }

        const isVerified = true;

        // Check if review already exists
        const existingReview = await prisma.review.findUnique({
            where: {
                propertyId_reviewerId: {
                    propertyId,
                    reviewerId
                }
            }
        });

        if (existingReview) {
            return res.status(400).json({ status: 'error', message: 'You have already reviewed this property' });
        }

        const review = await prisma.review.create({
            data: {
                rating,
                locationRating,
                valueRating,
                landlordRating,
                comment,
                propertyId,
                reviewerId,
                verified: isVerified
            }
        });

        // Update Property Average Rating
        const propertyAggregates = await prisma.review.aggregate({
            where: { propertyId },
            _avg: { rating: true },
            _count: { id: true }
        });

        await prisma.property.update({
            where: { id: propertyId },
            data: {
                avgRating: propertyAggregates._avg.rating || rating,
                reviewCount: propertyAggregates._count.id
            }
        });

        // Update Landlord Average Rating
        const landlordId = transaction?.property?.landlordId;
        if (landlordId) {
            const landlordAggregates = await prisma.review.aggregate({
                where: {
                    property: { landlordId }
                },
                _avg: { landlordRating: true },
                _count: { id: true }
            });

            await prisma.user.update({
                where: { id: landlordId },
                data: {
                    // @ts-ignore
                    landlordAvgRating: landlordAggregates._avg.landlordRating || landlordRating || rating,
                    // @ts-ignore
                    landlordReviewCount: landlordAggregates._count.id
                }
            });
        }

        res.status(201).json({ status: 'success', data: review });
    } catch (error) {
        console.error('Create Review Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create review' });
    }
};

export const getPropertyReviews = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const reviews = await prisma.review.findMany({
            where: { propertyId: id },
            include: {
                reviewer: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ status: 'success', data: reviews });
    } catch (error) {
        console.error('Get Reviews Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch reviews' });
    }
};
