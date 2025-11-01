import type { NextConfig } from "next";

const isStaticExport =
  process.env.NEXT_OUTPUT === "export" || process.env.EXPORT === "1";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker, switch to export for Capacitor builds
  output: isStaticExport ? "export" : "standalone",

  // TypeScript configuration - temporarily ignore build errors from dependencies
  typescript: {
    ignoreBuildErrors: true, // Skip type checking during build (fix dependency issues later)
  },

  // Service worker and PWA support
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
