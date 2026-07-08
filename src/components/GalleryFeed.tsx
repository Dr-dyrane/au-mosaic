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

function IconSearch({ className = "h-4 w-4" }: { className?: string }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3 -4.3" />
    </svg>
  );
}

export default function GalleryFeed({ items }: { items: GalleryItem[] }) {
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
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
      {clean && (
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <span className="chip-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] text-dusk">
            <IconSearch className="h-3.5 w-3.5" />
            <span className="text-ink">{query}</span>
            <span className="text-mist">
              {filtered.length} {filtered.length === 1 ? "frame" : "frames"}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="link-hair text-[12px] text-dusk"
          >
            Clear, show all
          </button>
        </div>
      )}
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

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label="Search the gallery"
        data-gallery-search="float"
        className="glass group fixed bottom-[calc(24px+env(safe-area-inset-bottom))] right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full text-ink shadow-lift transition-[transform,color] duration-300 hover:scale-105 hover:text-gold active:scale-95"
      >
        <span className="chip-glass pointer-events-none absolute right-full mr-3 hidden translate-x-1 whitespace-nowrap opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:inline-flex">
          Search the gallery
        </span>
        <IconSearch className="h-[22px] w-[22px]" />
        {clean && (
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-gold" aria-hidden />
        )}
      </button>

      <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-sand/35 backdrop-blur-[10px]" />
          <Dialog.Content
            aria-describedby={undefined}
            className="glass fixed left-1/2 top-[22%] z-[71] w-[min(560px,92vw)] -translate-x-1/2 rounded-[28px] p-6 shadow-lift outline-none sm:top-1/2 sm:-translate-y-1/2"
          >
            <Dialog.Title className="eyebrow text-gold">Search the house</Dialog.Title>
            <div className="relative mt-4">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Aqua, pool, mural, room"
                className="w-full rounded-full bg-shell/60 px-6 py-4 pr-14 text-[16px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300"
              />
              {clean && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-mist transition-colors hover:text-ink"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-dusk">
              {clean
                ? `${filtered.length} ${filtered.length === 1 ? "frame" : "frames"} behind the glass.`
                : "Type to filter the frames behind. Try a colour, a room, or a pool."}
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
