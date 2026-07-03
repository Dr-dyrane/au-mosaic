import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* Every image is the house's own, served from public/media. No remote
       hosts. The optimizer serves the richest format the browser speaks,
       sized per device and DPR. */
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
};

export default nextConfig;
