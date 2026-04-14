"use client";

import { useEffect } from "react";
import AOS from "aos";

export default function AosInit() {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 60,
        });
    }, []);

    return null; // It renders nothing, just runs AOS
}
