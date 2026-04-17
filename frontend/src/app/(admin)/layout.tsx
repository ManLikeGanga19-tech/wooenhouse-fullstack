import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/(admin)/providers";

// viewport-fit=cover lets the app extend under the iPhone notch / home bar
// so we can manually pad with env(safe-area-inset-*) for a true native feel
export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

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
        {/* Capture beforeinstallprompt early — before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__pwaPrompt=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;});`,
          }}
        />
      </head>
      <Providers>
        {children}
        <Toaster />
      </Providers>
    </>
  );
}
