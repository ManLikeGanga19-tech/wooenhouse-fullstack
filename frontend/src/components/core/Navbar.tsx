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
    X,
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
    const pathname = usePathname()

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const isActive = (path: string) => pathname === path

    return (
        <nav className="w-full fixed top-0 left-0 z-50 bg-white">

            {/* TOP BAR */}
            <div className="w-full bg-brand-brownDark text-brand-white text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-6">

                {/* Desktop/Tablet View - Horizontal Layout */}
                <div className="hidden sm:flex items-center justify-between">
                    {/* Left - Contact Info */}
                    <div className="flex items-center gap-3 md:gap-6 lg:gap-8 shrink min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer shrink-0">
                            <Phone size={14} className="sm:w-4 sm:h-4" style={{ color: "#C49A6C" }} />
                            <span className="font-medium group-hover:text-brand-brownLight transition-colors duration-200 whitespace-nowrap text-xs sm:text-sm">
                                +254 789 104 438
                            </span>
                        </div>

                        <div className="flex items-center gap-2 group cursor-pointer shrink-0">
                            <Mail size={14} className="sm:w-4 sm:h-4" style={{ color: "#C49A6C" }} />
                            <span className="font-medium group-hover:text-brand-brownLight transition-colors duration-200 whitespace-nowrap text-xs sm:text-sm">
                                info@woodenhouseskenya.com
                            </span>
                        </div>

                        <div className="hidden lg:flex items-center gap-2 group cursor-pointer shrink-0">
                            <MapPin size={16} style={{ color: "#C49A6C" }} />
                            <span className="font-medium group-hover:text-brand-brownLight transition-colors duration-200 whitespace-nowrap">
                                Naivasha, Kenya
                            </span>
                        </div>
                    </div>

                    {/* Right - Social Icons */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Link href="https://www.facebook.com/mitchiehousing/" className="hover:scale-110 transition-all">
                            <Facebook size={16} className="sm:w-[18px] sm:h-[18px]" style={{ color: "#8B5E3C" }} />
                        </Link>
                        <Link href="https://www.instagram.com/woodenhouseskenya/" className="hover:scale-110 transition-all">
                            <Instagram size={16} className="sm:w-[18px] sm:h-[18px]" style={{ color: "#8B5E3C" }} />
                        </Link>
                        <Link href="https://x.com/wooden_kenya/" className="hover:scale-110 transition-all">
                            <XBrandIcon size={18} color="#8B5E3C" />
                        </Link>
                        <Link href="#" className="hover:scale-110 transition-all">
                            <Youtube size={18} style={{ color: "#8B5E3C" }} />
                        </Link>
                    </div>
                </div>

                {/* Mobile View - Stacked Layout with ALL info */}
                <div className="flex sm:hidden flex-col gap-2">
                    {/* Row 1: Phone & Email */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 group cursor-pointer">
                            <Phone size={14} style={{ color: "#C49A6C" }} />
                            <span className="font-medium group-hover:text-brand-brownLight transition-colors duration-200 text-xs">
                                +254 789 104 438
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 group cursor-pointer">
                            <Mail size={14} style={{ color: "#C49A6C" }} />
                            <span className="font-medium group-hover:text-brand-brownLight transition-colors duration-200 text-xs">
                                info@woodenhouseskenya.com
                            </span>
                        </div>
                    </div>

                    {/* Row 2: Location & Social Icons */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 group cursor-pointer">
                            <MapPin size={14} style={{ color: "#C49A6C" }} />
                            <span className="font-medium group-hover:text-brand-brownLight transition-colors duration-200 text-xs">
                                Naivasha, Kenya
                            </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Link href="#" className="hover:scale-110 transition-all">
                                <Facebook size={16} style={{ color: "#8B5E3C" }} />
                            </Link>
                            <Link href="#" className="hover:scale-110 transition-all">
                                <Instagram size={16} style={{ color: "#8B5E3C" }} />
                            </Link>
                            <Link href="https://x.com/wooden_kenya/" className="hover:scale-110 transition-all">
                                <XBrandIcon size={16} color="#8B5E3C" />
                            </Link>
                            <Link href="#" className="hover:scale-110 transition-all">
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
                                style={{
                                    color: isActive(item.href)
                                        ? "#8B5E3C"
                                        : "inherit",
                                }}
                                className={`hover:text-brand-brown relative pb-1 whitespace-nowrap`}
                            >
                                {item.label}
                                {isActive(item.href) && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-brown" />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* MOBILE MENU — slides up from bottom */}
                    <Sheet>
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
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full bg-gray-200" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                                <span className="font-bold text-base" style={{ color: "#8B5E3C" }}>
                                    Navigation
                                </span>
                                <SheetClose className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                                    <X size={20} style={{ color: "#8B5E3C" }} />
                                </SheetClose>
                            </div>

                            {/* Nav links — 2 column grid so it stays compact */}
                            <div className="p-5 grid grid-cols-2 gap-3">
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
                                            className="py-3 px-4 rounded-xl text-center font-semibold text-sm transition-all"
                                            style={{
                                                background: isActive(item.href) ? "#8B5E3C" : "#f5f0eb",
                                                color:      isActive(item.href) ? "white"    : "#5c3d20",
                                            }}
                                        >
                                            {item.label}
                                        </Link>
                                    </SheetClose>
                                ))}
                            </div>

                            {/* Contact strip */}
                            <div className="mx-5 mb-5 rounded-xl p-3 flex items-center justify-around text-xs text-gray-500" style={{ background: "#faf8f5" }}>
                                <a href="tel:+254716111187" className="flex items-center gap-1.5 font-medium" style={{ color: "#8B5E3C" }}>
                                    <Phone size={13} /> +254 716 111 187
                                </a>
                                <span className="w-px h-4 bg-gray-200" />
                                <a href="mailto:info@woodenhouseskenya.com" className="flex items-center gap-1.5 font-medium" style={{ color: "#8B5E3C" }}>
                                    <Mail size={13} /> Email Us
                                </a>
                            </div>

                        </SheetContent>
                    </Sheet>

                </div>
            </div>

        </nav>
    )
}
