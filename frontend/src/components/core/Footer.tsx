"use client"

import { useState, useRef } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    MapPin,
    Phone,
    Mail,
    Facebook,
    Instagram,
    Youtube,
    ArrowRight,
    ArrowUp,
} from "lucide-react"

function XBrandIcon({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="X (Twitter)">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.733-8.835L2.25 2.25h6.413l4.26 5.636 5.321-5.636Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" fill={color} />
        </svg>
    )
}
import { api } from "@/lib/api/client"

export default function Footer() {
    const [email,     setEmail]     = useState("")
    const [hp,        setHp]        = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const loadedAt = useRef(Date.now())
    const { executeRecaptcha } = useGoogleReCaptcha()

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    const handleSubscribe = async () => {
        const trimmed = email.trim()
        if (!trimmed) return
        setIsLoading(true)
        try {
            const recaptchaToken = executeRecaptcha ? await executeRecaptcha("newsletter_subscribe") : undefined
            const { data } = await api.newsletter.subscribe({
                email: trimmed,
                source: "footer",
                hp,
                loadedAt: loadedAt.current,
                recaptchaToken,
            })
            toast.success(data.message ?? "Subscribed successfully!")
            setEmail("")
        } catch (err) {
            toast.error("Subscription failed — " + (err instanceof Error ? err.message : "please try again."))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <footer className="relative w-full max-w-full text-white overflow-hidden">

            {/* BACKGROUND IMAGE */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/footer.jpg"
                    alt="Footer Background"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* OVERLAY FOR READABILITY */}
            <div className="relative z-10 bg-black/40 w-full py-16 sm:py-20 md:py-24">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12 md:gap-16">

                    {/* COLUMN 1 — ADDRESS */}
                    <div
                        data-aos="fade-up"
                        data-aos-duration="800"
                        data-aos-delay="100"
                    >
                        <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: "#C49A6C" }}>
                            Address
                        </h3>

                        <div
                            className="flex items-start gap-3 mb-4"
                            data-aos="fade-right"
                            data-aos-duration="600"
                            data-aos-delay="200"
                        >
                            <MapPin size={20} className="sm:w-[22px] sm:h-[22px] flex-shrink-0" style={{ color: "#C49A6C" }} />
                            <p className="text-white/90 text-sm sm:text-base">Naivasha, Kenya</p>
                        </div>

                        <div
                            className="flex items-start gap-3 mb-4"
                            data-aos="fade-right"
                            data-aos-duration="600"
                            data-aos-delay="300"
                        >
                            <Phone size={20} className="sm:w-[22px] sm:h-[22px] flex-shrink-0" style={{ color: "#C49A6C" }} />
                            <p className="text-white/90 text-sm sm:text-base">+254 716 111 187 / +254 789 104 438</p>
                        </div>

                        <div
                            className="flex items-start gap-3 mb-4"
                            data-aos="fade-right"
                            data-aos-duration="600"
                            data-aos-delay="400"
                        >
                            <Mail size={20} className="sm:w-[22px] sm:h-[22px] flex-shrink-0" style={{ color: "#C49A6C" }} />
                            <p className="text-white/90 text-sm sm:text-base break-words">info@woodenhouseskenya.com</p>
                        </div>

                        {/* SOCIAL ICONS */}
                        <div
                            className="flex items-center gap-3 sm:gap-4 mt-5 sm:mt-6"
                            data-aos="zoom-in"
                            data-aos-duration="800"
                            data-aos-delay="500"
                        >
                            <Link href="https://www.facebook.com/mitchiehousing/" className="hover:scale-110 transition-all">
                                <Facebook size={22} className="sm:w-6 sm:h-6" style={{ color: "#C49A6C" }} />
                            </Link>
                            <Link href="https://www.instagram.com/woodenhouseskenya/" className="hover:scale-110 transition-all">
                                <Instagram size={22} className="sm:w-6 sm:h-6" style={{ color: "#C49A6C" }} />
                            </Link>
                            <Link href="https://x.com/wooden_kenya/" className="hover:scale-110 transition-all">
                                <XBrandIcon size={22} color="#C49A6C" />
                            </Link>
                            <Link href="#" className="hover:scale-110 transition-all">
                                <Youtube size={22} className="sm:w-6 sm:h-6" style={{ color: "#C49A6C" }} />
                            </Link>
                        </div>
                    </div>

                    {/* COLUMN 2 — QUICK LINKS */}
                    <div
                        data-aos="fade-up"
                        data-aos-duration="800"
                        data-aos-delay="200"
                    >
                        <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: "#C49A6C" }}>
                            Quick Links
                        </h3>

                        <ul className="space-y-2.5 sm:space-y-3 text-white/90 text-base sm:text-lg">
                            {[
                                { href: "/", label: "Home" },
                                { href: "/about", label: "About Us" },
                                { href: "/services", label: "Services" },
                                { href: "/projects", label: "Projects" },
                                { href: "/contact", label: "Contact Us" },
                            ].map((link, index) => (
                                <li
                                    key={link.href}
                                    data-aos="fade-right"
                                    data-aos-duration="600"
                                    data-aos-delay={300 + index * 50}
                                >
                                    <Link href={link.href} className="group flex items-center gap-2 hover:text-[#C49A6C] transition">
                                        <span>{link.label}</span>
                                        <ArrowRight
                                            size={16}
                                            className="sm:w-[18px] sm:h-[18px] opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300"
                                            style={{ color: "#C49A6C" }}
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* COLUMN 3 — NEWSLETTER */}
                    <div
                        data-aos="fade-up"
                        data-aos-duration="800"
                        data-aos-delay="300"
                    >
                        <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: "#C49A6C" }}>
                            Newsletter
                        </h3>

                        <p
                            className="text-white/90 mb-4 sm:mb-5 text-sm sm:text-base"
                            data-aos="fade-left"
                            data-aos-duration="600"
                            data-aos-delay="400"
                        >
                            Subscribe for our newsletters
                        </p>

                        <div>
                            {/* Honeypot — invisible to humans, bots fill it */}
                            <input
                                type="text"
                                name="website"
                                value={hp}
                                onChange={e => setHp(e.target.value)}
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                                style={{ position: "absolute", opacity: 0, height: 0, width: 0, border: 0, padding: 0 }}
                            />
                            <Input
                                type="email"
                                placeholder="Your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                                className="mb-4 bg-white/90 text-black placeholder-black/60 text-sm sm:text-base"
                            />

                            <Button
                                type="button"
                                onClick={handleSubscribe}
                                disabled={isLoading || !email.trim()}
                                className="w-full font-semibold text-sm sm:text-base hover:scale-105 transition-transform duration-300"
                                style={{
                                    background: "#8B5E3C",
                                    color: "white",
                                }}
                            >
                                {isLoading ? "Subscribing..." : "Subscribe"}
                            </Button>
                        </div>
                    </div>

                </div>

                {/* SEPARATOR */}
                <div
                    className="w-full mt-12 sm:mt-14 md:mt-16 border-t border-white/20"
                    data-aos="fade"
                    data-aos-duration="800"
                    data-aos-delay="600"
                ></div>

                {/* COPYRIGHT & SCROLL TO TOP */}
                <div
                    className="flex flex-col sm:flex-row items-center justify-between mt-5 sm:mt-6 px-4 sm:px-6 max-w-7xl mx-auto gap-4"
                    data-aos="fade-up"
                    data-aos-duration="800"
                    data-aos-delay="700"
                >
                    <p className="text-center sm:text-left text-white/80 text-xs sm:text-sm">
                        © {new Date().getFullYear()} Wooden Houses Kenya, All Rights Reserved.
                    </p>

                    {/* SCROLL TO TOP BUTTON */}
                    <button
                        onClick={scrollToTop}
                        className="group flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#C49A6C] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                        <span className="font-semibold text-xs sm:text-sm">Back to Top</span>
                        <ArrowUp
                            size={16}
                            className="sm:w-[18px] sm:h-[18px] transform group-hover:-translate-y-1 transition-transform duration-300"
                        />
                    </button>
                </div>
            </div>

        </footer>
    )
}