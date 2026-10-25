import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeSelfServiceRole, stripReleaseOtp } from "./identity";
import { hashOtp, otpMatches, timingSafeEqualString } from "./cryptoCompare";

describe("sanitizeSelfServiceRole", () => {
    it("allows tenant landlord and agent", () => {
        assert.equal(sanitizeSelfServiceRole("TENANT"), "TENANT");
        assert.equal(sanitizeSelfServiceRole("landlord"), "LANDLORD");
        assert.equal(sanitizeSelfServiceRole("AGENT"), "AGENT");
    });

    it("rejects admin and unknown values", () => {
        assert.equal(sanitizeSelfServiceRole("ADMIN"), undefined);
        assert.equal(sanitizeSelfServiceRole("SUPERUSER"), undefined);
        assert.equal(sanitizeSelfServiceRole(null), undefined);
    });
});

describe("otp hashing", () => {
    it("matches hashed codes and rejects mismatches", () => {
        const code = "482913";
        const stored = hashOtp(code);
        assert.equal(otpMatches(stored, code), true);
        assert.equal(otpMatches(stored, "000000"), false);
    });

    it("matches legacy plaintext 6-digit codes", () => {
        assert.equal(otpMatches("123456", "123456"), true);
        assert.equal(otpMatches("123456", "654321"), false);
    });
});

describe("timingSafeEqualString", () => {
    it("rejects different lengths without throwing", () => {
        assert.equal(timingSafeEqualString("abc", "ab"), false);
    });
});

describe("stripReleaseOtp", () => {
    it("removes otp from transaction payloads", () => {
        const stripped = stripReleaseOtp({ id: "tx1", releaseOtp: "123456", status: "ESCROWED" });
        assert.deepEqual(stripped, { id: "tx1", status: "ESCROWED" });
    });
});
