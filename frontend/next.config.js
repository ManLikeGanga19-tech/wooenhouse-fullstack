const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {},

  images: {
    remotePatterns: [
      // Backend-served uploads (project images uploaded via admin panel)
      { protocol: "https", hostname: "api.woodenhouseskenya.com" },
      { protocol: "https", hostname: "*.woodenhouseskenya.com" },
      // Local dev
      { protocol: "http", hostname: "localhost" },
    ],
  },

  async headers() {
    return [
      {
        // Allow the frontend site to call the backend API
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: process.env.NEXT_PUBLIC_SITE_URL || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
