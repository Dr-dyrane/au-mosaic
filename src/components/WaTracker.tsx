"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { stripTapReturnParams, withTapReturnParams } from "@/lib/tap-return";

/* Counts the only number that matters: WhatsApp taps, by placement.
   One capture-phase listener; CTAs carry data-wa for their source.
   Each tap also becomes an enquiry in the back office's book, sent as
   a beacon so the WhatsApp window is never kept waiting. The admin
   carries no data-wa, so it never logs itself. The beacon carries one
   anonymous first-party id, minted on the first tap and kept on the
   visitor's own device: no fingerprinting, no third parties, and the
   funnel learns to count people instead of taps. */

function sid(): string | null {
  try {
    const KEY = "aumosaic.sid";
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return null;
  }
}

function currentPath(): string {
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return stripTapReturnParams(path);
}

function sourceIndex(node: HTMLElement, source: string): number {
  const matches = Array.from(document.querySelectorAll<HTMLElement>("[data-wa]")).filter(
    (el) => el.dataset.wa === source
  );
  return Math.max(0, matches.indexOf(node));
}

export default function WaTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const a = target?.closest?.('a[href*="wa.me"]') as HTMLElement | null;
      if (!a) return;
      const sourceNode = a.dataset.wa ? a : (a.closest("[data-wa]") as HTMLElement | null) ?? a;
      const src = sourceNode.dataset.wa || "unknown";
      const path = currentPath();
      const rect = a.getBoundingClientRect();
      const returnPath = withTapReturnParams(path, src, sourceIndex(sourceNode, src), window.scrollY + rect.top);
      track("wa_tap", { source: src, path, returnPath });
      try {
        navigator.sendBeacon(
          "/api/enquiry",
          new Blob([JSON.stringify({ source: src, path, returnPath, sid: sid() })], {
            type: "application/json",
          })
        );
      } catch {}
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
