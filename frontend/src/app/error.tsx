"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to console in dev; swap for a logging service in production
        console.error("Global error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] px-4 text-center">
            <p className="text-5xl mb-4">⚠️</p>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-8 max-w-sm">
                An unexpected error occurred. Please try again.
            </p>
            <button
                onClick={reset}
                className="px-6 py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#8B5E3C" }}
            >
                Try Again
            </button>
        </div>
    );
}
