import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { naira } from "@/lib/backoffice";
import { ADMIN_ACTION_INTENTS, type AdminActionIntent } from "@/components/admin-action-intents";
import { STATUS_LABEL, fmtDate } from "../pipeline";
import StatusForm from "./StatusForm";
import { OrderLineAction } from "./AddLineForm";
import { OrderPaymentAction } from "./AddPaymentForm";
import { OrderReturnAction } from "./AddReturnForm";
import Back from "../../Back";
import Teach from "../../Teach";
import { Touch } from "../../touched";
import ArchiveButton from "../../records/ArchiveButton";

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
  intent?: AdminActionIntent;
};
type ShellContextAction = {
  href: string;
  label: string;
  external?: boolean;
  intent?: AdminActionIntent;
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
        name: l.pieceName ?? (l.item.description || "Item"),
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
    lines.length === 0
      ? {
          href: `/admin/orders/${order.id}#order-line`,
          label: "Add item",
          room: "orders",
          intent: ADMIN_ACTION_INTENTS.orderLine,
        }
      : balance > 0
        ? {
            href: `/admin/orders/${order.id}#order-payment`,
            label: "Add payment",
            room: "owed",
            intent: ADMIN_ACTION_INTENTS.orderPayment,
          }
        : order.status !== "delivered" && order.status !== "settled"
          ? {
              href: `/admin/deliveries/new?order=${order.id}`,
              label: "Arrange delivery",
              room: "deliveries",
            }
          : customer.phone
            ? {
                href: `/admin/compose?kind=receipt&order=${order.id}`,
                label: "Send receipt",
                room: "orders",
                external: true,
              }
            : { href: `/admin/invoice/${order.id}`, label: "The invoice", room: "orders" };
  const contextActions = [
    {
      href: `/admin/orders/${order.id}#order-line`,
      label: "Add item",
      intent: ADMIN_ACTION_INTENTS.orderLine,
    },
    { href: `/admin/customers/${customer.id}`, label: "Their record" },
    { href: `/admin/invoice/${order.id}`, label: "The invoice" },
    customer.phone
      ? { href: `/admin/compose?kind=quote&order=${order.id}`, label: "Send quote", external: true }
      : null,
    customer.phone
      ? { href: `/admin/compose?kind=receipt&order=${order.id}`, label: "Send receipt", external: true }
      : null,
    returnOptions.length > 0
      ? {
          href: `/admin/orders/${order.id}#order-return`,
          label: "Record a return",
          intent: ADMIN_ACTION_INTENTS.orderReturn,
        }
      : null,
  ].flatMap((action): ShellContextAction[] => (action ? [action] : []));

  return (
    <main>
      <span
        hidden
        data-admin-action
        data-href={navAction.href}
        data-label={navAction.label}
        data-room={navAction.room}
        data-external={navAction.external ? "true" : undefined}
        data-intent={navAction.intent}
      />
      {contextActions.map((action) => (
        <span
          key={`${action.href}-${action.label}`}
          hidden
          data-admin-context-action
          data-href={action.href}
          data-label={action.label}
          data-external={action.external ? "true" : undefined}
          data-intent={action.intent}
        />
      ))}
      {/* The record's vitals for the context rail: written fresh by
          this render, so the rail stays true while the page scrolls. */}
      <span hidden data-admin-context-fact data-label="Status" data-value={STATUS_LABEL[order.status]} />
      <span
        hidden
        data-admin-context-fact
        data-label={balance < 0 ? "Credit" : "Balance"}
        data-value={naira(Math.abs(balance))}
      />
      <Back href="/admin/orders" label="All orders" />
      <p className="eyebrow mt-6">Orders</p>
      <h1 className="font-serif text-display-section mt-3">{customer.name}</h1>
      <Touch href={`/admin/orders/${id}`} label={`${customer.name}'s order`} room="Orders" />
      <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-mist">
        Opened {fmtDate(order.createdAt)} · {STATUS_LABEL[order.status]}
      </p>
      {order.note && (
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">{order.note}</p>
      )}

      {/* The desk sees the two losses face each other: lines on the
          left, payments on the right, law 6 side by side. The phone
          keeps the single file it always read. */}
      <div className="mt-10 grid max-w-3xl items-start gap-x-10 gap-y-12 xl:max-w-none xl:grid-cols-2">
        {/* Section titles are h2 so the record reads as an outline:
            the customer's name, then each part of the sale. */}
        <section className="panel xl:col-span-2">
          <h2 className="font-serif text-[20px]">Where it stands</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <div>
              <p className="eyebrow">Billed</p>
              <p className="money font-serif mt-2 text-[26px] leading-none">{naira(billed)}</p>
            </div>
            <div>
              <p className="eyebrow">Paid</p>
              <p className="money font-serif mt-2 text-[26px] leading-none">{naira(paid)}</p>
            </div>
            <div>
              <p className="eyebrow">{balance < 0 ? "Credit" : "Balance"}</p>
              <p className="money font-serif mt-2 text-[26px] leading-none">
                {balance < 0 ? naira(Math.abs(balance)) : naira(balance)}
              </p>
            </div>
          </div>
          <StatusForm orderId={order.id} status={order.status} movements={movements} />
          <div className="mt-8">
            <ArchiveButton entity="order" id={order.id} label="Archive the order" />
          </div>
        </section>

        <section data-tour="order-lines">
          <h2 className="eyebrow">The items</h2>
          {lines.length === 0 && (
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">
              No items yet.
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
                          {pieceName ?? (item.description || "Item")}
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
                      {/* One price when they agree; both only when the
                          hand moved from the list. */}
                      <p className="money text-[14px] text-dusk">
                        {item.listPriceKobo === item.givenPriceKobo
                          ? naira(item.givenPriceKobo)
                          : `Usual ${naira(item.listPriceKobo)} · You gave ${naira(item.givenPriceKobo)}`}
                      </p>
                      {isReturn && (
                        <p className="money text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">
                          Return · {naira(item.givenPriceKobo * item.quantity)}
                        </p>
                      )}
                      {lineGap > 0 && (
                        <p className="money text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                          {naira(lineGap)} below usual
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {lines.length > 0 && (
            <Teach until="orders">
              <p className="mt-4 text-[14px] text-dusk">
                Wrong item? Add a corrected one.
              </p>
            </Teach>
          )}
          <OrderLineAction orderId={order.id} pieces={pieceOptions} />
        </section>

        <section>
          <h2 className="eyebrow">Payments</h2>
          {pays.length > 0 && (
            <div className="mt-4 grid gap-4">
              {pays.map((p) => (
                <div
                  key={p.id}
                  className="panel flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="money font-serif text-[20px] leading-snug">{naira(p.amountKobo)}</p>
                    <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-mist">
                      {p.amountKobo < 0
                        ? "Refund"
                        : p.method.charAt(0).toUpperCase() + p.method.slice(1)}{" "}
                      · {fmtDate(p.paidAt)}
                    </p>
                  </div>
                  {p.note && <p className="text-[14px] text-dusk">{p.note}</p>}
                </div>
              ))}
            </div>
          )}
          {/* Where it stands owns Billed, Paid, and Balance. This
              section only lists the payments themselves. */}
          {billed > 0 && balance === 0 && (
            <p className="mt-5 text-[14px] text-dusk">Settled in full.</p>
          )}
          {/* The section carries its own trigger, so recording money
              never means hunting the rail. The chip dress keeps the
              screen's one gold where it already lives: the phone dock's
              Add payment, and the open panel's Record button. */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            {pays.length === 0 && (
              <p className="text-[14px] leading-relaxed text-dusk">Nothing recorded yet.</p>
            )}
            <OrderPaymentAction
              orderId={order.id}
              showTrigger
              className="chip-solid min-h-11"
            />
          </div>
          {returnOptions.length > 0 && (
            <OrderReturnAction orderId={order.id} lines={returnOptions} />
          )}
        </section>
      </div>
    </main>
  );
}
