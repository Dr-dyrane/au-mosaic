import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getPieces } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const PIECES = await getPieces();
  const base = SITE.url.replace(/\/$/, "");
  const pages = ["/", "/mosaic-tiles", "/pool-materials", "/pools", "/about", "/contact"];
  return [
    ...pages.map((p) => ({
      url: p === "/" ? `${base}/` : `${base}${p}`,
      changeFrequency: "monthly" as const,
      priority: p === "/" ? 1 : 0.7,
    })),
    ...PIECES.map((p) => ({
      url: `${base}/piece/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
