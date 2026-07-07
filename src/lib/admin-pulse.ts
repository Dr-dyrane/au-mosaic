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
        where status not in ('enquiry','settled') and archived_at is null
      ),
      order_balances as (
        select o.customer_id,
               (coalesce((select sum(i.given_price_kobo * i.quantity) from order_items i where i.order_id = o.id), 0)
                - coalesce((select sum(p.amount_kobo) from payments p where p.order_id = o.id), 0))::bigint as balance
        from active_orders o
      )
      select
        (select count(*)::int from pieces) as pieces,
        (select count(*)::int
          from stock_levels
          where reorder_at > 0 and quantity_sheets <= reorder_at) as low_stock,
        (select count(*)::int from orders where status <> 'settled' and archived_at is null) as open_orders,
        (select coalesce(sum(greatest(balance, 0)), 0) from order_balances)::bigint as outstanding_kobo,
        (select count(*)::int from enquiries where status = 'new' and archived_at is null) as fresh_enquiries,
        (select count(distinct customer_id)::int from order_balances where balance > 0) as owing_customers
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
