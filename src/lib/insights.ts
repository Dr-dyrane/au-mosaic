import { desc, eq, sql } from "drizzle-orm";
import { getDb, rowsOf, schema } from "@/db";

/* One source of truth for the Insights room. The page renders these
   numbers and the AI read interprets the very same object, so a figure
   on a chart and a figure in the read can never disagree. Every value
   comes from the book, not from traffic; money stays integer kobo. */

export const INSIGHTS_WINDOWS = [
  { months: 3, label: "Three months" },
  { months: 6, label: "Six months" },
  { months: 12, label: "A year" },
] as const;

export type InsightsWindow = { months: number; label: string };

export type MonthPoint = { label: string; billed: number };
export type PieceRevenue = { name: string; revenue: number };
export type AgingBucket = { bucket: string; n: number; owed: number };
export type TapSource = { source: string; n: number };
export type FunnelStage = { label: string; n: number; note: string | null };
export type LowStockItem = { name: string; slug: string; unit: string; qty: number };

export type InsightsData = {
  window: InsightsWindow;
  months: MonthPoint[];
  lastFullLabel: string | null;
  delta: number | null;
  pace: number;
  pieces: PieceRevenue[];
  leakTotal: number;
  billedAll: number;
  leakWatch: boolean;
  buckets: AgingBucket[];
  owedTotal: number;
  oldestDebt: boolean;
  taps: TapSource[];
  funnel: FunnelStage[];
  convRate: number | null;
  settleRate: number | null;
  sessionsKnown: boolean;
  lowStock: LowStockItem[];
};

export function resolveWindow(monthsRaw: string | undefined): InsightsWindow {
  return INSIGHTS_WINDOWS.find((w) => String(w.months) === monthsRaw) ?? INSIGHTS_WINDOWS[1];
}

