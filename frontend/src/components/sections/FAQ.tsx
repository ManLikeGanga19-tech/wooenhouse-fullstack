"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { FAQS } from "@/lib/faq-data"

export default function FAQ() {
    const [open, setOpen] = useState<number | null>(null)

    return (
        <section className="w-full bg-[#faf8f5] py-16 sm:py-20 md:py-24 overflow-hidden">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">

                <div className="text-center mb-10 sm:mb-12" data-aos="fade-down" data-aos-duration="800">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#8B5E3C" }}>
                        Got Questions?
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
