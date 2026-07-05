"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
import { ADMIN_ROOMS, ADMIN_TABS, type AdminRoom, isActiveRoom } from "@/lib/admin-rooms";

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
        const RoomIcon = ROOM_ICONS[r.id];
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
              <RoomIcon className={`h-5 w-5 shrink-0 ${on ? "text-gold" : "text-mist"}`} />
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
        const RoomIcon = ROOM_ICONS[r.id];
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
              <RoomIcon className={`h-5 w-5 shrink-0 ${on ? "text-gold" : "text-mist group-hover:text-dusk"}`} />
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
  const isActive = useActive();
  return (
    <nav
      aria-label="Back office"
      data-tour="rooms"
      className="glass fixed inset-x-0 bottom-0 z-40 flex rounded-none pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      {ADMIN_TABS.map((r) => {
        const on = isActive(r);
        const RoomIcon = ROOM_ICONS[r.id];
        return (
          <Link
            key={r.href}
            href={r.href}
            aria-current={on ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1.5 pb-3 pt-3.5"
          >
            <RoomIcon className={`h-5 w-5 ${on ? "text-gold" : "text-mist"}`} />
            <span
              className={`text-[11px] font-semibold leading-none tracking-[0] ${
                on ? "text-ink" : "text-mist"
              }`}
            >
              {r.label}
              {r.label === "Owed" && <CountPill n={owed} />}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
