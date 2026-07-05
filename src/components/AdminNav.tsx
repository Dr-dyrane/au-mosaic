"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDeliveries,
  IconHome,
  IconInsights,
  IconMore,
  IconOrders,
  IconOwed,
  IconPeople,
  IconPhotos,
  IconSettings,
  IconStock,
} from "@/app/admin/(panel)/icons";
import {
  ADMIN_MORE_ROOMS,
  ADMIN_PHONE_ROOMS,
  ADMIN_ROOMS,
  type AdminRoom,
  type AdminRoomId,
  isActiveRoom,
  roomForPath,
} from "@/lib/admin-rooms";

/* Wayfinding for the back office, HIG style: you can always see
   where you are, and the primary rooms are always one tap away. On
   the phone that means a tab bar under the thumb; on the desk, a
   persistent rail. The current room holds ink; the others whisper. */

function useActive() {
  const pathname = usePathname();
  return (room: AdminRoom) => isActiveRoom(room, pathname);
}

const ROOM_ICONS = {
  home: IconHome,
  stock: IconStock,
  orders: IconOrders,
  people: IconPeople,
  owed: IconOwed,
  deliveries: IconDeliveries,
  photos: IconPhotos,
  insights: IconInsights,
  settings: IconSettings,
} satisfies Record<AdminRoom["id"], ComponentType<{ className?: string }>>;

function RoomGlyph({ room, className }: { room: AdminRoom; className?: string }) {
  const Glyph = ROOM_ICONS[room.id];
  return <Glyph className={className} />;
}

function roomById(id: AdminRoomId) {
  return ADMIN_ROOMS.find((room) => room.id === id) ?? ADMIN_ROOMS[0];
}

type RoomAction = {
  href: string;
  label: string;
  room: AdminRoom;
  external?: boolean;
};

function roomActionFor(pathname: string, owed: number): RoomAction {
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  const orderMatch = new RegExp(`^/admin/orders/(${uuid})$`, "i").exec(pathname);
  if (orderMatch) {
    return { href: `${pathname}#payment`, label: "Add payment", room: roomById("owed") };
  }

  const customerMatch = new RegExp(`^/admin/customers/(${uuid})$`, "i").exec(pathname);
  if (customerMatch) {
    return {
      href: `/admin/orders/new?customer=${customerMatch[1]}`,
      label: "New order",
      room: roomById("orders"),
    };
  }

  if (/^\/admin\/pieces\/(?!new$)[^/]+/.test(pathname)) {
    return { href: `${pathname}#stock`, label: "Reorder", room: roomById("stock") };
  }

  const room = roomForPath(pathname);
  switch (room.id) {
    case "home":
      return { href: "/admin/orders/new", label: "New order", room: roomById("orders") };
    case "stock":
      return { href: "/admin/pieces/new", label: "New piece", room: roomById("stock") };
    case "orders":
      return { href: "/admin/orders/new", label: "New order", room: roomById("orders") };
    case "people":
      return { href: "/admin/customers/new", label: "New customer", room: roomById("people") };
    case "owed":
      return { href: "/admin/debts", label: owed > 0 ? "Remind" : "Orders", room: roomById("owed") };
    case "deliveries":
      return { href: "/admin/deliveries/new", label: "New delivery", room: roomById("deliveries") };
    case "photos":
      return { href: "/admin/media", label: "Add photo", room: roomById("photos") };
    case "insights":
      return { href: "/admin", label: "Today", room: roomById("home") };
    case "settings":
      return { href: "/admin/settings/history", label: "History", room: roomById("settings") };
  }
}

function useChromeCompact() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const onScroll = () => setCompact(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return compact;
}

function pageActionFromDom(): RoomAction | null {
  const el = document.querySelector<HTMLElement>("[data-admin-action]");
  if (!el) return null;
  const href = el.dataset.href;
  const label = el.dataset.label;
  const roomId = el.dataset.room as AdminRoomId | undefined;
  if (!href || !label || !roomId) return null;
  return {
    href,
    label,
    room: roomById(roomId),
    external: el.dataset.external === "true",
  };
}

function usePageAction(pathname: string) {
  const [pageAction, setPageAction] = useState<RoomAction | null>(null);

  useEffect(() => {
    const sync = () => setPageAction(pageActionFromDom());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-admin-action", "data-href", "data-label", "data-room", "data-external"],
    });
    return () => observer.disconnect();
  }, [pathname]);

  return pageAction;
}

/* A quiet gold count beside a room's name: how many people owe. */
function CountPill({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span aria-label={`${n} owing`} className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-gold/15 px-1 text-[11px] font-semibold leading-4 text-gold">
      {n}
    </span>
  );
}

