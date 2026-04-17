"use client";

export default function ReloadButton() {
    return (
        <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-[#8B5E3C] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#7a5234] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:ring-offset-2"
        >
            Try again
        </button>
    );
}
