import type { ReactNode } from "react";

/* Deterministic mosaic graphics. No images needed: the brand IS the pattern.
   Colours cycle through a pool-to-terracotta palette with an index hash, so
   server and client always render the same tiles (no hydration drift). */

const PALETTE = [
  "#0e7490", "#155e75", "#38cfe0", "#7fdde9", "#d7f3f7",
  "#0e7490", "#134e5e", "#38cfe0", "#a5e8f0", "#c05f2b",
  "#0e7490", "#38cfe0", "#134e5e", "#7fdde9", "#e8b48e",
];

const tone = (i: number) => PALETTE[(i * 7 + 3) % PALETTE.length];

/* The brand mark: Nonso's "au" mosaic sign, rebuilt as deterministic
   tesserae in his own blues, the ones his Instagram has worn all
   along: navy, royal, sky, and pale glass. A logo is toner, not
   chrome, so the mark keeps these blues in every house and both
   suns; the palettes may change the room, never the sign above the
   door. No period, per the client's logo. Keep the bitmap in sync
   with scripts/brand-icons.py. */

/* The letters are joined the way his sign joins them: the a's stem
   and the u's left wall are one shared stroke, a ligature. The a's
   bowl rounds at its lower left (the base steps in), and the u's
   tail dips below the baseline and hooks back, both read off his
   own artwork. */
const AU_GRID = [
  ".######...##.",
  "##...##...##.",
  ".....##...##.",
  ".######...##.",
  "##...##...##.",
  "##...##...##.",
  "..##########.",
  ".........##..",
];
/* The light lives in the sign: his tiles run deep navy at the
   bottom-left and brighten to glass at the top-right, with a hash
   jitter so no two neighbours match. Position picks the tone, the
   hash breaks the banding, and the same arithmetic runs in
   scripts/brand-icons.py. */
const AU_RAMP = ["#12275e", "#1e3e90", "#2b5fc7", "#5b8fd9", "#7fb3e8", "#c8e0f5"];

/* Two voices, one sign. Brand: the canonical blues, for every
   surface that is the company's identity to the outside (icons,
   badges, paper). Room: the same arithmetic over the house tokens,
   so inside the site and the office the mark relights with the
   palette and the sun; in the Royal default the two voices agree. */
const AU_ROOM_RAMP = [
  "var(--color-gold-deep)",
  "var(--color-gold-deep)",
  "var(--color-gold)",
  "var(--color-gold)",
  "var(--color-ink)",
  "var(--color-ink)",
];

export type AuVoice = "room" | "brand";

function auTone(ramp: string[], r: number, c: number, rows: number, cols: number, i: number) {
  const w = 0.55 * (1 - r / (rows - 1)) + 0.45 * (c / (cols - 1));
  const jitter = (((i * 13 + 5) % 5) - 2) * 0.35;
  const idx = Math.min(ramp.length - 1, Math.max(0, Math.round(w * (ramp.length - 1) + jitter)));
  return ramp[idx];
}


export function AuMark({ className = "", voice = "room" }: { className?: string; voice?: AuVoice }) {
  const T = 10;
  const rows = AU_GRID.length;
  const cols = AU_GRID[0].length;
  const ramp = voice === "brand" ? AU_RAMP : AU_ROOM_RAMP;
  const w = cols * T;
  const h = rows * T;
  const tiles: React.ReactNode[] = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      i++;
      if (AU_GRID[r][c] !== "#") continue;
      tiles.push(
        <rect
          key={`${r}-${c}`}
          x={c * T + 1}
          y={r * T + 1}
          width={T - 2}
          height={T - 2}
          rx="2"
          fill={auTone(ramp, r, c, rows, cols, i)}
        />
      );
    }
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
      {tiles}
    </svg>
  );
}

