import Link from "next/link";
import { count, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

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
      .where(sql`${schema.stockLevels.quantitySheets} <= ${schema.stockLevels.reorderAt}`);
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
        { label: "Pieces in the catalogue", value: String(pieces.n), note: "published and drafts" },
        { label: "Stock warnings", value: String(low.n), note: "at or below reorder level" },
        { label: "Open orders", value: String(open.n), note: "quoted through delivered" },
        { label: "Outstanding", value: naira(Number(owed.kobo)), note: "billed minus paid, open orders" },
        { label: "New enquiries", value: String(fresh.n), note: "unanswered" },
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
      <p className="eyebrow">This morning</p>
      <h1 className="font-serif text-display-section mt-3">The house, in numbers.</h1>

      {!p.ok && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">The database is not answering.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Check DATABASE_URL, then refresh. The public site is unaffected;
            it does not read from here yet.
          </p>
        </div>
      )}

      {p.ok && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {p.cards.map((c) => (
            <div key={c.label} className="panel">
              <p className="eyebrow">{c.label}</p>
              <p className="font-serif mt-3 text-[34px] leading-none">{c.value}</p>
              <p className="mt-3 text-[12px] uppercase tracking-[0.14em] text-mist">{c.note}</p>
            </div>
          ))}
          <Link href="/admin/pieces" className="panel group flex flex-col justify-center transition-transform duration-300 active:scale-[0.99]">
            <p className="font-serif text-[20px] transition-colors duration-300 group-hover:text-gold">
              Manage the pieces
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-dusk">
              Words, colours, stock, and what shows on the site. Orders,
              debts, and deliveries follow as the rooms are built.
            </p>
            <span className="link-hair mt-5 text-dusk text-[13px]">Enter the stockroom</span>
          </Link>
        </div>
      )}
    </main>
  );
}
