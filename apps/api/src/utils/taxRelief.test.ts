import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateRentReliefDeduction, TAX_RELIEF_MAX_CAP } from "./taxRelief";

describe("Nigeria Tax Act 2025 Rent Relief Calculation", () => {
    it("calculates 20% relief when below the ₦500,000 cap", () => {
        // ₦2,000,000 rent -> ₦400,000 deduction
        const result = calculateRentReliefDeduction(2000000);
        assert.equal(result.annualRent, 2000000);
        assert.equal(result.grossRelief, 400000);
        assert.equal(result.allowableDeduction, 400000);
        assert.equal(result.isCapped, false);
    });

    it("caps allowable deduction strictly at ₦500,000 for high-rent leases", () => {
        // ₦3,500,000 rent -> 20% is ₦700,000, but capped at ₦500,000
        const result = calculateRentReliefDeduction(3500000);
        assert.equal(result.annualRent, 3500000);
        assert.equal(result.grossRelief, 700000);
        assert.equal(result.allowableDeduction, TAX_RELIEF_MAX_CAP);
        assert.equal(result.isCapped, true);
    });

    it("handles modest leases correctly", () => {
        // ₦800,000 rent -> ₦160,000 deduction
        const result = calculateRentReliefDeduction(800000);
        assert.equal(result.allowableDeduction, 160000);
        assert.equal(result.isCapped, false);
    });

    it("handles zero or invalid rents safely", () => {
        const result = calculateRentReliefDeduction(0);
        assert.equal(result.allowableDeduction, 0);
        assert.equal(result.isCapped, false);
    });
});
