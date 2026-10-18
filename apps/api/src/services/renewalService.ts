import { prisma } from "../config/database";
import { LeaseRenewal, RenewalStatus, NotificationType } from "@prisma/client";

export class RenewalService {
    /**
     * Landlord creates or triggers a lease renewal offer
     */
    async createRenewalOffer(data: {
        landlordId: string;
        propertyId: string;
        tenantId?: string;
        offeredRent: number;
        leaseDuration?: number; // months (e.g. 12 or 24)
        currentLeaseEndDate?: Date;
        newLeaseStartDate?: Date;
        landlordNote?: string;
    }): Promise<LeaseRenewal> {
        const property = await prisma.property.findUnique({
            where: { id: data.propertyId },
            include: {
                transactions: {
                    where: {
                        status: { in: ["ESCROWED", "RELEASED", "SUCCESSFUL"] }
                    },
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            }
        });

        if (!property) {
            throw new Error("Property not found");
        }

        if (property.landlordId !== data.landlordId) {
            throw new Error("Unauthorized: You do not own this property");
        }

        // Determine tenant
        let targetTenantId = data.tenantId;
        const latestTx = property.transactions[0];

        if (!targetTenantId && latestTx) {
            targetTenantId = latestTx.tenantId;
        }

        if (!targetTenantId) {
            // Check rental applications
            const latestApp = await prisma.rentalApplication.findFirst({
                where: { propertyId: data.propertyId, status: "APPROVED" },
                orderBy: { createdAt: "desc" }
            });
            if (latestApp) {
                targetTenantId = latestApp.tenantId;
            }
        }

        if (!targetTenantId) {
            throw new Error("Could not find an active or previous tenant for this property");
        }

        const leaseDuration = data.leaseDuration || 12;
        const currentRent = latestTx ? latestTx.rentAmount : property.pricePerYear;
        const offeredRent = data.offeredRent || currentRent;

        // Calculate lease period dates
        const now = new Date();
        const currentLeaseEndDate = data.currentLeaseEndDate || latestTx?.leaseEndDate || new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // default 60 days ahead
        const newLeaseStartDate = data.newLeaseStartDate || currentLeaseEndDate;
        const newLeaseEndDate = new Date(newLeaseStartDate);
        newLeaseEndDate.setMonth(newLeaseEndDate.getMonth() + leaseDuration);

        // 2% tenant fee on top + 2% landlord fee from rent
        const platformFeeTenant = Math.round(offeredRent * 0.02);
        const platformFeeLandlord = Math.round(offeredRent * 0.02);

        // Caution deposit is retained/rolled over from original transaction
        const cautionAmount = latestTx?.cautionFee || property.cautionFee || 0;

        const renewal = await prisma.leaseRenewal.create({
            data: {
                propertyId: data.propertyId,
                tenantId: targetTenantId,
                landlordId: data.landlordId,
                originalTransactionId: latestTx?.id,
                currentRent,
                offeredRent,
                leaseDuration,
                currentLeaseEndDate,
                newLeaseStartDate,
                newLeaseEndDate,
                platformFeeTenant,
                platformFeeLandlord,
                cautionRolledOver: true,
                cautionAmount,
                status: RenewalStatus.OFFERED_BY_LANDLORD,
                landlordNote: data.landlordNote
            },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                        images: { select: { url: true, isPrimary: true } }
                    }
                },
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
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

        // Send in-app notification to tenant
        await prisma.notification.create({
            data: {
                userId: targetTenantId,
                type: NotificationType.LEASE_RENEWAL_OFFERED,
                title: "Lease Renewal Offer Received",
                message: `${renewal.landlord.firstName} has offered a ${leaseDuration}-month lease renewal for ${property.title}. Review offer in your dashboard.`,
                actionUrl: "/dashboard?tab=applications",
                actionText: "View Renewal Offer"
            }
        }).catch(console.error);

        return renewal;
    }

    /**
     * Fetch renewals for a landlord
     */
    async getLandlordRenewals(landlordId: string) {
        return await prisma.leaseRenewal.findMany({
            where: { landlordId },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                        images: { select: { url: true, isPrimary: true } }
                    }
                },
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    /**
     * Fetch renewals for a tenant
     */
    async getTenantRenewals(tenantId: string) {
        return await prisma.leaseRenewal.findMany({
            where: { tenantId },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        address: true,
                        city: true,
                        images: { select: { url: true, isPrimary: true } }
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
            },
            orderBy: { createdAt: "desc" }
        });
    }

    /**
     * Tenant responds to a renewal offer
     */
    async respondToRenewal(data: {
        renewalId: string;
        tenantId: string;
        action: "ACCEPT" | "DECLINE" | "COUNTER";
        counterRent?: number;
        tenantNote?: string;
    }) {
        const renewal = await prisma.leaseRenewal.findUnique({
            where: { id: data.renewalId },
            include: {
                property: true,
                landlord: true,
                tenant: true
            }
        });

        if (!renewal) {
            throw new Error("Renewal offer not found");
        }

        if (renewal.tenantId !== data.tenantId) {
            throw new Error("Unauthorized: Only the tenant can respond to this renewal");
        }

        let newStatus: RenewalStatus = renewal.status;

        if (data.action === "ACCEPT") {
            newStatus = RenewalStatus.ACCEPTED;
        } else if (data.action === "DECLINE") {
            newStatus = RenewalStatus.DECLINED;
        } else if (data.action === "COUNTER") {
            newStatus = RenewalStatus.COUNTER_OFFERED;
        }

        const updated = await prisma.leaseRenewal.update({
            where: { id: data.renewalId },
            data: {
                status: newStatus,
                tenantNote: data.tenantNote,
                ...(data.action === "COUNTER" && data.counterRent ? { offeredRent: data.counterRent } : {})
            },
            include: {
                property: true,
                landlord: true,
                tenant: true
            }
        });

        // Notify landlord
        const notifType = data.action === "ACCEPT"
            ? NotificationType.LEASE_RENEWAL_ACCEPTED
            : NotificationType.LEASE_RENEWAL_DECLINED;

        await prisma.notification.create({
            data: {
                userId: renewal.landlordId,
                type: notifType,
                title: data.action === "ACCEPT" ? "Renewal Offer Accepted!" : "Renewal Offer Response",
                message: `${renewal.tenant.firstName} ${data.action.toLowerCase()}ed your renewal offer for ${renewal.property.title}.`,
                actionUrl: "/dashboard?tab=applications",
                actionText: "View Renewal Details"
            }
        }).catch(console.error);

        return updated;
    }
}

export const renewalService = new RenewalService();
