import Link from "next/link";
import { count, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
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
  try {
    const db = getDb();
    const [pieces] = await db.select({ n: count() }).from(schema.pieces);
    const [low] = await db
      .select({ n: count() })
      .from(schema.stockLevels)
      /* Warn-me-at 0 means he never asked to be warned. */
      .where(sql`${schema.stockLevels.reorderAt} > 0 and ${schema.stockLevels.quantitySheets} <= ${schema.stockLevels.reorderAt}`);
    const [open] = await db
      .select({ n: count() })
      .from(schema.orders)
      .where(ne(schema.orders.status, "settled"));
    const [fresh] = await db
      .select({ n: count() })
      .from(schema.enquiries)
      .where(eq(schema.enquiries.status, "new"));
    const [owed] = await db
      .select({
        kobo: sql<number>`coalesce((select sum(${schema.orderItems.givenPriceKobo} * ${schema.orderItems.quantity}) from ${schema.orderItems} join ${schema.orders} o on o.id = ${schema.orderItems.orderId} where o.status not in ('enquiry','settled')),0) - coalesce((select sum(${schema.payments.amountKobo}) from ${schema.payments} join ${schema.orders} o2 on o2.id = ${schema.payments.orderId} where o2.status not in ('enquiry','settled')),0)`,
      })
      .from(sql`(select 1) as one`);
    return {
      ok: true as const,
      cards: [
        { label: "Pieces in the catalogue", value: String(pieces.n), note: "published and drafts", href: "/admin/pieces" },
        { label: "Stock warnings", value: String(low.n), note: "at or below reorder level", href: "/admin/pieces" },
        { label: "Open orders", value: String(open.n), note: "quoted through delivered", href: "/admin/orders" },
        /* Never a negative on the glance: net overpayment reads as
           nothing owed, and the credit story lives on the order. */
        { label: "Outstanding", value: naira(Math.max(0, Number(owed.kobo))), note: "billed minus paid, open orders", href: "/admin/debts" },
        { label: "New enquiries", value: String(fresh.n), note: "unanswered", href: "/admin/customers" },
      ],
    };
  } catch {
    return { ok: false as const, cards: [] };
  }
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
      <h1 className="font-serif text-display-section mt-8">The house, in numbers.</h1>
      <RefreshLine />
      <div className="mt-7" data-tour="new-order">
        <Link href="/admin/orders/new" className="btn-gold">
          New order
        </Link>
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
              <li><Link href="/admin/pieces" className="font-serif block text-[21px] leading-snug transition-colors duration-300 hover:text-gold">The stockroom</Link></li>
              <li><Link href="/admin/orders" className="font-serif block text-[21px] leading-snug transition-colors duration-300 hover:text-gold">Orders</Link></li>
              <li><Link href="/admin/customers" className="font-serif block text-[21px] leading-snug transition-colors duration-300 hover:text-gold">Customers</Link></li>
            </ul>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3.5">
              <li><Link href="/admin/deliveries" className="link-hair text-dusk text-[13px]">Deliveries</Link></li>
              <li><Link href="/admin/debts" className="link-hair text-dusk text-[13px]">Who owes what</Link></li>
              <li><Link href="/admin/insights" className="link-hair text-dusk text-[13px]">Insights</Link></li>
              <li><Link href="/admin/settings" className="link-hair text-dusk text-[13px]">Settings</Link></li>
              <li><Link href="/" className="link-hair text-dusk text-[13px]">The site</Link></li>
              <li>
                <button data-tour-start="menu" className="link-hair text-dusk text-[13px]">
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
