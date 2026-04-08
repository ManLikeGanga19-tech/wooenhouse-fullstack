"use client"

import Image from "next/image"
import { ArrowRightCircle } from "lucide-react"

export default function Services() {
    const services = [
        {
            title: "Wooden Houses Construction",
            description:
                "At Wooden Houses Kenya, we specialize in crafting high-quality, sustainable wooden houses that...",
            image: "/services/house.jpg",
            link: "/services",
        },
        {
            title: "General Carpentry",
            description:
                "We provide top-quality carpentry services, specializing in custom woodwork that...",
            image: "/services/furniture.jpg",
            link: "/services",
        },
    ]

    return (
        <section className="w-full max-w-full py-16 sm:py-20 md:py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                <h2
                    className="text-3xl sm:text-4xl font-bold mb-10 sm:mb-12 text-left lg:text-center"
                    style={{ color: "#8B5E3C" }}
                    data-aos="fade-down"
                    data-aos-duration="800"
                >
                    Our Services
                </h2>


                {/* Cards Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                            data-aos="fade-up"
                            data-aos-duration="800"
                            data-aos-delay={index * 200}
                        >
                            {/* IMAGE */}
                            <div
                                className="relative w-full h-[220px] sm:h-[260px] md:h-[280px] overflow-hidden"
                                data-aos="zoom-in"
                                data-aos-duration="1000"
                                data-aos-delay={index * 200 + 100}
                            >
                                <Image
                                    src={service.image}
                                    alt={service.title}
                                    fill
                                    className="object-cover transition-transform duration-500 hover:scale-110"
                                />
                            </div>

                            {/* TEXT CONTENT */}
                            <div className="p-5 sm:p-6">
                                <h3
                                    className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4"
                                    style={{ color: "#8B5E3C" }}
                                    data-aos="fade-right"
                                    data-aos-duration="600"
                                    data-aos-delay={index * 200 + 200}
                                >
                                    {service.title}
                                </h3>

                                <p
                                    className="text-gray-600 text-base sm:text-lg leading-relaxed mb-5 sm:mb-6"
                                    data-aos="fade-up"
                                    data-aos-duration="600"
                                    data-aos-delay={index * 200 + 300}
                                >
                                    {service.description}
                                </p>

                                {/* READ MORE */}
                                <a
                                    href={service.link}
                                    className="inline-flex items-center gap-2 font-semibold text-base sm:text-lg transition-all hover:gap-3 group"
                                    style={{ color: "#8B5E3C" }}
                                    data-aos="fade-left"
                                    data-aos-duration="600"
                                    data-aos-delay={index * 200 + 400}
                                >
                                    Read More
                                    <ArrowRightCircle
                                        size={20}
                                        className="sm:w-[22px] sm:h-[22px] transition-transform group-hover:translate-x-1"
                                        style={{ color: "#8B5E3C" }}
                                    />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}