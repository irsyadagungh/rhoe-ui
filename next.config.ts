import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: { root: process.cwd() },
};

export default nextConfig;
