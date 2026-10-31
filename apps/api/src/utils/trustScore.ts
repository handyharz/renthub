/**
 * RentHub TrustScore Engine
 * 
 * Provides deterministic, anti-gaming reputation algorithms for:
 * 1. Property TrustScore (0–100): Powers search rankings and verified badge display.
 * 2. Landlord TrustScore (0–100): Evaluates escrow release discipline and caution refund honesty.
 * 3. Tenant TrustScore (0–100): Rewards on-time rent, clean handovers, and lease renewals.
 * 4. Regulated Agent TrustScore (0–100): Enforces Zero-Side-Payment Shield (₦0 viewing fees).
 * 
 * Anti-Gaming Guardrails:
 * - Self-rentals (tenantId == landlordId) are strictly disqualified from score boosts.
 * - Annual boost capped (+25 max/year for completed leases) to prevent synthetic farming.
 * - 3-strike dispute policy triggers automatic restriction.
 * - Zero PII and zero exact kobo leakage on public serialization.
 */

export interface PropertyTrustInput {
    verified: boolean;
    hasProof: boolean;
    photoCount?: number;
    hasGeotagHash?: boolean;
    hasDuplicateHash?: boolean;
    hasFieldOpsVerifier?: boolean;
    hasVideoWalkthrough?: boolean;
    landlordVerified?: boolean;
    landlordHasId?: boolean;
    recentUpheldChallenges?: number;
    descriptionLength?: number;
    hasAddress?: boolean;
}

export interface PropertyTrustResult {
    score: number;
    tier: "UNVERIFIED" | "VERIFIED" | "EXCELLENT";
    isVerified: boolean;
    factors: {
        baseVerified: number;
        fieldOps: number;
        landlordKyc: number;
        disputeFree: number;
        unverifiedBase: number;
        challengePenalty: number;
    };
    breakdown: string[];
}

export interface LandlordTrustInput {
    verified: boolean;
    idDocumentUrl?: string | null;
    phoneVerified: boolean;
    completedEscrowsCount: number; // released, non-self
    cautionRefundedWithoutDispute?: boolean;
    fastResponseRate?: boolean; // < 2hr avg response
    disputeStrikesCount: number; // fee extortion, unauthorized charges
}

export interface LandlordTrustResult {
    score: number;
    tier: "RESTRICTED" | "STANDARD" | "TRUSTED" | "EXEMPLARY";
    isRestricted: boolean;
    factors: {
        baseKyc: number;
        completedEscrows: number;
        cautionClean: number;
        fastResponse: number;
        strikePenalty: number;
    };
    breakdown: string[];
}

export interface TenantTrustInput {
    phoneVerified: boolean;
    verified: boolean; // NIN / Gov ID verified
    onTimeLeasesCount: number;
    cautionReturnedFullCount?: number;
    damageClaimsLostCount?: number;
}

export interface TenantTrustResult {
    score: number;
    tier: "BASIC" | "VERIFIED" | "REPUTABLE" | "ELITE";
    factors: {
        baseVerification: number;
        onTimeLeases: number;
        cleanCautionReturns: number;
        penalties: number;
    };
    breakdown: string[];
}

export interface AgentTrustInput {
    isProfileVerified: boolean;
    closedDealsCount: number;
    unauthorizedFeeStrikes: number;
}

export interface AgentTrustResult {
    score: number;
    tier: "SUSPENDED" | "STANDARD" | "SHIELD_CERTIFIED";
    isSuspended: boolean;
    factors: {
        baseKyc: number;
        cleanDeals: number;
        strikePenalty: number;
    };
    breakdown: string[];
}

/**
 * Calculate Property TrustScore (0–100)
 */
