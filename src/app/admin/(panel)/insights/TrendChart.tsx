"use client";

import { useRef, useState } from "react";
import { naira } from "@/lib/backoffice";

/* The billed trend, with detail on demand. The area and line fill the
   width as one stretched SVG; the crosshair, the point dot, and the top
   readout are crisp HTML laid over it, so nothing distorts and a touch
   or a hover names the month and its figure. Colour is palette tokens
   only, so it travels across every house and both suns. */

export type TrendPoint = { label: string; value: number };

export type TrendChartProps = {
  points: TrendPoint[];
  projection?: number | null;
  height?: number;
};

export default function TrendChart({ points, projection, height = 176 }: TrendChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  if (points.length < 2) {
    return (
      <p className="mt-3 text-[14px] leading-relaxed text-dusk">The first order draws the first line.</p>
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

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const i = Math.min(points.length - 1, Math.max(0, Math.round(frac * steps)));
    setHover(i);
  };

  const hx = hover !== null ? (xAt(hover) / W) * 100 : 0;
  const hy = hover !== null ? (yAt(points[hover].value) / H) * 100 : 0;

  return (
    <div className="mt-1">
      <div
        ref={wrapRef}
        className="relative touch-none"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={height}
          preserveAspectRatio="none"
          role="img"
          aria-label="Billed over time"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-gold)" stopOpacity="0.26" />
              <stop offset="1" stopColor="var(--color-gold)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#trend-fill)" />
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

        {hover !== null && (
          <>
            <span className="pointer-events-none absolute bottom-0 top-0 w-px bg-mist/40" style={{ left: `${hx}%` }} />
            <span
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold"
              style={{ left: `${hx}%`, top: `${hy}%` }}
            />
            <span
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-[12px] bg-shell px-3 py-2 text-center"
              style={{ left: `${Math.min(88, Math.max(12, hx))}%` }}
            >
              <span className="block text-[11px] uppercase tracking-[0.14em] text-mist">{points[hover].label}</span>
              <span className="block text-[14px] tabular-nums text-ink">{naira(points[hover].value)}</span>
            </span>
          </>
        )}
      </div>

      <div className="mt-2.5 flex justify-between gap-2">
        {points.map((p, i) => {
          const show = i % stride === 0 || i === points.length - 1;
          return (
            <span key={`${p.label}-${i}`} className="text-[11px] uppercase tracking-[0.14em] text-mist">
              {show ? p.label : " "}
            </span>
          );
        })}
        {hasProjection && <span className="text-[11px] uppercase tracking-[0.14em] text-gold">Pace</span>}
      </div>
    </div>
  );
}
