"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
}

export function Progress({ value = 0, className, ...props }: ProgressProps) {
    return (
        <div
            className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray-100", className)}
            {...props}
        >
            <div
                className="h-full w-full flex-1 bg-[var(--color-brand-blue)] transition-all duration-500"
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </div>
    );
}
