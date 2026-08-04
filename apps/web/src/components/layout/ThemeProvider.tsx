"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: ThemePreference;
    resolvedTheme: "light" | "dark";
    setTheme: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "system",
    resolvedTheme: "light",
    setTheme: () => {},
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemePreference>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    const applyTheme = (pref: ThemePreference) => {
        try {
            const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            const isDark = pref === "dark" || (pref === "system" && sysDark);

            if (isDark) {
                document.documentElement.classList.add("dark");
                setResolvedTheme("dark");
            } else {
                document.documentElement.classList.remove("dark");
                setResolvedTheme("light");
            }
        } catch {}
    };

    useEffect(() => {
        try {
            const saved = (localStorage.getItem("renthub_theme_preference") as ThemePreference) || "system";
            setThemeState(saved);
            applyTheme(saved);
            setMounted(true);
        } catch {}

        // Listen for OS system theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            const saved = (localStorage.getItem("renthub_theme_preference") as ThemePreference) || "system";
            if (saved === "system") {
                applyTheme("system");
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const setTheme = (newPref: ThemePreference) => {
        setThemeState(newPref);
        try {
            localStorage.setItem("renthub_theme_preference", newPref);
        } catch {}
        applyTheme(newPref);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("#theme-toggle-container")) {
                setIsOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const options: { id: ThemePreference; label: string; icon: any }[] = [
        { id: "light", label: "Light", icon: Sun },
        { id: "dark", label: "Dark", icon: Moon },
        { id: "system", label: "System", icon: Monitor },
    ];

    return (
        <div id="theme-toggle-container" className="relative inline-block">
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                aria-label="Theme selection menu"
                title={`Current theme: ${theme} (${resolvedTheme})`}
                className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:bg-[var(--bg-muted)] text-[var(--text-primary)] cursor-pointer ${className}`}
            >
                {resolvedTheme === "dark" ? (
                    <Moon className="h-5 w-5 text-amber-400" />
                ) : (
                    <Sun className="h-5 w-5 text-amber-500" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
                        Appearance
                    </div>
                    {options.map(opt => {
                        const Icon = opt.icon;
                        const isSelected = theme === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                    setTheme(opt.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                                    isSelected
                                        ? "text-[var(--color-brand-orange)] bg-[var(--bg-muted)]"
                                        : "text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <span>{opt.label}</span>
                                </div>
                                {isSelected && <Check className="h-3.5 w-3.5" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
