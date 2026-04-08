"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function Projects() {
    // FILTER CATEGORIES
    const categories = [
        "All",
        "Wooden Houses Construction",
        "General Carpentry",
    ]

    // PROJECT DATA
    const projects = [
        { title: "Off-the-grid cottage in Nanyuki", category: "Wooden Houses Construction", image: "/projects/off-nanyuki.jpg" },
        { title: "Kitchen Fittings", category: "General Carpentry", image: "/projects/kitchen.jpg" },
        { title: "Holiday Home, Naivasha", category: "Wooden Houses Construction", image: "/projects/holiday.jpg" },
        { title: "Foldable Chairs", category: "General Carpentry", image: "/projects/fold-chair.jpg" },
        { title: "Staff Meeting Room, Taita", category: "Wooden Houses Construction", image: "/projects/staff.jpg" },
        { title: "Garden Benches", category: "General Carpentry", image: "/projects/garden.jpg" },
    ]

    const [activeCategory, setActiveCategory] = useState("All")

    // FILTERED RESULTS
    const filtered =
        activeCategory === "All"
            ? projects
            : projects.filter((p) => p.category === activeCategory)

    return (
        <section className="w-full max-w-full bg-white py-16 sm:py-20 md:py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                {/* TITLE */}
                <h2
                    className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-10 text-left lg:text-center"
                    style={{ color: "#8B5E3C" }}
                    data-aos="fade-down"
                    data-aos-duration="800"
                >
                    Our Projects
                </h2>

                {/* FILTER BUTTONS — SHADCN BUTTON */}
                <div
                    className="flex flex-wrap items-center gap-3 sm:gap-4 mb-10 sm:mb-12 justify-start lg:justify-center"
                    data-aos="fade-up"
                    data-aos-duration="800"
                    data-aos-delay="200"
                >
                    {categories.map((cat, index) => (
                        <Button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            variant="outline"
                            className="px-4 sm:px-6 py-2 text-sm sm:text-base md:text-lg font-semibold border transition-all hover:scale-105"
                            style={{
                                background: activeCategory === cat ? "#8B5E3C" : "white",
                                color: activeCategory === cat ? "white" : "#8B5E3C",
                                borderColor: "#8B5E3C",
                            }}
                            data-aos="zoom-in"
                            data-aos-duration="600"
                            data-aos-delay={300 + index * 100}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                {/* PROJECT GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
                    {filtered.map((project, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                            data-aos="fade-up"
                            data-aos-duration="800"
                            data-aos-delay={index * 100}
                        >
                            {/* IMAGE */}
                            <div
                                className="relative w-full h-[200px] sm:h-[220px] md:h-[230px] overflow-hidden"
                                data-aos="zoom-in"
                                data-aos-duration="1000"
                                data-aos-delay={index * 100 + 100}
                            >
                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    className="object-cover transition-transform duration-500 hover:scale-110"
                                />
                            </div>

                            {/* CONTENT */}
                            <div className="p-4 sm:p-5">
                                <h4
                                    className="font-semibold text-xs sm:text-sm mb-2"
                                    style={{ color: "#8B5E3C" }}
                                    data-aos="fade-right"
                                    data-aos-duration="600"
                                    data-aos-delay={index * 100 + 200}
                                >
                                    {project.category}
                                </h4>

                                <h3
                                    className="text-lg sm:text-xl font-bold text-gray-800"
                                    data-aos="fade-up"
                                    data-aos-duration="600"
                                    data-aos-delay={index * 100 + 300}
                                >
                                    {project.title}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}