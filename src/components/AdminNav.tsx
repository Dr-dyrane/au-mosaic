"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* Wayfinding for the back office, HIG style: you can always see
   where you are, and the primary rooms are always one tap away. On
   the phone that means a tab bar under the thumb; on the desk, a
   quiet row in the header. The current room holds ink; the others
   whisper. */

const ROOMS = [
  { href: "/admin", label: "Home", exact: true, also: [] as string[] },
  { href: "/admin/pieces", label: "Stock", exact: false, also: ["/admin/ranges"] },
  { href: "/admin/orders", label: "Orders", exact: false, also: [] as string[] },
  { href: "/admin/customers", label: "People", exact: false, also: [] as string[] },
  { href: "/admin/debts", label: "Owed", exact: false, also: [] as string[] },
];

function useActive() {
  const pathname = usePathname();
  return (room: (typeof ROOMS)[number]) =>
    room.exact
      ? pathname === room.href
      : pathname.startsWith(room.href) || room.also.some((a) => pathname.startsWith(a));
}

/* A quiet gold count beside a room's name: how many people owe. */
function CountPill({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span aria-label={`${n} owing`} className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-gold/15 px-1 text-[10px] font-semibold leading-4 text-gold">
      {n}
    </span>
  );
}

export function AdminTopNav({ owed = 0 }: { owed?: number }) {
  const isActive = useActive();
  return (
    <nav aria-label="Back office" className="hidden items-center gap-6 sm:flex">
      {ROOMS.map((r) => (
        <Link
          key={r.href}
          href={r.href}
          aria-current={isActive(r) ? "page" : undefined}
          className={`text-[13px] transition-colors duration-300 ${
            isActive(r) ? "font-semibold text-ink" : "text-dusk hover:text-ink"
          }`}
        >
          {r.label}
          {r.label === "Owed" && <CountPill n={owed} />}
        </Link>
      ))}
    </nav>
  );
}

export function AdminTabBar({ owed = 0 }: { owed?: number }) {
  const isActive = useActive();
  return (
    <nav
      aria-label="Back office"
      className="glass fixed inset-x-0 bottom-0 z-40 flex rounded-none pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      {ROOMS.map((r) => {
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
              className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
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
