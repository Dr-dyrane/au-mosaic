import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* The flagship's images are the house's own, served from
       public/media. The back office adds one remote host: the piece
       photographs the owner uploads to Vercel Blob. */
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  experimental: {
    serverActions: {
      /* Phone photographs arrive through server actions. */
      bodySizeLimit: "8mb",
    },
  },
  /* The SAM2 weights (public/models/sam2) and the onnxruntime runtime
     assets (public/ort) are large, so they are cached, but NOT immutable:
     an immutable year-long cache also pins a 404, so a browser that once
     hit a deploy missing one of these files kept failing for a year even
     after the file returned. A day of freshness plus a week of
     stale-while-revalidate keeps them fast and lets a bad response heal.
     No isolation headers here: WebGPU needs no cross origin isolation, and
     COOP or COEP would break the Vercel Blob piece photos through
     next/image. */
  async headers() {
    return [
      {
        source: "/models/sam2/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/ort/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
