"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import InfiniteList from "./InfiniteList";
import ThemeImage from "./ThemeImage";
import type { GalleryItem } from "@/lib/gallery";
import { wa } from "@/lib/wa";

/* The public gallery mirrors the media room: large frames, useful captions,
   and one clear next place to go. The full feed is static and known at build,
   so pagination is client-side. A small pause lets the skeletons breathe
   before the next batch lands. */

const PAGE = 24;
const field =
  "w-full rounded-full bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";

function IconClose({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export default function GalleryFeed({ items }: { items: GalleryItem[] }) {
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [query, setQuery] = useState("");
  const clean = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!clean) return items;
    return items.filter((item) =>
      [
        item.title,
        item.label,
        item.line,
        item.alt,
        item.action,
        item.href,
      ]
        .join(" ")
        .toLowerCase()
        .includes(clean),
    );
  }, [clean, items]);
  const loadMore = async (offset: number) => {
    await new Promise((resolve) => setTimeout(resolve, 260));
    return {
      items: filtered.slice(offset, offset + PAGE),
      done: offset + PAGE >= filtered.length,
    };
  };

  return (
    <>
      <div className="mb-10 max-w-md">
        <label htmlFor="gallery-search" className="eyebrow mb-3 block">
          Search gallery
        </label>
        <input
          id="gallery-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Aqua, pool, mural, room"
          className={field}
        />
      </div>
      {filtered.length === 0 ? (
        <p className="max-w-md text-[14px] leading-relaxed text-dusk">
          Nothing matches that search.
        </p>
      ) : (
      <InfiniteList
        key={clean || "all"}
        initial={filtered.slice(0, PAGE)}
        initialDone={filtered.length <= PAGE}
        loadMore={loadMore}
        skeletonCount={3}
        className="-mx-5 grid gap-y-12 sm:mx-0 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 xl:grid-cols-3"
        renderItem={(item) => (
          <article key={item.src} className="group block min-w-0">
            <button
              type="button"
              aria-label={`Open ${item.alt}`}
              onClick={() => setSelected(item)}
              className="relative block aspect-[4/5] w-full overflow-hidden rounded-none text-left sm:rounded-[26px]"
            >
              <ThemeImage
                dark={item.src}
                light={item.srcDay}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1279px) 50vw, 33vw"
                className="media-lux object-cover transition-transform duration-500 group-hover:scale-[1.035]"
              />
              <span className="scrim-card pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-70 group-focus-visible:opacity-70" />
            </button>
            <span className="mt-5 block px-5 sm:px-1">
              <span className="eyebrow block text-gold">{item.label}</span>
              <span className="font-serif mt-2 block text-[20px] leading-tight text-ink transition-colors duration-300 group-hover:text-gold">
                {item.title}
              </span>
              <span className="mt-2 block text-[14px] leading-relaxed text-dusk">
                {item.line}
              </span>
              <Link href={item.href} className="link-hair mt-4 inline-flex text-dusk text-[12px]">
                {item.action}
              </Link>
            </span>
          </article>
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
      )}
      <Dialog.Root open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[80] bg-sand/80 backdrop-blur-[18px]" />
            <Dialog.Content className="fixed inset-0 z-[81] grid overflow-y-auto bg-sand outline-none sm:left-1/2 sm:top-1/2 sm:h-[min(82vh,760px)] sm:w-[min(92vw,1120px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] sm:overflow-hidden sm:rounded-[28px] sm:bg-shell/80 sm:shadow-lift sm:backdrop-blur-[24px]">
              <Dialog.Close
                aria-label="Close photo"
                className="glass fixed right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full text-dusk transition-colors hover:text-ink sm:absolute"
              >
                <IconClose className="h-4 w-4" />
              </Dialog.Close>
              <div className="relative min-h-[62dvh] sm:min-h-0">
                <ThemeImage
                  dark={selected.src}
                  light={selected.srcDay}
                  alt={selected.alt}
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1279px) 72vw, 62vw"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex min-h-0 flex-col justify-between gap-8 p-6 sm:p-7 sm:pr-16">
                <div>
                  <p className="eyebrow">{selected.label}</p>
                  <Dialog.Title className="font-serif mt-3 text-[20px] leading-tight text-ink">
                    {selected.title}
                  </Dialog.Title>
                  <Dialog.Description className="mt-3 text-[14px] leading-relaxed text-dusk">
                    {selected.line}
                  </Dialog.Description>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-3">
                  <Link
                    href={selected.href}
                    onClick={() => setSelected(null)}
                    className="link-hair text-dusk text-[12px]"
                  >
                    {selected.action}
                  </Link>
                  <a
                    href={wa(`Hello AU Mosaic, I saw this in the gallery: ${selected.title}. Can we talk about this look?`)}
                    target="_blank"
                    rel="noopener"
                    data-wa="gallery-photo"
                    className="link-hair text-dusk text-[12px]"
                  >
                    Enquire
                  </a>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </>
  );
}
