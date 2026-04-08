import Navbar from "@/components/core/Navbar";
import Footer from "@/components/core/Footer";
import AosInit from "@/components/core/AosInit";
import TawkToChat from "@/components/TawkToChat";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
  name:          "Wooden Houses Kenya",
  alternateName: "Wooden Houses KE",
  description:
    "Wooden Houses Kenya designs and builds custom wooden houses, off-grid cabins, garden offices, commercial structures, and bespoke furniture across Kenya and East Africa.",
  url:   "https://woodenhouseskenya.com",
  logo:  "https://woodenhouseskenya.com/woodenhouse-logo.jpg",
  image: "https://woodenhouseskenya.com/og-image.jpg",
  telephone: ["+254716111187", "+254789104438"],
  email:     "info@woodenhouseskenya.com",
  address: {
    "@type":         "PostalAddress",
    addressLocality: "Naivasha",
    addressRegion:   "Nakuru County",
    addressCountry:  "KE",
  },
  geo: {
    "@type":    "GeoCoordinates",
    latitude:   -0.7167,
    longitude:  36.4278,
  },
  areaServed: [
    { "@type": "Country", name: "Kenya" },
    { "@type": "Country", name: "Uganda" },
    { "@type": "Country", name: "Tanzania" },
  ],
  sameAs: [
    "https://www.facebook.com/mitchiehousing/",
    "https://www.instagram.com/woodenhouseskenya/",
    "https://x.com/wooden_kenya/",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name:    "Wooden Construction Services Kenya",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Custom Wooden Houses",     description: "Fully bespoke wooden homes designed and built to your specifications across Kenya" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Wooden Cabins & Cottages", description: "Off-grid retreats, eco-lodges, and holiday cabins" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Garden Studios & Offices", description: "Insulated home offices and creative studios" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Commercial Buildings",     description: "Wooden commercial structures, meeting rooms, and staff quarters" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Furniture & Carpentry",    description: "Bespoke hardwood furniture, kitchen fittings, and carpentry" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Outdoor Structures",       description: "Garden benches, pergolas, decking, and outdoor wooden structures" } },
    ],
  },
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Structured data for search engines and LLMs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AosInit />
      <Navbar />
      <main className="pt-[120px] bg-white min-h-screen">
        {children}
        <TawkToChat />
      </main>
      <Footer />
    </>
  );
}
