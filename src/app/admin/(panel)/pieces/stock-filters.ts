import { APPLICATION_TAGS } from "@/lib/application-tags";

/* Shared by the server page and the client sheet, so it lives in
   neutral territory: no "use client", callable from both sides.
   (The server may not call a client module's functions; it may only
   render its components. Production taught this the hard way.) */

export type StockFilters = {
  family?: string;
  low?: string;
  hue?: string;
  app?: string;
  sort?: string;
};

export function makeStockHref(cur: StockFilters, patch: Partial<StockFilters>) {
  const next = { ...cur, ...patch };
  const p = new URLSearchParams();
  if (next.family) p.set("family", next.family);
  if (next.low) p.set("low", "1");
  if (next.hue) p.set("hue", next.hue);
  if (next.app) p.set("app", next.app);
  if (next.sort === "name" || next.sort === "low") p.set("sort", next.sort);
  const s = p.toString();
  return s ? `/admin/pieces?${s}` : "/admin/pieces";
}

/* The three ways a shelf reads: as he arranged it, by name, or with
   the empties shouting first. */
export const SORTS = [
  { key: undefined, label: "Shelf order" },
  { key: "name", label: "By name" },
  { key: "low", label: "Low first" },
] as const;

export const HUES = [
  { key: "blue", dot: "#3aa9d6", label: "Blues" },
  { key: "green", dot: "#4f8a6d", label: "Greens" },
  { key: "earth", dot: "#b0703c", label: "Earth" },
  { key: "neutral", dot: "#b8b2a6", label: "Neutrals" },
];

export const APPLICATION_FILTERS = APPLICATION_TAGS.map((tag) => ({ key: tag, label: tag }));
