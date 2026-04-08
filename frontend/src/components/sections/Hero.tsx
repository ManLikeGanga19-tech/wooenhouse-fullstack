"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function Hero({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <section className="relative w-full h-[85vh] overflow-hidden select-none max-w-full">

      {/* Background Images */}
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1500 ease-in-out ${index === current ? "opacity-100" : "opacity-0"
            }`}
        >
          <Image
            src={src}
            alt={`Hero image ${index + 1}`}
            fill
            className="object-cover object-center"
            priority={index === 0}
          />
        </div>
      ))}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

      {/* Hero Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6">
        <h1
          className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-xl max-w-5xl"
          data-aos="fade-down"
          data-aos-duration="1000"
          data-aos-delay="200"
        >
          Building Modern Wooden Homes in Kenya
        </h1>

        <p
          className="text-white/90 text-base sm:text-lg md:text-xl mt-4 max-w-2xl drop-shadow-md leading-relaxed px-4"
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-delay="400"
        >
          Sustainable, durable, and beautifully crafted wooden houses designed for African climates.
        </p>

        <a
          href="/contact"
          className="mt-8 inline-block text-white text-base sm:text-lg font-semibold px-8 sm:px-10 py-3 rounded-lg shadow-lg transition-all duration-300 hover:scale-[1.03]"
          style={{ backgroundColor: "#8B5E3C" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#6B4A2C"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#8B5E3C"
          }}
          data-aos="zoom-in"
          data-aos-duration="800"
          data-aos-delay="600"
        >
          Get a Free Quote
        </a>
      </div>

      {/* Slide Indicators */}
      <div
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3"
        data-aos="fade-up"
        data-aos-duration="800"
        data-aos-delay="800"
      >
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 cursor-pointer ${current === index ? "scale-110" : "bg-white/60 hover:bg-white/80"
              }`}
            style={current === index ? { backgroundColor: "#8B5E3C" } : {}}
          />
        ))}
      </div>
    </section>
  )
}