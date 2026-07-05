import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { naira } from "@/lib/backoffice";
import { STATUS_LABEL, fmtDate } from "../pipeline";
import StatusForm from "./StatusForm";
import AddLineForm from "./AddLineForm";
import AddPaymentForm from "./AddPaymentForm";
import AddReturnForm from "./AddReturnForm";
import Back from "../../Back";
import Teach from "../../Teach";
import { Touch } from "../../touched";

/* The order record: one page that holds the whole sale. The steps
   across the top, every line with list beside given, the money
   against the balance. This page is why the book left paper. */

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type ShellAction = {
  href: string;
  label: string;
  room: "owed" | "deliveries" | "orders";
  external?: boolean;
};

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
    .select({
      item: schema.orderItems,
      pieceName: schema.pieces.name,
      pieceUnit: schema.pieces.unit,
    })
    .from(schema.orderItems)
    .leftJoin(schema.pieces, eq(schema.pieces.slug, schema.orderItems.pieceSlug))
    .where(eq(schema.orderItems.orderId, id));

  /* What crossing the door would physically move: the piece lines,
     named with quantity and unit, so the confirm can say the exact
     movement before it runs. Free-text lines move nothing. */
  const movementByPiece = new Map<string, { name: string; qty: number; unit: string }>();
  const returnedByLine = new Map<string, number>();
  for (const l of lines) {
    if (l.item.quantity < 0 && l.item.returnForItemId) {
      returnedByLine.set(
        l.item.returnForItemId,
        (returnedByLine.get(l.item.returnForItemId) ?? 0) + Math.abs(l.item.quantity)
      );
    }
    if (l.item.pieceSlug && l.pieceName) {
      const current = movementByPiece.get(l.item.pieceSlug) ?? {
        name: l.pieceName,
        qty: 0,
        unit: l.pieceUnit ?? "units",
      };
      current.qty += l.item.quantity;
      movementByPiece.set(l.item.pieceSlug, current);
    }
  }
  const movements = [...movementByPiece.values()]
    .filter((m) => m.qty > 0)
    .map((m) => ({ ...m, qty: m.qty }));
  const returnOptions = lines
    .filter((l) => l.item.quantity > 0)
    .map((l) => {
      const available = l.item.quantity - (returnedByLine.get(l.item.id) ?? 0);
      return {
        id: l.item.id,
        name: l.pieceName ?? (l.item.description || "Line"),
        unit: l.pieceUnit ?? "units",
        available,
        valueKobo: l.item.givenPriceKobo,
      };
    })
    .filter((l) => l.available > 0);

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
  const navAction: ShellAction =
    balance > 0
      ? { href: `/admin/orders/${order.id}#payment`, label: "Add payment", room: "owed" }
      : order.status !== "delivered" && order.status !== "settled"
        ? { href: `/admin/deliveries/new?order=${order.id}`, label: "Arrange delivery", room: "deliveries" }
        : customer.phone
          ? {
              href: `/admin/compose?kind=receipt&order=${order.id}`,
              label: "Send receipt",
              room: "orders",
              external: true,
            }
          : { href: `/admin/invoice/${order.id}`, label: "The invoice", room: "orders" };

  return (
    <main>
      <span
        hidden
        data-admin-action
        data-href={navAction.href}
        data-label={navAction.label}
        data-room={navAction.room}
        data-external={navAction.external ? "true" : undefined}
      />
      <Back href="/admin/orders" label="All orders" />
      <h1 className="font-serif text-display-section mt-6">{customer.name}</h1>
      <Touch href={`/admin/orders/${id}`} label={`${customer.name}'s order`} room="Orders" />
      <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-mist">
        Opened {fmtDate(order.createdAt)} · {STATUS_LABEL[order.status]}
      </p>
      {order.note && (
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">{order.note}</p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-6">
        <Link href={`/admin/customers/${customer.id}`} className="link-hair text-dusk text-[12px]">
          Their record
        </Link>
        <Link href={`/admin/invoice/${order.id}`} className="link-hair text-dusk text-[12px]">
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
              className="link-hair text-dusk text-[12px]"
            >
              Send the quote
            </a>
            <a
              href={`/admin/compose?kind=receipt&order=${order.id}`}
              target="_blank"
              rel="noreferrer"
              className="link-hair text-dusk text-[12px]"
            >
              Send the receipt
            </a>
          </>
        )}
      </div>

      {/* The desk sees the two losses face each other: lines on the
          left, payments on the right, law 6 side by side. The phone
          keeps the single file it always read. */}
      <div className="mt-10 grid max-w-3xl items-start gap-x-10 gap-y-12 xl:max-w-none xl:grid-cols-2">
        <section className="panel xl:col-span-2">
          <p className="font-serif text-[20px]">Where it stands</p>
          <StatusForm orderId={order.id} status={order.status} movements={movements} />
        </section>

        <section data-tour="order-lines">
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
                const isReturn = item.quantity < 0;
                const lineGap =
                  !isReturn && item.listPriceKobo > item.givenPriceKobo
                    ? (item.listPriceKobo - item.givenPriceKobo) * item.quantity
                    : 0;
                return (
                  <div key={item.id} className="panel">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-serif text-[20px] leading-snug">
                          {pieceName ?? (item.description || "Line")}
                        </p>
                        {pieceName && item.description && (
                          <p className="mt-1 text-[14px] text-dusk">{item.description}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-[14px] text-dusk">
                        {isReturn ? `Returned x${Math.abs(item.quantity)}` : `x${item.quantity}`}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[14px] text-dusk">
                        List {naira(item.listPriceKobo)} · Given {naira(item.givenPriceKobo)}
                      </p>
                      {isReturn && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">
                          Return · {naira(item.givenPriceKobo * item.quantity)}
                        </p>
                      )}
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
              <p className="font-serif text-[20px]">{naira(billed)}</p>
            </div>
          )}
          {lines.length > 0 && (
            <Teach until="orders">
              <p className="mt-4 text-[14px] text-dusk">
                Wrong line? Add a corrected one; nothing is ever lost.
              </p>
            </Teach>
          )}
          <AddLineForm orderId={order.id} pieces={pieceOptions} />
        </section>

        <section>
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
                    <p className="font-serif text-[20px] leading-snug">{naira(p.amountKobo)}</p>
                    <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-mist">
                      {p.amountKobo < 0 ? "refund" : p.method} · {fmtDate(p.paidAt)}
                    </p>
                  </div>
                  {p.note && <p className="text-[14px] text-dusk">{p.note}</p>}
                </div>
              ))}
            </div>
          )}
          {(billed > 0 || paid > 0) && (
            <div className="mt-5">
              <p className="text-[14px] text-dusk">Paid {naira(paid)}</p>
              {balance > 0 ? (
                <p className="mt-2 font-serif text-[26px]">Balance {naira(balance)}</p>
              ) : balance < 0 ? (
                <p className="mt-2 font-serif text-[26px]">Credit {naira(Math.abs(balance))}</p>
              ) : (
                <p className="mt-2 text-[14px] text-dusk">Settled in full.</p>
              )}
            </div>
          )}
          <AddPaymentForm orderId={order.id} />
          <AddReturnForm orderId={order.id} lines={returnOptions} />
        </section>
      </div>
    </main>
  );
}
