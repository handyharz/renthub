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
        success: <CheckCircle2 className="h-12 w-12 text-green-500" />,
        error: <XCircle className="h-12 w-12 text-red-500" />,
        warning: <AlertCircle className="h-12 w-12 text-orange-500" />,
        info: <Info className="h-12 w-12 text-blue-500" />,
    };

    const colors = {
        success: "text-green-900 bg-green-50",
        error: "text-red-900 bg-red-50",
        warning: "text-orange-900 bg-orange-50",
        info: "text-blue-900 bg-blue-50",
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="text-center">
                <div className="flex justify-center mb-4">
                    {icons[type]}
                </div>
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center font-black text-gray-900">{title}</DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-lg text-gray-700 mt-3 font-medium text-center">
                    {message}
                </DialogDescription>
                <div className="mt-6">
                    <Button
                        onClick={onClose}
                        className={cn(
                            "w-full font-bold py-6",
                            type === "success" && "bg-green-600 hover:bg-green-700",
                            type === "error" && "bg-red-600 hover:bg-red-700",
                            type === "warning" && "bg-orange-600 hover:bg-orange-700",
                            type === "info" && "bg-[var(--color-brand-blue)]"
                        )}
                    >
                        {actionLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
