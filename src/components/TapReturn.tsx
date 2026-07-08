"use client";

import { useEffect } from "react";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function matchingSource(source: string | null, index: number): HTMLElement | null {
  if (!source) return null;
  const matches = Array.from(document.querySelectorAll<HTMLElement>("[data-wa]")).filter(
    (el) => el.dataset.wa === source
  );
  return matches[index] ?? matches[0] ?? null;
}

function mark(node: HTMLElement) {
  const previous = {
    outline: node.style.outline,
    outlineOffset: node.style.outlineOffset,
    borderRadius: node.style.borderRadius,
  };
  node.style.outline = "1px solid var(--color-gold)";
  node.style.outlineOffset = "4px";
  if (!node.style.borderRadius) node.style.borderRadius = "999px";
  window.setTimeout(() => {
    node.style.outline = previous.outline;
    node.style.outlineOffset = previous.outlineOffset;
    node.style.borderRadius = previous.borderRadius;
  }, 2400);
}

export default function TapReturn() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("wa_src");
    const index = Math.max(0, Number(params.get("wa_i") ?? 0) || 0);
    const yRaw = Number(params.get("wa_y"));
    const y = Number.isFinite(yRaw) ? Math.max(0, yRaw) : null;
    if (!source && y === null) return;

    const timer = window.setTimeout(() => {
      const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
      const target = matchingSource(source, index);
      if (target) {
        target.scrollIntoView({ block: "center", inline: "nearest", behavior });
        target.focus({ preventScroll: true });
        mark(target);
        return;
      }
      if (y !== null) window.scrollTo({ top: y, behavior });
    }, 180);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
