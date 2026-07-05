"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

/* Recognition over recall: the records he opens remember themselves
   on his own device, and the glance offers the last three back, so
   morning starts where yesterday ended. His phone, his trail; the
   database is never asked. */

type Touched = { href: string; label: string; room: string; at: number };

const KEY = "maison.touched";

function read(): Touched[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/* localStorage as the external store it is: one cached parse per
   write, an empty book on the server, re-read after hydration. */
const EMPTY: Touched[] = [];
let cacheRaw: string | null = null;
let cacheList: Touched[] = EMPTY;

function snapshot(): Touched[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cacheList = raw === null ? EMPTY : read();
  }
  return cacheList;
}

function serverSnapshot(): Touched[] {
  return EMPTY;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/* Renders nothing; a record page mounts it to sign the visitors book. */
export function Touch({ href, label, room }: { href: string; label: string; room: string }) {
  useEffect(() => {
    if (!label) return;
    try {
      const next = [
        { href, label, room, at: Date.now() },
        ...read().filter((t) => t.href !== href),
      ].slice(0, 8);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, [href, label, room]);
  return null;
}

/* The glance's memory: up to three quiet links, or nothing at all.
   The server renders none and the client fills in after hydration,
   so nobody guesses wrong. */
export function LastTouched() {
  const items = useSyncExternalStore(subscribe, snapshot, serverSnapshot).slice(0, 3);
  if (items.length === 0) return null;
  return (
    <div className="mt-8">
      <p className="eyebrow">Where you left off</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((t) => (
          <li key={t.href} className="flex items-baseline gap-3">
            <Link href={t.href} className="link-hair text-dusk text-[12px]">
              {t.label}
            </Link>
            <span className="text-[11px] uppercase tracking-[0.14em] text-mist">{t.room}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
