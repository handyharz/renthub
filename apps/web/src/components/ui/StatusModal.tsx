"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: "success" | "error" | "info" | "warning";
    actionLabel?: string;
}

export function StatusModal({ open, onClose, title, message, type = "info", actionLabel = "Close" }: StatusModalProps) {
    const icons = {
        success: <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />,
        error: <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />,
        warning: <AlertCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />,
        info: <Info className="h-10 w-10 text-blue-600 dark:text-blue-400" />,
    };

    const iconBg = {
        success: "bg-emerald-500/15 border-emerald-500/30",
        error: "bg-red-500/15 border-red-500/30",
        warning: "bg-amber-500/15 border-amber-500/30",
        info: "bg-blue-500/15 border-blue-500/30",
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="text-center p-2">
                <div className="flex justify-center mb-4">
                    <div className={cn("h-20 w-20 rounded-3xl flex items-center justify-center border shadow-xs", iconBg[type])}>
                        {icons[type]}
                    </div>
                </div>
                <DialogHeader className="text-center">
                    <DialogTitle className="text-xl sm:text-2xl text-center font-black text-slate-900 dark:text-white tracking-tight">
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-sm sm:text-base text-slate-700 dark:text-slate-200 mt-3 font-medium text-center leading-relaxed max-w-sm mx-auto">
                    {message}
                </DialogDescription>
                <div className="mt-6">
                    <Button
                        onClick={onClose}
                        className={cn(
                            "w-full font-bold py-3.5 h-12 rounded-xl text-white shadow-sm transition-all active:scale-[0.99]",
                            type === "success" && "bg-emerald-600 hover:bg-emerald-700",
                            type === "error" && "bg-red-600 hover:bg-red-700",
                            type === "warning" && "bg-amber-600 hover:bg-amber-700",
                            type === "info" && "bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90"
                        )}
                    >
                        {actionLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
