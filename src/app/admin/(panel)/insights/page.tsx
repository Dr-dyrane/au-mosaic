import Link from "next/link";
import { naira } from "@/lib/backoffice";
import { computeInsights, resolveWindow, INSIGHTS_WINDOWS } from "@/lib/insights";
import { StatTile, Meter, RankBars, AgingBar, Funnel } from "./charts";
import TrendChart from "./TrendChart";
import InsightsRead from "./InsightsRead";

/* The numbers that decide, read as pictures and then in words. Read-only
   on purpose: this room asks nothing of him, it only answers. Every
   figure comes from the book, not from traffic, and the AI read above
   interprets the very same figures the charts below draw. */

export const dynamic = "force-dynamic";

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

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) {
  const { months: monthsRaw } = await searchParams;
  const win = resolveWindow(monthsRaw);
  const d = await computeInsights(win.months);

  return (
    <main>
      <div className="flex gap-2">
        <Link href="/admin" className="chip-solid">
          Today
        </Link>
        <span className="chip-solid is-on">Insights</span>
      </div>
      <h1 className="font-serif text-display-section mt-8">What the book says.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">The business, not the traffic.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {INSIGHTS_WINDOWS.map((w) => (
          <Link
            key={w.months}
            href={w.months === 6 ? "/admin/insights" : `/admin/insights?months=${w.months}`}
            className={`chip-solid ${win.months === w.months ? "is-on" : ""}`}
          >
            {w.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="On pace"
          value={naira(d.pace)}
          sub={
            d.delta !== null && d.lastFullLabel
              ? `${d.lastFullLabel} ${d.delta >= 0 ? "up" : "down"} ${Math.abs(d.delta)}%`
              : "this month"
          }
        />
        <StatTile
          label="Outstanding"
          value={naira(d.owedTotal)}
          sub={d.owedTotal > 0 ? (d.oldestDebt ? "some over two months" : "all under two months") : "nobody owes"}
        />
        <StatTile
          label="Discount leak"
          value={naira(d.leakTotal)}
          sub={d.billedAll > 0 ? `${Math.round((d.leakTotal / d.billedAll) * 100)}% of billed` : "no billing yet"}
        />
        <StatTile
          label="Low stock"
          value={String(d.lowStock.length)}
          sub={d.lowStock.length > 0 ? "at or below reorder" : "shelves calm"}
        />
      </div>

      <div className="mt-8">
        <InsightsRead key={win.months} months={win.months} />
      </div>

      <section className="panel mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-serif text-[20px]">Billed, month by month</p>
          {d.delta !== null && <State watch={d.delta < 0} />}
        </div>
        {d.months.length < 2 ? (
          <p className="mt-3 text-[14px] leading-relaxed text-dusk">The first order draws the first line.</p>
        ) : (
          <div className="mt-6">
            <TrendChart
              points={d.months.map((m) => ({ label: m.label, value: m.billed }))}
              projection={d.pace > 0 ? d.pace : null}
              formatValue={naira}
            />
          </div>
        )}
        {d.delta !== null && d.lastFullLabel && (
          <p className="mt-5 text-[14px] leading-relaxed text-dusk">
            {d.lastFullLabel} came in {Math.abs(d.delta)}% {d.delta >= 0 ? "up on" : "below"} the month before.
          </p>
        )}
        {d.pace > 0 && (
          <p className="mt-1.5 text-[14px] leading-relaxed text-gold">
            If the pace holds: {naira(d.pace)} this month.
          </p>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="panel">
          <p className="font-serif text-[20px]">What sells the house</p>
          {d.pieces.length === 0 ? (
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">Order lines will rank the pieces here.</p>
          ) : (
            <div className="mt-6">
              <RankBars rows={d.pieces.map((p) => ({ label: p.name, value: p.revenue }))} formatValue={naira} />
            </div>
          )}
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-[20px]">The discount leak</p>
            {d.billedAll > 0 && <State watch={d.leakWatch} />}
          </div>
          <p className="font-serif mt-4 text-[26px] tabular-nums">{naira(d.leakTotal)}</p>
          {d.billedAll > 0 && <Meter value={d.leakTotal} max={d.billedAll * 0.1} />}
          {d.billedAll > 0 && (
            <p className="mt-2 text-[12px] text-mist">Full bar is the watch line, a tenth of billed.</p>
          )}
          <p className="mt-3 text-[14px] leading-relaxed text-dusk">
            Given below list, all time. If this number grows faster than billed, the price list is a
            suggestion, and suggestions cost money.
          </p>
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-[20px]">How old the debts are</p>
            <State watch={d.oldestDebt} />
          </div>
          {d.buckets.length === 0 ? (
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">Nobody owes the house today.</p>
          ) : (
            <div className="mt-6">
              <AgingBar buckets={d.buckets} formatValue={naira} />
            </div>
          )}
          <Link href="/admin/debts" className="link-hair mt-5 inline-block text-dusk text-[12px]">
            Who owes what
          </Link>
        </section>

        <section className="panel">
          <p className="font-serif text-[20px]">Where the taps come from</p>
          {d.taps.length === 0 ? (
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">
              WhatsApp taps on the site will land here by source.
            </p>
          ) : (
            <div className="mt-6">
              <RankBars
                rows={d.taps.map((t) => ({ label: t.source, value: t.n }))}
                formatValue={(n) => n.toLocaleString()}
              />
            </div>
          )}
        </section>

        <section className="panel">
          <p className="font-serif text-[20px]">From tap to settled</p>
          {d.funnel.every((f) => f.n === 0) ? (
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">
              The funnel draws itself as the site&apos;s taps arrive.
            </p>
          ) : (
            <>
              <div className="mt-6">
                <Funnel stages={d.funnel} formatCount={(n) => n.toLocaleString()} />
              </div>
              {(d.convRate !== null || d.settleRate !== null) && (
                <p className="mt-4 text-[14px] leading-relaxed text-dusk">
                  {d.convRate !== null && `${d.convRate}% of enquiries became customers. `}
                  {d.settleRate !== null && `${d.settleRate}% of billed orders are settled.`}
                </p>
              )}
              {!d.sessionsKnown && (
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
            <State watch={d.lowStock.length > 0} />
          </div>
          {d.lowStock.length === 0 ? (
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">
              Nothing is running low. The shelves are calm.
            </p>
          ) : (
            <div className="mt-5 grid gap-2.5">
              {d.lowStock.map((s) => (
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
          )}
        </section>
      </div>
    </main>
  );
}
