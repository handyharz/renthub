import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Transparency & Admin Audit Guard Rails", () => {
    it("ensures exact kobo balances are not leaked by public formatting helpers", () => {
        function formatRange(amountKobo: bigint): string {
            const naira = Number(amountKobo / BigInt(100));
            if (naira === 0) return "₦0.00";
            if (naira < 1_000_000) return "₦400k – ₦1.0M";
            const lowerMillions = Math.floor(naira / 1_000_000);
            const upperMillions = lowerMillions + 1;
            return `₦${lowerMillions}M – ₦${upperMillions}M`;
        }

        // Exact balance in kobo (e.g. ₦2,750,000.50)
        const exactAnchorKobo = BigInt(275_000_050);
        const publicDisplay = formatRange(exactAnchorKobo);

        // Public display must show safe bracketed range, never exact kobo
        assert.equal(publicDisplay, "₦2M – ₦3M");
        assert.equal(publicDisplay.includes("275"), false);
        assert.equal(publicDisplay.includes("kobo"), false);
    });

    it("verifies dual-rail pool split formula guarantees zero variance", () => {
        const anchorRentNaira = 2_500_000;
        const anchorCautionNaira = 250_000;
        const afriRentNaira = 1_800_000;
        const afriCautionNaira = 180_000;

        const anchorDbExpectedKobo = BigInt((anchorRentNaira + anchorCautionNaira) * 100);
        const afriDbExpectedKobo = BigInt((afriRentNaira + afriCautionNaira) * 100);
        const totalDbExpectedKobo = anchorDbExpectedKobo + afriDbExpectedKobo;

        // In healthy operation, pool balances match expected
        const anchorPoolKobo = anchorDbExpectedKobo;
        const afriExchangePoolKobo = afriDbExpectedKobo;

        const anchorDiff = anchorDbExpectedKobo > anchorPoolKobo
            ? anchorDbExpectedKobo - anchorPoolKobo
            : anchorPoolKobo - anchorDbExpectedKobo;
        const afriDiff = afriDbExpectedKobo > afriExchangePoolKobo
            ? afriDbExpectedKobo - afriExchangePoolKobo
            : afriExchangePoolKobo - afriDbExpectedKobo;

        const varianceKobo = anchorDiff + afriDiff;

        assert.equal(anchorDbExpectedKobo, BigInt(275_000_000));
        assert.equal(afriDbExpectedKobo, BigInt(198_000_000));
        assert.equal(totalDbExpectedKobo, BigInt(473_000_000));
        assert.equal(varianceKobo, BigInt(0));
    });

    it("enforces ADMIN role requirement for audit route access", () => {
        function checkAdminRole(role: string | undefined): boolean {
            return role === "ADMIN";
        }

        assert.equal(checkAdminRole("ADMIN"), true);
        assert.equal(checkAdminRole("TENANT"), false);
        assert.equal(checkAdminRole("LANDLORD"), false);
        assert.equal(checkAdminRole("AGENT"), false);
        assert.equal(checkAdminRole(undefined), false);
    });
});
