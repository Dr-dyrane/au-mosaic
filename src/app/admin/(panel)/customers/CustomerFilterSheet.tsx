"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import AdminSheet from "@/components/AdminSheet";
import { useAdminSurface } from "@/components/admin-surface-router";
import { buzz } from "@/lib/backoffice";
import { IconClose, IconFilter } from "../icons";
import {
  activeCustomerFilterLabels,
  cleanCustomerSort,
  customerFilterHref,
  type CustomerFilters,
} from "./customer-filter-model";

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";

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

/* The one search field for the book of people. It lives at the head of
   the list, submits by Enter, and writes the same URL the sheet reads. */
export function CustomerSearchField({ current }: { current: CustomerFilters }) {
  const sort = cleanCustomerSort(current.sort);

  function submit(event: FormEvent<HTMLFormElement>) {
    buzz(3);
    const q = new FormData(event.currentTarget).get("q")?.toString().trim();
    if (!q) {
      event.preventDefault();
      window.location.href = customerFilterHref(current, { q: undefined });
    }
  }

  return (
    <form
      action="/admin/customers"
      method="GET"
      role="search"
      onSubmit={submit}
      className="w-full sm:w-72"
      data-tour="people-search"
    >
      <input
        type="search"
        name="q"
        defaultValue={current.q ?? ""}
        placeholder="Name or phone"
        aria-label="Search customers by name or phone"
        className={field}
      />
      {sort === "name" && <input type="hidden" name="sort" value="name" />}
    </form>
  );
}

function FilterBody({
  current,
  onPick,
}: {
  current: CustomerFilters;
  onPick: () => void;
}) {
  const sort = cleanCustomerSort(current.sort);

  return (
    <>
      <p className="eyebrow px-2">Order by</p>
      <div className="mt-3 grid gap-1">
        <Row
          href={customerFilterHref(current, { sort: undefined })}
          on={sort === "newest"}
          onPick={onPick}
        >
          Newest
        </Row>
        <Row
          href={customerFilterHref(current, { sort: "name" })}
          on={sort === "name"}
          onPick={onPick}
        >
          A to Z
        </Row>
      </div>
      {current.q && (
        <>
          <p className="eyebrow mt-5 px-2">Search</p>
          <div className="mt-3 grid gap-1">
            <Row href={customerFilterHref(current, { q: undefined })} on onPick={onPick}>
              Clear {current.q}
            </Row>
          </div>
        </>
      )}
    </>
  );
}

export function CustomerFilterPanel({
  current,
  onPick,
  onClose,
  id,
  showHeader = true,
}: {
  current: CustomerFilters;
  onPick: () => void;
  onClose: () => void;
  id?: string;
  showHeader?: boolean;
}) {
  const active = activeCustomerFilterLabels(current);

  return (
    <div id={id} data-tour="customer-filter-panel">
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
          <Link
            href="/admin/customers"
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

export default function CustomerFilterSheet({ current }: { current: CustomerFilters }) {
  const active = activeCustomerFilterLabels(current).length;
  const surface = useAdminSurface(
    { kind: "customer-filter", current },
    { id: "customer-filter-panel" }
  );

  return (
    <div className="relative inline-flex">
      <button
        onClick={surface.openSurface}
        className={`chip-solid ${active > 0 ? "is-on" : ""}`}
        aria-controls={surface.triggerProps["aria-controls"]}
        aria-expanded={surface.triggerProps["aria-expanded"]}
        data-tour="customer-filter-open"
      >
        <IconFilter className="h-3.5 w-3.5" />
        Filter{active > 0 ? ` / ${active}` : ""}
      </button>
      <AdminSheet
        open={surface.sheetOpen}
        onOpenChange={surface.setSheetOpen}
        title="Filter"
        id="customer-filter-panel"
        compactOnly
      >
        <CustomerFilterPanel
          current={current}
          onPick={surface.closeSheet}
          onClose={surface.closeSheet}
          showHeader={false}
        />
      </AdminSheet>
    </div>
  );
}
