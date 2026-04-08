import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/(admin)/providers";

export const metadata: Metadata = {
  title: {
    default: "Admin | Wooden Houses Kenya",
    template: "%s | WH Admin",
  },
  description: "Admin dashboard for Wooden Houses Kenya",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B5E3C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WH Admin" />
      </head>
      <Providers>
        {children}
        <Toaster />
      </Providers>
    </>
  );
}
