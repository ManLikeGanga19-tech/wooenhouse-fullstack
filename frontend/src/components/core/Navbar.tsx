"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
    Menu,
    Phone,
    Mail,
    MapPin,
    Facebook,
    Instagram,
    Youtube,
} from "lucide-react"

// Official X (formerly Twitter) logo as inline SVG
function XBrandIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="X (Twitter)">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.733-8.835L2.25 2.25h6.413l4.26 5.636 5.321-5.636Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" fill={color} />
        </svg>
    )
}

import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { DialogTitle } from "@radix-ui/react-dialog"

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Push Tawk.to chat behind the nav overlay when menu is open
    useEffect(() => {
        if (typeof window === "undefined") return

        // CSS class covers the case where Tawk hasn't loaded yet
        document.body.classList.toggle("nav-open", menuOpen)

        // Programmatic API hides it completely when loaded
        const tawk = (window as any).Tawk_API
        if (tawk) {
            if (menuOpen) {
                tawk.hideWidget?.()
            } else {
                tawk.showWidget?.()
            }
        }

        return () => { document.body.classList.remove("nav-open") }
    }, [menuOpen])

    const isActive = (path: string) => pathname === path

    return (
        <nav className="w-full fixed top-0 left-0 z-50 bg-white">

            {/* TOP BAR */}
            <div className="w-full bg-brand-brownDark text-brand-white text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-6">

                {/* Desktop/Tablet View */}
                <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-6 lg:gap-8 shrink min-w-0">
                        <a href="tel:+254789104438" className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer shrink-0">
                            <Phone size={14} className="sm:w-4 sm:h-4" style={{ color: "#C49A6C" }} />
                            <span className="font-medium group-hover:text-brand-brownLight transition-colors duration-200 whitespace-nowrap text-xs sm:text-sm">
                                +254 789 104 438
                            </span>
                        </a>

                        <a href="mailto:info@woodenhouseskenya.com" className="flex items-center gap-2 group cursor-pointer shrink-0">
                            <Mail size={14} className="sm:w-4 sm:h-4" style={{ color: "#C49A6C" }} />
                            <span className="font-medium group-hover:text-brand-brownLight transition-colors duration-200 whitespace-nowrap text-xs sm:text-sm">
                                info@woodenhouseskenya.com
                            </span>
                        </a>

                        <div className="hidden lg:flex items-center gap-2 group cursor-pointer shrink-0">
                            <MapPin size={16} style={{ color: "#C49A6C" }} />
                            <span className="font-medium group-hover:text-brand-brownLight transition-colors duration-200 whitespace-nowrap">
                                Naivasha, Kenya
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Link href="https://www.facebook.com/mitchiehousing/" aria-label="Follow us on Facebook" className="hover:scale-110 transition-all">
                            <Facebook size={16} className="sm:w-[18px] sm:h-[18px]" style={{ color: "#8B5E3C" }} />
                        </Link>
                        <Link href="https://www.instagram.com/woodenhouseskenya/" aria-label="Follow us on Instagram" className="hover:scale-110 transition-all">
                            <Instagram size={16} className="sm:w-[18px] sm:h-[18px]" style={{ color: "#8B5E3C" }} />
                        </Link>
                        <Link href="https://x.com/wooden_kenya/" aria-label="Follow us on X (Twitter)" className="hover:scale-110 transition-all">
                            <XBrandIcon size={18} color="#8B5E3C" />
                        </Link>
                        <Link href="https://www.youtube.com/@WoodenHouseKenya" target="_blank" rel="noopener noreferrer" aria-label="Watch us on YouTube" className="hover:scale-110 transition-all">
                            <Youtube size={18} style={{ color: "#8B5E3C" }} />
                        </Link>
                    </div>
                </div>

                {/* Mobile View */}
                <div className="flex sm:hidden flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                        <a href="tel:+254789104438" className="flex items-center gap-1.5 group cursor-pointer">
                            <Phone size={14} style={{ color: "#C49A6C" }} />
                            <span className="font-medium group-hover:text-brand-brownLight transition-colors duration-200 text-xs">
                                +254 789 104 438
                            </span>
                        </a>

                        <a href="mailto:info@woodenhouseskenya.com" className="flex items-center gap-1.5 group cursor-pointer">
                            <Mail size={14} style={{ color: "#C49A6C" }} />
                            <span className="font-medium group-hover:text-brand-brownLight transition-colors duration-200 text-xs">
                                info@woodenhouseskenya.com
                            </span>
                        </a>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 cursor-pointer">
                            <MapPin size={14} style={{ color: "#C49A6C" }} />
                            <span className="font-medium text-xs">Naivasha, Kenya</span>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Link href="https://www.facebook.com/mitchiehousing/" aria-label="Follow us on Facebook" className="hover:scale-110 transition-all">
                                <Facebook size={16} style={{ color: "#8B5E3C" }} />
                            </Link>
                            <Link href="https://www.instagram.com/woodenhouseskenya/" aria-label="Follow us on Instagram" className="hover:scale-110 transition-all">
                                <Instagram size={16} style={{ color: "#8B5E3C" }} />
                            </Link>
                            <Link href="https://x.com/wooden_kenya/" aria-label="Follow us on X (Twitter)" className="hover:scale-110 transition-all">
                                <XBrandIcon size={16} color="#8B5E3C" />
                            </Link>
                            <Link href="https://www.youtube.com/@WoodenHouseKenya" target="_blank" rel="noopener noreferrer" aria-label="Watch us on YouTube" className="hover:scale-110 transition-all">
                                <Youtube size={16} style={{ color: "#8B5E3C" }} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN NAV */}
            <div className={`w-full bg-white transition-all duration-300 ${scrolled ? "shadow-lg border-b border-gray-200" : "shadow-md"}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">

                    {/* Logo */}
                    <Link href="/" className="flex items-center shrink-0">
                        <Image
                            src="/woodenhouse.png"
                            alt="WoodenHouses Kenya Logo"
                            width={180}
                            height={60}
                            className="h-10 sm:h-12 w-auto"
                            priority
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6 lg:gap-10 text-gray-700 font-semibold text-sm lg:text-base">
                        {[
                            { href: "/", label: "Home" },
                            { href: "/about", label: "About" },
                            { href: "/services", label: "Services" },
                            { href: "/projects", label: "Projects" },
                            { href: "/contact", label: "Contact Us" },
                        ].map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{ color: isActive(item.href) ? "#8B5E3C" : "inherit" }}
                                className="hover:text-brand-brown relative pb-1 whitespace-nowrap"
                            >
                                {item.label}
                                {isActive(item.href) && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-brown" />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* MOBILE MENU — slides up from bottom */}
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger className="md:hidden p-2">
                            <Menu size={28} style={{ color: "#8B5E3C" }} />
                        </SheetTrigger>

                        <SheetContent
                            side="bottom"
                            className="bg-white p-0 rounded-t-3xl shadow-2xl border-t-0"
                            style={{ maxHeight: "72vh" }}
                        >
                            <VisuallyHidden>
                                <DialogTitle>Navigation Menu</DialogTitle>
                            </VisuallyHidden>

                            {/* Drag handle */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-10 h-1 rounded-full bg-gray-200" />
                            </div>

                            {/* Nav links — 2 column grid */}
                            <div className="px-5 pb-4 grid grid-cols-2 gap-2.5">
                                {[
                                    { href: "/", label: "Home" },
                                    { href: "/about", label: "About" },
                                    { href: "/services", label: "Services" },
                                    { href: "/projects", label: "Projects" },
                                    { href: "/contact", label: "Contact Us" },
                                ].map((item) => (
                                    <SheetClose asChild key={item.href}>
                                        <Link
                                            href={item.href}
                                            className="py-3 px-4 text-center font-semibold text-sm transition-all"
                                            style={{
                                                background: isActive(item.href) ? "#8B5E3C" : "#f5f0eb",
                                                color: isActive(item.href) ? "white" : "#5c3d20",
                                            }}
                                        >
                                            {item.label}
                                        </Link>
                                    </SheetClose>
                                ))}
                            </div>

                            {/* Action strip — phone dials directly, Get Quote navigates */}
                            <div className="mx-5 mb-6 rounded-xl overflow-hidden flex">
                                <a
                                    href="tel:+254789104438"
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 font-semibold text-sm"
                                    style={{ background: "#f5f0eb", color: "#5c3d20" }}
                                >
                                    <Phone size={15} />
                                    Call Us
                                </a>
                                <div className="w-px bg-white" />
                                <SheetClose asChild>
                                    <Link
                                        href="/contact"
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 font-semibold text-sm"
                                        style={{ background: "#8B5E3C", color: "white" }}
                                    >
                                        Get a Quote
                                    </Link>
                                </SheetClose>
                            </div>

                        </SheetContent>
                    </Sheet>

                </div>
            </div>

        </nav>
    )
}
