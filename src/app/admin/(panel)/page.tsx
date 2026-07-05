import Link from "next/link";
import { readAdminPulse } from "@/lib/admin-pulse";
import RefreshLine from "./RefreshLine";
import { TourOffer } from "./Tour";
import { LastTouched } from "./touched";

/* The morning glance: five numbers that used to live on paper.
   Force-dynamic because a back office is never stale; the queries run
   per request, never at build. */

export const dynamic = "force-dynamic";

function naira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

async function pulse() {
  const data = await readAdminPulse();
  if (!data.ok) return { ok: false as const, cards: [] };
  return {
    ok: true as const,
    cards: [
      { label: "Pieces in the catalogue", value: String(data.pieces), note: "published and drafts", href: "/admin/pieces" },
      { label: "Stock warnings", value: String(data.lowStock), note: "at or below reorder level", href: "/admin/pieces" },
      { label: "Open orders", value: String(data.openOrders), note: "quoted through delivered", href: "/admin/orders" },
      /* Never a negative on the glance: net overpayment reads as
         nothing owed, and the credit story lives on the order. */
      { label: "Outstanding", value: naira(data.outstandingKobo), note: "billed minus paid, open orders", href: "/admin/debts" },
      { label: "New enquiries", value: String(data.freshEnquiries), note: "unanswered", href: "/admin/customers" },
    ],
  };
}

export default async function AdminHome() {
  const p = await pulse();
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
        <div data-tour="new-order">
          <Link href="/admin/orders/new" className="btn-gold admin-page-action">
            New order
          </Link>
        </div>
      </div>
      {/* The tour offer speaks to the new hand, whose numbers are
          still zeros; it may sit above them. The trail serves the
          returning hand, so it waits below the pulse. */}
      <TourOffer />

      {!p.ok && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">The database is not answering.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Check DATABASE_URL, then refresh. The shop window stands on
            its built-in catalogue whenever the book is quiet, so
            customers see nothing of this.
          </p>
        </div>
      )}

      {p.ok && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-tour="pulse">
          {p.cards.map((c) => (
            <Link key={c.label} href={c.href} className="panel group block transition-transform duration-300 active:scale-[0.99]">
              <p className="eyebrow">{c.label}</p>
              <p className="font-serif mt-3 text-[26px] leading-none transition-colors duration-300 group-hover:text-gold">{c.value}</p>
              <p className="mt-3 text-[12px] uppercase tracking-[0.14em] text-mist">{c.note}</p>
            </Link>
          ))}
          {/* Rooms of different sizes, like a floor plan: the daily
              three wear serif, the occasional six wrap as a quiet
              cloud. Size is frequency, the mosaic is typographic,
              and nothing new is ornamental. */}
          <div className="panel flex flex-col justify-center">
            <p className="eyebrow">The rooms</p>
            <ul className="mt-5 space-y-3">
              <li><Link href="/admin/pieces" className="font-serif block text-[20px] leading-snug transition-colors duration-300 hover:text-gold">The stockroom</Link></li>
              <li><Link href="/admin/orders" className="font-serif block text-[20px] leading-snug transition-colors duration-300 hover:text-gold">Orders</Link></li>
              <li><Link href="/admin/customers" className="font-serif block text-[20px] leading-snug transition-colors duration-300 hover:text-gold">Customers</Link></li>
            </ul>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3.5">
              <li><Link href="/admin/deliveries" className="link-hair text-dusk text-[12px]">Deliveries</Link></li>
              <li><Link href="/admin/media" className="link-hair text-dusk text-[12px]">Photos</Link></li>
              <li><Link href="/admin/debts" className="link-hair text-dusk text-[12px]">Who owes what</Link></li>
              <li><Link href="/admin/insights" className="link-hair text-dusk text-[12px]">Insights</Link></li>
              <li><Link href="/admin/settings" className="link-hair text-dusk text-[12px]">Settings</Link></li>
              <li><Link href="/" className="link-hair text-dusk text-[12px]">The site</Link></li>
              <li>
                <button data-tour-start="menu" className="link-hair text-dusk text-[12px]">
                  Take the tour
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      <LastTouched />
    </main>
  );
}
