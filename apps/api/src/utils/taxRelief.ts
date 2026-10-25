/**
 * Nigeria Tax Act 2025 Rent Relief Helper
 * Provision: 20% of annual residential rent paid, capped at ₦500,000.
 */
export const TAX_RELIEF_RATE = 0.20;
export const TAX_RELIEF_MAX_CAP = 500000;

export function calculateRentReliefDeduction(annualRentNgn: number): {
    annualRent: number;
    reliefPercentage: number;
    grossRelief: number;
    allowableDeduction: number;
    isCapped: boolean;
} {
    const rent = Math.max(0, Math.round(annualRentNgn || 0));
    const grossRelief = Math.round(rent * TAX_RELIEF_RATE);
    const allowableDeduction = Math.min(grossRelief, TAX_RELIEF_MAX_CAP);
    return {
        annualRent: rent,
        reliefPercentage: 20,
        grossRelief,
        allowableDeduction,
        isCapped: grossRelief > TAX_RELIEF_MAX_CAP,
    };
}
