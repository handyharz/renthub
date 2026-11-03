import { Request, Response, NextFunction } from "express";
import { isEscrowOperational } from "../jobs/reconcileAnchorEscrow";

export function requireEscrowOperational(req: Request, res: Response, next: NextFunction) {
    if (!isEscrowOperational()) {
        return res.status(503).json({
            success: false,
            message:
                "Escrow bookings are paused while ledger variance is unresolved. New payments cannot start until reconciliation is healthy.",
        });
    }
    next();
}
