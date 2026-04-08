"use client";

import { useEffect } from "react";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Admin error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-2xl"
                style={{ backgroundColor: "#FEF3C7" }}
            >
                ⚠️
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6 text-sm max-w-sm">
                {error.message || "An unexpected error occurred in the admin panel."}
            </p>
            <button
                onClick={reset}
                className="px-5 py-2.5 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#8B5E3C" }}
            >
                Try Again
            </button>
        </div>
    );
}
