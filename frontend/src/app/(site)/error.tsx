"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SiteError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Site error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] px-4 text-center">
            <p className="text-7xl font-black" style={{ color: "#8B5E3C" }}>Oops</p>
            <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-8 max-w-sm">
                We hit an unexpected error. You can try again or go back to the homepage.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="px-5 py-2.5 rounded-lg border-2 border-gray-300 font-semibold text-gray-700 hover:border-gray-400 transition-colors"
                >
                    Try Again
                </button>
                <Link
                    href="/"
                    className="px-5 py-2.5 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#8B5E3C" }}
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}
