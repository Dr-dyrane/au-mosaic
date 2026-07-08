import Link from "next/link";
import { naira } from "@/lib/backoffice";
import { computeInsights, resolveWindow, INSIGHTS_WINDOWS } from "@/lib/insights";
import { AgingBar, DotGrid, Funnel, Meter, MiniBars, RankBars, RingGauge, SignalTile } from "./charts";
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
  const trendPoints = d.months.map((m) => ({ label: m.label, value: m.billed }));
  const recentBars = d.months.slice(-6).map((m) => m.billed);
  const periodBilled = d.months.reduce((sum, m) => sum + m.billed, 0);
  const lastPoint = d.months[d.months.length - 1] ?? null;
  const topPiece = d.pieces[0] ?? null;
  const leakPct = d.billedAll > 0 ? Math.round((d.leakTotal / d.billedAll) * 100) : 0;
  const debtMax = Math.max(1, d.owedTotal, Math.round(d.billedAll * 0.2));
  const leakMax = Math.max(1, Math.round(d.billedAll * 0.1), d.leakTotal);
  const cashWatch = d.owedTotal > 0 || d.leakWatch;

  return (
    <main>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex gap-2">
            <Link href="/admin" className="chip-solid">
              Today
            </Link>
            <span className="chip-solid is-on">Insights</span>
          </div>
          <p className="eyebrow mt-8">The book</p>
          <h1 className="font-serif text-display-section mt-3">The business at a glance.</h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">Data first. Words only where they help.</p>
        </div>

        <div className="flex flex-wrap gap-2">
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
      </header>

      <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Billed pace</p>
              <p className="font-serif mt-3 text-[26px] leading-none tabular-nums">
                {d.pace > 0 ? naira(d.pace) : lastPoint ? naira(lastPoint.billed) : naira(0)}
              </p>
              {d.delta !== null && d.lastFullLabel ? (
                <p className="mt-2 text-[12px] text-dusk">
                  {d.lastFullLabel}: {Math.abs(d.delta)}% {d.delta >= 0 ? "up" : "down"}
                </p>
              ) : null}
            </div>
            {d.delta !== null && <State watch={d.delta < 0} />}
          </div>
          <div className="mt-7">
            <TrendChart points={trendPoints} projection={d.pace > 0 ? d.pace : null} height={220} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SignalTile href="/admin/orders" label="Billed" value={naira(periodBilled)} note={win.label}>
            <MiniBars values={recentBars} label="Recent billed months" />
          </SignalTile>
          <SignalTile
            href="/admin/debts"
            label="Outstanding"
            value={naira(d.owedTotal)}
            note={d.owedTotal > 0 ? (d.oldestDebt ? "old money present" : "young balances") : "clear"}
            watch={d.oldestDebt}
          >
            <Meter value={d.owedTotal} max={debtMax} />
          </SignalTile>
          <SignalTile
            href="/admin/orders"
            label="Leak"
            value={naira(d.leakTotal)}
            note={d.billedAll > 0 ? `${leakPct}% of billed` : "no billing yet"}
            watch={d.leakWatch}
          >
            <Meter value={d.leakTotal} max={leakMax} />
          </SignalTile>
          <SignalTile
            href="/admin/pieces"
            label="Low stock"
            value={String(d.lowStock.length)}
            note={d.lowStock.length > 0 ? "needs reorder eye" : "calm"}
            watch={d.lowStock.length > 0}
          >
            <DotGrid count={d.lowStock.length} label="Low stock items" />
          </SignalTile>
        </div>
      </section>

      <div className="mt-5">
        <InsightsRead key={win.months} months={win.months} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Revenue mix</p>
              <p className="font-serif mt-3 text-[20px]">What sells the house</p>
            </div>
            {topPiece ? <span className="chip-solid">{topPiece.name}</span> : null}
          </div>
          {d.pieces.length === 0 ? (
            <p className="mt-5 text-[14px] leading-relaxed text-dusk">Order lines will rank the pieces here.</p>
          ) : (
            <div className="mt-6">
              <RankBars rows={d.pieces.map((p) => ({ label: p.name, value: p.revenue }))} formatValue={naira} />
            </div>
          )}
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Cash risk</p>
              <p className="font-serif mt-3 text-[20px]">Debt and discount</p>
            </div>
            <State watch={cashWatch} />
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="eyebrow">Outstanding</p>
              <p className="font-serif mt-3 text-[26px] leading-none tabular-nums">{naira(d.owedTotal)}</p>
            </div>
            <div>
              <p className="eyebrow">Discount leak</p>
              <p className="font-serif mt-3 text-[26px] leading-none tabular-nums">{naira(d.leakTotal)}</p>
            </div>
          </div>
          {d.buckets.length === 0 ? (
            <p className="mt-6 text-[14px] leading-relaxed text-dusk">Nobody owes the house today.</p>
          ) : (
            <div className="mt-6">
              <AgingBar buckets={d.buckets} formatValue={naira} />
            </div>
          )}
          {d.billedAll > 0 ? (
            <div className="mt-6">
              <p className="eyebrow">Leak against watch line</p>
              <Meter value={d.leakTotal} max={leakMax} />
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-4">
            <Link href="/admin/debts" className="link-hair text-dusk text-[12px]">
              Who owes what
            </Link>
            <Link href="/admin/orders" className="link-hair text-dusk text-[12px]">
              Orders
            </Link>
          </div>
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Conversion</p>
              <p className="font-serif mt-3 text-[20px]">Tap to settled</p>
            </div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <RingGauge label="enquiry to customer" value={d.convRate} />
            <RingGauge label="billed to settled" value={d.settleRate} />
          </div>
          {d.funnel.every((f) => f.n === 0) ? (
            <p className="mt-6 text-[14px] leading-relaxed text-dusk">The funnel draws itself as taps arrive.</p>
          ) : (
            <>
              <div className="mt-6">
                <Funnel stages={d.funnel} formatCount={(n) => n.toLocaleString()} />
              </div>
              {!d.sessionsKnown && (
                <p className="mt-1.5 text-[14px] leading-relaxed text-mist">
                  People counting starts with the next house update.
                </p>
              )}
            </>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Attention</p>
                <p className="font-serif mt-3 text-[20px]">Low stock</p>
              </div>
              <State watch={d.lowStock.length > 0} />
            </div>
            <div className="mt-6">
              {d.lowStock.length === 0 ? (
                <p className="mt-3 text-[14px] leading-relaxed text-dusk">Shelves calm.</p>
              ) : (
                <div className="mt-4 grid gap-2.5">
                  {d.lowStock.slice(0, 5).map((s) => (
                    <div key={s.slug} className="flex items-center justify-between gap-4">
                      <Link href={`/admin/pieces/${s.slug}`} className="link-hair text-dusk text-[12px]">
                        {s.name}
                      </Link>
                      <span className="text-[12px] uppercase tracking-[0.14em] text-gold">
                        {s.qty} {s.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Attention</p>
                <p className="font-serif mt-3 text-[20px]">Tap sources</p>
              </div>
              <State watch={false} />
            </div>
            <div className="mt-6">
              {d.taps.length === 0 ? (
                <p className="mt-3 text-[14px] leading-relaxed text-dusk">Waiting for site taps.</p>
              ) : (
                <div className="mt-4">
                  <RankBars
                    rows={d.taps.map((t) => ({
                      label: t.source,
                      value: t.n,
                      href: t.href,
                      sub: t.source === "demo" ? "Sample data" : undefined,
                    }))}
                    formatValue={(n) => n.toLocaleString()}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
