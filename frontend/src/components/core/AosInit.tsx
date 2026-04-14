"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AOS from "aos";

export default function AosInit() {
    const pathname = usePathname();

    useEffect(() => {
        // Re-initialise on every client-side navigation so newly rendered
        // [data-aos] elements on each page are properly observed.
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 60,
        });

        // Wait one animation frame so the DOM has fully committed the new
        // page's elements before AOS scans and observes them.
        const raf = requestAnimationFrame(() => AOS.refreshHard());
        return () => cancelAnimationFrame(raf);
    }, [pathname]); // ← runs on every page change, not just mount

    return null;
}
