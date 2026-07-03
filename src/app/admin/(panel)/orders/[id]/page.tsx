import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { naira } from "@/lib/backoffice";
import { STATUS_LABEL, fmtDate } from "../pipeline";
import StatusForm from "./StatusForm";
import AddLineForm from "./AddLineForm";
import AddPaymentForm from "./AddPaymentForm";
import Back from "../../Back";
import { Touch } from "../../touched";

/* The order record: one page that holds the whole sale. The steps
   across the top, every line with list beside given, the money
   against the balance. This page is why the book left paper. */

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
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

  const pieceOptions = await db
    .select({ slug: schema.pieces.slug, name: schema.pieces.name })
    .from(schema.pieces)
    .where(eq(schema.pieces.published, true))
    .orderBy(asc(schema.pieces.name));

  const billed = lines.reduce((s, l) => s + l.item.givenPriceKobo * l.item.quantity, 0);
  const paid = pays.reduce((s, p) => s + p.amountKobo, 0);
  const balance = billed - paid;

  return (
    <main>
      <Back href="/admin/orders" label="All orders" />
      <h1 className="font-serif text-display-section mt-6">{customer.name}</h1>
      <Touch href={`/admin/orders/${id}`} label={`${customer.name}'s order`} room="Orders" />
      <p className="mt-2 text-[13px] uppercase tracking-[0.14em] text-mist">
        Opened {fmtDate(order.createdAt)} · {STATUS_LABEL[order.status]}
      </p>
      {order.note && (
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">{order.note}</p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-6">
        <Link href={`/admin/customers/${customer.id}`} className="link-hair text-dusk text-[13px]">
          Their record
        </Link>
        <Link href={`/admin/invoice/${order.id}`} className="link-hair text-dusk text-[13px]">
          The invoice
        </Link>
        {/* Compose from the book: the message reads the order fresh
            on the way out, and WhatsApp opens with it written. */}
        {customer.phone && (
          <>
            <a
              href={`/admin/compose?kind=quote&order=${order.id}`}
              target="_blank"
              rel="noreferrer"
              className="link-hair text-dusk text-[13px]"
            >
              Send the quote
            </a>
            <a
              href={`/admin/compose?kind=receipt&order=${order.id}`}
              target="_blank"
              rel="noreferrer"
              className="link-hair text-dusk text-[13px]"
            >
              Send the receipt
            </a>
          </>
        )}
      </div>

      <div className="max-w-3xl">
        <section className="panel mt-10">
          <p className="font-serif text-[20px]">Where it stands</p>
          <StatusForm orderId={order.id} status={order.status} />
        </section>

        <section className="mt-12">
          <p className="eyebrow">The lines</p>
          {lines.length === 0 && (
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">
              No lines yet. The first line is what turns an enquiry into a
              quote.
            </p>
          )}
          {lines.length > 0 && (
            <div className="mt-4 grid gap-4">
              {lines.map(({ item, pieceName }) => {
                const lineGap =
                  item.listPriceKobo > item.givenPriceKobo
                    ? (item.listPriceKobo - item.givenPriceKobo) * item.quantity
                    : 0;
                return (
                  <div key={item.id} className="panel">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-serif text-[18px] leading-snug">
                          {pieceName ?? (item.description || "Line")}
                        </p>
                        {pieceName && item.description && (
                          <p className="mt-1 text-[13px] text-dusk">{item.description}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-[13px] text-dusk">x{item.quantity}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[13px] text-dusk">
                        List {naira(item.listPriceKobo)} · Given {naira(item.givenPriceKobo)}
                      </p>
                      {lineGap > 0 && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                          {naira(lineGap)} below list
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {lines.length > 0 && (
            <div className="mt-5 flex items-baseline justify-between">
              <p className="eyebrow">Billed</p>
              <p className="font-serif text-[22px]">{naira(billed)}</p>
            </div>
          )}
          {lines.length > 0 && (
            <p className="mt-4 text-[13px] text-dusk">
              Wrong line? Add a corrected one; nothing is ever lost.
            </p>
          )}
          <AddLineForm orderId={order.id} pieces={pieceOptions} />
        </section>

        <section className="mt-12">
          <p className="eyebrow">Payments</p>
          {pays.length === 0 && (
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">
              Nothing recorded yet. Every naira that arrives goes in here,
              and the balance keeps itself.
            </p>
          )}
          {pays.length > 0 && (
            <div className="mt-4 grid gap-4">
              {pays.map((p) => (
                <div
                  key={p.id}
                  className="panel flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-serif text-[18px] leading-snug">{naira(p.amountKobo)}</p>
                    <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-mist">
                      {p.method} · {fmtDate(p.paidAt)}
                    </p>
                  </div>
                  {p.note && <p className="text-[13px] text-dusk">{p.note}</p>}
                </div>
              ))}
            </div>
          )}
          {(billed > 0 || paid > 0) && (
            <div className="mt-5">
              <p className="text-[13px] text-dusk">Paid {naira(paid)}</p>
              {balance > 0 ? (
                <p className="mt-2 font-serif text-[26px]">Balance {naira(balance)}</p>
              ) : (
                <p className="mt-2 text-[13px] text-dusk">Settled in full.</p>
              )}
            </div>
          )}
          <AddPaymentForm orderId={order.id} />
        </section>
      </div>
    </main>
  );
}
