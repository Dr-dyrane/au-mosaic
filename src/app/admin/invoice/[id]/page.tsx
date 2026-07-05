import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { naira } from "@/lib/backoffice";
import { SITE } from "@/lib/site";
import Image from "next/image";
import PrintButton from "../PrintButton";

/* The invoice: a sheet of paper, not a screen. It lives outside the
   panel chrome so nothing office-shaped prints, wears paper white in
   both suns because toner has one theme, and shows the customer only
   given prices; the gap to list is the owner's number, not theirs.
   Balances are computed fresh like everywhere else, never stored. */

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await hasSession())) redirect("/admin/login");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const db = getDb();
  const [row] = await db
    .select({ order: schema.orders, customer: schema.customers })
    .from(schema.orders)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
    .where(eq(schema.orders.id, id));
  if (!row) notFound();
  const { order, customer } = row;

  const lines = await db
    .select({ item: schema.orderItems, pieceName: schema.pieces.name })
    .from(schema.orderItems)
    .leftJoin(schema.pieces, eq(schema.pieces.slug, schema.orderItems.pieceSlug))
    .where(eq(schema.orderItems.orderId, id));

  const pays = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, id))
    .orderBy(asc(schema.payments.paidAt));

  /* House facts prefer the settings table; site.ts stands behind it. */
  let facts: Record<string, string> = {};
  try {
    const rows = await db.select().from(schema.settings);
    facts = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {}
  const phone = facts.phone_display || SITE.phoneDisplay;
  const location = facts.location || SITE.location;

  const billed = lines.reduce((s, l) => s + l.item.givenPriceKobo * l.item.quantity, 0);
  const paid = pays.reduce((s, p) => s + p.amountKobo, 0);
  const balance = billed - paid;

  return (
    <main className="min-h-svh px-4 py-10 print:p-0 sm:py-16">
      <div className="mx-auto mb-8 flex max-w-[210mm] items-center justify-between gap-6 print-hide">
        <Link href={`/admin/orders/${order.id}`} className="link-hair text-dusk text-[13px]">
          Back to the order
        </Link>
        <PrintButton />
      </div>

      <div className="print-sheet mx-auto max-w-[210mm] rounded-[28px] bg-white p-10 text-[#17150F] shadow-lift sm:p-14">
        <header className="flex items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 text-[#17150F]">
              {/* Paper carries the owner's file: toner has one theme. */}
              <Image
                src="/media/logo/mark.png"
                alt="AU Mosaic"
                width={473}
                height={360}
                className="h-[16px] w-auto"
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Mosaic
              </span>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-[#5D564A]">
              {SITE.name}
              <br />
              {location}
              <br />
              {phone}
            </p>
          </div>
          <div className="flex flex-col items-end text-right">
            {/* Five tesserae: the house in miniature, the one ornament. */}
            <span aria-hidden className="flex gap-1">
              {["#C2A15C", "#8F7434", "#5D564A", "#B8B2A6", "#17150F"].map((c) => (
                <span key={c} className="h-2 w-2" style={{ background: c }} />
              ))}
            </span>
            <p className="font-serif mt-3 text-[26px]">Invoice</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#5D564A]">
              Order {order.id.slice(0, 8)}
              <br />
              Opened {fmtDate(order.createdAt)}
              <br />
              Issued {fmtDate(new Date())}
            </p>
          </div>
        </header>

        <section className="mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#856A30]">
            Billed to
          </p>
          <p className="font-serif mt-2 text-[20px]">{customer.name}</p>
          <p className="mt-1 text-[12px] text-[#5D564A]">
            {[customer.phone, customer.area].filter(Boolean).join(" · ")}
          </p>
        </section>

        <section className="mt-10">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#856A30]">
                <th className="pb-3 pr-4 font-semibold">Item</th>
                <th className="pb-3 pr-4 text-right font-semibold">Qty</th>
                <th className="pb-3 pr-4 text-right font-semibold">Each</th>
                <th className="pb-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {lines.map(({ item, pieceName }) => {
                const isReturn = item.quantity < 0;
                const name = isReturn ? item.description || `Return: ${pieceName ?? "work"}` : pieceName ?? (item.description || "Work");
                return (
                  <tr key={item.id}>
                    <td className="py-3 pr-4 align-top">
                      <span className="font-serif text-[15px]">{name}</span>
                      {!isReturn && pieceName && item.description && (
                        <span className="block text-[11px] text-[#746C57]">{item.description}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right align-top tabular-nums">
                      {isReturn ? `Returned ${Math.abs(item.quantity)}` : item.quantity}
                    </td>
                    <td className="py-3 pr-4 text-right align-top tabular-nums">{naira(item.givenPriceKobo)}</td>
                    <td className="py-3 text-right align-top tabular-nums">
                      {naira(item.givenPriceKobo * item.quantity)}
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-[#5D564A]">
                    No lines on this order yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="mt-8 ml-auto max-w-[16rem] text-right">
          <div className="flex items-baseline justify-between gap-6 text-[13px]">
            <span className="text-[#5D564A]">Billed</span>
            <span className="tabular-nums">{naira(billed)}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-6 text-[13px]">
            <span className="text-[#5D564A]">Paid to date</span>
            <span className="tabular-nums">{naira(paid)}</span>
          </div>
          {/* The balance stands under its eyebrow, never beside it. */}
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#856A30]">
            {balance > 0 ? "Balance due" : balance === 0 ? "Settled" : "In credit"}
          </p>
          <p className="font-serif mt-1.5 text-[28px] leading-none tabular-nums">
            {naira(Math.abs(balance))}
          </p>
        </section>

        {pays.length > 0 && (
          <section className="mt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#856A30]">
              Payments and refunds
            </p>
            <div className="mt-3 text-[12px] leading-relaxed text-[#5D564A]">
              {pays.map((p) => (
                <p key={p.id}>
                  {fmtDate(p.paidAt)} · {naira(p.amountKobo)} by {p.amountKobo < 0 ? "refund" : p.method}
                  {p.note ? ` · ${p.note}` : ""}
                </p>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-14">
          <p className="font-serif text-[14px] text-[#5D564A]">
            Thank you for building with {SITE.shortName}.
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#5D564A]">
            Questions live on WhatsApp: {phone}
          </p>
          <p className="mt-6 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#746C57]">
            AU Mosaic and Pool Materials · Lagos · Foshan
          </p>
        </footer>
      </div>
    </main>
  );
}
