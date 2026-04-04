import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