export function calculatePropertyTrustScore(input: PropertyTrustInput): PropertyTrustResult {
    const isPhysicallyVerified = input.verified || (
        input.hasProof &&
        (input.photoCount ?? 0) >= 3 &&
        Boolean(input.hasGeotagHash) &&
        Boolean(input.hasDuplicateHash)
    );

    let baseVerified = 0;
    let fieldOps = 0;
    let landlordKyc = 0;
    let disputeFree = 0;
    let unverifiedBase = 0;
    let challengePenalty = 0;
    const breakdown: string[] = [];

    if (isPhysicallyVerified) {
        baseVerified = 60;
        breakdown.push("Physical verification badge verified (+60)");

        if (input.hasFieldOpsVerifier && input.hasVideoWalkthrough) {
            fieldOps = 20;
            breakdown.push("Field Ops agent inspected with video walkthrough (+20)");
        } else if (input.hasFieldOpsVerifier || input.hasVideoWalkthrough) {
            fieldOps = 10;
            breakdown.push("Field Ops coordinate inspection verified (+10)");
        }

        if (input.landlordVerified) {
            landlordKyc = 10;
            breakdown.push("Owner identity & title KYC passed (+10)");
        }

        const strikes = input.recentUpheldChallenges ?? 0;
        if (strikes === 0) {
            disputeFree = 10;
            breakdown.push("Zero dispute history in last 6 months (+10)");
        } else {
            challengePenalty = strikes * 15;
            breakdown.push(`Upheld public challenge penalties (-${challengePenalty})`);
        }
    } else {
        // Unverified listing base (capped at 30 to clearly show warning)
        unverifiedBase = 15;
        if (input.hasAddress) unverifiedBase += 5;
        if ((input.photoCount ?? 0) > 0) unverifiedBase += 5;
        if ((input.descriptionLength ?? 0) > 50) unverifiedBase += 5;
        unverifiedBase = Math.min(unverifiedBase, 30);
        breakdown.push("Unverified listing (capped at 30 max, inspection recommended)");
    }

    const rawScore = isPhysicallyVerified
        ? (baseVerified + fieldOps + landlordKyc + disputeFree - challengePenalty)
        : unverifiedBase;

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    let tier: PropertyTrustResult["tier"] = "UNVERIFIED";
    if (score >= 90) tier = "EXCELLENT";
    else if (score >= 60) tier = "VERIFIED";

    return {
        score,
        tier,
        isVerified: isPhysicallyVerified,
        factors: {
            baseVerified,
            fieldOps,
            landlordKyc,
            disputeFree,
            unverifiedBase,
            challengePenalty,
        },
        breakdown,
    };
}

/**
 * Calculate Landlord TrustScore (0–100)
 */
export function calculateLandlordTrustScore(input: LandlordTrustInput): LandlordTrustResult {
    let baseKyc = 25;
    const breakdown: string[] = [];

    if (input.verified) {
        baseKyc = 50;
        breakdown.push("Landlord government ID & phone KYC completed (+50)");
    } else {
        baseKyc = 25;
        breakdown.push("Basic profile (KYC pending admin verification) (+25)");
    }

    // +5 per completed escrow release, max +25 per rolling year to prevent farming
    const completedEscrows = Math.min(input.completedEscrowsCount * 5, 25);
    if (completedEscrows > 0) {
        breakdown.push(`Completed escrow releases (${input.completedEscrowsCount} verified leases, +${completedEscrows})`);
    }

    // Caution refund honesty (+10)
    let cautionClean = 0;
    if (input.cautionRefundedWithoutDispute && input.completedEscrowsCount > 0) {
        cautionClean = 10;
        breakdown.push("100% dispute-free caution deposit release history (+10)");
    }

    // Response time discipline (+5)
    let fastResponse = 0;
    if (input.fastResponseRate) {
        fastResponse = 5;
        breakdown.push("Rapid inquiry response discipline (+5)");
    }

    // Strike penalties (-20 each)
    const strikes = input.disputeStrikesCount || 0;
    const strikePenalty = strikes * 20;
    if (strikes > 0) {
        breakdown.push(`Unauthorized fee or extortion strikes (${strikes} strikes, -${strikePenalty})`);
    }

    const isRestricted = strikes >= 3;
    let rawScore = baseKyc + completedEscrows + cautionClean + fastResponse - strikePenalty;
    if (isRestricted) {
        rawScore = Math.min(rawScore, 20);
        breakdown.push("Account restricted due to 3 or more verified strikes");
    }

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    let tier: LandlordTrustResult["tier"] = "STANDARD";
    if (isRestricted) tier = "RESTRICTED";
    else if (score >= 90) tier = "EXEMPLARY";
    else if (score >= 70) tier = "TRUSTED";

    return {
        score,
        tier,
        isRestricted,
        factors: {
            baseKyc,
            completedEscrows,
            cautionClean,
            fastResponse,
            strikePenalty,
        },
        breakdown,
    };
}

