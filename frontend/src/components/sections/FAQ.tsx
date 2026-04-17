"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const FAQS = [
    {
        q: "How much does a wooden house cost in Kenya?",
        a: "The cost depends on size, design and finishes. A basic one-bedroom structure of around 40 square metres starts from KES 900,000. Larger family homes of 80 to 120 square metres range from KES 1,800,000 to KES 3,500,000. We provide free, site-specific quotes — contact us with your location and requirements.",
    },
    {
        q: "How long does it take to build a wooden house in Kenya?",
        a: "Most of our projects are completed in 4 to 9 weeks from ground-breaking to handover. Smaller cabins and garden offices can be done in 2 to 3 weeks. This is significantly faster than brick and mortar construction, which typically takes 7 to 12 months for a comparable structure.",
    },
    {
        q: "Are wooden houses durable in Kenya's climate?",
        a: "Yes. We use pressure-treated, kiln-dried timber that resists termites, moisture and UV damage. Our structures are designed for Kenya's varied conditions — from the cool highlands of Nanyuki to Naivasha's lakeside humidity. With routine maintenance every 5 to 7 years, a well-built wooden house lasts 40 to 60 years.",
    },
    {
        q: "Do you build wooden houses outside Nairobi?",
        a: "We build across the whole country. Completed projects include Naivasha, Nanyuki, Laikipia, Taita Taveta, Karen and many other locations. We handle all logistics including material transport to remote sites. Tell us your location and we will build a quote around it.",
    },
    {
        q: "How do wooden houses compare to brick houses in Kenya?",
        a: "Wooden houses are faster to build, naturally better insulated for temperature control, and generally more affordable per square metre. Brick houses can carry higher resale value in dense urban markets. For holiday homes, eco-lodges, staff quarters, garden offices and rural properties, timber construction is usually the stronger choice.",
    },
    {
        q: "Do you offer a warranty on your structures?",
        a: "Yes. We provide a structural warranty on all completed builds and stand behind the quality of our work. We have been building wooden structures since 2016. We also offer maintenance packages and remain available for post-construction support.",
    },
]

export const faqJsonLd = {
    "@context": "https://schema.org",
    "@type":    "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
        "@type":          "Question",
        name:             q,
        acceptedAnswer:   { "@type": "Answer", text: a },
    })),
}

export default function FAQ() {
    const [open, setOpen] = useState<number | null>(null)

    return (
        <section className="w-full bg-[#faf8f5] py-16 sm:py-20 md:py-24 overflow-hidden">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">

                <div className="text-center mb-10 sm:mb-12" data-aos="fade-down" data-aos-duration="800">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#8B5E3C" }}>
                        Maswali ya Kawaida
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "#8B5E3C" }}>
                        Frequently Asked Questions
                    </h2>
                    <p className="mt-3 text-gray-600 text-base sm:text-lg">
                        Everything you need to know before you build.
                    </p>
                </div>

                <div className="space-y-3">
                    {FAQS.map((faq, i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm"
                            data-aos="fade-up"
                            data-aos-duration="600"
                            data-aos-delay={i * 60}
                        >
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                                aria-expanded={open === i}
                            >
                                <span className="text-sm sm:text-base">{faq.q}</span>
                                <ChevronDown
                                    size={18}
                                    className={cn(
                                        "shrink-0 transition-transform duration-300",
                                        open === i ? "rotate-180" : ""
                                    )}
                                    style={{ color: "#8B5E3C" }}
                                />
                            </button>

                            <div
                                className={cn(
                                    "overflow-hidden transition-all duration-300",
                                    open === i ? "max-h-96" : "max-h-0"
                                )}
                            >
                                <p className="px-5 pb-5 text-gray-600 text-sm sm:text-base leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}
