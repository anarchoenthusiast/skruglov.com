import type { NextConfig } from "next";

const blockSearchIndexing = process.env.BLOCK_SEARCH_INDEXING === "true";

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    qualities: [75, 90, 95],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2048, 2560, 2880, 3840],
    imageSizes: [256, 384, 512, 640, 750, 828, 1080, 1200, 1440, 1920, 2560, 3840],
  },
  async headers() {
    if (!blockSearchIndexing) {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
