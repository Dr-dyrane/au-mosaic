"use client";

import Link from "next/link";
import AdminSheet from "@/components/AdminSheet";
import { buzz } from "@/lib/backoffice";
import { useAdminSurface } from "@/components/admin-surface-router";

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

/* One smart filter. Desktop borrows the context rail; everything below
   desktop asks the shared surface router for the right sheet. Every row
   is still a link, so the URL carries the view. */

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
      className={`admin-glass-control flex min-h-12 items-center justify-between rounded-[18px] px-5 text-[14px] active:scale-[0.98] ${
        on ? "is-on text-ink" : "text-dusk hover:bg-shell/50"
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

export function StockFilterPanel({
  current,
  onPick,
  onClose,
  id,
  showHeader = true,
}: {
  current: StockFilters;
  onPick: () => void;
  onClose: () => void;
  id?: string;
  showHeader?: boolean;
}) {
  const active = activeStockFilterLabels(current);
  return (
    <div id={id} data-tour="stock-sheet">
      {showHeader && (
        <div className="flex items-center justify-between px-2">
          <p className="eyebrow">Filter</p>
          <button
            onClick={onClose}
            aria-label="Close filters"
            data-tour="stock-sheet-close"
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-dusk transition-colors duration-300 hover:text-ink"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      )}
      {active.length > 0 && (
        <div className={`${showHeader ? "mt-2" : ""} flex items-center justify-between gap-4 px-2`}>
          <p className="text-[13px] leading-relaxed text-dusk">
            {active.join(" · ")}
          </p>
          <Link
            href="/admin/pieces"
            onClick={onPick}
            className="link-hair shrink-0 text-[12px] text-dusk"
          >
            Clear
          </Link>
        </div>
      )}
      <div className={showHeader || active.length > 0 ? "mt-4" : ""}>
        <FilterBody current={current} onPick={onPick} />
      </div>
    </div>
  );
}

export default function FilterSheet({ current }: { current: StockFilters }) {
  const active = activeStockFilterLabels(current).length;
  const surface = useAdminSurface(
    { kind: "stock-filter", current },
    { id: "stock-filter-panel" }
  );

  return (
    <div className="relative inline-flex">
      <button
        onClick={surface.openSurface}
        className={`chip-solid ${active > 0 ? "is-on" : ""}`}
        aria-controls={surface.triggerProps["aria-controls"]}
        aria-expanded={surface.triggerProps["aria-expanded"]}
        data-tour="stock-filter-open"
      >
        <IconFilter className="h-3.5 w-3.5" />
        Filter{active > 0 ? ` · ${active}` : ""}
      </button>
      <AdminSheet open={surface.sheetOpen} onOpenChange={surface.setSheetOpen} title="Filter" id="stock-filter-panel">
        <StockFilterPanel current={current} onPick={surface.closeSheet} onClose={surface.closeSheet} showHeader={false} />
      </AdminSheet>
    </div>
  );
}
