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
};

export default nextConfig;
