import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Phone, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
    title:       "Wooden Houses in Nairobi — Custom Builds, Cabins & Garden Offices | Wooden Houses Kenya",
    description: "Looking for a wooden house in Nairobi? We build custom wooden homes, garden offices and wooden structures in Karen, Kileleshwa, Runda, Syokimau and across Nairobi. Free quote.",
    alternates:  { canonical: "/nairobi" },
    openGraph: {
        title:       "Wooden Houses in Nairobi — Custom Builds & Garden Offices",
        description: "Custom wooden homes, cabins and garden offices built across Nairobi. Serving Karen, Kileleshwa, Runda, Westlands and beyond.",
        url:         "/nairobi",
        images:      [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
}

const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type":    ["LocalBusiness", "HomeAndConstructionBusiness"],
    "@id":      "https://woodenhouseskenya.com/#organization",
    name:       "Wooden Houses Kenya — Nairobi",
    description: "Custom wooden houses, garden offices, cabins and wooden structures built in Nairobi and surrounding areas.",
    url:        "https://woodenhouseskenya.com/nairobi",
    telephone:  ["+254716111187", "+254789104438"],
    email:      "info@woodenhouseskenya.com",
    address: {
        "@type":           "PostalAddress",
        addressLocality:   "Nairobi",
        addressRegion:     "Nairobi County",
        addressCountry:    "KE",
    },
    geo: {
        "@type":    "GeoCoordinates",
        latitude:   -1.2921,
        longitude:  36.8219,
    },
    areaServed: { "@type": "City", name: "Nairobi" },
}

const SERVICES = [
    "Custom wooden homes for permanent residence",
    "Garden studios and home offices",
    "Wooden extensions and renovations",
    "Staff quarters and caretaker houses",
    "Bespoke kitchen fittings and carpentry",
    "Outdoor decking and garden structures",
]

const AREAS = [
    "Karen", "Kileleshwa", "Runda", "Westlands",
    "Syokimau", "Rongai", "Kitengela", "Ngong",
    "Langata", "Lavington", "Gigiri", "Ridgeways",
]

export default function NairobiPage() {
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
                        alt="Wooden house built in Nairobi Kenya"
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center text-white">
                        <div className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: "#C49A6C" }}>
                            <MapPin size={16} />
                            <span>Nairobi, Kenya</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 max-w-2xl leading-tight">
                            Wooden Houses Built in Nairobi
                        </h1>
                        <p className="text-white/85 max-w-xl text-base sm:text-lg mb-6">
                            From Karen to Syokimau, we design and build custom wooden structures that suit your land, budget and lifestyle.
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
                        Why Nairobi Homeowners Choose Timber
                    </h2>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
                        Land in Nairobi is expensive, and time is never on your side. A wooden structure can be completed in 4 to 9 weeks — giving you a liveable space while the main house is being built, or a finished garden office that adds value to your property without a long construction season.
                    </p>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
                        We have built across Karen, Kileleshwa, Runda and Syokimau. We know the county building code requirements and can advise on what permits you need before we break ground.
                    </p>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                        Kila jengo tunalolisimamia linatengenezwa kulingana na mahitaji yako — hakuna templates, hakuna mkato. Kila kitu ni cha kipekee.
                    </p>
                </section>

                {/* SERVICES */}
                <section className="bg-[#faf8f5] py-14 sm:py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-8" style={{ color: "#8B5E3C" }}>
                            What We Build in Nairobi
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {SERVICES.map((s, i) => (
                                <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                    <CheckCircle size={20} className="shrink-0 mt-0.5" style={{ color: "#8B5E3C" }} />
                                    <span className="text-gray-700 font-medium text-sm sm:text-base">{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* AREAS SERVED */}
                <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: "#8B5E3C" }}>
                        Areas We Serve in Nairobi
                    </h2>
                    <p className="text-gray-600 mb-6 text-base sm:text-lg">
                        We cover the entire Nairobi metropolitan area, including:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {AREAS.map(area => (
                            <span
                                key={area}
                                className="px-3 py-1.5 rounded-full text-sm font-semibold"
                                style={{ background: "#F5F0EB", color: "#8B5E3C" }}
                            >
                                {area}
                            </span>
                        ))}
                    </div>
                    <p className="text-gray-500 text-sm mt-4">
                        Not on this list? Call us — if it is in Nairobi County, we can get there.
                    </p>
                </section>

                {/* CTA */}
                <section className="py-14 sm:py-16" style={{ background: "#8B5E3C" }}>
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-white">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                            Ready to Build in Nairobi?
                        </h2>
                        <p className="text-white/85 mb-6 text-base sm:text-lg">
                            Tell us your plot size, intended use and budget. We will send you a detailed quote within 2 working days — at no charge.
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
