"use client";

import Link from "next/link";
import { useState } from "react";
import { buzz } from "@/lib/backoffice";

import { IconClose, IconFilter } from "../icons";
import { APPLICATION_FILTERS, HUES, SORTS, makeStockHref, type StockFilters } from "./stock-filters";

/* The phone's filter: one chip opens a glass sheet from the bottom
   edge, big rows, each a link so the URL carries the view. Tapping a
   row navigates and the sheet lets go. */

function Row({
  href,
  on,
  onPick,
  children,
}: {
  href: string;
  on: boolean;
  onPick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={() => {
        buzz(3);
        onPick();
      }}
      className={`flex min-h-12 items-center justify-between rounded-[18px] px-5 text-[15px] transition-colors duration-200 ${
        on ? "bg-shell text-ink" : "text-dusk"
      }`}
    >
      {children}
      {on && <span className="text-[11px] uppercase tracking-[0.14em] text-gold">On</span>}
    </Link>
  );
}

export default function FilterSheet({ current }: { current: StockFilters }) {
  const [open, setOpen] = useState(false);
  const active =
    (current.family ? 1 : 0) +
    (current.low ? 1 : 0) +
    (current.hue ? 1 : 0) +
    (current.app ? 1 : 0);
  const close = () => setOpen(false);

  return (
    <div className="sm:hidden">
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
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close filters"
            onClick={close}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="glass absolute inset-x-0 bottom-0 rounded-t-[28px] p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
            data-tour="stock-sheet"
          >
            <div className="flex items-center justify-between px-2">
              <p className="eyebrow">Show</p>
              <button
                onClick={close}
                aria-label="Close filters"
                data-tour="stock-sheet-close"
                className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-dusk transition-colors duration-300 hover:text-ink"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid gap-1">
              <Row onPick={close} href={makeStockHref(current, { family: undefined })} on={!current.family}>
                Everything
              </Row>
              <Row onPick={close} href={makeStockHref(current, { family: "mosaic" })} on={current.family === "mosaic"}>
                The tiles
              </Row>
              <Row onPick={close} href={makeStockHref(current, { family: "pool" })} on={current.family === "pool"}>
                The pool materials
              </Row>
              <Row
                onPick={close}
                href={makeStockHref(current, { low: current.low ? undefined : "1" })}
                on={!!current.low}
              >
                Running low only
              </Row>
            </div>
            <p className="eyebrow mt-5 px-2">Colour</p>
            <div className="mt-3 grid gap-1">
              {HUES.map((h) => (
                <Row
                  key={h.key}
                  onPick={close}
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
                  onPick={close}
                  href={makeStockHref(current, { app: current.app === a.key ? undefined : a.key })}
                  on={current.app === a.key}
                >
                  {a.label}
                </Row>
              ))}
            </div>
            <p className="eyebrow mt-5 px-2">Order by</p>
            <div className="mt-3 grid gap-1">
              {SORTS.map((s) => (
                <Row
                  key={s.label}
                  onPick={close}
                  href={makeStockHref(current, { sort: s.key })}
                  on={(current.sort === "name" || current.sort === "low" ? current.sort : undefined) === s.key}
                >
                  {s.label}
                </Row>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
