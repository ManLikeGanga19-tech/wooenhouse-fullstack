import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Phone, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
    title:       "Wooden Houses in Naivasha — Holiday Homes, Cabins & Eco Retreats | Wooden Houses Kenya",
    description: "We are based in Naivasha. Build your wooden holiday home, lakeside cabin or eco retreat near Lake Naivasha with Kenya's most experienced wooden house builders. Free quote.",
    alternates:  { canonical: "/naivasha" },
    openGraph: {
        title:       "Wooden Houses in Naivasha — Holiday Homes & Lakeside Cabins",
        description: "Our home base. We build wooden holiday homes, cabins and eco retreats near Lake Naivasha. Talk to us today.",
        url:         "/naivasha",
        images:      [{ url: "/projects/holiday.jpg", width: 1200, height: 630 }],
    },
}

const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type":    ["LocalBusiness", "HomeAndConstructionBusiness"],
    "@id":      "https://woodenhouseskenya.com/#organization",
    name:       "Wooden Houses Kenya — Naivasha",
    description: "Custom wooden holiday homes, lakeside cabins, eco retreats and permanent residences built in Naivasha and the greater Rift Valley region.",
    url:        "https://woodenhouseskenya.com/naivasha",
    telephone:  ["+254716111187", "+254789104438"],
    email:      "info@woodenhouseskenya.com",
    address: {
        "@type":           "PostalAddress",
        addressLocality:   "Naivasha",
        addressRegion:     "Nakuru County",
        addressCountry:    "KE",
    },
    geo: {
        "@type":    "GeoCoordinates",
        latitude:   -0.7167,
        longitude:  36.4278,
    },
    areaServed: { "@type": "City", name: "Naivasha" },
}

const SERVICES = [
    "Lakeside holiday homes and weekend retreats",
    "Eco-lodge cabins and guest cottages",
    "Permanent wooden residences",
    "Farm and ranch structures",
    "Staff quarters and caretaker houses",
    "Garden decking and outdoor entertainment areas",
]

const AREAS = [
    "Lake Naivasha", "Kongoni", "South Lake Road",
    "Kigio", "Elementaita", "Gilgil", "Naivasha Town",
    "Loldia", "Karagita", "Mai Mahiu",
]

export default function NaivashaPage() {
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
                        src="/projects/holiday.jpg"
                        alt="Wooden holiday home near Lake Naivasha Kenya"
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center text-white">
                        <div className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: "#C49A6C" }}>
                            <MapPin size={16} />
                            <span>Naivasha, Nakuru County</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 max-w-2xl leading-tight">
                            Wooden Homes Built in Naivasha
                        </h1>
                        <p className="text-white/85 max-w-xl text-base sm:text-lg mb-6">
                            This is where we are based. We know the land, the soil and the seasons. Nobody builds wooden houses near Lake Naivasha with more experience than us.
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
                        Our Home Ground
                    </h2>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
                        Wooden Houses Kenya has been based in Naivasha since 2016. We have built along the South Lake Road, on farms around Kongoni and Gilgil, and on private estates looking out over the Rift Valley escarpment. The lake, the flamingos, the acacia trees — we know what this landscape demands of a building.
                    </p>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
                        Naivasha is a place where people come to slow down. Holiday homes here should feel like a release from the city. We build structures that sit naturally in the landscape: wide verandas, big windows, natural timber tones that age gracefully in the lakeside air.
                    </p>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                        Tumejengea karibu na Ziwa Naivasha kwa miaka mingi. Tunajua ardhi hii vizuri — na kwa sababu hiyo, tunaweza kukujenga haraka na kwa bei inayofaa.
                    </p>
                </section>

                {/* SERVICES */}
                <section className="bg-[#faf8f5] py-14 sm:py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-8" style={{ color: "#8B5E3C" }}>
                            What We Build Around Naivasha
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
                        Areas We Serve Around Naivasha
                    </h2>
                    <p className="text-gray-600 mb-6 text-base sm:text-lg">
                        We cover all areas in and around Naivasha, including:
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
                </section>

                {/* CTA */}
                <section className="py-14 sm:py-16" style={{ background: "#8B5E3C" }}>
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-white">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                            Building in Naivasha?
                        </h2>
                        <p className="text-white/85 mb-6 text-base sm:text-lg">
                            As the local experts, we can visit your site quickly and turn a quote around in 2 working days. No obligation.
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
