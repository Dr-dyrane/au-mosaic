import { sql } from "drizzle-orm";
import { getDb, rowsOf } from "@/db";
import { naira } from "@/lib/backoffice";
import { getDataMode, hideDemoNoteSql, hideDemoSourceSql } from "@/lib/data-mode";

/* What needs his eye today. Not a task list, a computed surface of the
   due and the overdue, drawn from the book: debts gone old, enquiries
   left waiting, deliveries past their date, samples due. Only real items
   appear; a calm house shows nothing. Attention stewardship: this spends
   one glance to save a forgotten loss. */

export type AttentionItem = { key: string; text: string; href: string };

export async function computeAttention(): Promise<AttentionItem[]> {
  const db = getDb();
  const mode = await getDataMode();
  const items: AttentionItem[] = [];

  try {
    /* Debts a month or more old that still owe. */
    const debtRows = rowsOf<{ n: number | string; owed: number | string }>(
      await db.execute(sql`
        select count(*)::int as n, coalesce(sum(bal), 0)::bigint as owed from (
          select o.id,
            coalesce((select sum(i.given_price_kobo * i.quantity) from order_items i where i.order_id = o.id), 0)
            - coalesce((select sum(p.amount_kobo) from payments p where p.order_id = o.id), 0) as bal
          from orders o
          where o.status not in ('enquiry','settled') and o.archived_at is null
            and o.created_at < now() - interval '30 days'${hideDemoNoteSql(mode, "o")}
        ) t where bal > 0`)
    );
    const dn = Number(debtRows[0]?.n ?? 0);
    const dowed = Number(debtRows[0]?.owed ?? 0);
    if (dn > 0) {
      items.push({
        key: "debts",
        text: `${dn} ${dn === 1 ? "debt" : "debts"} over a month, ${naira(dowed)}`,
        href: "/admin/debts",
      });
    }
  } catch {
    /* One room's fault stays in that room. */
  }

  try {
    /* Enquiries left new more than three days. */
    const enqRows = rowsOf<{ n: number | string }>(
      await db.execute(sql`
        select count(*)::int as n from enquiries
        where status = 'new' and archived_at is null and created_at < now() - interval '3 days'${hideDemoSourceSql(mode, "enquiries")}`)
    );
    const en = Number(enqRows[0]?.n ?? 0);
    if (en > 0) {
      items.push({
        key: "enquiries",
        text: `${en} ${en === 1 ? "enquiry" : "enquiries"} waiting`,
        href: "/admin/customers",
      });
    }
  } catch {
    /* One room's fault stays in that room. */
  }

  try {
    /* Deliveries past their scheduled date, not yet landed. */
    const delRows = rowsOf<{ n: number | string }>(
      await db.execute(sql`
        select count(*)::int as n from deliveries
        where status in ('pending','out') and archived_at is null
          and scheduled_for is not null and scheduled_for < current_date${hideDemoNoteSql(mode, "deliveries")}`)
    );
    const den = Number(delRows[0]?.n ?? 0);
    if (den > 0) {
      items.push({
        key: "deliveries",
        text: `${den} ${den === 1 ? "delivery" : "deliveries"} past due`,
        href: "/admin/deliveries",
      });
    }
  } catch {
    /* One room's fault stays in that room. */
  }

  try {
    /* Sample motions due today or overdue, still open. */
    const motRows = rowsOf<{ n: number | string }>(
      await db.execute(sql`
        select count(*)::int as n from sales_motions
        where status = 'open' and archived_at is null
          and scheduled_for is not null and scheduled_for <= current_date${hideDemoNoteSql(mode, "sales_motions")}`)
    );
    const mn = Number(motRows[0]?.n ?? 0);
    if (mn > 0) {
      items.push({
        key: "motions",
        text: `${mn} ${mn === 1 ? "sample" : "samples"} due`,
        href: "/admin/customers",
      });
    }
  } catch {
    /* One room's fault stays in that room. */
  }

  return items;
}
