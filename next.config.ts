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
     assets (public/ort) are large and immutable: when a model or the
     runtime is upgraded the whole pair is replaced, so the browser may
     hold them for a year. No isolation headers here: WebGPU needs no
     cross origin isolation, and COOP or COEP would break the Vercel
     Blob piece photos served through next/image. */
  async headers() {
    return [
      {
        source: "/models/sam2/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/ort/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
