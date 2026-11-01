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
            include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true, phone: true, verified: true, idDocumentUrl: true } } }
        });
        if (existing) return existing;

        return prisma.agentProfile.create({
            data: { userId },
            include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true, phone: true, verified: true, idDocumentUrl: true } } }
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
                        verified: true, clerkId: true, idDocumentUrl: true
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
            cacDocUrl?: string;
            addressDocUrl?: string;
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
            include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true, phone: true, verified: true, idDocumentUrl: true } } }
        });
    }

    /**
     * Submit profile for admin review (sets status to PENDING_REVIEW if fields and mandatory docs complete)
     */
    async submitForReview(userId: string) {
        const [profile, user] = await Promise.all([
            prisma.agentProfile.findUnique({ where: { userId } }),
            prisma.user.findUnique({ where: { id: userId }, select: { idDocumentUrl: true, verified: true } }),
        ]);

        if (!profile) throw new Error("Agent profile not found");
        if (profile.status === AgentStatus.ACTIVE) throw new Error("Profile is already active");

        const missing: string[] = [];
        if (!profile.businessName) missing.push("Business / Agency name");
        if (!profile.businessAddress) missing.push("Business address");
        if (!profile.operatingCities?.length) missing.push("Operating cities");
        if (!profile.addressDocUrl) missing.push("Office address proof (utility bill / lease agreement)");
        if (!user?.idDocumentUrl) missing.push("Government photo ID (uploaded on your profile)");

        if (missing.length > 0) {
            throw new Error(`Cannot submit application. Missing required items: ${missing.join(", ")}`);
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
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, verified: true, idDocumentUrl: true }
                }
            },
            orderBy: { createdAt: "asc" },
            skip, take
        });
    }

    async approveAgent(agentProfileId: string, adminClerkId: string) {
        const profile = await prisma.agentProfile.findUnique({
            where: { id: agentProfileId },
            include: { user: { select: { id: true, idDocumentUrl: true, verified: true } } }
        });
        if (!profile) throw new Error("Agent profile not found");

        const missing: string[] = [];
        if (!profile.addressDocUrl) missing.push("Office address proof");
        if (!profile.user?.idDocumentUrl) missing.push("Government photo ID");

        if (missing.length > 0) {
            throw new Error(`Cannot approve agent: Mandatory verification documents missing (${missing.join(", ")}).`);
        }

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

        // Update user role to AGENT and ensure verified is true
        await prisma.user.update({
            where: { id: profile.userId },
            data: { role: "AGENT", verified: true }
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

    async getAdminAgentKPIs() {
        const [totalProfiles, activeAgents, pendingReview, suspended, delegations, strikes] = await Promise.all([
            prisma.agentProfile.count(),
            prisma.agentProfile.count({ where: { status: AgentStatus.ACTIVE } }),
            prisma.agentProfile.count({ where: { status: AgentStatus.PENDING_REVIEW } }),
            prisma.agentProfile.count({ where: { status: AgentStatus.SUSPENDED } }),
            prisma.agentListing.findMany({
                where: { status: "COMPLETED" },
                select: { commissionAmount: true }
            }),
            prisma.agentStrike.findMany({
                where: { status: "UPHELD", strikeApplied: true }
            }),
        ]);

        const now = new Date();
        const activeStrikes = strikes.filter(s => !s.expiresAt || s.expiresAt > now).length;
        const totalCommissionPaid = delegations.reduce((sum, d) => sum + (d.commissionAmount || 0), 0);

        return {
            totalProfiles,
            activeAgents,
            pendingReview,
            suspended,
            activeStrikes,
            totalCommissionPaid,
            completedDeals: delegations.length,
        };
    }

    async listAdminAgents(filters: { status?: any; search?: string; city?: string; skip?: number; take?: number } = {}) {
        const { status, search, city, skip = 0, take = 50 } = filters;

        const where: any = {};
        if (status && status !== "ALL") {
            where.status = status as AgentStatus;
        }
        if (city && city !== "ALL") {
            where.operatingCities = { has: city };
        }
        if (search && search.trim()) {
            const q = search.trim();
            where.OR = [
                { businessName: { contains: q, mode: "insensitive" } },
                { licenseNumber: { contains: q, mode: "insensitive" } },
                { user: { firstName: { contains: q, mode: "insensitive" } } },
                { user: { lastName: { contains: q, mode: "insensitive" } } },
                { user: { email: { contains: q, mode: "insensitive" } } },
                { user: { phone: { contains: q, mode: "insensitive" } } },
            ];
        }

        return prisma.agentProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true, firstName: true, lastName: true, email: true,
                        phone: true, avatar: true, verified: true, idDocumentUrl: true
                    }
                }
            },
            orderBy: [{ createdAt: "desc" }],
            skip,
            take,
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
                            select: { businessName: true, avgRating: true, reviewCount: true, totalClosed: true, status: true, strikeCount: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    // ─── AGENT-CREATED LISTINGS ON BEHALF OF LANDLORD ────────────────────────────

    /**
     * Returns landlords for whom this agent has an AUTHORIZED delegation (can create listings)
     * OR a PENDING_LANDLORD delegation (awaiting landlord approval — shown as pending in UI).
     * Used to populate the "Select Landlord" dropdown and pending-approval status list.
     */
    async getAuthorizedLandlords(agentId: string) {
        const delegations = await prisma.agentListing.findMany({
            where: {
                agentId,
                status: { in: [AgentListingStatus.AUTHORIZED, AgentListingStatus.PENDING_LANDLORD] }
            },
            select: {
                id: true,
                status: true,
                landlordId: true,
                commissionPct: true,
                requestedAt: true,
                authorizedAt: true,
                property: {
                    select: { id: true, title: true, city: true }
                },
                landlord: {
                    select: {
                        id: true, firstName: true, lastName: true,
                        avatar: true, phone: true, email: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Build a de-duped landlord list, with pendingApproval and pendingProperties metadata
        const landlordMap = new Map<string, any>();
        for (const d of delegations) {
            const existing = landlordMap.get(d.landlordId);
            if (!existing) {
                landlordMap.set(d.landlordId, {
                    ...d.landlord,
                    agreedCommissionPct: d.commissionPct,
                    pendingApproval: d.status === AgentListingStatus.PENDING_LANDLORD,
                    authorizedAt: d.authorizedAt,
                    pendingProperties: d.status === AgentListingStatus.PENDING_LANDLORD
                        ? [{ id: d.property.id, title: d.property.title, city: d.property.city }]
                        : [],
                });
            } else {
                // If we already have this landlord as AUTHORIZED, keep them as authorized
                if (d.status === AgentListingStatus.AUTHORIZED) {
                    existing.pendingApproval = false;
                    existing.agreedCommissionPct = d.commissionPct;
                    existing.authorizedAt = d.authorizedAt;
                } else if (existing.pendingApproval) {
                    existing.pendingProperties.push({
                        id: d.property.id, title: d.property.title, city: d.property.city
                    });
                }
            }
        }
        return Array.from(landlordMap.values());
    }


    /**
     * Agent creates a new property listing on behalf of an authorized landlord.
     *
     * Rules:
     * - Agent must be ACTIVE.
     * - Agent must have at least one AUTHORIZED delegation for that landlordId.
     * - Property is created in DRAFT status — landlord must publish it.
     * - An AUTHORIZED AgentListing is auto-created at the agent's default commission rate.
     * - A notification is sent to the landlord to review and publish.
     */
    async createPropertyForLandlord(agentId: string, data: {
        landlordId: string;
        title: string;
        description: string;
        address: string;
        city: string;
        state: string;
        zipCode?: string;
        latitude?: number;
        longitude?: number;
        propertyType: string;
        bedrooms: number;
        bathrooms: number;
        toilets: number;
        parkingSpaces?: number;
        floorArea?: number;
        pricePerYear: number;
        cautionFee?: number;
        legalFee?: number;
        agentFee?: number;
        serviceFee?: number;
        paymentTerms?: string;
        negotiable?: boolean;
        furnished?: boolean;
        serviced?: boolean;
        petsAllowed?: boolean;
        powerSupply?: string;
        waterSupply?: string;
        amenities?: string[];
        images?: string[];
        agentNote?: string;
    }) {
        // 1. Verify agent is ACTIVE
        const ap = await prisma.agentProfile.findUnique({
            where: { userId: agentId },
            select: { status: true, defaultCommissionPct: true, businessName: true }
        });
        if (!ap || ap.status !== AgentStatus.ACTIVE) {
            throw new Error("Agent is not currently active / verified");
        }

        // 2. Verify agent has an AUTHORIZED delegation with this landlord
        const authorization = await prisma.agentListing.findFirst({
            where: { agentId, landlordId: data.landlordId, status: AgentListingStatus.AUTHORIZED },
            select: { id: true, commissionPct: true }
        });
        if (!authorization) {
            throw new Error("You do not have an authorized delegation with this landlord. The landlord must first authorize you on an existing property.");
        }

        // 3. Validate landlord exists
        const landlord = await prisma.user.findUnique({
            where: { id: data.landlordId },
            select: { id: true, firstName: true, lastName: true }
        });
        if (!landlord) throw new Error("Landlord not found");

        // 4. Create property as DRAFT under the landlord's account
        const property = await prisma.property.create({
            data: {
                title: data.title,
                description: data.description,
                address: data.address,
                city: data.city,
                state: data.state,
                zipCode: data.zipCode,
                latitude: data.latitude,
                longitude: data.longitude,
                propertyType: data.propertyType as any,
                bedrooms: data.bedrooms,
                bathrooms: data.bathrooms,
                toilets: data.toilets,
                parkingSpaces: data.parkingSpaces ?? 0,
                floorArea: data.floorArea,
                pricePerYear: data.pricePerYear,
                cautionFee: data.cautionFee ?? 0,
                legalFee: data.legalFee ?? 0,
                agentFee: data.agentFee ?? 0,
                serviceFee: data.serviceFee ?? 0,
                paymentTerms: data.paymentTerms as any ?? "TWO_YEARS",
                negotiable: data.negotiable ?? false,
                furnished: data.furnished ?? false,
                serviced: data.serviced ?? false,
                petsAllowed: data.petsAllowed ?? false,
                powerSupply: data.powerSupply as any ?? "GRID_ONLY",
                waterSupply: data.waterSupply as any ?? "BOREHOLE",
                status: "DRAFT" as any,
                landlord: { connect: { id: data.landlordId } },
                images: data.images?.length ? {
                    create: data.images.map((url: string, index: number) => ({
                        url,
                        publicId: `ag_img_${Date.now()}_${index}`,
                        isPrimary: index === 0,
                        order: index,
                    }))
                } : undefined,
                amenities: data.amenities?.length ? {
                    create: data.amenities.map((name: string) => ({ amenity: { connect: { name } } }))
                } : undefined,
            },
            include: {
                landlord: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                images: true,
            }
        });

        // 5. Auto-create an AUTHORIZED AgentListing for this new property
        await prisma.agentListing.create({
            data: {
                propertyId: property.id,
                agentId,
                landlordId: data.landlordId,
                status: AgentListingStatus.AUTHORIZED,
                commissionPct: authorization.commissionPct,
                agentNote: data.agentNote,
                authorizedAt: new Date(),
            }
        });

        // 6. Notify landlord to review and publish
        await prisma.notification.create({
            data: {
                userId: data.landlordId,
                type: "NEW_PROPERTY" as any,
                title: "New Listing Created on Your Behalf",
                message: `${ap.businessName || "Your agent"} has created a new property listing "${data.title}" for you. Please review the details and publish it when ready.`,
                actionUrl: `/dashboard/properties`,
                actionText: "Review & Publish"
            }
        }).catch(console.error);

        return property;
    }

    // ─── RECONCILIATION & STATS ──────────────────────────────────────────────────


    async reconcileCompletedAgentListings(agentId?: string) {
        try {
            const authorizedListings = await prisma.agentListing.findMany({
                where: {
                    status: "AUTHORIZED",
                    ...(agentId ? { agentId } : {}),
                },
                include: {
                    property: {
                        select: {
                            id: true,
                            status: true,
                            pricePerYear: true,
                            transactions: {
                                where: {
                                    OR: [{ status: "RELEASED" }, { escrowReleased: true }]
                                },
                                take: 1,
                                orderBy: { createdAt: "desc" }
                            }
                        }
                    }
                }
            });

            for (const al of authorizedListings) {
                const tx = al.property.transactions?.[0];
                const isRented = al.property.status === "RENTED" || tx != null;
                if (isRented) {
                    const rentAmount = tx?.rentAmount || al.property.pricePerYear;
                    const commissionAmount = Math.round(rentAmount * (al.commissionPct / 100));
                    await prisma.agentListing.update({
                        where: { id: al.id },
                        data: {
                            status: "COMPLETED",
                            commissionAmount,
                            completedAt: tx?.createdAt || new Date(),
                        }
                    });
                    await prisma.agentProfile.updateMany({
                        where: { userId: al.agentId },
                        data: {
                            totalClosed: { increment: 1 }
                        }
                    });
                }
            }
        } catch (e) {
            console.warn("[AgentService] Reconcile completed agent listings warning:", e);
        }
    }

    async getAgentStats(agentId: string) {
        await this.reconcileCompletedAgentListings(agentId);

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

    /**
     * Get commission payouts and settlement breakdown for an agent
     */
    async getAgentPayouts(agentId: string) {
        await this.reconcileCompletedAgentListings(agentId);

        const [user, delegations] = await Promise.all([
            prisma.user.findUnique({
                where: { id: agentId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    settlementLinkedAt: true,
                    afriExchangeAccountEmail: true,
                    afriExchangeWalletAddress: true,
                    afriExchangeUserId: true,
                }
            }),
            prisma.agentListing.findMany({
                where: { agentId },
                include: {
                    property: {
                        select: {
                            id: true,
                            title: true,
                            address: true,
                            city: true,
                            state: true,
                            pricePerYear: true,
                            status: true,
                            images: { take: 1, where: { isPrimary: true } },
                            transactions: {
                                where: { OR: [{ status: "RELEASED" }, { escrowReleased: true }] },
                                take: 1,
                                orderBy: { createdAt: "desc" },
                                select: {
                                    id: true,
                                    afriExchangeRef: true,
                                    status: true,
                                    releaseDate: true,
                                    rentAmount: true,
                                }
                            }
                        }
                    },
                    landlord: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            phone: true,
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            })
        ]);

        const completed = delegations.filter(d => d.status === "COMPLETED");
        const authorized = delegations.filter(d => d.status === "AUTHORIZED");
        const totalEarned = completed.reduce((sum, d) => sum + (d.commissionAmount ?? Math.round((d.property.pricePerYear * (d.commissionPct / 100)))), 0);
        const pendingCommission = authorized.reduce((sum, d) => sum + Math.round((d.property.pricePerYear * (d.commissionPct / 100))), 0);

        return {
            settlement: {
                isLinked: !!(user?.settlementLinkedAt && (user?.afriExchangeAccountEmail || user?.afriExchangeWalletAddress || user?.afriExchangeUserId)),
                accountEmail: user?.afriExchangeAccountEmail,
                walletAddress: user?.afriExchangeWalletAddress,
                linkedAt: user?.settlementLinkedAt,
            },
            summary: {
                totalEarned,
                pendingCommission,
                completedDeals: completed.length,
                activeDeals: authorized.length,
            },
            items: delegations.map(d => {
                const tx = d.property.transactions?.[0];
                const grossRent = tx?.rentAmount || d.property.pricePerYear;
                const commissionAmount = d.commissionAmount ?? Math.round(grossRent * (d.commissionPct / 100));
                const platformGuaranteeFee = Math.round(grossRent * 0.02); // 2% escrow guarantee fee
                const netLandlordProceeds = Math.max(0, grossRent - commissionAmount - platformGuaranteeFee);

                return {
                    id: d.id,
                    propertyId: d.property.id,
                    propertyTitle: d.property.title,
                    propertyAddress: `${d.property.address}, ${d.property.city}`,
                    propertyImage: d.property.images?.[0]?.url,
                    annualRent: grossRent,
                    commissionPct: d.commissionPct,
                    commissionAmount,
                    platformGuaranteeFee,
                    netLandlordProceeds,
                    transactionId: tx?.id,
                    afriExchangeRef: tx?.afriExchangeRef,
                    tokenType: "NT",
                    status: d.status,
                    landlordName: `${d.landlord.firstName} ${d.landlord.lastName}`,
                    landlordPhone: d.landlord.phone,
                    authorizedAt: d.authorizedAt,
                    completedAt: d.completedAt || tx?.releaseDate,
                    createdAt: d.createdAt,
                };
            })
        };
    }

    // ─── ZERO SIDE-PAYMENTS & STRIKE SYSTEM ────────────────────────────────────────

    /**
     * Tenant files a strike violation report against an agent
     */
    async fileStrikeReport(reporterId: string, data: {
        agentId: string;
        propertyId?: string;
        reason: any;
        description: string;
        evidenceUrls?: string[];
    }) {
        if (reporterId === data.agentId) {
            throw new Error("You cannot report yourself.");
        }

        const agent = await prisma.user.findUnique({
            where: { id: data.agentId },
            include: { agentProfile: true }
        });

        if (!agent) {
            throw new Error("Reported agent not found.");
        }

        const strike = await prisma.agentStrike.create({
            data: {
                agentId: data.agentId,
                reporterId,
                propertyId: data.propertyId || null,
                reason: data.reason,
                description: data.description,
                evidenceUrls: data.evidenceUrls || [],
                status: "PENDING",
            },
            include: {
                agent: { select: { id: true, firstName: true, lastName: true, phone: true } },
                reporter: { select: { id: true, firstName: true, lastName: true } },
                property: { select: { id: true, title: true, address: true } }
            }
        });

        return strike;
    }

    /**
     * Admin: List strikes / reports
     */
    async listStrikes(filters: { status?: any; skip?: number; take?: number } = {}) {
        const { status, skip = 0, take = 50 } = filters;
        return prisma.agentStrike.findMany({
            where: status ? { status } : {},
            include: {
                agent: {
                    select: {
                        id: true, firstName: true, lastName: true, phone: true, email: true,
                        agentProfile: {
                            select: {
                                businessName: true,
                                strikeCount: true,
                                status: true
                            }
                        }
                    }
                },
                reporter: {
                    select: { id: true, firstName: true, lastName: true, phone: true, email: true }
                },
                property: {
                    select: { id: true, title: true, address: true, city: true }
                }
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        });
    }

    /**
     * Admin: Review and adjudicate a strike report
     */
    async reviewStrike(strikeId: string, adminClerkId: string, action: "UPHOLD" | "DISMISS", adminNote?: string) {
        const strike = await prisma.agentStrike.findUnique({
            where: { id: strikeId },
            include: { agent: { include: { agentProfile: true } } }
        });

        if (!strike) {
            throw new Error("Strike report not found.");
        }

        if (action === "DISMISS") {
            return prisma.agentStrike.update({
                where: { id: strikeId },
                data: {
                    status: "DISMISSED",
                    reviewedBy: adminClerkId,
                    reviewedAt: new Date(),
                    adminNote: adminNote || "Dismissed by platform compliance team",
                }
            });
        }

        // Action is UPHOLD: Apply 90-day rolling strike to agent
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

        const updatedStrike = await prisma.agentStrike.update({
            where: { id: strikeId },
            data: {
                status: "UPHELD",
                strikeApplied: true,
                expiresAt,
                reviewedBy: adminClerkId,
                reviewedAt: new Date(),
                adminNote: adminNote || "Violation upheld. 90-day rolling strike registered against partner agent.",
            }
        });

        const { strikeCount, activeStrikes } = await this.syncActiveStrikes(strike.agentId);
        const shouldSuspend = strikeCount >= 3;

        if (shouldSuspend) {
            await prisma.agentProfile.updateMany({
                where: { userId: strike.agentId },
                data: { status: AgentStatus.SUSPENDED, strikeCount }
            });

            // If suspended due to 3 active strikes, revoke all active delegations
            await prisma.agentListing.updateMany({
                where: { agentId: strike.agentId, status: "AUTHORIZED" },
                data: {
                    status: "REVOKED",
                    revokedAt: new Date(),
                    landlordNote: "System revocation: Agent suspended due to platform side-payment violations (3 strikes accumulated)."
                }
            });
        }

        return {
            strike: updatedStrike,
            strikeCount,
            expiresAt,
            suspended: shouldSuspend,
        };
    }

    /**
     * Calculate active non-expired strikes and sync strikeCount for an agent
     */
    async syncActiveStrikes(agentId: string) {
        const now = new Date();
        const allStrikes = await prisma.agentStrike.findMany({
            where: { agentId, status: "UPHELD", strikeApplied: true }
        });

        const activeStrikes = allStrikes.filter(s => !s.expiresAt || s.expiresAt > now);
        const expiredStrikes = allStrikes.filter(s => s.expiresAt && s.expiresAt <= now);
        const strikeCount = activeStrikes.length;

        const profile = await prisma.agentProfile.findUnique({
            where: { userId: agentId },
            select: { status: true, strikeCount: true }
        });

        if (profile && profile.status !== AgentStatus.SUSPENDED) {
            if (profile.strikeCount !== strikeCount) {
                await prisma.agentProfile.update({
                    where: { userId: agentId },
                    data: { strikeCount }
                });
            }
        }

        return { strikeCount, activeStrikes, expiredStrikes };
    }

    /**
     * Agent: Get strikes and compliance history for their own profile
     */
    async getAgentStrikes(agentId: string) {
        const { strikeCount, activeStrikes, expiredStrikes } = await this.syncActiveStrikes(agentId);

        const [profile, history] = await Promise.all([
            prisma.agentProfile.findUnique({
                where: { userId: agentId },
                select: { strikeCount: true, status: true }
            }),
            prisma.agentStrike.findMany({
                where: { agentId },
                select: {
                    id: true,
                    reason: true,
                    description: true,
                    status: true,
                    strikeApplied: true,
                    expiresAt: true,
                    createdAt: true,
                    reviewedAt: true,
                    adminNote: true,
                },
                orderBy: { createdAt: "desc" }
            })
        ]);

        return {
            strikeCount,
            expiredCount: expiredStrikes.length,
            status: profile?.status,
            maxStrikes: 3,
            strikesRemaining: Math.max(0, 3 - strikeCount),
            isBanned: strikeCount >= 3 || profile?.status === AgentStatus.SUSPENDED,
            activeHistory: activeStrikes,
            expiredHistory: expiredStrikes,
            history,
        };
    }

    // ─── DEACTIVATION & ROLE RELINQUISHMENT ─────────────────────────────────────

    /**
     * Check if an agent is eligible to deactivate/relinquish their agent role.
     * Guards:
     * 1. 0 active property delegations (AUTHORIZED or PENDING_LANDLORD)
     * 2. 0 in-flight/held escrow transactions on properties they manage
     * 3. 0 pending strikes/disputes
     */
    async checkDeactivationEligibility(userId: string) {
        // 1. Check delegations
        const activeDelegations = await prisma.agentListing.findMany({
            where: {
                agentId: userId,
                status: { in: [AgentListingStatus.AUTHORIZED, AgentListingStatus.PENDING_LANDLORD] }
            },
            include: {
                property: { select: { id: true, title: true } }
            }
        });

        // 2. Check withheld / pending escrow transactions on managed properties
        const allAgentListings = await prisma.agentListing.findMany({
            where: { agentId: userId },
            select: { propertyId: true }
        });
        const propertyIds = allAgentListings.map(l => l.propertyId);

        let withheldTransactions: any[] = [];
        if (propertyIds.length > 0) {
            withheldTransactions = await prisma.transaction.findMany({
                where: {
                    propertyId: { in: propertyIds },
                    OR: [
                        { escrowHeld: true, escrowReleased: false },
                        { status: "PENDING" },
                        { disputed: true }
                    ]
                },
                select: {
                    id: true,
                    totalAmount: true,
                    rentAmount: true,
                    status: true,
                    disputed: true,
                    property: { select: { title: true } }
                }
            });
        }

        // 3. Check pending strikes / disputes
        const pendingStrikes = await prisma.agentStrike.findMany({
            where: {
                agentId: userId,
                status: "PENDING"
            },
            select: { id: true, reason: true }
        });

        const blockers: string[] = [];

        if (activeDelegations.length > 0) {
            const propNames = activeDelegations.map(d => d.property?.title || "Property").slice(0, 2).join(", ");
            blockers.push(`You currently have ${activeDelegations.length} active property delegation(s) (${propNames}${activeDelegations.length > 2 ? "..." : ""}). You must relinquish or complete them before deactivating.`);
        }

        if (withheldTransactions.length > 0) {
            blockers.push(`You have ${withheldTransactions.length} transaction(s) with funds currently held in escrow or in dispute. Escrow releases or refunds must be finalized first.`);
        }

        if (pendingStrikes.length > 0) {
            blockers.push(`You have ${pendingStrikes.length} unresolved dispute/strike review(s) currently open.`);
        }

        const canDeactivate = blockers.length === 0;

        return {
            canDeactivate,
            blockers,
            details: {
                activeDelegationsCount: activeDelegations.length,
                withheldTransactionsCount: withheldTransactions.length,
                pendingStrikesCount: pendingStrikes.length,
            },
            retentionPolicy: {
                retentionYears: 2,
                notice: "In compliance with real estate regulatory standards and financial escrow anti-fraud laws, your past transaction audit trail, KYC documents, and delegation records will be retained in secure storage for 2 years before permanent deletion."
            }
        };
    }

    /**
     * Deactivates the agent profile, archives it for the 2-year retention period,
     * and switches the user role back to TENANT.
     */
    async deactivateAgentAccount(userId: string, confirmation: string) {
        if (!confirmation || confirmation.trim().toUpperCase() !== "DELETE") {
            throw new Error('You must type "DELETE" to confirm deactivation.');
        }

        // Re-verify eligibility
        const eligibility = await this.checkDeactivationEligibility(userId);
        if (!eligibility.canDeactivate) {
            throw new Error(`Cannot deactivate agent account: ${eligibility.blockers.join(" ")}`);
        }

        // 1. Update AgentProfile to SUSPENDED status (archived for retention)
        await prisma.agentProfile.upsert({
            where: { userId },
            update: {
                status: AgentStatus.SUSPENDED,
                rejectionReason: "Account deactivated by user; archived for 2-year statutory retention."
            },
            create: {
                userId,
                status: AgentStatus.SUSPENDED,
                rejectionReason: "Account deactivated by user; archived for 2-year statutory retention."
            }
        });

        // 2. Switch User.role back to TENANT
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                role: "TENANT"
            },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true
            }
        });

        return {
            success: true,
            user: updatedUser,
            message: "Agent role relinquished successfully. Your account has been switched back to a Tenant account. Your records are archived under the 2-year retention policy."
        };
    }
}

export const agentService = new AgentService();
