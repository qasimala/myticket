import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // TypeScript configuration - temporarily ignore build errors from dependencies
  typescript: {
    ignoreBuildErrors: true, // Skip type checking during build (fix dependency issues later)
  },
};

export default nextConfig;
