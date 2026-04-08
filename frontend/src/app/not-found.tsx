import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] px-4 text-center">
            <p className="text-7xl font-black" style={{ color: "#8B5E3C" }}>404</p>
            <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-2">Page Not Found</h1>
            <p className="text-gray-500 mb-8 max-w-sm">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link
                href="/"
                className="px-6 py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#8B5E3C" }}
            >
                Back to Home
            </Link>
        </div>
    );
}
