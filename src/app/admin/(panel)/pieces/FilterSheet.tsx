"use client";

import Link from "next/link";
import { useState } from "react";
import { buzz } from "@/lib/backoffice";

import { IconClose, IconFilter } from "../icons";
import {
  APPLICATION_FILTERS,
  HUES,
  SORTS,
  activeStockFilterLabels,
  cleanSort,
  makeStockHref,
  type StockFilters,
} from "./stock-filters";

/* One smart filter: a popover on the desk, a sheet under the thumb on
   the phone. Every row is still a link, so the URL carries the view. */

function Row({
  href,
  on,
  onPick,
  tour,
  children,
}: {
  href: string;
  on: boolean;
  onPick: () => void;
  tour?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      data-tour={tour}
      onClick={() => {
        buzz(3);
        onPick();
      }}
      className={`flex min-h-12 items-center justify-between rounded-[18px] px-5 text-[15px] transition-colors duration-200 hover:bg-shell/60 ${
        on ? "bg-shell text-ink shadow-lift" : "text-dusk"
      }`}
    >
      {children}
      {on && <span className="text-[11px] uppercase tracking-[0.14em] text-gold">On</span>}
    </Link>
  );
}

function FilterBody({ current, onPick }: { current: StockFilters; onPick: () => void }) {
  const sort = cleanSort(current.sort);
  return (
    <>
      <div className="grid gap-1">
        <Row onPick={onPick} href="/admin/pieces" on={activeStockFilterLabels(current).length === 0}>
          Everything
        </Row>
        <Row onPick={onPick} href={makeStockHref(current, { family: "mosaic" })} on={current.family === "mosaic"}>
          The tiles
        </Row>
        <Row onPick={onPick} href={makeStockHref(current, { family: "pool" })} on={current.family === "pool"}>
          The pool materials
        </Row>
        <Row
          onPick={onPick}
          href={makeStockHref(current, { low: current.low ? undefined : "1" })}
          on={!!current.low}
        >
          Running low only
        </Row>
      </div>
      <p className="eyebrow mt-5 px-2">Colour</p>
      <div className="mt-3 grid gap-1" data-tour="stock-hues">
        {HUES.map((h) => (
          <Row
            key={h.key}
            onPick={onPick}
            href={makeStockHref(current, { hue: current.hue === h.key ? undefined : h.key })}
            on={current.hue === h.key}
          >
            <span className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full" style={{ background: h.dot }} />
              {h.label}
            </span>
          </Row>
        ))}
      </div>
      <p className="eyebrow mt-5 px-2">Place</p>
      <div className="mt-3 grid gap-1">
        {APPLICATION_FILTERS.map((a) => (
          <Row
            key={a.key}
            onPick={onPick}
            href={makeStockHref(current, { app: current.app === a.key ? undefined : a.key })}
            on={current.app === a.key}
          >
            {a.label}
          </Row>
        ))}
      </div>
      <p className="eyebrow mt-5 px-2">Order by</p>
      <div className="mt-3 grid gap-1" data-tour="stock-sorts">
        {SORTS.map((s) => (
          <Row
            key={s.label}
            onPick={onPick}
            href={makeStockHref(current, { sort: s.key })}
            on={sort === s.key}
          >
            {s.label}
          </Row>
        ))}
      </div>
    </>
  );
}

export default function FilterSheet({ current }: { current: StockFilters }) {
  const [open, setOpen] = useState(false);
  const active = activeStockFilterLabels(current).length;
  const close = () => setOpen(false);

  return (
    <div className="relative inline-flex">
      <button
        onClick={() => {
          buzz(3);
          setOpen(true);
        }}
        className={`chip-solid ${active > 0 ? "is-on" : ""}`}
        aria-expanded={open}
        data-tour="stock-filter-open"
      >
        <IconFilter className="h-3.5 w-3.5" />
        Filter{active > 0 ? ` · ${active}` : ""}
      </button>
      {open && (
        <>
          <button
            aria-label="Close filters"
            onClick={close}
            className="filter-scrim fixed inset-0 z-40 sm:hidden"
          />
          <button
            aria-label="Close filters"
            onClick={close}
            className="fixed inset-0 z-40 hidden cursor-default sm:block"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="filter-surface fixed inset-x-3 bottom-3 z-50 max-h-[min(82svh,44rem)] overflow-auto rounded-[28px] p-5 pb-[calc(20px+env(safe-area-inset-bottom))] outline-none sm:absolute sm:bottom-auto sm:left-0 sm:top-[calc(100%+12px)] sm:w-[28rem] sm:max-w-[calc(100vw-2rem)] sm:pb-5"
            data-tour="stock-sheet"
          >
            <div className="flex items-center justify-between px-2">
              <p className="eyebrow">Filter</p>
              <button
                onClick={close}
                aria-label="Close filters"
                data-tour="stock-sheet-close"
                className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-dusk transition-colors duration-300 hover:text-ink"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
            {active > 0 && (
              <div className="mt-2 flex items-center justify-between gap-4 px-2">
                <p className="text-[13px] leading-relaxed text-dusk">
                  {activeStockFilterLabels(current).join(" · ")}
                </p>
                <Link
                  href="/admin/pieces"
                  onClick={close}
                  className="link-hair shrink-0 text-[12px] text-dusk"
                >
                  Clear
                </Link>
              </div>
            )}
            <div className="mt-4">
              <FilterBody current={current} onPick={close} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
