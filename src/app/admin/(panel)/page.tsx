import Link from "next/link";
import { readAdminPulse } from "@/lib/admin-pulse";
import RefreshLine from "./RefreshLine";
import { TourOffer } from "./Tour";
import { LastTouched } from "./touched";
import { computeAttention } from "@/lib/attention";
import { ADMIN_ROOMS, type AdminRoomId } from "@/lib/admin-rooms";
import { IconOrders, IconOwed, IconPeople, IconStock } from "./icons";

/* The morning glance: five numbers that used to live on paper.
   Force-dynamic because a back office is never stale; the queries run
   per request, never at build. */

export const dynamic = "force-dynamic";

function naira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/* Each card wears its room's glyph, so the eye can walk from a number
   here to the same shape on the rail. A warning number dresses in the
   deep gold and carries a dot beside its label; the label word itself
   says why. */
const CARD_GLYPHS = {
  stock: IconStock,
  orders: IconOrders,
  owed: IconOwed,
  people: IconPeople,
} as const;

type CardRoom = keyof typeof CARD_GLYPHS;

async function pulse() {
  const data = await readAdminPulse();
  if (!data.ok) return { ok: false as const, cards: [] };
  return {
    ok: true as const,
    cards: [
      { label: "Pieces in the catalogue", value: String(data.pieces), href: "/admin/pieces", room: "stock" as CardRoom, warn: false },
      /* Straight to the shelf, already filtered to the empties. */
      { label: "Stock warnings", value: String(data.lowStock), href: "/admin/pieces?low=1", room: "stock" as CardRoom, warn: data.lowStock > 0 },
      { label: "Open orders", value: String(data.openOrders), href: "/admin/orders", room: "orders" as CardRoom, warn: false },
      /* Never a negative on the glance: net overpayment reads as
         nothing owed, and the credit story lives on the order. */
      { label: "Outstanding", value: naira(data.outstandingKobo), href: "/admin/debts", room: "owed" as CardRoom, warn: false },
      { label: "New enquiries", value: String(data.freshEnquiries), href: "/admin/customers#enquiries", room: "people" as CardRoom, warn: data.freshEnquiries > 0 },
    ],
  };
}

/* The floor plan under the numbers, phone and tablet only: the desk
   already carries every room on the rail. Names come from the one
   room list, so a room is called the same thing everywhere. */
const DAILY_ROOM_IDS: readonly AdminRoomId[] = ["stock", "orders", "people"];
const DAILY_ROOMS = ADMIN_ROOMS.filter((room) => DAILY_ROOM_IDS.includes(room.id));
const QUIET_ROOMS = ADMIN_ROOMS.filter(
  (room) => room.id !== "home" && !DAILY_ROOM_IDS.includes(room.id)
);

export default async function AdminHome() {
  const [p, attention] = await Promise.all([pulse(), computeAttention()]);
  return (
    <main>
      {/* Home wears two faces: today, and the longer story. */}
      <div className="flex gap-2">
        <span className="chip-solid is-on">Today</span>
        <Link href="/admin/insights" className="chip-solid">
          Insights
        </Link>
      </div>
      {/* Title left, the one gold right on the desk; the phone
          wraps the button back under the thumb. */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-7">
        <div>
          <h1 className="font-serif text-display-section">The house, in numbers.</h1>
          <RefreshLine />
        </div>
        <div data-tour="new-order" className="flex flex-col items-end gap-3">
          <Link href="/admin/orders/new" className="btn-gold admin-page-action">
            New order
          </Link>
          <Link href="/admin/share" className="link-hair text-dusk text-[12px]">
            From WhatsApp
          </Link>
        </div>
      </div>

      {attention.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <span className="eyebrow">Needs your eye</span>
          {attention.map((a) => (
            <Link key={a.key} href={a.href} className="link-hair text-[14px] text-dusk">
              {a.text}
            </Link>
          ))}
        </div>
      )}

      {!p.ok && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">The book is quiet.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Refresh once. If it stays quiet, ask for help.
          </p>
        </div>
      )}

      {p.ok && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-tour="pulse">
          {p.cards.map((c) => {
            const Glyph = CARD_GLYPHS[c.room];
            return (
              <Link key={c.label} href={c.href} className="panel group block transition-transform duration-300 active:scale-[0.99]">
                <p className="flex items-center gap-2">
                  <Glyph className="h-4 w-4 shrink-0 text-mist" />
                  <span className="eyebrow">{c.label}</span>
                  {c.warn && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-deep" />}
                </p>
                <p
                  className={`font-serif mt-3 text-[26px] leading-none transition-colors duration-300 group-hover:text-gold ${
                    c.warn ? "font-semibold text-gold-deep" : ""
                  }`}
                >
                  {c.value}
                </p>
              </Link>
            );
          })}
          {/* Rooms of different sizes, like a floor plan: the daily
              three wear serif, the occasional six wrap as a quiet
              cloud. Size is frequency, the mosaic is typographic,
              and nothing new is ornamental. */}
          <div className="panel flex flex-col justify-center xl:hidden">
            <p className="eyebrow">The rooms</p>
            <ul className="mt-5 space-y-3">
              {DAILY_ROOMS.map((room) => (
                <li key={room.id}>
                  <Link href={room.href} className="font-serif block text-[20px] leading-snug transition-colors duration-300 hover:text-gold">
                    {room.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3.5">
              {QUIET_ROOMS.map((room) => (
                <li key={room.id}>
                  <Link href={room.href} className="link-hair text-dusk text-[12px]">
                    {room.label}
                  </Link>
                </li>
              ))}
              <li><Link href="/" className="link-hair text-dusk text-[12px]">The site</Link></li>
            </ul>
          </div>
        </div>
      )}

      {/* The tour offer speaks to the new hand; it waits under the
          numbers so the glance stays a glance, even on a phone. */}
      <TourOffer />

      <LastTouched />
    </main>
  );
}
