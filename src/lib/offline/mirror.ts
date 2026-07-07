"use client";

/* The mirror keeps the field kit fresh. While online it pulls the
   snapshot from the server and saves it to IndexedDB, so the last
   known copy is always the most recent the network allowed. It stays
   quiet when offline and never lets two pulls overlap. */

import { putSnapshot } from "./db";
import type { Snapshot } from "./types";

let inFlight = false;

export async function refreshSnapshot(): Promise<boolean> {
  if (inFlight) return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  inFlight = true;
  try {
    const res = await fetch("/admin/api/snapshot", { credentials: "same-origin", cache: "no-store" });
    if (!res.ok) return false;
    const snapshot = (await res.json()) as Snapshot;
    await putSnapshot(snapshot);
    return true;
  } catch {
    return false;
  } finally {
    inFlight = false;
  }
}
