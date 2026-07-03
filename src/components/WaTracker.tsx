"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

/* Counts the only number that matters: WhatsApp taps, by placement.
   One capture-phase listener; CTAs carry data-wa for their source.
   Each tap also becomes an enquiry in the back office's book, sent as
   a beacon so the WhatsApp window is never kept waiting. The admin
   carries no data-wa, so it never logs itself. */
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
      const path = window.location.pathname;
      track("wa_tap", { source: src, path });
      try {
        navigator.sendBeacon(
          "/api/enquiry",
          new Blob([JSON.stringify({ source: src, path })], { type: "application/json" })
        );
      } catch {}
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
