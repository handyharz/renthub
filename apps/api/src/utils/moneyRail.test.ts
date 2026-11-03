import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    paidKoboMeetsExpected,
    paidNairaMeetsExpected,
    afriExchangePaidMeetsExpected,
} from "./moneyRail";
import { isWebhookTimestampFresh } from "./webhookSecurity";

describe("paidKoboMeetsExpected", () => {
    it("requires a positive numeric amount at or above expected kobo", () => {
        assert.equal(paidKoboMeetsExpected(2_500_000_00, 2_500_000), true);
        assert.equal(paidKoboMeetsExpected(2_499_999_99, 2_500_000), false);
        assert.equal(paidKoboMeetsExpected(undefined, 2_500_000), false);
        assert.equal(paidKoboMeetsExpected(0, 2_500_000), false);
        assert.equal(paidKoboMeetsExpected("250000000", 2_500_000), true);
    });
});

describe("paidNairaMeetsExpected", () => {
    it("rejects missing and underpaid naira", () => {
        assert.equal(paidNairaMeetsExpected(400_000, 400_000), true);
        assert.equal(paidNairaMeetsExpected(399_999, 400_000), false);
        assert.equal(paidNairaMeetsExpected(null, 400_000), false);
    });
});

describe("afriExchangePaidMeetsExpected", () => {
    it("prefers explicit kobo then naira then amount auto-unit", () => {
        assert.equal(afriExchangePaidMeetsExpected({ amountKobo: 40_000_000 }, 400_000), true);
        assert.equal(afriExchangePaidMeetsExpected({ amountInNgn: 400_000 }, 400_000), true);
        assert.equal(afriExchangePaidMeetsExpected({ amount: 40_000_000 }, 400_000), true);
        assert.equal(afriExchangePaidMeetsExpected({ amount: 400_000 }, 400_000), true);
        assert.equal(afriExchangePaidMeetsExpected({ amount: 100 }, 400_000), false);
        assert.equal(afriExchangePaidMeetsExpected({}, 400_000), false);
    });
});

describe("isWebhookTimestampFresh", () => {
    it("rejects missing, unparsable, and stale timestamps", () => {
        const now = Math.floor(Date.now() / 1000);
        assert.equal(isWebhookTimestampFresh(undefined), false);
        assert.equal(isWebhookTimestampFresh("nope"), false);
        assert.equal(isWebhookTimestampFresh(String(now)), true);
        assert.equal(isWebhookTimestampFresh(String(now - 400)), false);
        assert.equal(isWebhookTimestampFresh(String(Date.now()), 300), true);
    });
});
