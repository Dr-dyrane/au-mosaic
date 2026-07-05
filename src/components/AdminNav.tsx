"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_ROOMS, ADMIN_TABS, type AdminRoom, isActiveRoom } from "@/lib/admin-rooms";

/* Wayfinding for the back office, HIG style: you can always see
   where you are, and the primary rooms are always one tap away. On
   the phone that means a tab bar under the thumb; on the desk, a
   persistent rail. The current room holds ink; the others whisper. */

function useActive() {
  const pathname = usePathname();
  return (room: AdminRoom) => isActiveRoom(room, pathname);
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
      {ADMIN_ROOMS.map((r) => (
        <Link
          key={r.href}
          href={r.href}
          aria-current={isActive(r) ? "page" : undefined}
          className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors duration-300 ${
            isActive(r)
              ? "bg-shell text-ink shadow-lift"
              : "text-dusk hover:bg-shell/40 hover:text-ink"
          }`}
        >
          {r.label}
          {r.label === "Owed" && <CountPill n={owed} />}
        </Link>
      ))}
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
            className={`group flex items-center justify-between rounded-full px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] transition-[background,color,transform] duration-300 active:scale-[0.98] ${
              on ? "bg-shell text-ink shadow-lift" : "text-dusk hover:bg-shell/35 hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full transition-opacity duration-300 ${
                  on ? "bg-gold opacity-100" : "bg-mist opacity-35 group-hover:opacity-70"
                }`}
              />
              {r.label}
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
        return (
          <Link
            key={r.href}
            href={r.href}
            aria-current={on ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1.5 pb-3 pt-3.5"
          >
            <span
              aria-hidden
              className={`h-1 w-1 rounded-full transition-opacity duration-300 ${
                on ? "bg-gold opacity-100" : "opacity-0"
              }`}
            />
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
