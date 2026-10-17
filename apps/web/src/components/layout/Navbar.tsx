"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Menu, X, PlusCircle, Home, Search, BookOpen, LayoutDashboard, Shield, Wallet, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/layout/ThemeProvider";
import { useState } from "react";

export function Navbar() {
    const { authenticated, loading, isLandlord, isTenant, isAdmin } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const closeMobile = () => setMobileOpen(false);

    return (
        <>
            {/* Main Nav Bar */}
            <nav className="sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] transition-colors duration-200">
                <div className="w-full px-4 md:px-10 flex h-16 items-center justify-between">

                    {/* Left: Logo + Desktop Links */}
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link href="/" onClick={closeMobile} className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-blue)] text-white font-bold text-xl shrink-0">
                                R
                            </div>
                            <span className="text-xl font-bold text-[var(--text-primary)] hidden sm:block">
                                RentHub
                            </span>
                        </Link>

                        {/* Desktop Nav Links */}
                        {!loading && (
                            <div className="hidden md:flex items-center gap-1">
                                <Link href="/search"
                                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold
                                        text-[var(--text-primary)] hover:bg-[var(--color-brand-green)] hover:text-white transition-all duration-200">
                                    {isLandlord ? "Search" : "For Rent"}
                                </Link>
                                {authenticated ? (
                                    <>
                                        {isTenant && (
                                            <Link href="/dashboard?tab=favorites"
                                                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold
                                                    text-[var(--text-primary)] hover:bg-[var(--color-brand-green)] hover:text-white transition-all duration-200">
                                                Saved Homes
                                            </Link>
                                        )}
                                        {isLandlord && (
                                            <>
                                                <Link href="/dashboard?tab=properties"
                                                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold
                                                        text-[var(--text-primary)] hover:bg-[var(--color-brand-green)] hover:text-white transition-all duration-200">
                                                    My Properties
                                                </Link>
                                                <Link href="/dashboard?tab=payouts"
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold
                                                        text-[var(--text-primary)] hover:bg-[var(--color-brand-green)] hover:text-white transition-all duration-200">
                                                    <Wallet className="h-4 w-4" />
                                                    Payouts
                                                </Link>
                                            </>
                                        )}
                                        <Link href="/dashboard"
                                            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold
                                                text-[var(--text-primary)] hover:bg-[var(--color-brand-green)] hover:text-white transition-all duration-200">
                                            Dashboard
                                        </Link>
                                        <Link href="/dashboard/profile"
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold
                                                text-[var(--text-primary)] hover:bg-[var(--color-brand-green)] hover:text-white transition-all duration-200">
                                            <User className="h-4 w-4" />
                                            Profile
                                        </Link>
                                        {isAdmin && (
                                            <Link href="/admin"
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold
                                                    text-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)] hover:text-white transition-all duration-200">
                                                <Shield className="h-3.5 w-3.5" />
                                                Admin
                                            </Link>
                                        )}
                                    </>
                                ) : (
                                    <Link href="/dashboard"
                                        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold
                                            text-[var(--text-primary)] hover:bg-[var(--color-brand-green)] hover:text-white transition-all duration-200">
                                        For Landlords
                                    </Link>
                                )}
                                <Link href="/resources"
                                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold
                                        text-[var(--text-primary)] hover:bg-[var(--color-brand-green)] hover:text-white transition-all duration-200">
                                    Resources
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />

                        <SignedOut>
                            <Link href="/sign-in" className="hidden sm:block">
                                <Button variant="ghost"
                                    className="font-semibold text-[var(--text-primary)] hover:bg-[var(--color-brand-green)] hover:text-white">
                                    Sign In
                                </Button>
                            </Link>
                        </SignedOut>

                        <SignedIn>
                            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-9 w-9" } }}>
                                <UserButton.MenuItems>
                                    <UserButton.Link
                                        label="Payouts & Settlements"
                                        labelIcon={<Wallet className="h-4 w-4 text-emerald-600" />}
                                        href="/dashboard?tab=payouts"
                                    />
                                    <UserButton.Link
                                        label="My Profile"
                                        labelIcon={<User className="h-4 w-4" />}
                                        href="/dashboard/profile"
                                    />
                                </UserButton.MenuItems>
                            </UserButton>
                        </SignedIn>

                        {!loading && (
                            <Link href={isLandlord ? "/properties/new" : "/dashboard"} className="hidden sm:block">
                                <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {isLandlord ? "Add Property" : "List Your Home"}
                                </Button>
                            </Link>
                        )}

                        {/* Mobile Hamburger */}
                        <button
                            type="button"
                            onClick={() => setMobileOpen(prev => !prev)}
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            className="md:hidden p-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer">
                            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Dropdown Panel */}
            {mobileOpen && (
                <div className="md:hidden fixed top-16 left-0 right-0 z-40
                    bg-[var(--bg-card)] border-b border-[var(--border-color)] shadow-[var(--shadow-md)]">
                    <div className="px-4 py-4 space-y-1">
                        <Link href="/search" onClick={closeMobile}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold
                                text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
                            <Search className="h-5 w-5 text-[var(--text-primary)]" />
                            {isLandlord ? "Search Properties" : "Find a Home"}
                        </Link>

                        {authenticated ? (
                            <>
                                {isTenant && (
                                    <Link href="/dashboard?tab=favorites" onClick={closeMobile}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold
                                            text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
                                        <Home className="h-5 w-5 text-[var(--color-brand-green)]" />
                                        Saved Homes
                                    </Link>
                                )}
                                {isLandlord && (
                                    <>
                                        <Link href="/dashboard?tab=properties" onClick={closeMobile}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold
                                                text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
                                            <Home className="h-5 w-5 text-[var(--color-brand-green)]" />
                                            My Properties
                                        </Link>
                                        <Link href="/dashboard?tab=payouts" onClick={closeMobile}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold
                                                text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
                                            <Wallet className="h-5 w-5 text-emerald-600" />
                                            AfriExchange Payouts
                                        </Link>
                                    </>
                                )}
                                <Link href="/dashboard" onClick={closeMobile}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold
                                        text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
                                    <LayoutDashboard className="h-5 w-5 text-[var(--text-primary)]" />
                                    Dashboard
                                </Link>
                                <Link href="/dashboard/profile" onClick={closeMobile}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold
                                        text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
                                    <User className="h-5 w-5 text-[var(--color-brand-blue)]" />
                                    My Profile
                                </Link>
                                {isAdmin && (
                                    <Link href="/admin" onClick={closeMobile}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold
                                            text-[var(--color-brand-green)] hover:bg-[var(--bg-muted)] transition-colors">
                                        <Shield className="h-5 w-5" />
                                        Admin Portal
                                    </Link>
                                )}
                            </>
                        ) : (
                            <Link href="/dashboard" onClick={closeMobile}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold
                                    text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
                                <LayoutDashboard className="h-5 w-5 text-[var(--text-primary)]" />
                                For Landlords
                            </Link>
                        )}

                        <Link href="/resources" onClick={closeMobile}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold
                                text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
                            <BookOpen className="h-5 w-5 text-[var(--color-brand-orange)]" />
                            Resources
                        </Link>

                        {/* Divider */}
                        <div className="border-t border-[var(--border-color)] my-2" />

                        <SignedOut>
                            <Link href="/sign-in" onClick={closeMobile}>
                                <Button variant="outline" className="w-full font-bold
                                    border-[var(--border-color)] text-[var(--text-primary)] bg-transparent">
                                    Sign In
                                </Button>
                            </Link>
                        </SignedOut>

                        {!loading && (
                            <Link href={isLandlord ? "/properties/new" : "/dashboard"} onClick={closeMobile}>
                                <Button className="w-full bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold mt-1">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {isLandlord ? "Add Property" : "List Your Home"}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 top-16 z-30 bg-black/20 backdrop-blur-sm"
                    onClick={closeMobile}
                />
            )}
        </>
    );
}
