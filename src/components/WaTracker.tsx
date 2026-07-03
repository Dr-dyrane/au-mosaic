"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

/* Counts the only number that matters: WhatsApp taps, by placement.
   One capture-phase listener; CTAs carry data-wa for their source. */
export default function WaTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const a = target?.closest?.('a[href*="wa.me"]') as HTMLElement | null;
      if (!a) return;
      const src =
        a.dataset.wa ||
        (a.closest("[data-wa]") as HTMLElement | null)?.dataset.wa ||
        "unknown";
      track("wa_tap", { source: src, path: window.location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
