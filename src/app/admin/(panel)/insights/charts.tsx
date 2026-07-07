/* Presentational charts for the insights room. Pure server components,
   props in and JSX out, no client, no state. The book supplies the
   numbers upstairs; these only draw the shape of them. Colour comes
   from the palette tokens alone, so every chart travels across all six
   palettes and both night and day. Bars are divs; the trend, which
   needs a hover, lives in its own client file. */

import Link from "next/link";

export type StatTileProps = { label: string; value: string; sub?: string; href?: string };

/* A headline number, led with, and a doorway when it has somewhere to
   go. The figure is the hero in serif; the label sits above it small,
   the read below quiet. A linked tile carries a quiet chevron that warms
   on hover, and the whole tile is the tap target. */
export function StatTile({ label, value, sub, href }: StatTileProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">{label}</p>
        {href ? (
          <span
            className="text-[13px] text-mist transition-colors duration-300 group-hover:text-gold"
            aria-hidden
          >
            &rsaquo;
          </span>
        ) : null}
      </div>
      <p className="font-serif text-[26px] leading-none tabular-nums mt-2.5">{value}</p>
      {sub ? <p className="mt-2 text-[12px] leading-relaxed text-dusk">{sub}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="panel group block">
      {body}
    </Link>
  ) : (
    <div className="panel">{body}</div>
  );
}

export type MeterProps = {
  value: number;
  max: number;
  threshold?: number | null;
};

/* A ratio against a limit, in one hue. The fill reads the share; a
   faint tick marks the line to watch. No second colour, no numbers on
   the bar, since the figure is stated beside it. */
export function Meter({ value, max, threshold }: MeterProps) {
  if (max <= 0) return null;
  const pct = Math.min(100, Math.max(2, Math.round((value / max) * 100)));
  const tick =
    typeof threshold === "number" && threshold > 0 ? Math.min(100, (threshold / max) * 100) : null;

  return (
    <div className="relative mt-4 h-2.5 w-full rounded-full bg-shell/50">
      <div className="h-2.5 rounded-full bg-gold" style={{ width: `${pct}%` }} />
      {tick !== null && (
        <span className="absolute -bottom-1 -top-1 w-px bg-mist" style={{ left: `${tick}%` }} aria-hidden />
      )}
    </div>
  );
}

export type RankRow = { label: string; value: number; sub?: string };

export type RankBarsProps = {
  rows: RankRow[];
  formatValue: (n: number) => string;
};

/* Ranked horizontal bars for top sellers and tap sources. Div based, so
   it wraps and flexes on its own. The label leads, the bar carries the
   proportion, the figure trails. */
export function RankBars({ rows, formatValue }: RankBarsProps) {
  if (rows.length === 0) return null;
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="grid gap-3">
      {rows.map((r, i) => {
        const pct = Math.max(2, Math.round((r.value / max) * 100));
        return (
          <div key={`${r.label}-${i}`} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] text-ink">{r.label}</p>
              {r.sub ? <p className="text-[12px] text-mist">{r.sub}</p> : null}
              <span className="mt-1.5 block h-2.5 w-full rounded-full bg-shell/50">
                <span className="block h-2.5 rounded-full bg-gold" style={{ width: `${pct}%` }} />
              </span>
            </div>
            <span className="text-[14px] text-dusk tabular-nums">{formatValue(r.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

export type AgingBucketRow = { bucket: string; n: number; owed: number };

export type AgingBarProps = {
  buckets: AgingBucketRow[];
  formatValue: (n: number) => string;
};

/* Debt aging as one segmented bar. A single accent at rising intensity,
   so the eye lands on the oldest money without a second colour ever
   entering the room. Order is fixed, freshest to oldest. */
const AGING_ORDER = [
  { bucket: "Under a month", fill: "bg-gold/35" },
  { bucket: "One to two months", fill: "bg-gold/65" },
  { bucket: "Older than two months", fill: "bg-gold" },
] as const;

export function AgingBar({ buckets, formatValue }: AgingBarProps) {
  if (buckets.length === 0) return null;

  const present = AGING_ORDER.map((slot) => {
    const found = buckets.find((b) => b.bucket === slot.bucket);
    return found ? { ...slot, ...found } : null;
  }).filter((x): x is (typeof AGING_ORDER)[number] & AgingBucketRow => x !== null);

  if (present.length === 0) return null;

  const total = Math.max(1, present.reduce((a, b) => a + b.owed, 0));

  return (
    <div>
      <span className="flex h-2.5 w-full overflow-hidden rounded-full bg-shell/50">
        {present.map((b) => (
          <span key={b.bucket} className={`block h-2.5 ${b.fill}`} style={{ width: `${(b.owed / total) * 100}%` }} />
        ))}
      </span>
      <div className="mt-4 grid gap-3">
        {present.map((b) => (
          <div key={b.bucket} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2.5">
              <span className={`block h-2.5 w-2.5 rounded-full ${b.fill}`} />
              <span className="text-[14px] text-ink">{b.bucket}</span>
            </span>
            <span className="text-[14px] text-dusk tabular-nums">
              {b.n} {b.n === 1 ? "order" : "orders"} / {formatValue(b.owed)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export type FunnelStageRow = { label: string; n: number; note?: string | null };

export type FunnelProps = {
  stages: FunnelStageRow[];
  formatCount: (n: number) => string;
};

/* Tap to settled, as a stepped funnel. Each bar centres itself and
   narrows down the list, so the shape reads before the numbers do. */
export function Funnel({ stages, formatCount }: FunnelProps) {
  if (stages.length === 0 || stages.every((s) => s.n === 0)) return null;
  const max = Math.max(1, ...stages.map((s) => s.n));

  return (
    <div className="grid gap-4">
      {stages.map((s, i) => {
        const pct = Math.max(8, Math.round((s.n / max) * 100));
        return (
          <div key={`${s.label}-${i}`} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] uppercase tracking-[0.14em] text-mist">{s.label}</span>
              <span className="text-[14px] text-dusk tabular-nums">{formatCount(s.n)}</span>
            </div>
            <span className="mx-auto block h-2.5 rounded-full bg-gold" style={{ width: `${pct}%` }} />
            {s.note ? <span className="text-[12px] text-mist">{s.note}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
