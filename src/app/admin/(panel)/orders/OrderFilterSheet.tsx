"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import AdminSheet from "@/components/AdminSheet";
import { useAdminSurface } from "@/components/admin-surface-router";
import { buzz } from "@/lib/backoffice";
import { IconClose, IconFilter } from "../icons";
import { OPEN_STEPS, STATUS_LABEL } from "./pipeline";
import {
  activeOrderFilterLabels,
  orderFilterHref,
  type OrderFilters,
} from "./order-filter-model";

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

function FilterBody({ current, onPick }: { current: OrderFilters; onPick: () => void }) {
  return (
    <>
      <div className="grid gap-1">
        <Row
          onPick={onPick}
          href={orderFilterHref(current, { status: undefined })}
          on={!current.status}
        >
          All open
        </Row>
      </div>
      <p className="eyebrow mt-5 px-2">Step</p>
      <div className="mt-3 grid gap-1">
        {OPEN_STEPS.map((s) => (
          <Row
            key={s}
            onPick={onPick}
            href={orderFilterHref(current, { status: current.status === s ? undefined : s })}
            on={current.status === s}
          >
            {STATUS_LABEL[s]}
          </Row>
        ))}
      </div>
      {current.q && (
        <>
          <p className="eyebrow mt-5 px-2">Search</p>
          <div className="mt-3 grid gap-1">
            <Row onPick={onPick} href={orderFilterHref(current, { q: undefined })} on>
              Clear {current.q}
            </Row>
          </div>
        </>
      )}
    </>
  );
}

export function OrderFilterPanel({
  current,
  onPick,
  onClose,
  id,
  showHeader = true,
}: {
  current: OrderFilters;
  onPick: () => void;
  onClose: () => void;
  id?: string;
  showHeader?: boolean;
}) {
  const active = activeOrderFilterLabels(current);
  return (
    <div id={id} data-tour="order-filter-panel">
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
          <Link href="/admin/orders" onClick={onPick} className="link-hair shrink-0 text-[12px] text-dusk">
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

export default function OrderFilterSheet({ current }: { current: OrderFilters }) {
  const active = activeOrderFilterLabels(current).length;
  const surface = useAdminSurface(
    { kind: "order-filter", current },
    { id: "order-filter-panel" }
  );

  return (
    <div className="relative inline-flex">
      <button
        onClick={surface.openSurface}
        className={`chip-solid ${active > 0 ? "is-on" : ""}`}
        aria-controls={surface.triggerProps["aria-controls"]}
        aria-expanded={surface.triggerProps["aria-expanded"]}
        data-tour="order-filter-open"
      >
        <IconFilter className="h-3.5 w-3.5" />
        Filter{active > 0 ? ` / ${active}` : ""}
      </button>
      <AdminSheet
        open={surface.sheetOpen}
        onOpenChange={surface.setSheetOpen}
        title="Filter"
        id="order-filter-panel"
        compactOnly
      >
        <OrderFilterPanel
          current={current}
          onPick={surface.closeSheet}
          onClose={surface.closeSheet}
          showHeader={false}
        />
      </AdminSheet>
    </div>
  );
}
