/**
 * Fail-closed paid-vs-expected checks for escrow funding.
 * Amounts on Transaction are integer Naira. Paystack/Anchor send kobo.
 */

export function nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
}

export function parsePositiveNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
    }
    return null;
}

export function paidKoboMeetsExpected(paidKobo: unknown, expectedNaira: number): boolean {
    const paid = parsePositiveNumber(paidKobo);
    if (paid === null || paid <= 0) return false;
    if (!Number.isFinite(expectedNaira) || expectedNaira < 0) return false;
    return paid >= nairaToKobo(expectedNaira);
}

export function paidNairaMeetsExpected(paidNaira: unknown, expectedNaira: number): boolean {
    const paid = parsePositiveNumber(paidNaira);
    if (paid === null || paid <= 0) return false;
    if (!Number.isFinite(expectedNaira) || expectedNaira < 0) return false;
    return paid >= expectedNaira;
}

/**
 * AfriExchange payloads mix Naira and kobo. Prefer explicit fields; otherwise
 * treat values ≥ expected kobo as kobo, else as Naira.
 */
export function afriExchangePaidMeetsExpected(
    data: Record<string, unknown> | null | undefined,
    expectedNaira: number
): boolean {
    if (!data) return false;
    const kobo =
        data.amountKobo ??
        data.amount_kobo ??
        data.paidKobo ??
        data.amountInKobo;
    if (kobo !== undefined && kobo !== null) {
        return paidKoboMeetsExpected(kobo, expectedNaira);
    }
    const naira = data.amountInNgn ?? data.amount_ngn ?? data.amountInNGN ?? data.paidNaira;
    if (naira !== undefined && naira !== null) {
        return paidNairaMeetsExpected(naira, expectedNaira);
    }
    const amount = parsePositiveNumber(data.amount);
    if (amount === null) return false;
    const expectedKobo = nairaToKobo(expectedNaira);
    if (amount >= expectedKobo) return true;
    return amount >= expectedNaira;
}
