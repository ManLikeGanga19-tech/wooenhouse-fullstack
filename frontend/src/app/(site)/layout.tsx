import Navbar from "@/components/core/Navbar";
import Footer from "@/components/core/Footer";
import AosInit from "@/components/core/AosInit";
import CookieBanner from "@/components/core/CookieBanner";
import TawkToChat from "@/components/TawkToChat";
import RecaptchaProvider from "@/components/core/RecaptchaProvider";
import { getCookieConsent } from "@/actions/cookies";

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
  "@id": "https://woodenhouseskenya.com/#organization",
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
  openingHoursSpecification: [
    {
      "@type":     "OpeningHoursSpecification",
      dayOfWeek:   ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens:       "08:00",
      closes:      "18:00",
    },
    {
      "@type":     "OpeningHoursSpecification",
      dayOfWeek:   ["Saturday"],
      opens:       "09:00",
      closes:      "16:00",
    },
  ],
  contactPoint: [
    {
      "@type":        "ContactPoint",
      telephone:      "+254716111187",
      contactType:    "customer service",
      availableLanguage: ["English", "Swahili"],
      areaServed:     "KE",
    },
    {
      "@type":        "ContactPoint",
      email:          "info@woodenhouseskenya.com",
      contactType:    "customer service",
      availableLanguage: ["English", "Swahili"],
    },
  ],
  areaServed: [
    { "@type": "Country", name: "Kenya" },
    { "@type": "Country", name: "Uganda" },
    { "@type": "Country", name: "Tanzania" },
  ],
  sameAs: [
    "https://www.facebook.com/mitchiehousing/",
    "https://www.instagram.com/woodenhouseskenya/",
    "https://x.com/wooden_kenya/",
    "https://www.youtube.com/@WoodenHouseKenya",
    "https://wa.me/254789104438",
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

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type":    "WebSite",
  "@id":      "https://woodenhouseskenya.com/#website",
  url:        "https://woodenhouseskenya.com",
  name:       "Wooden Houses Kenya",
  description: "Custom wooden houses, cabins, offices and furniture built across Kenya and East Africa.",
  publisher: { "@id": "https://woodenhouseskenya.com/#organization" },
  potentialAction: {
    "@type":       "SearchAction",
    target:        "https://woodenhouseskenya.com/projects?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const consent = await getCookieConsent();
  const showBanner = consent === null;

  return (
    <RecaptchaProvider>
      {/* Structured data — LocalBusiness + WebSite schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <AosInit />
      <Navbar />
      <main className="pt-[120px] bg-white min-h-screen">
        {children}
        <TawkToChat />
      </main>
      <Footer />
      {showBanner && <CookieBanner />}
    </RecaptchaProvider>
  );
}
