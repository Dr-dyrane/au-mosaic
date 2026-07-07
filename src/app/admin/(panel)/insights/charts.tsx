/* Presentational charts for the insights room. Pure server components,
   props in and JSX out, no client, no state. The book supplies the
   numbers upstairs; these only draw the shape of them. Colour comes
   from the palette tokens alone, so every chart travels across all six
   palettes and both night and day. Bars are divs, the hero is one SVG,
   and nothing here asks the reader for anything. */

export type TrendPoint = { label: string; value: number };

export type TrendAreaProps = {
  points: TrendPoint[];
  projection?: number | null;
};

/* The hero: billed over time as a gold line with a soft fill under it,
   and, when the pace earns it, a dotted continuation one step to the
   right that reads as "if this holds". The area and line fill the width
   with preserveAspectRatio none; the strokes stay crisp with
   non-scaling-stroke, and the month labels ride an HTML row below so
   their type never distorts. Point dots are left off on purpose, since
   a stretched circle would read as an ellipse; the line carries the
   eye, and the figures live in the copy beside the chart. */
export function TrendArea({ points, projection }: TrendAreaProps) {
  if (points.length < 2) {
    return (
      <p className="mt-3 text-[14px] leading-relaxed text-dusk">
        The first order draws the first line.
      </p>
    );
  }

  const W = 1000;
  const H = 200;
  const padTop = 16;
  const padBottom = 12;
  const plotH = H - padTop - padBottom;

  const hasProjection = typeof projection === "number" && projection > 0;
  const steps = points.length - 1 + (hasProjection ? 1 : 0);
  const max = Math.max(1, ...points.map((p) => p.value), hasProjection ? (projection as number) : 0);

  const xAt = (i: number) => (steps === 0 ? 0 : (i / steps) * W);
  const yAt = (v: number) => padTop + (1 - v / max) * plotH;

  const coords = points.map((p, i) => ({ x: xAt(i), y: yAt(p.value) }));
  const last = coords[coords.length - 1];

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${(H - padBottom).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(H - padBottom).toFixed(1)} Z`;

  const projX = hasProjection ? xAt(points.length) : 0;
  const projY = hasProjection ? yAt(projection as number) : 0;

  const stride = points.length > 8 ? Math.ceil(points.length / 6) : 1;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="176"
        preserveAspectRatio="none"
        role="img"
        aria-label="Billed over time"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="trend-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-gold)" stopOpacity="0.26" />
            <stop offset="1" stopColor="var(--color-gold)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#trend-area-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {hasProjection && (
          <line
            x1={last.x}
            y1={last.y}
            x2={projX}
            y2={projY}
            stroke="var(--color-gold)"
            strokeWidth="2"
            strokeOpacity="0.5"
            strokeDasharray="2 6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      <div className="mt-2.5 flex justify-between gap-2">
        {points.map((p, i) => {
          const show = i % stride === 0 || i === points.length - 1;
          return (
            <span key={`${p.label}-${i}`} className="text-[11px] uppercase tracking-[0.14em] text-mist">
              {show ? p.label : " "}
            </span>
          );
        })}
        {hasProjection && <span className="text-[11px] uppercase tracking-[0.14em] text-gold">Pace</span>}
      </div>
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
