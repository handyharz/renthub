import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    calculatePropertyTrustScore,
    calculateLandlordTrustScore,
    calculateTenantTrustScore,
    calculateAgentTrustScore,
    formatPublicUserScoreRange,
} from "./trustScore";

describe("TrustScore Engine & Anti-Gaming Guardrails", () => {
    describe("Property TrustScore (0–100)", () => {
        it("strictly caps unverified listings at 30 to display warning", () => {
            const unverified = calculatePropertyTrustScore({
                verified: false,
                hasProof: false,
                photoCount: 10,
                hasAddress: true,
                descriptionLength: 200,
            });

            assert.equal(unverified.isVerified, false);
            assert.equal(unverified.tier, "UNVERIFIED");
            assert.ok(unverified.score <= 30);
            assert.equal(unverified.score, 30);
        });

        it("awards base 60 for verified badge and reaches 95-100 with field ops and KYC", () => {
            const fullyVerified = calculatePropertyTrustScore({
                verified: true,
                hasProof: true,
                photoCount: 8,
                hasGeotagHash: true,
                hasDuplicateHash: true,
                hasFieldOpsVerifier: true,
                hasVideoWalkthrough: true,
                landlordVerified: true,
                landlordHasId: true,
                recentUpheldChallenges: 0,
            });

            assert.equal(fullyVerified.isVerified, true);
            assert.equal(fullyVerified.tier, "EXCELLENT");
            assert.equal(fullyVerified.score, 100);
            assert.equal(fullyVerified.factors.baseVerified, 60);
            assert.equal(fullyVerified.factors.fieldOps, 20);
            assert.equal(fullyVerified.factors.landlordKyc, 10);
            assert.equal(fullyVerified.factors.disputeFree, 10);
        });

        it("penalizes verified listings when upheld public challenges occur", () => {
            const challenged = calculatePropertyTrustScore({
                verified: true,
                hasProof: true,
                photoCount: 4,
                hasGeotagHash: true,
                hasDuplicateHash: true,
                hasFieldOpsVerifier: true,
                hasVideoWalkthrough: false,
                landlordVerified: true,
                recentUpheldChallenges: 2, // 2 strikes = -30
            });

            // 60 base + 10 fieldOps + 10 kyc - 30 penalty = 50
            assert.equal(challenged.score, 50);
            assert.equal(challenged.factors.challengePenalty, 30);
        });
    });

    describe("Landlord TrustScore (0–100)", () => {
        it("starts at 50 after KYC and compounds with completed escrows", () => {
            const landlord = calculateLandlordTrustScore({
                verified: true,
                phoneVerified: true,
                idDocumentUrl: "https://example.com/id.jpg",
                completedEscrowsCount: 4, // 4 * 5 = +20
                cautionRefundedWithoutDispute: true, // +10
                fastResponseRate: true, // +5
                disputeStrikesCount: 0,
            });

            assert.equal(landlord.isRestricted, false);
            assert.equal(landlord.tier, "TRUSTED");
            assert.equal(landlord.score, 85); // 50 + 20 + 10 + 5
        });

        it("enforces anti-gaming cap on completed escrows (max +25)", () => {
            const gamingAttempt = calculateLandlordTrustScore({
                verified: true,
                phoneVerified: true,
                idDocumentUrl: "https://example.com/id.jpg",
                completedEscrowsCount: 20, // 20 * 5 = 100 if uncapped!
                cautionRefundedWithoutDispute: false,
                disputeStrikesCount: 0,
            });

            // Must cap escrow boost to +25 max
            assert.equal(gamingAttempt.factors.completedEscrows, 25);
            assert.equal(gamingAttempt.score, 75); // 50 base + 25 capped
        });

        it("penalizes extortion and automatically restricts landlord at 3 strikes", () => {
            const bannedLandlord = calculateLandlordTrustScore({
                verified: true,
                phoneVerified: true,
                completedEscrowsCount: 5,
                disputeStrikesCount: 3, // 3 strikes = auto-restrict
            });

            assert.equal(bannedLandlord.isRestricted, true);
            assert.equal(bannedLandlord.tier, "RESTRICTED");
            assert.ok(bannedLandlord.score <= 20);
        });
    });

    describe("Tenant TrustScore (0–100)", () => {
        it("starts at 60 after NIN/phone verification and rewards on-time renewals", () => {
            const tenant = calculateTenantTrustScore({
                phoneVerified: true,
                verified: true,
                onTimeLeasesCount: 2, // +20
                cautionReturnedFullCount: 1, // +10
                damageClaimsLostCount: 0,
            });

            assert.equal(tenant.tier, "ELITE");
            assert.equal(tenant.score, 90); // 60 + 20 + 10
        });

        it("penalizes damage claims and default", () => {
            const defaultingTenant = calculateTenantTrustScore({
                phoneVerified: true,
                verified: true,
                onTimeLeasesCount: 0,
                damageClaimsLostCount: 2, // -30
            });

            assert.equal(defaultingTenant.score, 30); // 60 - 30
            assert.equal(defaultingTenant.tier, "BASIC");
        });
    });

    describe("Regulated Agent TrustScore (0–100)", () => {
        it("awards shield certification for zero-fee compliance", () => {
            const agent = calculateAgentTrustScore({
                isProfileVerified: true, // 70
                closedDealsCount: 8, // +16
                unauthorizedFeeStrikes: 0,
            });

            assert.equal(agent.isSuspended, false);
            assert.equal(agent.tier, "SHIELD_CERTIFIED");
            assert.equal(agent.score, 86); // 70 + 16
        });

        it("permanently revokes agent license upon 3 illegal fee strikes", () => {
            const rogueAgent = calculateAgentTrustScore({
                isProfileVerified: true,
                closedDealsCount: 15,
                unauthorizedFeeStrikes: 3,
            });

            assert.equal(rogueAgent.isSuspended, true);
            assert.equal(rogueAgent.tier, "SUSPENDED");
            assert.equal(rogueAgent.score, 0);
        });
    });

    describe("Zero-PII Public Masking", () => {
        it("safely masks public scores into brackets without leaking exact values", () => {
            assert.equal(formatPublicUserScoreRange(95), "90+ (Exemplary)");
            assert.equal(formatPublicUserScoreRange(84), "80–89 (Trusted)");
            assert.equal(formatPublicUserScoreRange(72), "70–79 (Reliable)");
            assert.equal(formatPublicUserScoreRange(63), "60–69 (Verified)");
            assert.equal(formatPublicUserScoreRange(45), "Under 60 (New / Basic)");
        });
    });
});
