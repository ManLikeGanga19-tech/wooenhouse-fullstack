// src/app/offline/page.tsx
export const metadata = { title: "Offline – Wooden Houses Kenya Admin" };

export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                {/* Simple wifi-off icon via SVG to avoid a Lucide import in a server component */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C49A6C"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="2" y1="2" x2="22" y2="22" />
                    <path d="M8.5 16.5a5 5 0 0 1 7 0" />
                    <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
                    <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
                    <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
                    <path d="M5 13a10 10 0 0 1 5.24-2.76" />
                    <circle cx="12" cy="20" r="1" />
                </svg>
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">You&apos;re offline</h1>
                <p className="max-w-sm text-gray-500">
                    No internet connection. Please check your network and try again.
                </p>
            </div>

            <button
                onClick={() => window.location.reload()}
                className="rounded-md bg-[#8B5E3C] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#7a5234] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:ring-offset-2"
            >
                Try again
            </button>
        </div>
    );
}
