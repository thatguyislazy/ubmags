import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: Dev performance on Windows can degrade significantly with Turbopack
  // on slow filesystems. We default to webpack via npm scripts instead.
};

export default nextConfig;
