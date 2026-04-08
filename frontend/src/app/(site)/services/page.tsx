"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Image from "next/image"
import {
  Home,
  Hammer,
  Paintbrush,
  Ruler,
  ShieldCheck,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  TreePine
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ServicesPage() {
  const mainServices = [
    {
      icon: <Home size={48} style={{ color: "#8B5E3C" }} />,
      title: "Wooden Houses Construction",
      description: "We specialize in crafting high-quality, sustainable wooden houses tailored for East African climates. From initial design to final handover, we deliver homes that blend modern living with natural beauty.",
      features: [
        "Custom architectural designs",
        "Climate-optimized structures",
        "Premium timber selection",
        "Energy-efficient insulation",
        "Fast construction timelines",
        "Turnkey project delivery"
      ],
      image: "/services/house.jpg"
    },
    {
      icon: <Hammer size={48} style={{ color: "#8B5E3C" }} />,
      title: "General Carpentry",
      description: "Our skilled artisans provide top-quality carpentry services, specializing in custom woodwork that transforms spaces. We bring precision, creativity, and durability to every project.",
      features: [
        "Custom furniture design",
        "Kitchen & wardrobe fittings",
        "Wooden flooring & decking",
        "Door & window frames",
        "Outdoor structures",
        "Wood restoration & repair"
      ],
      image: "/services/furniture.jpg"
    }
  ]

  const additionalServices = [
    {
      icon: <Paintbrush size={32} style={{ color: "#8B5E3C" }} />,
      title: "Interior Design Consultation",
      description: "Expert guidance on wooden interior aesthetics and functional layouts."
    },
    {
      icon: <Ruler size={32} style={{ color: "#8B5E3C" }} />,
      title: "Site Assessment & Planning",
      description: "Comprehensive evaluation of your land for optimal house placement."
    },
    {
      icon: <ShieldCheck size={32} style={{ color: "#8B5E3C" }} />,
      title: "Quality Assurance",
      description: "Rigorous quality checks at every construction phase."
    },
    {
      icon: <Clock size={32} style={{ color: "#8B5E3C" }} />,
      title: "Project Management",
      description: "End-to-end coordination ensuring on-time, on-budget delivery."
    },
    {
      icon: <Award size={32} style={{ color: "#8B5E3C" }} />,
      title: "After-Sales Support",
      description: "Ongoing maintenance guidance and warranty coverage."
    },
    {
      icon: <TreePine size={32} style={{ color: "#8B5E3C" }} />,
      title: "Sustainable Sourcing",
      description: "Ethically sourced timber from certified sustainable forests."
    }
  ]



  return (
    <div className="min-h-screen bg-white w-full max-w-full overflow-hidden">

      {/* ======================== PAGE HEADER ======================== */}
      <div className="relative w-full py-8 sm:py-12 border-b border-gray-200 overflow-hidden">
        <Image
          src="/services/service1.jpg"
          alt="Services Background"
          fill
          className="object-cover object-center"
          priority
        />

        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
            style={{ color: "#C49A6C" }}
            data-aos="fade-down"
          >
            Our Services
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
                  href="/services"
                  className="text-[#C49A6C] font-medium"
                >
                  Services
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ======================== PAGE CONTENT ======================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">

        {/* INTRO */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20" data-aos="fade-up">
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
            At Wooden Houses Kenya, we deliver comprehensive construction and carpentry solutions
            that combine traditional craftsmanship with modern innovation. Our expertise spans
            residential construction, custom woodwork, and sustainable building practices.
          </p>
        </div>

        {/* ======================== MAIN SERVICES ======================== */}
        {mainServices.map((service, index) => (
          <section
            key={index}
            className={`mb-20 sm:mb-24 md:mb-28 grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center ${index % 2 === 1 ? 'md:grid-flow-dense' : ''
              }`}
          >
            {/* Image */}
            <div
              className={`relative w-full h-[300px] sm:h-[350px] md:h-[400px] rounded-2xl overflow-hidden shadow-xl ${index % 2 === 1 ? 'md:col-start-2' : ''
                }`}
              data-aos={index % 2 === 0 ? "fade-right" : "fade-left"}
              data-aos-duration="1000"
            >
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>

            {/* Content */}
            <div
              className={index % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}
              data-aos={index % 2 === 0 ? "fade-left" : "fade-right"}
              data-aos-duration="1000"
            >
              <div className="mb-6" data-aos="zoom-in" data-aos-delay="200">
                {service.icon}
              </div>

              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6"
                style={{ color: "#8B5E3C" }}
                data-aos="fade-up"
                data-aos-delay="300"
              >
                {service.title}
              </h2>

              <p
                className="text-gray-700 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8"
                data-aos="fade-up"
                data-aos-delay="400"
              >
                {service.description}
              </p>

              {/* Features Grid */}
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {service.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 sm:gap-3"
                    data-aos="fade-right"
                    data-aos-delay={500 + i * 50}
                  >
                    <CheckCircle2
                      size={20}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: "#8B5E3C" }}
                    />
                    <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                className="group inline-flex items-center gap-2 px-6 py-3 text-base sm:text-lg font-semibold rounded-lg shadow-md transition-all duration-300 hover:scale-105"
                style={{ background: "#8B5E3C", color: "white" }}
                data-aos="fade-up"
                data-aos-delay="800"
              >
                <Link href="/contact">
                  Request Quote
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </section>
        ))}

        {/* ======================== ADDITIONAL SERVICES ======================== */}
        <section className="mb-20 sm:mb-24">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-10 sm:mb-12 text-center"
            style={{ color: "#8B5E3C" }}
            data-aos="fade-up"
          >
            Additional Services
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {additionalServices.map((service, index) => (
              <div
                key={index}
                className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="mb-4" data-aos="zoom-in" data-aos-delay={index * 100 + 100}>
                  {service.icon}
                </div>
                <h3
                  className="text-xl sm:text-2xl font-bold mb-3"
                  style={{ color: "#8B5E3C" }}
                >
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {service.description}
                </p>
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