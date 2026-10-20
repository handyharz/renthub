import { prisma } from "../config/database";
import { RentalApplication, ApplicationStatus } from "@prisma/client";

export class ApplicationService {
    /**
     * Submit a new rental application
     */
    async createApplication(data: {
        tenantId: string;
        propertyId: string;
        proposedMoveInDate: Date;
        leaseDuration?: number;
        note?: string;
    }): Promise<RentalApplication> {
        // Check if property exists and is available
        const property = await prisma.property.findUnique({
            where: { id: data.propertyId },
            select: {
                id: true,
                status: true,
                landlordId: true,
                landlord: { select: { id: true, clerkId: true } }
            }
        });

        if (!property) {
            throw new Error("Property not found");
        }

        if (
            property.landlordId === data.tenantId ||
            property.landlord?.id === data.tenantId ||
            property.landlord?.clerkId === data.tenantId
        ) {
            throw new Error("You cannot apply to rent your own property");
        }

        if (property.status !== "AVAILABLE") {
            throw new Error("Property is not currently available for application");
        }

        // Check if tenant already has an active application for this property
        const existingApp = await prisma.rentalApplication.findFirst({
            where: {
                tenantId: data.tenantId,
                propertyId: data.propertyId,
                status: {
                    in: [ApplicationStatus.PENDING, ApplicationStatus.APPROVED]
                }
            }
        });

        if (existingApp) {
            throw new Error("You already have an active application for this property");
        }

        return await prisma.rentalApplication.create({
            data: {
                tenantId: data.tenantId,
                propertyId: data.propertyId,
                landlordId: property.landlordId,
                proposedMoveInDate: data.proposedMoveInDate,
                leaseDuration: data.leaseDuration || 12,
                note: data.note,
                status: ApplicationStatus.PENDING
            },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                        pricePerYear: true,
                        images: { take: 1, where: { isPrimary: true } }
                    }
                },
                landlord: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });
    }

    /**
     * Get tenant applications
     */
    async getTenantApplications(tenantId: string): Promise<RentalApplication[]> {
        return await prisma.rentalApplication.findMany({
            where: { tenantId },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                        pricePerYear: true,
                        cautionFee: true,
                        legalFee: true,
                        images: { take: 1, where: { isPrimary: true } }
                    }
                },
                landlord: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        phone: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    /**
     * Get landlord applications
     */
    async getLandlordApplications(landlordId: string): Promise<RentalApplication[]> {
        return await prisma.rentalApplication.findMany({
            where: { landlordId },
            include: {
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        phone: true,
                        email: true,
                        verified: true,
                        phoneVerified: true
                    }
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                        pricePerYear: true,
                        images: { take: 1, where: { isPrimary: true } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    /**
     * Get single application by ID
     */
    async getApplicationById(id: string): Promise<RentalApplication | null> {
        return await prisma.rentalApplication.findUnique({
            where: { id },
            include: {
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true,
                        avatar: true,
                        verified: true
                    }
                },
                landlord: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true
                    }
                },
                property: true
            }
        });
    }

    /**
     * Update application status (Landlord approves/rejects)
     */
    async updateApplicationStatus(
        id: string,
        landlordId: string,
        status: ApplicationStatus
    ): Promise<RentalApplication> {
        const application = await prisma.rentalApplication.findUnique({
            where: { id },
            select: { id: true, landlordId: true, propertyId: true }
        });

        if (!application) {
            throw new Error("Application not found");
        }

        if (application.landlordId !== landlordId) {
            throw new Error("Unauthorized: You do not own this property listing");
        }

        const updated = await prisma.rentalApplication.update({
            where: { id },
            data: { status }
        });

        // If approved, lock property by setting status to UNDER_OFFER
        if (status === ApplicationStatus.APPROVED) {
            await prisma.property.update({
                where: { id: application.propertyId },
                data: { status: "UNDER_OFFER" }
            });
        }

        return updated;
    }
}

export const applicationService = new ApplicationService();
