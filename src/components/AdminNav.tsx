"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconAdd,
  IconDeliveries,
  IconHome,
  IconInsights,
  IconOrders,
  IconOwed,
  IconPeople,
  IconPhotos,
  IconSettings,
  IconStock,
} from "@/app/admin/(panel)/icons";
import {
  ADMIN_PHONE_ROOMS,
  ADMIN_ROOMS,
  type AdminRoom,
  type AdminRoomId,
  isActiveRoom,
  roomForPath,
} from "@/lib/admin-rooms";
import {
  ADMIN_ACTION_INTENTS,
  dispatchAdminActionIntent,
  isPlainAdminClick,
  type AdminActionIntent,
} from "@/components/admin-action-intents";

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
  tour?: string;
  intent?: AdminActionIntent;
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
      tour: "order-new",
    };
  }

  if (/^\/admin\/pieces\/(?!new$)[^/]+/.test(pathname)) {
    return { href: `${pathname}#stock`, label: "Reorder", room: roomById("stock") };
  }

  const room = roomForPath(pathname);
  switch (room.id) {
    case "home":
      return { href: "/admin/orders/new", label: "New order", room: roomById("orders"), tour: "order-new" };
    case "stock":
      return { href: "/admin/pieces/new", label: "New piece", room: roomById("stock"), tour: "new-piece" };
    case "orders":
      return { href: "/admin/orders/new", label: "New order", room: roomById("orders"), tour: "order-new" };
    case "people":
      return { href: "/admin/customers/new", label: "New customer", room: roomById("people"), tour: "people-new" };
    case "owed":
      return { href: "/admin/debts", label: owed > 0 ? "Remind" : "Orders", room: roomById("owed") };
    case "deliveries":
      return { href: "/admin/deliveries/new", label: "New delivery", room: roomById("deliveries") };
    case "photos":
      return {
        href: "/admin/media#media-add-photo",
        label: "Add photo",
        room: roomById("photos"),
        intent: ADMIN_ACTION_INTENTS.mediaCreate,
      };
    case "insights":
      return { href: "/admin", label: "Today", room: roomById("home") };
    case "settings":
      return { href: "/admin/settings/history", label: "History", room: roomById("settings") };
  }
}

function ActionGlyph({ action }: { action: RoomAction }) {
  const addAction = /^(Add|New)\b/.test(action.label);
  if (addAction) return <IconAdd className="h-5 w-5" />;
  return <RoomGlyph room={action.room} className="h-5 w-5" />;
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
    tour: el.dataset.tour,
    intent: el.dataset.intent as AdminActionIntent | undefined,
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
      attributeFilter: ["data-admin-action", "data-href", "data-label", "data-room", "data-external", "data-tour", "data-intent"],
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
            className={`admin-glass-control group flex items-center justify-between rounded-full px-4 py-3 text-[14px] font-medium tracking-[0] active:scale-[0.98] ${
              on ? "is-on text-ink" : "text-dusk hover:bg-shell/35 hover:text-ink"
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
  const compact = useChromeCompact();
  const pageAction = usePageAction(pathname);
  const routeAction = useMemo(() => roomActionFor(pathname, owed), [pathname, owed]);
  const action = pageAction ?? routeAction;

  return (
    <>
      <div
        data-tour="rooms"
        className={`layer-admin-nav pointer-events-none fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] flex items-center justify-center gap-2 transition-transform duration-300 xl:hidden ${
          compact ? "translate-y-1 scale-[0.98]" : ""
        }`}
      >
        <nav aria-label="Back office rooms" className="glass liquid-glass pointer-events-auto flex h-14 items-center gap-1 rounded-full p-1.5">
          {ADMIN_PHONE_ROOMS.map((r) => {
            const on = isActive(r);
            return (
              <Link
                key={r.href}
                href={r.href}
                aria-current={on ? "page" : undefined}
                className={`admin-glass-control flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-[12px] font-semibold tracking-[0] active:scale-[0.98] ${
                  on ? "is-on text-ink" : "text-mist"
                }`}
              >
                <RoomGlyph room={r} className={`h-5 w-5 shrink-0 ${on ? "text-gold" : "text-mist"}`} />
                {on && <span>{r.label}</span>}
              </Link>
            );
          })}
        </nav>
        <Link
          href={action.href}
          target={action.external ? "_blank" : undefined}
          rel={action.external ? "noreferrer" : undefined}
          onClick={(event) => {
            if (!action.intent) return;
            if (!isPlainAdminClick(event)) return;
            event.preventDefault();
            dispatchAdminActionIntent(action.intent, action);
          }}
          aria-label={action.label}
          title={action.label}
          data-tour={action.tour}
          className="btn-gold admin-fab pointer-events-auto shadow-lift"
        >
          <ActionGlyph action={action} />
        </Link>
      </div>
    </>
  );
}
