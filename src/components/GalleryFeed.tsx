"use client";

import Link from "next/link";
import InfiniteList from "./InfiniteList";
import ThemeImage from "./ThemeImage";
import type { GalleryItem } from "@/lib/gallery";

/* The public gallery, Instagram-Explore style: a tight, un-captioned grid the
   reader falls down. The full feed is static and known at build, so pagination
   is client-side — a small pause lets the skeletons breathe before the next
   batch lands, the way Explore does. Each frame links home to its page. */

const PAGE = 12;

export default function GalleryFeed({ items }: { items: GalleryItem[] }) {
  const loadMore = async (offset: number) => {
    await new Promise((resolve) => setTimeout(resolve, 260));
    return { items: items.slice(offset, offset + PAGE), done: offset + PAGE >= items.length };
  };

  return (
    <InfiniteList
      initial={items.slice(0, PAGE)}
      initialDone={items.length <= PAGE}
      loadMore={loadMore}
      skeletonCount={6}
      className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-4"
      renderItem={(item) => (
        <Link
          key={item.src}
          href={item.href}
          className="group relative block aspect-square overflow-hidden rounded-[10px] bg-shell sm:rounded-[20px]"
        >
          <ThemeImage
            dark={item.src}
            light={item.srcDay}
            alt={item.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="media-lux object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
          <div className="scrim-card pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>
      )}
      renderSkeleton={(index) => (
        <div key={`sk-${index}`} className="skel aspect-square rounded-[10px] sm:rounded-[20px]" />
      )}
    />
  );
}
