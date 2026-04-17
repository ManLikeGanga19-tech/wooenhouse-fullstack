import type { Metadata } from "next"
import { getHeroImages } from "@/lib/hero-img"
import Hero from "@/components/sections/Hero"
import Steps from "@/components/sections/Steps"
import About from "@/components/sections/About"
import Services from "@/components/sections/Services"
import WhyChooseUs from "@/components/sections/Why"
import Partners from "@/components/sections/Partners"
import Projects from "@/components/sections/Project"
import FAQ, { faqJsonLd } from "@/components/sections/FAQ"

export const metadata: Metadata = {
    title:       "Wooden Houses Kenya — Custom Wooden Houses, Cabins & Offices",
    description: "Wooden Houses Kenya designs and builds custom wooden houses, off-grid cabins, garden offices and commercial structures across Kenya since 2016. Get a free quote today.",
    alternates:  { canonical: "/" },
    openGraph: {
        title:       "Wooden Houses Kenya — Custom Wooden Houses, Cabins & Offices",
        description: "Building custom wooden structures across Kenya since 2016. Houses, cabins, offices and more.",
        url:         "/",
        images:      [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Wooden Houses Kenya" }],
    },
}

export default function Home() {
    const images = getHeroImages()

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            <div className="flex flex-col w-full">
                <Hero images={images} />
                <Steps />
                <About />
                <Partners />
                <Services />
                <WhyChooseUs />
                <Projects />
                <FAQ />
            </div>
        </>
    )
}
