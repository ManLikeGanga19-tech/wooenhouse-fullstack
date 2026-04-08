"use client";

import Image from "next/image";

/**
 * Partners / Brands we've worked with — infinite marquee slider.
 */

const PARTNERS: { name: string; logo: string }[] = [
  { name: "Masai Mara Wildlife Conservancies Association", logo: "/partners/masaimara.jpg" },
  { name: "Sirikoi Lodge", logo: "/partners/sirikoi.jpg" },
  { name: "Mpala Research Center | Nanyuki", logo: "/partners/mpala.jpg" },
  { name: "Majani Mingi Sisal Estate Limited", logo: "/partners/majani.jpg" },
  { name: "Hsc Systems Limited", logo: "/partners/hsc.jpg" },
];

export default function Partners() {
  return (
    <section className="py-12 sm:py-14 bg-[#faf8f5] border-y border-gray-200 overflow-hidden">

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] mb-1">
          Trusted by
        </p>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
          Our Partners &amp; Brands
        </h2>
      </div>

      {/* Marquee */}
      <div
        className="relative"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
      >
        <div className="marquee-track">
          {[...PARTNERS, ...PARTNERS].map((p, i) => (
            <div
              key={i}
              className="relative mx-3 sm:mx-4 md:mx-6 flex items-center justify-center shrink-0 w-[120px] h-[70px] sm:w-[140px] sm:h-[80px] md:w-[180px] md:h-[100px]"
            >
              <Image
                src={p.logo}
                alt={p.name}
                fill
                sizes="(max-width: 640px) 120px, (max-width: 768px) 140px, 180px"
                className="object-contain transition-all duration-300 opacity-90 hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}