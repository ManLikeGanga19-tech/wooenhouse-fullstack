import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Phone, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
    title:       "Wooden Houses in Nanyuki — Eco Lodges, Cabins & Ranch Structures | Wooden Houses Kenya",
    description: "Building wooden houses, eco-lodge cabins, research facilities and ranch structures in Nanyuki and the Mt. Kenya region since 2016. Trusted by Mpala Research Center. Free quote.",
    alternates:  { canonical: "/nanyuki" },
    openGraph: {
        title:       "Wooden Houses in Nanyuki — Eco Lodges, Cabins & Ranch Structures",
        description: "Custom wooden structures for eco-lodges, research facilities, ranches and private homes in the Nanyuki and Mt. Kenya region.",
        url:         "/nanyuki",
        images:      [{ url: "/projects/off-nanyuki.jpg", width: 1200, height: 630 }],
    },
}

const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type":    ["LocalBusiness", "HomeAndConstructionBusiness"],
    "@id":      "https://woodenhouseskenya.com/#organization",
    name:       "Wooden Houses Kenya — Nanyuki",
    description: "Custom wooden eco-lodges, cabins, research facilities, ranch homes and permanent residences built in Nanyuki and the Mt. Kenya region.",
    url:        "https://woodenhouseskenya.com/nanyuki",
    telephone:  ["+254716111187", "+254789104438"],
    email:      "info@woodenhouseskenya.com",
    address: {
        "@type":           "PostalAddress",
        addressLocality:   "Nanyuki",
        addressRegion:     "Laikipia County",
        addressCountry:    "KE",
    },
    geo: {
        "@type":    "GeoCoordinates",
        latitude:   0.0167,
        longitude:  37.0708,
    },
    areaServed: [
        { "@type": "City", name: "Nanyuki" },
        { "@type": "AdministrativeArea", name: "Laikipia County" },
    ],
}

const SERVICES = [
    "Off-grid wooden houses and cottages",
    "Eco-lodge and safari camp structures",
    "Research station and field office buildings",
    "Ranch homes and farm manager quarters",
    "Staff quarters and dormitories",
    "Remote site builds with full logistics",
]

const AREAS = [
    "Nanyuki Town", "Laikipia Plateau", "Ol Pejeta",
    "Mpala", "Timau", "Meru", "Nyeri",
    "Naro Moru", "Ol Jogi", "Lewa",
]

export default function NanyukiPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
            />

            <div className="flex flex-col w-full">

                {/* HERO */}
                <section className="relative w-full h-[340px] sm:h-[420px] overflow-hidden">
                    <Image
                        src="/projects/off-nanyuki.jpg"
                        alt="Off-grid wooden cabin near Mt. Kenya Nanyuki"
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-black/55" />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center text-white">
                        <div className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: "#C49A6C" }}>
                            <MapPin size={16} />
                            <span>Nanyuki, Laikipia County</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 max-w-2xl leading-tight">
                            Wooden Houses Built in Nanyuki
                        </h1>
                        <p className="text-white/85 max-w-xl text-base sm:text-lg mb-6">
                            In the shadow of Mt. Kenya, where the land demands structures that respect it. We have built here for research centres, eco-lodges, ranches and private homeowners.
                        </p>
                        <Button
                            asChild
                            className="text-white font-semibold px-6 py-3 text-base rounded-lg hover:scale-105 transition-transform"
                            style={{ background: "#8B5E3C" }}
                        >
                            <Link href="/contact">Get a Free Quote</Link>
                        </Button>
                    </div>
                </section>

                {/* INTRO */}
                <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-5" style={{ color: "#8B5E3C" }}>
                        Building in the Highlands
                    </h2>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
                        The Nanyuki and Laikipia region is one of Kenya's most stunning landscapes. It is also one of the most demanding places to build. Remote roads, altitude, unpredictable highland rains — and the knowledge that whatever you build will sit within a view of Mt. Kenya. That is a responsibility we take seriously.
                    </p>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
                        We have built for Mpala Research Center, for private ranch owners and for individual homeowners seeking an off-grid life in the highlands. Each build here is different because the land here is different from anywhere else in Kenya.
                    </p>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                        Nanyuki ni mji wa kipekee — una hali ya hewa nzuri, mandhari nzuri na watu wanaotaka kuishi karibu na asili. Hilo ndilo tunalolisaidia kujenga.
                    </p>
                </section>

                {/* TRUSTED BY */}
                <section className="bg-[#faf8f5] py-10 sm:py-12">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#8B5E3C" }}>
                            Trusted by organisations in this region
                        </p>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 relative rounded-lg overflow-hidden border border-gray-200 bg-white">
                                    <Image src="/partners/mpala.jpg" alt="Mpala Research Center" fill className="object-contain p-1" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 text-sm">Mpala Research Center</p>
                                    <p className="text-xs text-gray-500">Field office structure, Nanyuki</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SERVICES */}
                <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-8" style={{ color: "#8B5E3C" }}>
                        What We Build in the Nanyuki Region
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {SERVICES.map((s, i) => (
                            <div key={i} className="flex items-start gap-3 bg-[#faf8f5] rounded-xl p-4 border border-gray-100">
                                <CheckCircle size={20} className="shrink-0 mt-0.5" style={{ color: "#8B5E3C" }} />
                                <span className="text-gray-700 font-medium text-sm sm:text-base">{s}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* AREAS */}
                <section className="bg-[#faf8f5] py-14 sm:py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: "#8B5E3C" }}>
                            Areas We Serve in the Mt. Kenya Region
                        </h2>
                        <div className="flex flex-wrap gap-2 mt-6">
                            {AREAS.map(area => (
                                <span
                                    key={area}
                                    className="px-3 py-1.5 rounded-full text-sm font-semibold"
                                    style={{ background: "white", color: "#8B5E3C", border: "1px solid #C49A6C" }}
                                >
                                    {area}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-14 sm:py-16" style={{ background: "#8B5E3C" }}>
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-white">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                            Planning a Build Near Mt. Kenya?
                        </h2>
                        <p className="text-white/85 mb-6 text-base sm:text-lg">
                            Remote builds are our speciality. Tell us your site, your vision and your budget — we will handle the rest, including transport and logistics.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button asChild className="bg-white font-semibold text-base px-6 py-3 hover:bg-gray-100 rounded-lg" style={{ color: "#8B5E3C" }}>
                                <Link href="/contact">Request a Quote</Link>
                            </Button>
                            <Button asChild variant="outline" className="border-white text-white font-semibold text-base px-6 py-3 hover:bg-white/10 rounded-lg">
                                <a href="tel:+254789104438">
                                    <Phone size={16} className="mr-2 inline" /> +254 789 104 438
                                </a>
                            </Button>
                        </div>
                    </div>
                </section>

            </div>
        </>
    )
}
