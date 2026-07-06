"use client";

import Link from "next/link";
import InfiniteList from "./InfiniteList";
import ThemeImage from "./ThemeImage";
import type { GalleryItem } from "@/lib/gallery";

/* The public gallery mirrors the media room: large frames, useful captions,
   and one clear next place to go. The full feed is static and known at build,
   so pagination is client-side. A small pause lets the skeletons breathe
   before the next batch lands. */

const PAGE = 24;

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
      skeletonCount={3}
      className="-mx-5 grid gap-y-12 sm:mx-0 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 xl:grid-cols-3"
      renderItem={(item) => (
        <Link
          key={item.src}
          href={item.href}
          className="group block min-w-0"
        >
          <span className="relative block aspect-[4/5] w-full overflow-hidden rounded-none sm:rounded-[26px]">
            <ThemeImage
              dark={item.src}
              light={item.srcDay}
              alt={item.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1279px) 50vw, 33vw"
              className="media-lux object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            />
            <span className="scrim-card pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300 group-hover:opacity-95" />
            <span
              aria-hidden
              className="liquid-glass absolute bottom-5 right-5 inline-flex h-11 items-center rounded-full px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink transition-transform duration-300 group-hover:-translate-y-1"
            >
              <span>View</span>
            </span>
          </span>
          <span className="mt-5 block px-5 sm:px-1">
            <span className="eyebrow block text-gold">{item.label}</span>
            <span className="font-serif mt-2 block text-[20px] leading-tight text-ink transition-colors duration-300 group-hover:text-gold">
              {item.title}
            </span>
            <span className="mt-2 block text-[14px] leading-relaxed text-dusk">
              {item.line}
            </span>
            <span className="link-hair mt-4 inline-flex text-dusk text-[12px]">
              {item.action}
            </span>
          </span>
        </Link>
      )}
      renderSkeleton={(index) => (
        <div key={`sk-${index}`} className="grid gap-4">
          <div className="skel aspect-[4/5] rounded-none sm:rounded-[26px]" />
          <div className="px-5 sm:px-1">
            <div className="skel h-5 w-1/2 rounded-full" />
            <div className="skel mt-3 h-4 w-3/4 rounded-full" />
          </div>
        </div>
      )}
    />
  );
}
