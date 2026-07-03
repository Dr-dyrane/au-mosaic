/* One theme store, two axes. Mode (night or day) drives media and
   scenes; palette (which house) drives the tokens. The toggle and the
   picker write, everything that cares subscribes. */

let listeners: Array<() => void> = [];

export const subscribeTheme = (fn: () => void) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
};

export const getIsLight = () =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "light";

export const notifyTheme = () => listeners.forEach((l) => l());

export const PALETTES = ["maison", "lagoon", "terracotta", "onyx"] as const;
export type Palette = (typeof PALETTES)[number];

export const getPalette = (): Palette => {
  if (typeof document === "undefined") return "maison";
  const p = document.documentElement.dataset.palette as Palette | undefined;
  return p && PALETTES.includes(p) ? p : "maison";
};

export const setPalette = (p: Palette) => {
  if (p === "maison") delete document.documentElement.dataset.palette;
  else document.documentElement.dataset.palette = p;
  try { localStorage.setItem("aumosaic.palette", p); } catch {}
  notifyTheme();
};
