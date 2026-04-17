"use client";

import { useState, useEffect, useRef } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstallPWA() {
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const deferredPrompt = useRef<Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);

    useEffect(() => {
        // Don't show if already running as installed PWA
        if (window.matchMedia("(display-mode: standalone)").matches) return;
        // Don't show if user has already dismissed
        if (sessionStorage.getItem("pwa-banner-dismissed")) return;

        // iOS detection — Safari on iPhone/iPad doesn't fire beforeinstallprompt
        const ua = navigator.userAgent;
        const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
        if (isIOSDevice) {
            setIsIOS(true);
            setShowBanner(true);
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            deferredPrompt.current = e as typeof deferredPrompt.current;
            setShowBanner(true);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt.current) return;
        await deferredPrompt.current.prompt();
        const { outcome } = await deferredPrompt.current.userChoice;
        if (outcome === "accepted") {
            setShowBanner(false);
        }
        deferredPrompt.current = null;
    };

    const handleDismiss = () => {
        sessionStorage.setItem("pwa-banner-dismissed", "1");
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-900">
            {isIOS ? (
                <>
                    <Share size={15} className="shrink-0 text-amber-600" />
                    <span className="hidden lg:inline">
                        Install: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
                    </span>
                    <span className="lg:hidden">Tap Share → Add to Home Screen</span>
                </>
            ) : (
                <>
                    <Download size={15} className="shrink-0 text-amber-600" />
                    <span className="hidden sm:inline">Install app</span>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-6 border-amber-400 px-2 py-0 text-xs hover:bg-amber-100"
                        onClick={handleInstall}
                    >
                        Install
                    </Button>
                </>
            )}
            <button
                onClick={handleDismiss}
                aria-label="Dismiss install banner"
                className="ml-1 rounded p-0.5 hover:bg-amber-200"
            >
                <X size={13} />
            </button>
        </div>
    );
}
