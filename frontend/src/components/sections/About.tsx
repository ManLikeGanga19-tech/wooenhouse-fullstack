"use client"

import Image from "next/image"
import Link from "next/link"
import { Users, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function About() {
    return (
        <section className="w-full max-w-full bg-white py-16 sm:py-20 md:py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 lg:gap-16 items-center">

                {/* LEFT — IMAGE */}
                <div
                    className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] rounded-xl overflow-hidden shadow-lg"
                    data-aos="fade-right"
                    data-aos-duration="1000"
                >
                    <Image
                        src="/about.jpg"
                        alt="About Wooden Houses Kenya"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* RIGHT — TEXT CONTENT */}
                <div className="flex flex-col">

                    <h2
                        className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6"
                        style={{ color: "#8B5E3C" }}
                        data-aos="fade-down"
                        data-aos-duration="800"
                        data-aos-delay="200"
                    >
                        About Us
                    </h2>

                    <p
                        className="text-gray-700 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10"
                        data-aos="fade-up"
                        data-aos-duration="800"
                        data-aos-delay="300"
                    >
                        Wooden Houses Kenya has since 2016 grown and developed into one of the
                        largest provider of specialized wood products within Kenya and boasts
                        of extensive experience in supplying substantial buildings such as
                        residential houses, offices, recreational rooms and classrooms, and
                        has participated in numerous large-scale engineering projects
                        throughout Kenya.
                    </p>

                    {/* STATS */}
                    <div
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-10 mb-8 sm:mb-10"
                        data-aos="fade-up"
                        data-aos-duration="800"
                        data-aos-delay="400"
                    >

                        {/* Happy Clients */}
                        <div
                            className="flex items-center gap-3 sm:gap-4"
                            data-aos="zoom-in"
                            data-aos-duration="600"
                            data-aos-delay="500"
                        >
                            <Users size={36} className="sm:w-[42px] sm:h-[42px]" style={{ color: "#8B5E3C" }} />

                            <div className="flex flex-col">
                                <span
                                    className="text-3xl sm:text-4xl font-extrabold"
                                    style={{ color: "#8B5E3C" }}
                                >
                                    56
                                </span>
                                <p className="text-gray-700 text-base sm:text-lg font-medium">
                                    Happy Clients
                                </p>
                            </div>
                        </div>

                        {/* Projects Done */}
                        <div
                            className="flex items-center gap-3 sm:gap-4"
                            data-aos="zoom-in"
                            data-aos-duration="600"
                            data-aos-delay="600"
                        >
                            <CheckCircle size={36} className="sm:w-[42px] sm:h-[42px]" style={{ color: "#8B5E3C" }} />

                            <div className="flex flex-col">
                                <span
                                    className="text-3xl sm:text-4xl font-extrabold"
                                    style={{ color: "#8B5E3C" }}
                                >
                                    37
                                </span>
                                <p className="text-gray-700 text-base sm:text-lg font-medium">
                                    Projects Done
                                </p>
                            </div>
                        </div>

                    </div>

                    <div
                        data-aos="fade-up"
                        data-aos-duration="800"
                        data-aos-delay="700"
                    >
                        <Button
                            asChild
                            className="inline-flex items-center justify-center w-auto self-start px-5 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg font-semibold rounded-lg shadow-md transition-all duration-300 hover:scale-105"
                            style={{
                                background: "#8B5E3C",
                                color: "white",
                            }}
                        >
                            <Link href="/about">Explore More</Link>
                        </Button>
                    </div>

                </div>

            </div>
        </section>
    )
}