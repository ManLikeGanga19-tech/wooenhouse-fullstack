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

function WhatsAppIcon({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="WhatsApp">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill={color} />
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
                            <Link href="https://www.facebook.com/mitchiehousing/" aria-label="Follow us on Facebook" className="hover:scale-110 transition-all">
                                <Facebook size={22} className="sm:w-6 sm:h-6" style={{ color: "#C49A6C" }} />
                            </Link>
                            <Link href="https://www.instagram.com/woodenhouseskenya/" aria-label="Follow us on Instagram" className="hover:scale-110 transition-all">
                                <Instagram size={22} className="sm:w-6 sm:h-6" style={{ color: "#C49A6C" }} />
                            </Link>
                            <Link href="https://x.com/wooden_kenya/" aria-label="Follow us on X (Twitter)" className="hover:scale-110 transition-all">
                                <XBrandIcon size={22} color="#C49A6C" />
                            </Link>
                            <Link href="https://www.youtube.com/@WoodenHouseKenya" target="_blank" rel="noopener noreferrer" aria-label="Watch us on YouTube" className="hover:scale-110 transition-all">
                                <Youtube size={22} className="sm:w-6 sm:h-6" style={{ color: "#C49A6C" }} />
                            </Link>
                            <a href="https://wa.me/254789104438" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp" className="hover:scale-110 transition-all">
                                <WhatsAppIcon size={22} color="#C49A6C" />
                            </a>
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
                                { href: "/blog", label: "Blog" },
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