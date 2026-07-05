"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
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
  isActiveRoom,
} from "@/lib/admin-rooms";
import {
  dispatchAdminActionIntent,
  isPlainAdminClick,
} from "@/components/admin-action-intents";
import {
  type AdminPageAction as RoomAction,
  useResolvedAdminAction,
} from "@/components/admin-page-action";

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
  const action = useResolvedAdminAction(pathname, owed);

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
