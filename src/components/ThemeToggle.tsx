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
      aria-label={light ? "Switch to night mode" : "Switch to day mode"}
      aria-pressed={light}
      className="sun-beam"
    >
      <span className={!light ? "is-on" : ""}>Night</span>
      <i aria-hidden />
      <span className={light ? "is-on" : ""}>Day</span>
    </button>
  );
}
