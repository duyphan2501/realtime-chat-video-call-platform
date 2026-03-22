import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
