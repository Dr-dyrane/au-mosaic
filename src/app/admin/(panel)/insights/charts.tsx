/* Presentational charts for the insights room. Pure server components,
   props in and JSX out, no client, no state. The book supplies the
   numbers upstairs; these only draw the shape of them. Colour comes
   from the palette tokens alone, so every chart travels across all six
   palettes and both night and day. Bars are divs; the trend, which
   needs a hover, lives in its own client file. */

import Link from "next/link";
import type { ReactNode } from "react";

export type SignalTileProps = {
  label: string;
  value: string;
  note?: string;
  href?: string;
  watch?: boolean;
  children?: ReactNode;
};

/* Compact instrument tile. It leads with one number and lets a tiny
   visual carry the second read, so the first scan is data before prose. */
export function SignalTile({ label, value, note, href, watch = false, children }: SignalTileProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{label}</p>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            watch ? "bg-gold/15 text-gold" : "bg-shell/55 text-mist"
          }`}
        >
          {watch ? "Watch" : "Steady"}
        </span>
      </div>
      <p className="font-serif mt-3 text-[26px] leading-none tabular-nums">{value}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      {note ? <p className="mt-3 text-[12px] leading-relaxed text-dusk">{note}</p> : null}
    </>
  );

  return href ? (
    <Link href={href} className="panel group block transition-transform duration-300 active:scale-[0.99]">
      {body}
    </Link>
  ) : (
    <div className="panel">{body}</div>
  );
}

export type MiniBarsProps = {
  values: number[];
  label: string;
};

/* Tiny column trend for at-a-glance cards. The exact figures live in
   nearby text or the main chart; this only gives the eye direction. */
export function MiniBars({ values, label }: MiniBarsProps) {
  if (values.length === 0) return <span className="block h-12 rounded-full bg-shell/45" aria-hidden />;
  const max = Math.max(1, ...values);

  return (
    <div className="flex h-12 items-end gap-1.5" aria-label={label} role="img">
      {values.map((value, i) => {
        const height = Math.max(12, Math.round((value / max) * 48));
        return (
          <span
            key={`${value}-${i}`}
            className="block flex-1 rounded-full bg-gold/75"
            style={{ height }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

export type RingGaugeProps = {
  label: string;
  value: number | null;
};

/* Small circular rate read. One ring, one percentage, one label. */
export function RingGauge({ label, value }: RingGaugeProps) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const dash = `${pct} ${100 - pct}`;

  return (
    <div className="flex items-center gap-4" role="img" aria-label={`${label}: ${pct}%`}>
      <svg viewBox="0 0 42 42" className="h-16 w-16 shrink-0 -rotate-90" aria-hidden>
        <circle cx="21" cy="21" r="16" fill="none" stroke="var(--color-shell)" strokeWidth="6" opacity="0.7" />
        <circle
          cx="21"
          cy="21"
          r="16"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="6"
          strokeDasharray={dash}
          strokeLinecap="round"
          pathLength="100"
        />
      </svg>
      <div>
        <p className="font-serif text-[26px] leading-none tabular-nums">{pct}%</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-mist">{label}</p>
      </div>
    </div>
  );
}

export type DotGridProps = {
  count: number;
  max?: number;
  label: string;
};

/* Inventory pressure as a small dot field. It is deliberately simple:
   each lit dot is one item needing the owner's eye. */
export function DotGrid({ count, max = 8, label }: DotGridProps) {
  const total = Math.max(max, count, 1);
  return (
    <div className="flex flex-wrap gap-1.5" role="img" aria-label={label}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${i < count ? "bg-gold" : "bg-shell/60"}`}
          aria-hidden
        />
      ))}
    </div>
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
