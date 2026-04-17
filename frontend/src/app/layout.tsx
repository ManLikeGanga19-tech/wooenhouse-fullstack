import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://woodenhouseskenya.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Wooden Houses Kenya — Custom Wooden Houses, Cabins & Structures",
    template: "%s | Wooden Houses Kenya",
  },

  description:
    "Wooden Houses Kenya builds custom wooden houses, off-grid cabins, garden offices, commercial structures, and bespoke furniture across Kenya and East Africa. Based in Naivasha, Kenya. Call +254 716 111 187.",

  keywords: [
    "wooden houses Kenya",
    "custom wooden houses Nairobi",
    "wooden cabins Kenya",
    "eco lodge construction Kenya",
    "wooden house builders Kenya",
    "timber construction Kenya",
    "garden offices Kenya",
    "wooden furniture Kenya",
    "off-grid cabins Kenya",
    "Naivasha wooden houses",
    "wooden cottages Kenya",
    "wooden structures East Africa",
    "bespoke carpentry Kenya",
    "wooden house contractors Kenya",
  ],

  authors: [{ name: "Wooden Houses Kenya", url: BASE_URL }],
  creator: "Wooden Houses Kenya",
  publisher: "Wooden Houses Kenya",

  alternates: { canonical: "/" },

  openGraph: {
    type:        "website",
    locale:      "en_KE",
    url:         BASE_URL,
    siteName:    "Wooden Houses Kenya",
    title:       "Wooden Houses Kenya — Custom Wooden Houses, Cabins & Structures",
    description:
      "Build your dream wooden home in Kenya. Custom houses, off-grid cabins, garden offices, commercial buildings, and furniture. Serving all of Kenya and East Africa.",
    images: [
      {
        url:    "/og-image.jpg",
        width:  1200,
        height: 630,
        alt:    "Wooden Houses Kenya — Custom Wooden Construction in Kenya",
      },
    ],
  },

  twitter: {
    card:        "summary_large_image",
    site:        "@wooden_kenya",
    creator:     "@wooden_kenya",
    title:       "Wooden Houses Kenya — Custom Wooden Houses & Structures",
    description: "Custom wooden houses, cabins, offices and furniture built across Kenya and East Africa.",
    images:      ["/og-image.jpg"],
  },

  robots: {
    index:     true,
    follow:    true,
    googleBot: {
      index:                 true,
      follow:                true,
      "max-video-preview":   -1,
      "max-image-preview":   "large",
      "max-snippet":         -1,
    },
  },

  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  }),

  category: "construction",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-center" closeButton duration={4000} />
      </body>
    </html>
  );
}
