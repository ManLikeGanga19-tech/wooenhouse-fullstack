"use client"
import { Paintbrush, PackageCheck, MessageSquare, Headset, ArrowRight } from "lucide-react"

export default function Steps() {
    const items = [
        {
            number: "01",
            title: "Creative Designers",
            icon: <Paintbrush size={32} style={{ color: "#8B5E3C" }} />,
        },
        {
            number: "02",
            title: "Quality Products",
            icon: <PackageCheck size={32} style={{ color: "#8B5E3C" }} />,
        },
        {
            number: "03",
            title: "Free Consultation",
            icon: <MessageSquare size={32} style={{ color: "#8B5E3C" }} />,
        },
        {
            number: "04",
            title: "Customer Support",
            icon: <Headset size={32} style={{ color: "#8B5E3C" }} />,
        },
    ]

    return (
        <section className="w-full max-w-full bg-white py-12 sm:py-16 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                {/* GRID ON SMALL SCREENS, FLEX ON LARGE */}
                <div className="grid grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:flex lg:flex-row lg:items-center lg:justify-between">

                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 sm:gap-6 justify-center"
                            data-aos="fade-up"
                            data-aos-duration="800"
                            data-aos-delay={index * 150}
                        >

                            {/* Icon + Text */}
                            <div className="flex flex-col items-center text-center">
                                <div
                                    className="transition-transform duration-300 hover:scale-110"
                                    data-aos="zoom-in"
                                    data-aos-duration="600"
                                    data-aos-delay={index * 150 + 100}
                                >
                                    {item.icon}
                                </div>

                                <span
                                    className="font-extrabold text-2xl sm:text-3xl mt-2 sm:mt-3"
                                    style={{ color: "#8B5E3C" }}
                                    data-aos="fade-down"
                                    data-aos-duration="600"
                                    data-aos-delay={index * 150 + 200}
                                >
                                    {item.number}
                                </span>

                                <h3
                                    className="text-base sm:text-lg md:text-xl font-semibold mt-1"
                                    data-aos="fade-up"
                                    data-aos-duration="600"
                                    data-aos-delay={index * 150 + 300}
                                >
                                    {item.title}
                                </h3>
                            </div>

                            {/* Arrow ONLY on desktop & NOT after last item */}
                            {index !== items.length - 1 && (
                                <ArrowRight
                                    size={36}
                                    className="hidden lg:block animate-pulse"
                                    style={{ color: "#8B5E3C" }}
                                    data-aos="fade-left"
                                    data-aos-duration="800"
                                    data-aos-delay={index * 150 + 400}
                                />
                            )}
                        </div>
                    ))}

                </div>
            </div>
        </section>
    )
}