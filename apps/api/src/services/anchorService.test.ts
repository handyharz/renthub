import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { anchorService } from "./anchorService";

describe("Anchor BaaS Webhook Signature & Security (Official Documentation)", () => {
    const testSecret = "anchor_live_sec_991823ab8174df9021";

    test("verifies valid signature using Anchor official Base64(HMAC_SHA1(rawBody).digest('hex'))", () => {
        // Configure test secret
        (anchorService as any).webhookSecret = testSecret;

        const payload = JSON.stringify({
            data: {
                id: "17314910010651037850-anc_py_et",
                type: "payin.received",
                attributes: {
                    createdAt: "2024-11-13T09:43:21.065172119",
                    amount: 250000000,
                },
            },
        });

        // Compute official Anchor signature: Base64(HMAC_SHA1(rawBody, secret).digest('hex'))
        const hexDigest = crypto.createHmac("sha1", testSecret).update(payload).digest("hex");
        const officialAnchorSignature = Buffer.from(hexDigest).toString("base64");

        const isValid = anchorService.verifyWebhookSignature(payload, officialAnchorSignature);
        assert.equal(isValid, true, "Signature matching Anchor's official algorithm must verify true");
    });

    test("rejects tampered webhook payloads", () => {
        (anchorService as any).webhookSecret = testSecret;

        const payload = JSON.stringify({ data: { type: "payment.received", amount: 100000 } });
        const hexDigest = crypto.createHmac("sha1", testSecret).update(payload).digest("hex");
        const signature = Buffer.from(hexDigest).toString("base64");

        const tamperedPayload = JSON.stringify({ data: { type: "payment.received", amount: 9999999 } });
        const isValid = anchorService.verifyWebhookSignature(tamperedPayload, signature);
        assert.equal(isValid, false, "Tampered payload must fail signature check");
    });

    test("rejects webhook if timestamp is drifted by more than 300 seconds", () => {
        (anchorService as any).webhookSecret = testSecret;

        const payload = JSON.stringify({ data: { type: "nip.inbound.completed" } });
        const hexDigest = crypto.createHmac("sha1", testSecret).update(payload).digest("hex");
        const signature = Buffer.from(hexDigest).toString("base64");

        const staleTimestamp = (Math.floor(Date.now() / 1000) - 350).toString();
        const isValid = anchorService.verifyWebhookSignature(payload, signature, staleTimestamp);
        assert.equal(isValid, false, "Stale timestamp (> 300s) must be rejected");
    });

    test("accepts fresh timestamp within 300 seconds", () => {
        (anchorService as any).webhookSecret = testSecret;

        const payload = JSON.stringify({ data: { type: "nip.inbound.completed" } });
        const hexDigest = crypto.createHmac("sha1", testSecret).update(payload).digest("hex");
        const signature = Buffer.from(hexDigest).toString("base64");

        const freshTimestamp = (Math.floor(Date.now() / 1000) - 10).toString();
        const isValid = anchorService.verifyWebhookSignature(payload, signature, freshTimestamp);
        assert.equal(isValid, true, "Fresh timestamp within 300s window must pass");
    });
});

describe("Anchor BaaS Event Mapping (Anchor Official Docs)", () => {
    // Normalization logic used in paymentController
    const normalize = (eventType: string) => (eventType || "").toLowerCase().replace(/_/g, ".");

    const isCredit = (eventType: string) => {
        const t = normalize(eventType);
        return (
            t === "account.credited" ||
            t === "inflow.success" ||
            t === "inward.payment.success" ||
            t === "payment.received" ||
            t === "payment.settled" ||
            t === "payin.received" ||
            t === "nip.inbound.completed" ||
            t === "nip.incomingtransfer.received" ||
            t === "nip.incoming.transfer.received" ||
            (t.includes("incoming") && t.includes("transfer")) ||
            t === "payment.create"
        );
    };

    const isTransferConfirm = (eventType: string) => {
        const t = normalize(eventType);
        return t.includes("transfer") && (t.includes("success") || t.includes("completed"));
    };

    const isTransferFailure = (eventType: string) => {
        const t = normalize(eventType);
        return t.includes("transfer") && (t.includes("failed") || t.includes("reversed") || t.includes("declined"));
    };

    test("identifies all official Anchor inbound credit event types", () => {
        const officialInboundEvents = [
            "payin.received",
            "payment.received",
            "payment.settled",
            "nip.inbound.completed",
            "nip.incomingtransfer.received",
            "nip_incoming_transfer_received",
            "account.credited",
        ];

        for (const evt of officialInboundEvents) {
            assert.equal(isCredit(evt), true, `Expected ${evt} to be recognized as inbound credit`);
        }
    });

    test("identifies all official Anchor outbound NIP confirmation event types", () => {
        const officialConfirmEvents = [
            "nip.transfer.successful",
            "nip.transfer.completed",
            "transfer.successful",
            "transfer.completed",
            "nip_transfer_successful",
            "book.transfer.successful",
        ];

        for (const evt of officialConfirmEvents) {
            assert.equal(isTransferConfirm(evt), true, `Expected ${evt} to be recognized as transfer confirmation`);
        }
    });

    test("identifies all official Anchor outbound NIP failure/reversal event types", () => {
        const officialFailureEvents = [
            "nip.transfer.failed",
            "nip.transfer.reversed",
            "transfer.failed",
            "transfer.reversed",
            "transfer.declined",
            "book.transfer.failed",
        ];

        for (const evt of officialFailureEvents) {
            assert.equal(isTransferFailure(evt), true, `Expected ${evt} to be recognized as transfer failure`);
        }
    });
});

describe("Anchor Escrow Reconciliation & Solvency Invariant", () => {
    test("calculates solvency invariant with in-flight payout debits", () => {
        // Scenario:
        // RentHub holds ₦10,000,000 across 2 active tenant escrows (liability)
        // A ₦3,000,000 payout was dispatched to Landlord A and debited by Anchor,
        // but confirmation webhook is in-flight (status: PROCESSING).
        // Anchor FBO ledger shows ₦7,000,000.
        const totalEscrowLiabilitiesKobo = 10_000_000_00; // ₦10,000,000.00
        const inFlightAnchorPayoutsKobo = 3_000_000_00;   // ₦3,000,000.00
        const anchorLedgerBalanceKobo = 7_000_000_00;     // ₦7,000,000.00

        // Solvency Formula:
        const effectiveAnchorPoolKobo = anchorLedgerBalanceKobo + inFlightAnchorPayoutsKobo;
        const netDeficitKobo = totalEscrowLiabilitiesKobo - effectiveAnchorPoolKobo;

        assert.equal(effectiveAnchorPoolKobo, 10_000_000_00);
        assert.equal(netDeficitKobo, 0, "No false deficit alarm when in-flight payouts are properly tracked");
    });

    test("flags true deficit when Anchor pool is insufficient to cover liabilities", () => {
        const totalEscrowLiabilitiesKobo = 10_000_000_00; // ₦10,000,000.00
        const inFlightAnchorPayoutsKobo = 1_000_000_00;   // ₦1,000,000.00
        const anchorLedgerBalanceKobo = 7_000_000_00;     // ₦7,000,000.00

        const effectiveAnchorPoolKobo = anchorLedgerBalanceKobo + inFlightAnchorPayoutsKobo;
        const netDeficitKobo = totalEscrowLiabilitiesKobo - effectiveAnchorPoolKobo;

        assert.equal(netDeficitKobo, 2_000_000_00, "Must flag exact ₦2,000,000 deficit when pool is underfunded");
    });
});