export async function computeInsights(months: number): Promise<InsightsData> {
  const window = INSIGHTS_WINDOWS.find((w) => w.months === months) ?? INSIGHTS_WINDOWS[1];
  const db = getDb();

  /* The interval comes from the whitelist, never raw user input. */
  const monthly = await db.execute(sql`
    select to_char(date_trunc('month', o.created_at), 'Mon') as label,
           date_trunc('month', o.created_at) as m,
           coalesce(sum(i.given_price_kobo * i.quantity), 0)::bigint as billed
    from orders o join order_items i on i.order_id = o.id
    where o.created_at > now() - ${sql.raw(`interval '${window.months} months'`)}
    group by 2 order by 2`);

  /* Top pieces and the leak read the same window as the trend, both
     for one honest frame and so the scan cannot grow without bound as
     the book fills. The interval is whitelist, never raw input. */
  const topPieces = await db.execute(sql`
    select coalesce(p.name, i.description, 'Custom work') as name,
           sum(i.given_price_kobo * i.quantity)::bigint as revenue
    from order_items i
    join orders o on o.id = i.order_id
    left join pieces p on p.slug = i.piece_slug
    where o.created_at > now() - ${sql.raw(`interval '${window.months} months'`)}
    group by 1 order by 2 desc limit 5`);

  const leak = await db.execute(sql`
    select coalesce(sum(case when i.given_price_kobo < i.list_price_kobo
             then (i.list_price_kobo - i.given_price_kobo) * i.quantity else 0 end), 0)::bigint as total,
           coalesce(sum(i.given_price_kobo * i.quantity), 0)::bigint as billed
    from order_items i
    join orders o on o.id = i.order_id
    where o.created_at > now() - ${sql.raw(`interval '${window.months} months'`)}`);

  const aging = await db.execute(sql`
    select bucket, count(*)::int as n, sum(balance)::bigint as owed from (
      select o.id,
        case when o.created_at > now() - interval '30 days' then 'Under a month'
             when o.created_at > now() - interval '60 days' then 'One to two months'
             else 'Older than two months' end as bucket,
        coalesce((select sum(i.given_price_kobo * i.quantity) from order_items i where i.order_id = o.id), 0) - coalesce((select sum(p.amount_kobo) from payments p where p.order_id = o.id), 0) as balance
      from orders o where o.status not in ('enquiry','settled') and o.archived_at is null
    ) t where balance > 0 group by bucket order by min(case bucket
      when 'Under a month' then 1 when 'One to two months' then 2 else 3 end)`);

  const sources = await db.execute(sql`
    select source, count(*)::int as n from enquiries
    group by source order by n desc limit 6`);

  /* The funnel, tap to settled. Sessions read the beacon's anonymous
     id; before that house update, the top row waits gently instead of
     erroring the room. */
  let sessions: number | null = null;
  try {
    const s = await db.execute(sql`
      select count(distinct session_id)::int as n from enquiries
      where session_id is not null and session_id <> ''`);
    sessions = Number(rowsOf<{ n: number }>(s)[0]?.n ?? 0);
  } catch {
    sessions = null;
  }
  const enquiryStages = await db.execute(sql`
    select count(*)::int as enquiries,
           count(*) filter (where status = 'converted')::int as converted
    from enquiries`);
  const orderStages = await db.execute(sql`
    select (select count(distinct order_id) from order_items)::int as billed_n,
           (select count(*) from orders where status = 'settled')::int as settled_n`);

  const lowStock = await db
    .select({
      name: schema.pieces.name,
      slug: schema.pieces.slug,
      unit: schema.pieces.unit,
      qty: schema.stockLevels.quantitySheets,
    })
    .from(schema.stockLevels)
    .innerJoin(schema.pieces, eq(schema.pieces.slug, schema.stockLevels.pieceSlug))
    .where(sql`${schema.stockLevels.reorderAt} > 0 and ${schema.stockLevels.quantitySheets} <= ${schema.stockLevels.reorderAt}`)
    .orderBy(desc(schema.stockLevels.updatedAt))
    .limit(8);

  const months2 = rowsOf<{ label: string; billed: number }>(monthly).map((m) => ({
    label: m.label,
    billed: Number(m.billed),
  }));
  const pieces = rowsOf<{ name: string; revenue: number }>(topPieces).map((p) => ({
    name: p.name,
    revenue: Number(p.revenue),
  }));
  const buckets = rowsOf<{ bucket: string; n: number; owed: number }>(aging).map((b) => ({
    bucket: b.bucket,
    n: Number(b.n),
    owed: Number(b.owed),
  }));
  const taps = rowsOf<{ source: string; n: number }>(sources).map((t) => ({
    source: t.source,
    n: Number(t.n),
  }));
  const enq = rowsOf<{ enquiries: number; converted: number }>(enquiryStages)[0];
  const ord = rowsOf<{ billed_n: number; settled_n: number }>(orderStages)[0];

  const funnel: FunnelStage[] = [
    {
      label: "People who tapped",
      n: sessions ?? 0,
      note: sessions === null ? "counting begins after the update lands" : "distinct visitors, first-party only",
    },
    { label: "Enquiries in the book", n: Number(enq?.enquiries ?? 0), note: null },
    { label: "Became customers", n: Number(enq?.converted ?? 0), note: null },
    { label: "Orders billed", n: Number(ord?.billed_n ?? 0), note: null },
    { label: "Orders settled", n: Number(ord?.settled_n ?? 0), note: null },
  ];
  const convRate =
    Number(enq?.enquiries ?? 0) > 0
      ? Math.round((Number(enq?.converted ?? 0) / Number(enq.enquiries)) * 100)
      : null;
  const settleRate =
    Number(ord?.billed_n ?? 0) > 0
      ? Math.round((Number(ord?.settled_n ?? 0) / Number(ord.billed_n)) * 100)
      : null;

  const leakRow = rowsOf<{ total: number; billed: number }>(leak)[0];
  const leakTotal = Number(leakRow?.total ?? 0);
  const billedAll = Number(leakRow?.billed ?? 0);
  const leakWatch = billedAll > 0 && leakTotal >= billedAll / 10;

  const owedTotal = buckets.reduce((a, b) => a + b.owed, 0);
  const oldestDebt = buckets.some((b) => b.bucket === "Older than two months");

  /* Last full month against the one before it, and an honest
     projection from the recent pace. */
  const full = months2.slice(0, -1);
  const lastFull = full[full.length - 1];
  const prevFull = full[full.length - 2];
  const delta =
    lastFull && prevFull && prevFull.billed > 0
      ? Math.round(((lastFull.billed - prevFull.billed) / prevFull.billed) * 100)
      : null;
  const paceMonths = full.slice(-3);
  const pace =
    paceMonths.length > 0 ? Math.round(paceMonths.reduce((a, m) => a + m.billed, 0) / paceMonths.length) : 0;

  return {
    window,
    months: months2,
    lastFullLabel: lastFull?.label ?? null,
    delta,
    pace,
    pieces,
    leakTotal,
    billedAll,
    leakWatch,
    buckets,
    owedTotal,
    oldestDebt,
    taps,
    funnel,
    convRate,
    settleRate,
    sessionsKnown: sessions !== null,
    lowStock: lowStock.map((s) => ({ name: s.name, slug: s.slug, unit: s.unit, qty: Number(s.qty) })),
  };
}
