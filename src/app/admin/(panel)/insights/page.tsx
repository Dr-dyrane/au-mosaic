import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { naira } from "@/lib/backoffice";

/* The numbers that decide. Read-only on purpose: this room asks
   nothing of him, it only answers. Bars are divs; the data is the
   decoration. Every figure comes from the book, not from traffic. */

export const dynamic = "force-dynamic";

const rowsOf = <T,>(r: unknown): T[] =>
  Array.isArray(r) ? (r as T[]) : ((r as { rows?: T[] }).rows ?? []);

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

export default async function InsightsPage() {
  const db = getDb();

  const monthly = await db.execute(sql`
    select to_char(date_trunc('month', o.created_at), 'Mon') as label,
           date_trunc('month', o.created_at) as m,
           coalesce(sum(i.given_price_kobo * i.quantity), 0)::bigint as billed
    from orders o join order_items i on i.order_id = o.id
    where o.created_at > now() - interval '6 months'
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
        coalesce((select sum(i.given_price_kobo * i.quantity) from order_items i where i.order_id = o.id), 0)
          - coalesce((select sum(p.amount_kobo) from payments p where p.order_id = o.id), 0) as balance
      from orders o where o.status not in ('enquiry','settled')
    ) t where balance > 0 group by bucket order by min(case bucket
      when 'Under a month' then 1 when 'One to two months' then 2 else 3 end)`);

  const sources = await db.execute(sql`
    select source, count(*)::int as n from enquiries
    group by source order by n desc limit 6`);

  const lowStock = await db
    .select({ name: schema.pieces.name, slug: schema.pieces.slug, unit: schema.pieces.unit, qty: schema.stockLevels.quantitySheets })
    .from(schema.stockLevels)
    .innerJoin(schema.pieces, eq(schema.pieces.slug, schema.stockLevels.pieceSlug))
    .where(sql`${schema.stockLevels.quantitySheets} <= ${schema.stockLevels.reorderAt}`)
    .orderBy(desc(schema.stockLevels.updatedAt))
    .limit(8);

  const months = rowsOf<{ label: string; billed: number }>(monthly);
  const pieces = rowsOf<{ name: string; revenue: number }>(topPieces);
  const buckets = rowsOf<{ bucket: string; n: number; owed: number }>(aging);
  const taps = rowsOf<{ source: string; n: number }>(sources);
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

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
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
                <span className="text-[13px] text-dusk">{naira(Number(m.billed))}</span>
              </div>
            ))}
          </div>
          {delta !== null && lastFull && (
            <p className="mt-4 text-[13px] leading-relaxed text-dusk">
              {lastFull.label} came in {Math.abs(delta)}% {delta >= 0 ? "up on" : "below"} the month before.
            </p>
          )}
          {pace > 0 && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-gold">
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
                  <p className="text-[13px] text-ink">{p.name}</p>
                  <Bar frac={Number(p.revenue) / maxPiece} />
                </div>
                <span className="text-[13px] text-dusk">{naira(Number(p.revenue))}</span>
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
          <p className="mt-2 text-[13px] leading-relaxed text-dusk">
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
                <span className="text-[13px] text-ink">{b.bucket}</span>
                <span className="text-[13px] text-dusk">
                  {b.n} {b.n === 1 ? "order" : "orders"} · {naira(Number(b.owed))}
                </span>
              </div>
            ))}
          </div>
          <Link href="/admin/debts" className="link-hair mt-5 inline-block text-dusk text-[13px]">
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
                <span className="text-[13px] text-dusk">{t.n}</span>
              </div>
            ))}
          </div>
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
                <Link href={`/admin/pieces/${s.slug}`} className="link-hair text-dusk text-[13px]">
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
