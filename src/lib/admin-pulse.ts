import { cache } from "react";
import { sql } from "drizzle-orm";
import { getDb, rowsOf } from "@/db";

export type AdminPulse = {
  ok: boolean;
  pieces: number;
  lowStock: number;
  openOrders: number;
  outstandingKobo: number;
  freshEnquiries: number;
  owingCustomers: number;
};

const QUIET: AdminPulse = {
  ok: false,
  pieces: 0,
  lowStock: 0,
  openOrders: 0,
  outstandingKobo: 0,
  freshEnquiries: 0,
  owingCustomers: 0,
};

export const readAdminPulse = cache(async (): Promise<AdminPulse> => {
  try {
    const rows = await getDb().execute(sql`
      with active_orders as (
        select id, customer_id
        from orders
        where status not in ('enquiry','settled')
      ),
      customer_lines as (
        select o.customer_id,
               coalesce(sum(i.given_price_kobo * i.quantity), 0)::bigint as billed
        from active_orders o
        left join order_items i on i.order_id = o.id
        group by o.customer_id
      ),
      customer_payments as (
        select o.customer_id,
               coalesce(sum(p.amount_kobo), 0)::bigint as paid
        from active_orders o
        left join payments p on p.order_id = o.id
        group by o.customer_id
      ),
      customer_balances as (
        select l.customer_id,
               (l.billed - coalesce(p.paid, 0))::bigint as balance
        from customer_lines l
        left join customer_payments p on p.customer_id = l.customer_id
      )
      select
        (select count(*)::int from pieces) as pieces,
        (select count(*)::int
          from stock_levels
          where reorder_at > 0 and quantity_sheets <= reorder_at) as low_stock,
        (select count(*)::int from orders where status <> 'settled') as open_orders,
        greatest(
          (select coalesce(sum(billed), 0) from customer_lines)
          -
          (select coalesce(sum(paid), 0) from customer_payments),
          0
        )::bigint as outstanding_kobo,
        (select count(*)::int from enquiries where status = 'new') as fresh_enquiries,
        (select count(*)::int from customer_balances where balance > 0) as owing_customers
    `);
    const row = rowsOf<{
      pieces?: number | string;
      low_stock?: number | string;
      open_orders?: number | string;
      outstanding_kobo?: number | string;
      fresh_enquiries?: number | string;
      owing_customers?: number | string;
    }>(rows)[0];
    return {
      ok: true,
      pieces: Number(row?.pieces ?? 0),
      lowStock: Number(row?.low_stock ?? 0),
      openOrders: Number(row?.open_orders ?? 0),
      outstandingKobo: Number(row?.outstanding_kobo ?? 0),
      freshEnquiries: Number(row?.fresh_enquiries ?? 0),
      owingCustomers: Number(row?.owing_customers ?? 0),
    };
  } catch {
    return QUIET;
  }
});
