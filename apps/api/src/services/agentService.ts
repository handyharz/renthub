import { prisma } from "../config/database";
import { AgentStatus, AgentListingStatus } from "@prisma/client";

export class AgentService {
    // ─── PROFILE ────────────────────────────────────────────────────────────────

    /**
     * Get or create an agent profile for a user.
     * Called after a user selects the AGENT role.
     */
    async getOrCreateProfile(userId: string) {
        const existing = await prisma.agentProfile.findUnique({
            where: { userId },
            include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true, phone: true, verified: true } } }
        });
        if (existing) return existing;

        return prisma.agentProfile.create({
            data: { userId },
            include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true, phone: true, verified: true } } }
        });
    }

    async getProfileByUserId(userId: string) {
        return prisma.agentProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        avatar: true, email: true, phone: true,
                        verified: true, clerkId: true
                    }
                }
            }
        });
    }

    async updateProfile(
        userId: string,
        data: {
            licenseNumber?: string;
            licenseDocUrl?: string;
            businessName?: string;
            businessAddress?: string;
            yearsOfExperience?: number;
            operatingCities?: string[];
            bio?: string;
            defaultCommissionPct?: number;
        }
    ) {
        // Cap commission at 5 % per platform rules
        if (data.defaultCommissionPct && data.defaultCommissionPct > 5) {
            throw new Error("Commission cannot exceed 5% of annual rent");
        }

        return prisma.agentProfile.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
            include: { user: { select: { id: true, firstName: true, lastName: true } } }
        });
    }

    /**
     * Submit profile for admin review (sets status to PENDING_REVIEW if fields complete)
     */
    async submitForReview(userId: string) {
        const profile = await prisma.agentProfile.findUnique({ where: { userId } });
        if (!profile) throw new Error("Agent profile not found");
        if (profile.status === AgentStatus.ACTIVE) throw new Error("Profile is already active");

        if (!profile.businessName || !profile.operatingCities.length) {
            throw new Error("Complete your business name and operating cities before submitting");
        }

        return prisma.agentProfile.update({
            where: { userId },
            data: { status: AgentStatus.PENDING_REVIEW }
        });
    }

    // ─── ADMIN REVIEW ────────────────────────────────────────────────────────────

    async listPendingProfiles(skip = 0, take = 20) {
        return prisma.agentProfile.findMany({
            where: { status: AgentStatus.PENDING_REVIEW },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, verified: true }
                }
            },
            orderBy: { createdAt: "asc" },
            skip, take
        });
    }

    async approveAgent(agentProfileId: string, adminClerkId: string) {
        const profile = await prisma.agentProfile.findUnique({ where: { id: agentProfileId } });
        if (!profile) throw new Error("Agent profile not found");

        // Update profile to active
        const updated = await prisma.agentProfile.update({
            where: { id: agentProfileId },
            data: {
                status: AgentStatus.ACTIVE,
                reviewedAt: new Date(),
                reviewedBy: adminClerkId,
                rejectionReason: null
            }
        });

        // Update user role to AGENT
        await prisma.user.update({
            where: { id: profile.userId },
            data: { role: "AGENT" }
        });

        return updated;
    }

    async rejectAgent(agentProfileId: string, adminClerkId: string, reason: string) {
        const profile = await prisma.agentProfile.findUnique({ where: { id: agentProfileId } });
        if (!profile) throw new Error("Agent profile not found");

        return prisma.agentProfile.update({
            where: { id: agentProfileId },
            data: {
                status: AgentStatus.REJECTED,
                reviewedAt: new Date(),
                reviewedBy: adminClerkId,
                rejectionReason: reason
            }
        });
    }

    async suspendAgent(agentProfileId: string) {
        return prisma.agentProfile.update({
            where: { id: agentProfileId },
            data: { status: AgentStatus.SUSPENDED }
        });
    }

    // ─── DELEGATION (AGENT LISTINGS) ─────────────────────────────────────────────

    /**
     * Agent requests to manage a property on behalf of a landlord.
     * Sets status to PENDING_LANDLORD until landlord authorizes.
     */
    async requestDelegation(data: {
        agentId: string;       // DB user.id of the agent
        propertyId: string;
        agentNote?: string;
        commissionPct?: number;
    }) {
        const { agentId, propertyId, agentNote, commissionPct } = data;

        // Verify agent is active
        const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: agentId } });
        if (!agentProfile || agentProfile.status !== AgentStatus.ACTIVE) {
            throw new Error("Agent is not currently active / verified");
        }

        // Fetch property
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { id: true, landlordId: true, status: true, title: true }
        });
        if (!property) throw new Error("Property not found");
        if (property.landlordId === agentId) throw new Error("You cannot be agent for your own property");

        // Cap commission
        const pct = commissionPct ?? agentProfile.defaultCommissionPct;
        if (pct > 5) throw new Error("Commission cannot exceed 5%");

        // Upsert — one delegation per property-agent pair
        return prisma.agentListing.upsert({
            where: { propertyId_agentId: { propertyId, agentId } },
            create: {
                propertyId,
                agentId,
                landlordId: property.landlordId,
                commissionPct: pct,
                agentNote,
                status: AgentListingStatus.PENDING_LANDLORD
            },
            update: {
                commissionPct: pct,
                agentNote,
                status: AgentListingStatus.PENDING_LANDLORD
            },
            include: {
                property: { select: { id: true, title: true, address: true, city: true } },
                agent: { select: { id: true, firstName: true, lastName: true, avatar: true, agentProfile: true } }
            }
        });
    }

    /**
     * Landlord authorizes an agent delegation request.
     */
    async authorizeDelegation(delegationId: string, landlordId: string, landlordNote?: string) {
        const delegation = await prisma.agentListing.findUnique({ where: { id: delegationId } });
        if (!delegation) throw new Error("Delegation not found");
        if (delegation.landlordId !== landlordId) throw new Error("Unauthorized: You don't own this property");
        if (delegation.status !== AgentListingStatus.PENDING_LANDLORD) {
            throw new Error("This delegation is not pending your authorization");
        }

        return prisma.agentListing.update({
            where: { id: delegationId },
            data: {
                status: AgentListingStatus.AUTHORIZED,
                authorizedAt: new Date(),
                landlordNote
            },
            include: {
                property: { select: { id: true, title: true } },
                agent: { select: { id: true, firstName: true, lastName: true } }
            }
        });
    }

    /**
     * Landlord revokes a previously authorized delegation.
     */
    async revokeDelegation(delegationId: string, landlordId: string) {
        const delegation = await prisma.agentListing.findUnique({ where: { id: delegationId } });
        if (!delegation) throw new Error("Delegation not found");
        if (delegation.landlordId !== landlordId) throw new Error("Unauthorized");

        return prisma.agentListing.update({
            where: { id: delegationId },
            data: { status: AgentListingStatus.REVOKED, revokedAt: new Date() }
        });
    }

    /**
     * Get delegations for an agent (their listings portfolio).
     */
    async getAgentDelegations(agentId: string) {
        return prisma.agentListing.findMany({
            where: { agentId },
            include: {
                property: {
                    select: {
                        id: true, title: true, address: true, city: true, state: true,
                        pricePerYear: true, status: true, bedrooms: true, bathrooms: true,
                        images: { take: 1, where: { isPrimary: true } }
                    }
                },
                landlord: { select: { id: true, firstName: true, lastName: true, avatar: true, phone: true } }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    /**
     * Get delegations for a landlord (pending and authorized).
     */
    async getLandlordDelegations(landlordId: string) {
        return prisma.agentListing.findMany({
            where: { landlordId },
            include: {
                property: {
                    select: {
                        id: true, title: true, address: true, city: true,
                        pricePerYear: true, status: true,
                        images: { take: 1, where: { isPrimary: true } }
                    }
                },
                agent: {
                    select: {
                        id: true, firstName: true, lastName: true, avatar: true, phone: true,
                        agentProfile: {
                            select: { businessName: true, avgRating: true, reviewCount: true, totalClosed: true, status: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    // ─── STATS ────────────────────────────────────────────────────────────────────

    async getAgentStats(agentId: string) {
        const [delegations, profile] = await Promise.all([
            prisma.agentListing.findMany({
                where: { agentId },
                select: { status: true, commissionAmount: true }
            }),
            prisma.agentProfile.findUnique({ where: { userId: agentId } })
        ]);

        const authorized = delegations.filter(d => d.status === "AUTHORIZED").length;
        const completed = delegations.filter(d => d.status === "COMPLETED").length;
        const pending = delegations.filter(d => d.status === "PENDING_LANDLORD").length;
        const totalEarned = delegations
            .filter(d => d.status === "COMPLETED" && d.commissionAmount)
            .reduce((sum, d) => sum + (d.commissionAmount ?? 0), 0);

        return { authorized, completed, pending, totalEarned, profile };
    }

    /**
     * List all active agents (public — for landlord browsing)
     */
    async listActiveAgents(filters: { city?: string; skip?: number; take?: number } = {}) {
        const { city, skip = 0, take = 20 } = filters;

        return prisma.agentProfile.findMany({
            where: {
                status: AgentStatus.ACTIVE,
                ...(city ? { operatingCities: { has: city } } : {})
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatar: true, phone: true }
                }
            },
            orderBy: [{ avgRating: "desc" }, { totalClosed: "desc" }],
            skip, take
        });
    }
}

export const agentService = new AgentService();
