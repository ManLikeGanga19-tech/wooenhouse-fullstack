import type { Metadata } from "next"
import ContactClient from "./ContactClient"

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Get in touch with Wooden Houses Kenya for a free consultation and quote. Call +254 716 111 187, email info@woodenhouseskenya.com, or fill in our contact form — we reply within 24 hours.",
    alternates: { canonical: "/contact" },
    openGraph: {
        title: "Contact Wooden Houses Kenya | Free Consultation & Quote",
        description: "Ready to start your wooden construction project? Contact our team in Naivasha, Kenya for a free consultation, site assessment, and detailed quote within 48 hours.",
        url: "https://woodenhouseskenya.com/contact",
        images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Contact Wooden Houses Kenya" }],
    },
    twitter: {
        title: "Contact Wooden Houses Kenya | Free Quote",
        description: "Call +254 716 111 187 or fill in our form — free consultation and quote within 48 hours.",
        images: ["/og-image.jpg"],
    },
}

export default function ContactPage() {
    return <ContactClient />
}
