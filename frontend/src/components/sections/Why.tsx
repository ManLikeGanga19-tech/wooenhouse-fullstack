"use client"

import Image from "next/image"
import { ShieldCheck, Brush, MessageSquare, Headset } from "lucide-react"

export default function WhyChooseUs() {
    const features = [
        "Superior Quality",
        "A Green Approach",
        "On-time and On-budget Delivery",
        "Personalized Service",
        "Wide Selection of Models",
    ]

    const gridItems = [
        { title: "Quality Services", icon: <ShieldCheck size={32} style={{ color: "#8B5E3C" }} /> },
        { title: "Creative Designers", icon: <Brush size={32} style={{ color: "#8B5E3C" }} /> },
        { title: "Free Consultation", icon: <MessageSquare size={32} style={{ color: "#8B5E3C" }} /> },
        { title: "Customer Support", icon: <Headset size={32} style={{ color: "#8B5E3C" }} /> },
    ]

    return (
        <section className="w-full max-w-full py-16 sm:py-20 md:py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 lg:gap-16 items-center">

                {/* LEFT — TEXT */}
                <div className="flex flex-col">

                    {/* Header */}
                    <h2
                        className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-left"
                        style={{ color: "#8B5E3C" }}
                        data-aos="fade-right"
                        data-aos-duration="800"
                    >
                        Why Choose Us
                    </h2>

                    {/* Feature list with custom brown bullet points */}
                    <ul className="space-y-2.5 sm:space-y-3 mb-10 sm:mb-12 md:mb-14">
                        {features.map((item, index) => (
                            <li
                                key={index}
                                className="text-gray-700 text-base sm:text-lg font-medium flex items-start gap-3"
                                data-aos="fade-right"
                                data-aos-duration="600"
                                data-aos-delay={index * 100}
                            >
                                {/* BROWN BULLET */}
                                <span
                                    className="mt-2 sm:mt-2.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: "#8B5E3C" }}
                                ></span>

                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>

                    {/* GRID — 4 items */}
                    <div className="grid grid-cols-2 gap-6 sm:gap-8 md:gap-10">
                        {gridItems.map((item, index) => (
                            <div
                                key={index}
                                className="flex flex-col items-center text-center transition-transform duration-300 hover:scale-105"
                                data-aos="zoom-in"
                                data-aos-duration="600"
                                data-aos-delay={500 + index * 100}
                            >

                                <div
                                    className="mb-2 sm:mb-3 transition-transform duration-300 hover:rotate-12"
                                    data-aos="flip-up"
                                    data-aos-duration="800"
                                    data-aos-delay={500 + index * 100}
                                >
                                    {item.icon}
                                </div>

                                <h3
                                    className="text-base sm:text-lg md:text-xl font-semibold"
                                    data-aos="fade-up"
                                    data-aos-duration="600"
                                    data-aos-delay={600 + index * 100}
                                >
                                    {item.title}
                                </h3>

                            </div>
                        ))}
                    </div>

                </div>

                {/* RIGHT — IMAGE */}
                <div
                    className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] rounded-xl overflow-hidden shadow-lg"
                    data-aos="fade-left"
                    data-aos-duration="1000"
                >
                    <Image
                        src="/why.jpg"
                        alt="Why Choose Us - Wooden Houses Kenya"
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-110"
                        priority
                    />
                </div>

            </div>
        </section>
    )
}