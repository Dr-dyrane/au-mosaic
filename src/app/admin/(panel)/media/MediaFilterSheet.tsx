"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import AdminSheet from "@/components/AdminSheet";
import { useAdminSurface } from "@/components/admin-surface-router";
import { buzz } from "@/lib/backoffice";
import { IconClose, IconFilter } from "../icons";
import {
  ROLES,
  STATUSES,
  activeMediaFilterLabels,
  labelRole,
  labelStatus,
  mediaFilterHref,
  type MediaFilterTotals,
  type MediaFilters,
} from "./media-filter-model";

function countLabel(label: string, count?: number) {
  return typeof count === "number" ? `${label} ${count.toLocaleString()}` : label;
}

function Row({
  href,
  on,
  onPick,
  children,
}: {
  href: string;
  on: boolean;
  onPick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
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

function FilterBody({
  current,
  totals,
  onPick,
}: {
  current: MediaFilters;
  totals?: MediaFilterTotals;
  onPick: () => void;
}) {
  return (
    <>
      <div className="grid gap-1">
        <Row
          onPick={onPick}
          href="/admin/media"
          on={activeMediaFilterLabels(current).length === 0}
        >
          {countLabel("Everything", totals?.all)}
        </Row>
      </div>
      <p className="eyebrow mt-5 px-2">State</p>
      <div className="mt-3 grid gap-1">
        {STATUSES.map((s) => (
          <Row
            key={s}
            onPick={onPick}
            href={mediaFilterHref(current, { status: current.status === s ? undefined : s })}
            on={current.status === s}
          >
            {countLabel(labelStatus(s), totals?.[s])}
          </Row>
        ))}
      </div>
      <p className="eyebrow mt-5 px-2">Use</p>
      <div className="mt-3 grid gap-1">
        {ROLES.map((r) => (
          <Row
            key={r}
            onPick={onPick}
            href={mediaFilterHref(current, { role: current.role === r ? undefined : r })}
            on={current.role === r}
          >
            {labelRole(r)}
          </Row>
        ))}
      </div>
      <p className="eyebrow mt-5 px-2">Set</p>
      <div className="mt-3 grid gap-1">
        <Row
          onPick={onPick}
          href={mediaFilterHref(current, { batch: current.batch ? undefined : "batch-08" })}
          on={!!current.batch}
        >
          Prepared set
        </Row>
      </div>
    </>
  );
}

export function MediaFilterPanel({
  current,
  totals,
  onPick,
  onClose,
  id,
  showHeader = true,
}: {
  current: MediaFilters;
  totals?: MediaFilterTotals;
  onPick: () => void;
  onClose: () => void;
  id?: string;
  showHeader?: boolean;
}) {
  const active = activeMediaFilterLabels(current);
  return (
    <div id={id} data-tour="media-filter-panel">
      {showHeader && (
        <div className="flex items-center justify-between px-2">
          <p className="eyebrow">Filter</p>
          <button
            onClick={onClose}
            aria-label="Close filter"
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-dusk transition-colors duration-300 hover:text-ink"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      )}
      {active.length > 0 && (
        <div className={`${showHeader ? "mt-2" : ""} flex items-center justify-between gap-4 px-2`}>
          <p className="text-[14px] leading-relaxed text-dusk">{active.join(" / ")}</p>
          <Link href="/admin/media" onClick={onPick} className="link-hair shrink-0 text-[12px] text-dusk">
            Clear
          </Link>
        </div>
      )}
      <div className={showHeader || active.length > 0 ? "mt-4" : ""}>
        <FilterBody current={current} totals={totals} onPick={onPick} />
      </div>
    </div>
  );
}

export default function MediaFilterSheet({
  current,
  totals,
}: {
  current: MediaFilters;
  totals: MediaFilterTotals;
}) {
  const active = activeMediaFilterLabels(current).length;
  const surface = useAdminSurface(
    { kind: "media-filter", current: { ...current, totals } },
    { id: "media-filter-panel" }
  );

  return (
    <div className="relative inline-flex">
      <button
        onClick={surface.openSurface}
        className={`chip-solid ${active > 0 ? "is-on" : ""}`}
        aria-controls={surface.triggerProps["aria-controls"]}
        aria-expanded={surface.triggerProps["aria-expanded"]}
        data-tour="media-filter-open"
      >
        <IconFilter className="h-3.5 w-3.5" />
        Filter{active > 0 ? ` / ${active}` : ""}
      </button>
      <AdminSheet
        open={surface.sheetOpen}
        onOpenChange={surface.setSheetOpen}
        title="Filter"
        id="media-filter-panel"
        compactOnly
      >
        <MediaFilterPanel
          current={current}
          totals={totals}
          onPick={surface.closeSheet}
          onClose={surface.closeSheet}
          showHeader={false}
        />
      </AdminSheet>
    </div>
  );
}