/**
 * Calculate Tenant TrustScore (0–100)
 */
export function calculateTenantTrustScore(input: TenantTrustInput): TenantTrustResult {
    let baseVerification = 30;
    const breakdown: string[] = [];

    if (input.phoneVerified && input.verified) {
        baseVerification = 60;
        breakdown.push("Verified phone & National ID / NIN registration (+60)");
    } else if (input.phoneVerified) {
        baseVerification = 45;
        breakdown.push("Phone verified (+45)");
    } else {
        breakdown.push("Basic registration (+30)");
    }

    // On-time rental payments / 1-Click Renewals (+10 each, max +30)
    const onTimeLeases = Math.min((input.onTimeLeasesCount || 0) * 10, 30);
    if (onTimeLeases > 0) {
        breakdown.push(`On-time rental payments / 1-Click Renewals (+${onTimeLeases})`);
    }

    // Clean property handover & full deposit return (+10)
    let cleanCautionReturns = 0;
    if ((input.cautionReturnedFullCount || 0) > 0) {
        cleanCautionReturns = 10;
        breakdown.push("Clean property handover & zero-deduction caution returns (+10)");
    }

    // Penalties for damage claims or default (-15 each)
    const claims = input.damageClaimsLostCount || 0;
    const penalties = claims * 15;
    if (claims > 0) {
        breakdown.push(`Upheld property damage or rent default claims (-${penalties})`);
    }

    const rawScore = baseVerification + onTimeLeases + cleanCautionReturns - penalties;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    let tier: TenantTrustResult["tier"] = "BASIC";
    if (score >= 90) tier = "ELITE";
    else if (score >= 75) tier = "REPUTABLE";
    else if (score >= 60) tier = "VERIFIED";

    return {
        score,
        tier,
        factors: {
            baseVerification,
            onTimeLeases,
            cleanCautionReturns,
            penalties,
        },
        breakdown,
    };
}

/**
 * Calculate Regulated Agent TrustScore (0–100)
 */
export function calculateAgentTrustScore(input: AgentTrustInput): AgentTrustResult {
    let baseKyc = 40;
    const breakdown: string[] = [];

    if (input.isProfileVerified) {
        baseKyc = 70;
        breakdown.push("Registered agency license & CAC verification passed (+70)");
    } else {
        breakdown.push("Provisional agent registration (+40)");
    }

    // Clean, zero-side-fee closed transactions (+2 each, max +20)
    const cleanDeals = Math.min((input.closedDealsCount || 0) * 2, 20);
    if (cleanDeals > 0) {
        breakdown.push(`Zero-fee compliant transactions closed (+${cleanDeals})`);
    }

    // Strikes for illegal viewing fees or fuel money demands (-25 each)
    const strikes = input.unauthorizedFeeStrikes || 0;
    const strikePenalty = strikes * 25;
    if (strikes > 0) {
        breakdown.push(`Illegal viewing fee extortion strikes (${strikes} strikes, -${strikePenalty})`);
    }

    const isSuspended = strikes >= 3;
    let rawScore = baseKyc + cleanDeals - strikePenalty;
    if (isSuspended) {
        rawScore = 0;
        breakdown.push("License permanently revoked: 3 viewing fee extortion violations");
    }

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    let tier: AgentTrustResult["tier"] = "STANDARD";
    if (isSuspended) tier = "SUSPENDED";
    else if (score >= 85) tier = "SHIELD_CERTIFIED";

    return {
        score,
        tier,
        isSuspended,
        factors: {
            baseKyc,
            cleanDeals,
            strikePenalty,
        },
        breakdown,
    };
}

/**
 * Masks user trust score for public, non-authenticated or third-party browsing
 * to protect user privacy while communicating trustworthiness.
 */
export function formatPublicUserScoreRange(score: number): string {
    if (score >= 90) return "90+ (Exemplary)";
    if (score >= 80) return "80–89 (Trusted)";
    if (score >= 70) return "70–79 (Reliable)";
    if (score >= 60) return "60–69 (Verified)";
    return "Under 60 (New / Basic)";
}
