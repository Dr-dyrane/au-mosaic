import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getPieces, getProjects } from "@/lib/catalog";
import { GUIDES } from "@/lib/journal";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const PIECES = await getPieces();
  const PROJECTS = await getProjects();
  const base = SITE.url.replace(/\/$/, "");
  const pages = ["/", "/mosaic-tiles", "/pool-materials", "/pools", "/projects", "/visualizer", "/about", "/contact", "/journal"];
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
    ...PROJECTS.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...GUIDES.map((g) => ({
      url: `${base}/journal/${g.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