/* The full sign, as the client's own flyers set it: the tesserae au,
   then mosaic in a lowercase serif wearing the brand blue. The word
   picks its legible blue per sun through the brand-word rules in
   globals; the palettes have no say, because a sign is a sign. Size
   the lockup with a font-size on the wrapper: the mark rides at 1em. */
export function AuLockup({ className = "", voice = "room" }: { className?: string; voice?: AuVoice }) {
  return (
    <span className={`inline-flex items-center gap-[0.3em] ${className}`}>
      <AuMark voice={voice} className="h-[1.12em] w-auto shrink-0" />
      <span className="brand-word font-serif text-[1.4em] leading-none">mosaic</span>
    </span>
  );
}

/** Small square logo mark: a 3x3 mosaic. */
export function MosaicMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <rect
          key={i}
          x={(i % 3) * 12 + 1}
          y={Math.floor(i / 3) * 12 + 1}
          width="10"
          height="10"
          rx="2.5"
          fill={tone(i)}
        />
      ))}
    </svg>
  );
}

/** Wide mosaic band used as section artwork. */
export function MosaicBand({ rows = 5, cols = 18, className = "" }: { rows?: number; cols?: number; className?: string }) {
  const w = cols * 12;
  const h = rows * 12;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden>
      {Array.from({ length: rows * cols }, (_, i) => (
        <rect
          key={i}
          x={(i % cols) * 12 + 0.8}
          y={Math.floor(i / cols) * 12 + 0.8}
          width="10.4"
          height="10.4"
          rx="2"
          fill={tone(i)}
          opacity={0.5 + ((i * 11) % 50) / 100}
        />
      ))}
    </svg>
  );
}

/* ---- vivid product renders ------------------------------------------------
   A "tile sheet" drawn like the real thing: glass squares on grout, each with
   a specular highlight and a darker base edge, colours picked from the range's
   own palette. Deterministic (index hash), so server and client agree. */

const pick = (colors: string[], i: number) => colors[(i * 13 + 5) % colors.length];

export function TileSheet({
  colors,
  rows = 7,
  cols = 7,
  className = "",
}: {
  colors: string[];
  rows?: number;
  cols?: number;
  className?: string;
}) {
  const T = 14; // tile cell
  const w = cols * T;
  const h = rows * T;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      {/* grout */}
      <rect x="0" y="0" width={w} height={h} fill="#e9e4da" />
      {Array.from({ length: rows * cols }, (_, i) => {
        const x = (i % cols) * T + 1;
        const y = Math.floor(i / cols) * T + 1;
        const s = T - 2;
        const c = pick(colors, i);
        return (
          <g key={i}>
            <rect x={x} y={y} width={s} height={s} rx="1.6" fill={c} />
            {/* darker base edge for depth */}
            <rect x={x} y={y + s - 2.6} width={s} height="2.6" rx="1.3" fill="#0d2430" opacity="0.18" />
            {/* glass specular highlight */}
            <path
              d={`M ${x + 1} ${y + 4} Q ${x + 1} ${y + 1} ${x + 4} ${y + 1} L ${x + s - 3} ${y + 1} Q ${x + 2} ${y + 2.5} ${x + 1} ${y + s * 0.55} Z`}
              fill="#ffffff"
              opacity="0.34"
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Immersive water panel: layered pool gradient over a mosaic floor, with
    light caustics. The hero surface the headline sits on. */
export function WaterHero({ className = "", children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* mosaic floor */}
      <TileSheet
        colors={["#0e7490", "#155e75", "#1a94ad", "#2fb9cf", "#67d6e5"]}
        rows={10}
        cols={24}
        className="absolute inset-0 h-full w-full"
      />
      {/* water depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(168deg, rgba(19,78,94,0.86) 0%, rgba(14,116,144,0.62) 42%, rgba(56,207,224,0.32) 100%)",
        }}
      />
      {/* light caustics */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 42% at 78% 6%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%), radial-gradient(42% 30% at 16% 86%, rgba(56,207,224,0.36) 0%, rgba(56,207,224,0) 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