export function AdminTopNav({ owed = 0 }: { owed?: number }) {
  const isActive = useActive();
  return (
    <nav
      aria-label="Back office"
      data-tour="rooms"
      className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto sm:flex lg:hidden"
    >
      {ADMIN_ROOMS.map((r) => {
        const on = isActive(r);
        return (
          <Link
            key={r.href}
            href={r.href}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0] transition-colors duration-300 ${
              on ? "bg-shell text-ink shadow-lift" : "text-dusk hover:bg-shell/40 hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-2">
              <RoomGlyph room={r} className={`h-5 w-5 shrink-0 ${on ? "text-gold" : "text-mist"}`} />
              {r.label}
              {r.label === "Owed" && <CountPill n={owed} />}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminRailNav({ owed = 0 }: { owed?: number }) {
  const isActive = useActive();
  return (
    <nav aria-label="Back office rooms" data-tour="rooms" className="mt-10 space-y-1.5">
      {ADMIN_ROOMS.map((r) => {
        const on = isActive(r);
        return (
          <Link
            key={r.href}
            href={r.href}
            aria-current={on ? "page" : undefined}
            className={`group flex items-center justify-between rounded-full px-4 py-3 text-[14px] font-medium tracking-[0] transition-[background,color,transform] duration-300 active:scale-[0.98] ${
              on ? "bg-shell text-ink shadow-lift" : "text-dusk hover:bg-shell/35 hover:text-ink"
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <RoomGlyph room={r} className={`h-5 w-5 shrink-0 ${on ? "text-gold" : "text-mist group-hover:text-dusk"}`} />
              <span className="truncate">{r.label}</span>
            </span>
            {r.label === "Owed" && <CountPill n={owed} />}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminTabBar({ owed = 0 }: { owed?: number }) {
  const pathname = usePathname();
  const isActive = useActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const compact = useChromeCompact();
  const pageAction = usePageAction(pathname);
  const routeAction = useMemo(() => roomActionFor(pathname, owed), [pathname, owed]);
  const action = pageAction ?? routeAction;
  const moreOn = ADMIN_MORE_ROOMS.some((room) => isActive(room));

  return (
    <>
      <div
        data-tour="rooms"
        className={`layer-admin-nav pointer-events-none fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] flex items-center justify-center gap-2 transition-transform duration-300 sm:hidden ${
          compact ? "translate-y-1 scale-[0.98]" : ""
        }`}
      >
        <nav aria-label="Back office rooms" className="glass pointer-events-auto flex h-14 items-center gap-1 rounded-full p-1.5">
          {ADMIN_PHONE_ROOMS.map((r) => {
            const on = isActive(r);
            return (
              <Link
                key={r.href}
                href={r.href}
                aria-current={on ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
                className={`flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-[12px] font-semibold tracking-[0] transition-[background,color,width] duration-300 active:scale-[0.98] ${
                  on ? "bg-shell text-ink shadow-lift" : "text-mist"
                }`}
              >
                <RoomGlyph room={r} className={`h-5 w-5 shrink-0 ${on ? "text-gold" : "text-mist"}`} />
                {on && <span>{r.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-label="More rooms"
          className={`glass pointer-events-auto relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors duration-300 active:scale-[0.98] ${
            moreOn ? "text-gold" : "text-mist"
          }`}
        >
          <IconMore className="h-5 w-5" />
          {owed > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold leading-5 text-[#17150f]">
              {owed}
            </span>
          )}
        </button>
        <Link
          href={action.href}
          target={action.external ? "_blank" : undefined}
          rel={action.external ? "noreferrer" : undefined}
          onClick={() => setMoreOpen(false)}
          className="btn-gold pointer-events-auto flex h-14 max-w-[9rem] shrink-0 items-center gap-2 px-3 text-[12px] shadow-lift active:scale-[0.98]"
        >
          <RoomGlyph room={action.room} className="admin-action-icon h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate whitespace-nowrap">{action.label}</span>
        </Link>
      </div>
      {moreOpen && (
        <>
          <button
            aria-label="Close rooms"
            onClick={() => setMoreOpen(false)}
            className="filter-scrim layer-admin-scrim fixed inset-0 sm:hidden"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More rooms"
            className="filter-surface layer-admin-panel fixed inset-x-3 bottom-[calc(86px+env(safe-area-inset-bottom))] max-h-[min(72svh,32rem)] overflow-auto rounded-[28px] p-5 outline-none sm:hidden"
          >
            <div className="flex items-center justify-between px-2">
              <p className="eyebrow">More</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="link-hair text-dusk text-[12px]"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-1">
              {ADMIN_MORE_ROOMS.map((r) => {
                const on = isActive(r);
                return (
                  <Link
                    key={r.href}
                    href={r.href}
                    aria-current={on ? "page" : undefined}
                    onClick={() => setMoreOpen(false)}
                    className={`flex min-h-12 items-center justify-between rounded-[18px] px-5 text-[14px] transition-colors duration-200 active:scale-[0.99] ${
                      on ? "bg-shell text-ink shadow-lift" : "text-dusk"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <RoomGlyph room={r} className={`h-5 w-5 ${on ? "text-gold" : "text-mist"}`} />
                      {r.label}
                    </span>
                    {r.label === "Owed" && <CountPill n={owed} />}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
