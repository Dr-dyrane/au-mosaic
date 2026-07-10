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
  turbopack: {
    /* Depth Anything runs client-side in a worker on WASM or WebGPU.
       The Node-only ORT backend and sharp are never needed in the
       browser, so alias their browser resolution to an empty module.
       Turbopack ignores the webpack externals trick, and it will not
       accept a bare false here, so an empty module is the reliable
       form. Server bundling already externalises both by default. */
    resolveAlias: {
      "onnxruntime-node": { browser: "./src/components/visualizer/empty.ts" },
      sharp: { browser: "./src/components/visualizer/empty.ts" },
    },
  },
};

export default nextConfig;
