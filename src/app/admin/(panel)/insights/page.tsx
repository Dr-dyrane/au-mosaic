import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { getDb, rowsOf, schema } from "@/db";
import { naira } from "@/lib/backoffice";

/* The numbers that decide. Read-only on purpose: this room asks
   nothing of him, it only answers. Bars are divs; the data is the
   decoration. Every figure comes from the book, not from traffic. */

export const dynamic = "force-dynamic";

function Bar({ frac }: { frac: number }) {
  return (
    <span className="block h-2 w-full rounded-full bg-shell/50">
      <span
        className="block h-2 rounded-full bg-gold/70"
        style={{ width: `${Math.max(2, Math.round(frac * 100))}%` }}
      />
    </span>
  );
}

/* The six months as one line, drawn on the server. The bars carry
   the numbers; this carries the shape. */
function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * 112 + 4).toFixed(1)},${(24 - (v / max) * 18).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox="0 0 120 28" className="h-7 w-[7.5rem]" aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke="var(--color-gold)"
        strokeOpacity="0.7"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* One word of judgement per panel, earned from the data behind it:
   Steady when the number behaves, Watch when it asks for his eye. */
function State({ watch }: { watch: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
        watch ? "bg-gold/15 text-gold" : "bg-shell/55 text-mist"
      }`}
    >
      {watch ? "Watch" : "Steady"}
    </span>
  );
}

/* The windows the book will open: a quarter, half a year, a year. */
const WINDOWS = [
  { months: 3, label: "Three months" },
  { months: 6, label: "Six months" },
  { months: 12, label: "A year" },
] as const;

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) {
  const { months: monthsRaw } = await searchParams;
  const win = WINDOWS.find((w) => String(w.months) === monthsRaw) ?? WINDOWS[1];

  const db = getDb();

  /* The interval comes from the whitelist above, never the URL. */
  const monthly = await db.execute(sql`
    select to_char(date_trunc('month', o.created_at), 'Mon') as label,
           date_trunc('month', o.created_at) as m,
           coalesce(sum(i.given_price_kobo * i.quantity), 0)::bigint as billed
    from orders o join order_items i on i.order_id = o.id
    where o.created_at > now() - ${sql.raw(`interval '${win.months} months'`)}
    group by 2 order by 2`);

  const topPieces = await db.execute(sql`
    select coalesce(p.name, i.description, 'Custom work') as name,
           sum(i.given_price_kobo * i.quantity)::bigint as revenue
    from order_items i
    left join pieces p on p.slug = i.piece_slug
    group by 1 order by 2 desc limit 5`);

  const leak = await db.execute(sql`
    select coalesce(sum(case when i.given_price_kobo < i.list_price_kobo
             then (i.list_price_kobo - i.given_price_kobo) * i.quantity else 0 end), 0)::bigint as total,
           coalesce(sum(i.given_price_kobo * i.quantity), 0)::bigint as billed
    from order_items i`);

  const aging = await db.execute(sql`
    select bucket, count(*)::int as n, sum(balance)::bigint as owed from (
      select o.id,
        case when o.created_at > now() - interval '30 days' then 'Under a month'
             when o.created_at > now() - interval '60 days' then 'One to two months'
             else 'Older than two months' end as bucket,
        coalesce((select sum(i.given_price_kobo * i.quantity) from order_items i where i.order_id = o.id), 0) - coalesce((select sum(p.amount_kobo) from payments p where p.order_id = o.id), 0) as balance
      from orders o where o.status not in ('enquiry','settled')
    ) t where balance > 0 group by bucket order by min(case bucket
      when 'Under a month' then 1 when 'One to two months' then 2 else 3 end)`);

  const sources = await db.execute(sql`
    select source, count(*)::int as n from enquiries
    group by source order by n desc limit 6`);

  /* The funnel, tap to settled. Sessions read the beacon's anonymous
     id; before that house update, the top row waits gently instead
     of erroring the room. */
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
    .select({ name: schema.pieces.name, slug: schema.pieces.slug, unit: schema.pieces.unit, qty: schema.stockLevels.quantitySheets })
    .from(schema.stockLevels)
    .innerJoin(schema.pieces, eq(schema.pieces.slug, schema.stockLevels.pieceSlug))
    .where(sql`${schema.stockLevels.reorderAt} > 0 and ${schema.stockLevels.quantitySheets} <= ${schema.stockLevels.reorderAt}`)
    .orderBy(desc(schema.stockLevels.updatedAt))
    .limit(8);

  const months = rowsOf<{ label: string; billed: number }>(monthly);
  const pieces = rowsOf<{ name: string; revenue: number }>(topPieces);
  const buckets = rowsOf<{ bucket: string; n: number; owed: number }>(aging);
  const taps = rowsOf<{ source: string; n: number }>(sources);
  const enq = rowsOf<{ enquiries: number; converted: number }>(enquiryStages)[0];
  const ord = rowsOf<{ billed_n: number; settled_n: number }>(orderStages)[0];
  const funnel = [
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
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.n));
  const funnelEmpty = funnel.every((f) => f.n === 0);
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
  /* A tenth of billed walking away is worth an eye. */
  const leakWatch = billedAll > 0 && leakTotal >= billedAll / 10;
  const maxMonth = Math.max(1, ...months.map((m) => Number(m.billed)));
  const maxPiece = Math.max(1, ...pieces.map((p) => Number(p.revenue)));
  const maxTap = Math.max(1, ...taps.map((t) => t.n));

  /* Inference in plain words: the last full month against the one
     before it, and an honest projection from the recent pace. */
  const full = months.slice(0, -1);
  const lastFull = full[full.length - 1];
  const prevFull = full[full.length - 2];
  const delta =
    lastFull && prevFull && Number(prevFull.billed) > 0
      ? Math.round(((Number(lastFull.billed) - Number(prevFull.billed)) / Number(prevFull.billed)) * 100)
      : null;
  const paceMonths = full.slice(-3);
  const pace =
    paceMonths.length > 0
      ? Math.round(paceMonths.reduce((a, m) => a + Number(m.billed), 0) / paceMonths.length)
      : 0;

  return (
    <main>
      <div className="flex gap-2">
        <Link href="/admin" className="chip-solid">
          Today
        </Link>
        <span className="chip-solid is-on">Insights</span>
      </div>
      <h1 className="font-serif text-display-section mt-8">What the book says.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        The business, not the traffic.
      </p>

      {/* How far back the month bars look. Links, so the URL
          remembers the window. */}
      <div className="mt-8 flex flex-wrap gap-2">
        {WINDOWS.map((w) => (
          <Link
            key={w.months}
            href={w.months === 6 ? "/admin/insights" : `/admin/insights?months=${w.months}`}
            className={`chip-solid ${win.months === w.months ? "is-on" : ""}`}
          >
            {w.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-[20px]">Billed, month by month</p>
            <span className="flex items-center gap-3">
              <Spark values={months.map((m) => Number(m.billed))} />
              {delta !== null && <State watch={delta < 0} />}
            </span>
          </div>
          {months.length === 0 && (
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">
              The first order draws the first bar.
            </p>
          )}
          <div className="mt-5 grid gap-3">
            {months.map((m) => (
              <div key={m.label} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3">
                <span className="text-[12px] uppercase tracking-[0.14em] text-mist">{m.label}</span>
                <Bar frac={Number(m.billed) / maxMonth} />
                <span className="text-[14px] text-dusk">{naira(Number(m.billed))}</span>
              </div>
            ))}
          </div>
          {delta !== null && lastFull && (
            <p className="mt-4 text-[14px] leading-relaxed text-dusk">
              {lastFull.label} came in {Math.abs(delta)}% {delta >= 0 ? "up on" : "below"} the month before.
            </p>
          )}
          {pace > 0 && (
            <p className="mt-1.5 text-[14px] leading-relaxed text-gold">
              If the pace holds: {naira(pace)} this month.
            </p>
          )}
        </section>

        <section className="panel">
          <p className="font-serif text-[20px]">What sells the house</p>
          {pieces.length === 0 && (
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">
              Order lines will rank the pieces here.
            </p>
          )}
          <div className="mt-5 grid gap-3">
            {pieces.map((p) => (
              <div key={p.name} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <p className="text-[14px] text-ink">{p.name}</p>
                  <Bar frac={Number(p.revenue) / maxPiece} />
                </div>
                <span className="text-[14px] text-dusk">{naira(Number(p.revenue))}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-[20px]">The discount leak</p>
            {billedAll > 0 && <State watch={leakWatch} />}
          </div>
          <p className="font-serif mt-4 text-[26px]">{naira(leakTotal)}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Given below list, all time. If this number grows faster than
            billed, the price list is a suggestion, and suggestions cost
            money.
          </p>
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-[20px]">How old the debts are</p>
            <State watch={buckets.some((b) => b.bucket === "Older than two months")} />
          </div>
          {buckets.length === 0 && (
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">
              Nobody owes the house today.
            </p>
          )}
          <div className="mt-5 grid gap-3">
            {buckets.map((b) => (
              <div key={b.bucket} className="flex items-center justify-between gap-4">
                <span className="text-[14px] text-ink">{b.bucket}</span>
                <span className="text-[14px] text-dusk">
                  {b.n} {b.n === 1 ? "order" : "orders"} / {naira(Number(b.owed))}
                </span>
              </div>
            ))}
          </div>
          <Link href="/admin/debts" className="link-hair mt-5 inline-block text-dusk text-[12px]">
            Who owes what
          </Link>
        </section>

        <section className="panel">
          <p className="font-serif text-[20px]">Where the taps come from</p>
          {taps.length === 0 && (
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">
              WhatsApp taps on the site will land here by source.
            </p>
          )}
          <div className="mt-5 grid gap-3">
            {taps.map((t) => (
              <div key={t.source} className="grid grid-cols-[6rem_1fr_auto] items-center gap-3">
                <span className="truncate text-[12px] uppercase tracking-[0.14em] text-mist">{t.source}</span>
                <Bar frac={t.n / maxTap} />
                <span className="text-[14px] text-dusk">{t.n}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <p className="font-serif text-[20px]">From tap to settled</p>
          {funnelEmpty && (
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">
              The funnel draws itself as the site&apos;s taps arrive.
            </p>
          )}
          {!funnelEmpty && (
            <>
              <div className="mt-5 grid gap-3">
                {funnel.map((f) => (
                  <div key={f.label} className="grid grid-cols-[9.5rem_1fr_auto] items-center gap-3">
                    <span className="text-[12px] uppercase tracking-[0.14em] text-mist">{f.label}</span>
                    <Bar frac={f.n / maxFunnel} />
                    <span className="text-[14px] text-dusk">{f.n.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {(convRate !== null || settleRate !== null) && (
                <p className="mt-4 text-[14px] leading-relaxed text-dusk">
                  {convRate !== null &&
                    `${convRate}% of enquiries became customers. `}
                  {settleRate !== null && `${settleRate}% of billed orders are settled.`}
                </p>
              )}
              {sessions === null && (
                <p className="mt-1.5 text-[14px] leading-relaxed text-mist">
                  People counting starts with the next house update.
                </p>
              )}
            </>
          )}
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-[20px]">Stock pressure</p>
            <State watch={lowStock.length > 0} />
          </div>
          {lowStock.length === 0 && (
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">
              Nothing is running low. The shelves are calm.
            </p>
          )}
          <div className="mt-5 grid gap-2.5">
            {lowStock.map((s) => (
              <div key={s.slug} className="flex items-center justify-between gap-4">
                <Link href={`/admin/pieces/${s.slug}`} className="link-hair text-dusk text-[12px]">
                  {s.name}
                </Link>
                <span className="text-[12px] uppercase tracking-[0.14em] text-gold">
                  {s.qty} {s.unit} left
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
