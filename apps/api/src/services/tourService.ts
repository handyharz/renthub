import { prisma } from "../config/database";
import { TourStatus } from "@prisma/client";

export class TourService {
    async createTourRequest(data: {
        propertyId: string;
        tenantId: string;
        landlordId: string;
        preferredDate: Date;
        preferredTime: string;
        message?: string;
    }) {
        return await prisma.tourRequest.create({
            data: {
                propertyId: data.propertyId,
                tenantId: data.tenantId,
                landlordId: data.landlordId,
                preferredDate: data.preferredDate,
                preferredTime: data.preferredTime,
                message: data.message,
                status: TourStatus.PENDING,
            },
            include: {
                property: true,
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
    }

    async getTourRequestsByUser(userId: string, role: "LANDLORD" | "TENANT") {
        const where = role === "LANDLORD" ? { landlordId: userId } : { tenantId: userId };

        return await prisma.tourRequest.findMany({
            where,
            include: {
                property: {
                    include: {
                        images: {
                            where: { isPrimary: true },
                            take: 1,
                        },
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        phone: true,
                    },
                },
                landlord: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                preferredDate: "asc",
            },
        });
    }

    async updateTourStatus(tourId: string, status: TourStatus) {
        return await prisma.tourRequest.update({
            where: { id: tourId },
            data: { status },
        });
    }
}

export const tourService = new TourService();
