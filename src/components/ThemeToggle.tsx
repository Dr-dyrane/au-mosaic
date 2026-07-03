"use client";

import { useSyncExternalStore } from "react";
import { subscribeTheme, getIsLight, notifyTheme } from "@/lib/theme-store";

/* Dark is the house default; light is one tap away. Persisted, no flash
   (see the inline script in layout.tsx). Flipping notifies every
   ThemeImage, so the whole maison changes time of day together. */

export default function ThemeToggle() {
  const light = useSyncExternalStore(subscribeTheme, getIsLight, () => true);

  const flip = () => {
    const next = !light;
    if (next) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem("aumosaic.theme", next ? "light" : "dark"); } catch {}
    notifyTheme();
  };

  return (
    <button
      onClick={flip}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      className="flex h-10 w-10 items-center justify-center rounded-full text-dusk transition-[color,transform] duration-300 hover:text-ink active:scale-90"
    >
      {light ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}
