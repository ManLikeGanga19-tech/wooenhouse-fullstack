"use client"
import Image from "next/image"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white w-full">

            {/* ======================== PAGE HEADER ======================== */}
            <div className="relative w-full py-8 sm:py-12 border-b border-gray-200 overflow-hidden">

                <Image
                    src="/about/about.jpg"
                    alt="About Background"
                    fill
                    className="object-cover object-center"
                    priority
                />

                <div className="absolute inset-0 bg-black/40" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
                    <h1
                        className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
                        style={{ color: "#C49A6C" }}
                    >
                        About Us
                    </h1>

                    <Breadcrumb>
                        <BreadcrumbList className="text-white/90 text-sm sm:text-base">
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/" className="hover:text-[#C49A6C] transition">
                                    Home
                                </BreadcrumbLink>
                            </BreadcrumbItem>

                            <BreadcrumbSeparator className="text-white/90" />

                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    href="/about"
                                    className="text-[#C49A6C] font-medium"
                                >
                                    About Us
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            {/* ======================== PAGE CONTENT ======================== */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">

                {/* INTRO PARAGRAPH */}
                <p
                    data-aos="fade-up"
                    className="text-gray-700 text-base sm:text-lg leading-relaxed max-w-3xl mb-12 sm:mb-16"
                >
                    Welcome to Wooden Houses Kenya. We specialize in crafting sustainable,
                    beautiful, and long-lasting wooden structures tailored for East African
                    climates. We are committed to delivering modern living solutions that
                    blend nature, durability, and comfort at an affordable cost.
                </p>

                {/* ======================== WHO WE ARE ======================== */}
                <section className="mb-16 sm:mb-20 md:mb-24 grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
                    <div data-aos="fade-right">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6" style={{ color: "#8B5E3C" }}>
                            Who We Are
                        </h2>

                        <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                            Wooden Houses Kenya is a construction company dedicated to providing
                            modern wooden homes that combine sustainability, efficiency, and
                            long-term durability. Our designs are engineered to perform in
                            African climates, offering natural insulation, structural strength,
                            and timeless beauty.
                        </p>
                    </div>

                    <Image
                        data-aos="fade-left"
                        src="/about/about-1.jpg"
                        width={700}
                        height={500}
                        alt="Who We Are"
                        className="rounded-xl shadow-lg w-full h-auto"
                    />
                </section>

                {/* ======================== OUR STORY ======================== */}
                <section className="mb-16 sm:mb-20 md:mb-24" data-aos="fade-up">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6" style={{ color: "#8B5E3C" }}>
                        Our Story
                    </h2>

                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed max-w-4xl">
                        Our journey began with a vision to revolutionize Kenya's housing industry
                        by introducing high-quality wooden homes that are both environmentally
                        responsible and structurally superior. Over the years, we have grown into
                        a trusted name, delivering premium wooden structures to families,
                        developers, and businesses across Kenya and East Africa.
                    </p>
                </section>

                {/* ======================== MISSION & VISION ======================== */}
                <section className="mb-16 sm:mb-20 md:mb-24 grid md:grid-cols-2 gap-8 sm:gap-12">
                    <div
                        data-aos="fade-right"
                        className="bg-gray-50 p-6 sm:p-8 md:p-10 rounded-2xl shadow-md border border-gray-200"
                    >
                        <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: "#C49A6C" }}>
                            Our Mission
                        </h3>
                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                            To provide sustainable, innovative, and durable wooden homes that enhance
                            modern living while protecting the environment.
                        </p>
                    </div>

                    <div
                        data-aos="fade-left"
                        className="bg-gray-50 p-6 sm:p-8 md:p-10 rounded-2xl shadow-md border border-gray-200"
                    >
                        <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: "#C49A6C" }}>
                            Our Vision
                        </h3>
                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                            To be Africa's leading provider of modern wooden construction solutions,
                            redefining housing with eco-friendly, affordable, and long-lasting homes.
                        </p>
                    </div>
                </section>

                {/* ======================== CORE VALUES ======================== */}
                <section className="mb-16 sm:mb-20 md:mb-24">
                    <h2
                        data-aos="fade-up"
                        className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-10"
                        style={{ color: "#8B5E3C" }}
                    >
                        Our Core Values
                    </h2>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
                        {[
                            { title: "Sustainability", desc: "Environmentally conscious materials & construction." },
                            { title: "Craftsmanship", desc: "Attention to detail and high-end finishing." },
                            { title: "Integrity", desc: "Honest pricing, transparency, and reliability." },
                            { title: "Innovation", desc: "Modern designs tailored to East African needs." },
                            { title: "Durability", desc: "Homes built to last and withstand all climates." },
                            { title: "Customer Focus", desc: "We prioritize client needs from start to finish." },
                        ].map((item, i) => (
                            <div
                                key={item.title}
                                data-aos="fade-up"
                                data-aos-delay={i * 120}
                                className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100"
                            >
                                <h4 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3" style={{ color: "#C49A6C" }}>
                                    {item.title}
                                </h4>
                                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ======================== WHY CHOOSE US ======================== */}
                <section className="mb-16 sm:mb-20 md:mb-24">
                    <h2
                        data-aos="fade-up"
                        className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-10"
                        style={{ color: "#8B5E3C" }}
                    >
                        Why Choose Wooden Houses Kenya?
                    </h2>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
                        {[
                            "Affordable & Fast Construction",
                            "Eco-Friendly Materials",
                            "Natural Temperature Insulation",
                            "Strong, Durable Timber Structures",
                            "Custom Designs for Every Budget",
                            "Experienced & Skilled Team",
                        ].map((text, i) => (
                            <div
                                key={i}
                                data-aos="fade-up"
                                data-aos-delay={i * 120}
                                className="p-6 sm:p-8 bg-gray-50 rounded-xl shadow-md border border-gray-100"
                            >
                                <p className="text-gray-700 text-sm sm:text-base font-medium">{text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ======================== PROCESS SECTION ======================== */}
                <section className="mb-16 sm:mb-20 md:mb-24">
                    <h2
                        className="text-2xl sm:text-3xl font-bold mb-12 sm:mb-16 text-center"
                        style={{ color: "#8B5E3C" }}
                        data-aos="fade-up"
                    >
                        Our Process
                    </h2>

                    <div className="relative space-y-16 sm:space-y-20 md:space-y-28">

                        {/* Vertical Line */}
                        <div className="hidden md:block absolute left-1/2 top-0 w-1 bg-[#E5D5C5] h-full -translate-x-1/2"></div>

                        {[
                            {
                                title: "Consultation & Planning",
                                desc: "We begin with an in-depth discussion to understand your requirements, design preferences, and land details.",
                            },
                            {
                                title: "Design & Customization",
                                desc: "Our architects transform your ideas into visual 3D plans, ensuring practicality and beauty.",
                            },
                            {
                                title: "Construction & Assembly",
                                desc: "Crafted with precision, your structure begins to take shape using durable climate-ready materials.",
                            },
                            {
                                title: "Finishing & Handover",
                                desc: "Once completed, we refine every detail and hand over your dream wooden home ready for living.",
                            },
                        ].map((step, i) => (
                            <div
                                key={i}
                                className={`flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-10 ${i % 2 === 1 ? "md:flex-row-reverse" : ""
                                    }`}
                                data-aos={
                                    i % 2 === 0 ? "fade-right" : "fade-left"
                                }
                            >
                                {/* NUMBER */}
                                <div className="md:w-1/2 flex justify-center">
                                    <div className="
                                        h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 rounded-full border-4 border-[#8B5E3C]
                                        flex items-center justify-center text-3xl sm:text-4xl font-bold text-[#8B5E3C]
                                        shadow-md bg-white
                                        animate-pulse
                                    ">
                                        {i + 1}
                                    </div>
                                </div>

                                {/* CONTENT CARD */}
                                <div className="md:w-1/2 bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow-lg border border-gray-100 w-full">
                                    <h3 className="text-xl sm:text-2xl font-semibold text-[#8B5E3C] mb-2 sm:mb-3">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ======================== CTA SECTION ======================== */}
                <div data-aos="fade-up" className="text-center py-16 sm:py-20">
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6" style={{ color: "#8B5E3C" }}>
                        Ready to Start Your Project?
                    </h3>
                    <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10">
                        Contact us today for a free consultation and discover how we can bring
                        your wooden construction vision to life.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
                        <Button
                            asChild
                            size="lg"
                            className="px-8 py-6 text-base sm:text-lg font-semibold shadow-lg hover:scale-105 transition-all"
                            style={{ background: "#8B5E3C", color: "white" }}
                        >
                            <Link href="/contact">Get Free Quote</Link>
                        </Button>

                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="px-8 py-6 text-base sm:text-lg font-semibold border-2 hover:scale-105 transition-all"
                            style={{ borderColor: "#8B5E3C", color: "#8B5E3C" }}
                        >
                            <Link href="/projects">View Our Work</Link>
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}