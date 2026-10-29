"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

interface DatePickerProps {
    value: string;           // ISO yyyy-MM-dd
    onChange: (iso: string) => void;
    min?: string;            // ISO yyyy-MM-dd — dates before this are disabled
    placeholder?: string;
    required?: boolean;
    id?: string;
}

function parseISO(iso: string): Date | null {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

export function DatePicker({
    value,
    onChange,
    min,
    placeholder = "Select a date",
    id,
}: DatePickerProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = min ? parseISO(min) : today;
    const selectedDate = parseISO(value);

    const initialView = selectedDate ?? (minDate && minDate > today ? minDate : today);
    const [viewYear, setViewYear] = useState(initialView.getFullYear());
    const [viewMonth, setViewMonth] = useState(initialView.getMonth());
    const [open, setOpen] = useState(false);
    const [yearInput, setYearInput] = useState(false);
    const [yearDraft, setYearDraft] = useState(String(initialView.getFullYear()));

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setYearInput(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const handleDay = (day: number) => {
        const picked = new Date(viewYear, viewMonth, day);
        picked.setHours(0, 0, 0, 0);
        if (minDate && picked < minDate) return;
        onChange(toISO(picked));
        setOpen(false);
    };

    const handleYearCommit = () => {
        const y = parseInt(yearDraft);
        if (!isNaN(y) && y >= 2024 && y <= 2040) setViewYear(y);
        setYearInput(false);
    };

    const displayValue = selectedDate
        ? selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "";

    return (
        <div ref={containerRef} style={{ position: "relative" }}>
            {/* Trigger */}
            <button
                id={id}
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    background: "var(--bg-input)",
                    border: open
                        ? "1px solid var(--color-brand-green)"
                        : "1px solid var(--border-color)",
                    borderRadius: "12px",
                    fontSize: "14px",
                    color: displayValue ? "var(--text-primary)" : "var(--text-placeholder, #9ca3af)",
                    cursor: "pointer",
                    textAlign: "left",
                    outline: "none",
                    boxShadow: open
                        ? "0 0 0 3px color-mix(in srgb, var(--color-brand-green) 15%, transparent)"
                        : "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <Calendar style={{ width: 16, height: 16, color: "var(--color-brand-green)", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{displayValue || placeholder}</span>
                {selectedDate && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={e => { e.stopPropagation(); onChange(""); }}
                        onKeyDown={e => e.key === "Enter" && onChange("")}
                        style={{ display: "flex", alignItems: "center", color: "var(--text-muted, #6b7280)", cursor: "pointer" }}
                        aria-label="Clear date"
                    >
                        <X style={{ width: 14, height: 14 }} />
                    </span>
                )}
            </button>

            {/* Calendar dropdown */}
            {open && (
                <div
                    role="dialog"
                    aria-label="Calendar date picker"
                    style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        right: 0,
                        zIndex: 200,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "16px",
                        padding: "16px",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                        animation: "dp-slide-in 0.14s ease",
                    }}
                >
                    <style>{`
                        @keyframes dp-slide-in {
                            from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                            to   { opacity: 1; transform: translateY(0) scale(1); }
                        }
                        .dp-day-btn:hover:not([aria-disabled="true"]):not([aria-pressed="true"]) {
                            background: color-mix(in srgb, var(--color-brand-green) 12%, transparent) !important;
                            color: var(--color-brand-green) !important;
                        }
                        .dp-nav-btn:hover { background: var(--bg-muted, #f3f4f6) !important; }
                    `}</style>

                    {/* Navigation header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <button type="button" className="dp-nav-btn" onClick={prevMonth} style={NAV_BTN} aria-label="Previous month">
                            <ChevronLeft style={{ width: 16, height: 16 }} />
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <select
                                value={viewMonth}
                                onChange={e => setViewMonth(Number(e.target.value))}
                                style={SEL}
                                aria-label="Month"
                            >
                                {MONTHS.map((m, i) => (
                                    <option key={m} value={i}>{m}</option>
                                ))}
                            </select>

                            {yearInput ? (
                                <input
                                    autoFocus
                                    type="number"
                                    value={yearDraft}
                                    min={2024}
                                    max={2040}
                                    onChange={e => setYearDraft(e.target.value)}
                                    onBlur={handleYearCommit}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") handleYearCommit();
                                        if (e.key === "Escape") setYearInput(false);
                                    }}
                                    style={{ ...SEL, width: 70, textAlign: "center" }}
                                    aria-label="Year"
                                />
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => { setYearDraft(String(viewYear)); setYearInput(true); }}
                                    style={{ ...SEL, cursor: "pointer", border: "1px solid transparent" }}
                                    title="Click to edit year"
                                >
                                    {viewYear}
                                </button>
                            )}
                        </div>

                        <button type="button" className="dp-nav-btn" onClick={nextMonth} style={NAV_BTN} aria-label="Next month">
                            <ChevronRight style={{ width: 16, height: 16 }} />
                        </button>
                    </div>

                    {/* Day-of-week headers */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
                        {DAYS.map(d => (
                            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-muted, #9ca3af)", padding: "4px 0" }}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Date grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                        {cells.map((day, idx) => {
                            if (day === null) return <div key={`empty-${idx}`} />;
                            const cellDate = new Date(viewYear, viewMonth, day);
                            cellDate.setHours(0, 0, 0, 0);
                            const disabled = !!(minDate && cellDate < minDate);
                            const isToday = sameDay(cellDate, today);
                            const isSelected = selectedDate ? sameDay(cellDate, selectedDate) : false;

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    className="dp-day-btn"
                                    onClick={() => !disabled && handleDay(day)}
                                    aria-label={cellDate.toDateString()}
                                    aria-pressed={isSelected}
                                    aria-disabled={disabled}
                                    tabIndex={disabled ? -1 : 0}
                                    style={{
                                        borderRadius: 8,
                                        border: isToday && !isSelected
                                            ? "1.5px solid var(--color-brand-green)"
                                            : "1.5px solid transparent",
                                        padding: "6px 0",
                                        fontSize: 13,
                                        fontWeight: isSelected || isToday ? 700 : 500,
                                        background: isSelected ? "var(--color-brand-green)" : "transparent",
                                        color: disabled
                                            ? "var(--text-muted, #9ca3af)"
                                            : isSelected
                                                ? "#fff"
                                                : "var(--text-primary)",
                                        cursor: disabled ? "not-allowed" : "pointer",
                                        opacity: disabled ? 0.35 : 1,
                                        transition: "background 0.12s, color 0.12s",
                                        outline: "none",
                                    }}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div style={{
                        marginTop: 12, paddingTop: 10,
                        borderTop: "1px solid var(--border-color)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                        <button
                            type="button"
                            onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}
                            style={{ fontSize: 12, fontWeight: 600, color: "var(--color-brand-green)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                            Today
                        </button>
                        {selectedDate && (
                            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                                {selectedDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const NAV_BTN: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 30, height: 30, borderRadius: 8,
    border: "1px solid var(--border-color)",
    background: "var(--bg-input)",
    color: "var(--text-secondary)",
    cursor: "pointer", flexShrink: 0,
    transition: "background 0.12s",
};

const SEL: React.CSSProperties = {
    padding: "4px 8px", borderRadius: 8,
    border: "1px solid var(--border-color)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: 13, fontWeight: 700,
    outline: "none",
};
