/* Shared by the server page and the client sheet, so it lives in
   neutral territory: no "use client", callable from both sides.
   (The server may not call a client module's functions; it may only
   render its components. Production taught this the hard way.) */

export type StockFilters = { family?: string; low?: string; hue?: string };

export function makeStockHref(cur: StockFilters, patch: Partial<StockFilters>) {
  const next = { ...cur, ...patch };
  const p = new URLSearchParams();
  if (next.family) p.set("family", next.family);
  if (next.low) p.set("low", "1");
  if (next.hue) p.set("hue", next.hue);
  const s = p.toString();
  return s ? `/admin/pieces?${s}` : "/admin/pieces";
}

export const HUES = [
  { key: "blue", dot: "#3aa9d6", label: "Blues" },
  { key: "green", dot: "#4f8a6d", label: "Greens" },
  { key: "earth", dot: "#b0703c", label: "Earth" },
  { key: "neutral", dot: "#b8b2a6", label: "Neutrals" },
];
