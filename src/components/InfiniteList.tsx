"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/* Instagram-style infinite scroll: render a first set on the server, then load
   the next batch automatically when the reader nears the end — no page buttons.
   While a batch is in flight, skeletons stand in the grid; when it lands, the
   real cards replace them. One engine, reused by every long list (photos,
   stock, orders, people, owed, deliveries).

   The parent owns the data. It passes the first page (server-rendered) and a
   `loadMore(offset)` server action that returns the next slice and whether the
   list is exhausted. This component owns only the scroll, the state, and the
   loaders — it knows nothing about what it lists. */

export type Batch<T> = { items: T[]; done: boolean };

export default function InfiniteList<T>({
  initial,
  initialDone = false,
  loadMore,
  renderItem,
  renderSkeleton,
  skeletonCount = 6,
  className,
  rootMargin = "800px 0px",
}: {
  /** The first page, rendered on the server for instant paint and SEO. */
  initial: T[];
  /** True when the first page is already the whole list. */
  initialDone?: boolean;
  /** Returns the next slice starting at `offset`, and whether the list ends. */
  loadMore: (offset: number) => Promise<Batch<T>>;
  /** One list item. Include a stable `key`. */
  renderItem: (item: T, index: number) => ReactNode;
  /** One placeholder cell, shaped like an item. Include a `key` (use the index). */
  renderSkeleton: (index: number) => ReactNode;
  /** How many skeletons to show while a batch loads. Match the grid columns. */
  skeletonCount?: number;
  /** Grid/layout classes; items and skeletons are its direct children. */
  className?: string;
  /** How early to start the next fetch before the end scrolls into view. */
  rootMargin?: string;
}) {
  const [items, setItems] = useState<T[]>(initial);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialDone || initial.length === 0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);

  const fetchMore = useCallback(async () => {
    if (busy.current || done) return;
    busy.current = true;
    setLoading(true);
    try {
      const batch = await loadMore(items.length);
      setItems((prev) => [...prev, ...batch.items]);
      if (batch.done || batch.items.length === 0) setDone(true);
    } catch {
      /* Transient (offline, hiccup). Leave the sentinel; the next scroll retries. */
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [done, items.length, loadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || done) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchMore();
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchMore, done, rootMargin]);

  return (
    <>
      <div className={className} aria-busy={loading}>
        {items.map((item, index) => renderItem(item, index))}
        {loading && Array.from({ length: skeletonCount }, (_, i) => renderSkeleton(i))}
      </div>
      {!done && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
      <p className="sr-only" role="status" aria-live="polite">
        {loading ? "Loading more" : ""}
      </p>
    </>
  );
}
