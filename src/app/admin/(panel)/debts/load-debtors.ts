"use server";

import { sql } from "drizzle-orm";
import { getDb, rowsOf } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { getDataMode, hideDemoNoteSql } from "@/lib/data-mode";
import type { Batch } from "@/components/InfiniteList";
import { DEBTORS_PAGE, type Debtor, type OwingOrder } from "./debtors-types";

/* The ledger, read a page at a time. Debtors arrive longest-forgotten
   first, each with the orders that still owe. Every sum is scoped to the
   customers on the page, so the scan cannot grow without bound as the
   book fills. Money stays integer kobo; the room formats it. */

/* One live order's balance, the canonical rule: billed minus paid, on a
   live order only. Reused by both queries below so they never disagree. */
const LIVE_BALANCE = sql`
  coalesce((select sum(i.given_price_kobo * i.quantity) from order_items i where i.order_id = o.id), 0)
  - coalesce((select sum(p.amount_kobo) from payments p where p.order_id = o.id), 0)`;

const LIVE_WHERE = sql`o.status not in ('enquiry','settled') and o.archived_at is null`;

export async function fetchDebtors(offset: number): Promise<Batch<Debtor>> {
  if (!(await hasSession())) return { items: [], done: true };
  const db = getDb();
  const mode = await getDataMode();
  const start = Math.max(0, Math.trunc(offset));

  /* One page of debtors: total owed and the age of their oldest owing
     order, longest forgotten first. */
  const debtorRows = rowsOf<{
    id: string;
    name: string;
    phone: string;
    total: number | string;
  }>(
    await db.execute(sql`
      with owing as (
        select o.customer_id, o.created_at, greatest(${LIVE_BALANCE}, 0) as bal
        from orders o
        where ${LIVE_WHERE}${hideDemoNoteSql(mode, "o")}
      )
      select w.customer_id as id, c.name, c.phone,
             sum(w.bal)::bigint as total
      from owing w
      join customers c on c.id = w.customer_id
      where w.bal > 0
      group by w.customer_id, c.name, c.phone
      order by min(w.created_at) asc, w.customer_id asc
      limit ${DEBTORS_PAGE} offset ${start}`)
  );

  if (debtorRows.length === 0) return { items: [], done: true };

  /* The owing orders for exactly these debtors, oldest first. Scoped to
     the page, so the second scan is bounded too. */
  const ids = debtorRows.map((d) => d.id);
  const orderRows = rowsOf<{
    id: string;
    customer_id: string;
    status: string;
    created_at: string;
    balance: number | string;
  }>(
    await db.execute(sql`
      select o.id, o.customer_id, o.status, o.created_at,
             (${LIVE_BALANCE})::bigint as balance
      from orders o
      where ${LIVE_WHERE}${hideDemoNoteSql(mode, "o")}
        and o.customer_id in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})
      order by o.created_at asc`)
  );

  const ordersByCustomer = new Map<string, OwingOrder[]>();
  for (const r of orderRows) {
    const balance = Number(r.balance);
    if (balance <= 0) continue;
    const list = ordersByCustomer.get(r.customer_id) ?? [];
    list.push({
      id: r.id,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      balance,
    });
    ordersByCustomer.set(r.customer_id, list);
  }

  const items: Debtor[] = debtorRows.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    total: Number(d.total),
    orders: ordersByCustomer.get(d.id) ?? [],
  }));

  return { items, done: items.length < DEBTORS_PAGE };
}

/* The grand total owed across everyone, clamped per order so a credit
   on one order never cancels a debt on another. Bounded by live orders. */
export async function fetchGrandOwed(): Promise<number> {
  if (!(await hasSession())) return 0;
  const db = getDb();
  const mode = await getDataMode();
  const row = rowsOf<{ grand: number | string }>(
    await db.execute(sql`
      select coalesce(sum(greatest(${LIVE_BALANCE}, 0)), 0)::bigint as grand
      from orders o
      where ${LIVE_WHERE}${hideDemoNoteSql(mode, "o")}`)
  )[0];
  return Number(row?.grand ?? 0);
}
