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

/* The brand mark: Nonso's "au" sign, read closely off his own logo.
   Not pixel letters: his a and u are smooth rounded lowercase
   letterforms, and the mosaic lives INSIDE them, tiny tesserae with
   visible grout filling soft letter shapes. Here the letters are
   thick round-capped strokes (a single-storey a: bowl and stem; a u:
   two stems on a curve) and the stroke paints through a deterministic
   tesserae pattern in his blues. A logo is toner, not chrome: these
   blues hold in every house and both suns. Keep geometry and tones
   in sync with scripts/brand-icons.py. */

const AU_TONES = ["#2b5fc7", "#1e3e90", "#7fb3e8", "#c8e0f5", "#123064"];
const AU_GROUT = "#0a1a3e";

/* One pre-laid pattern tile of 5x5 tesserae, hash-cycled so server
   and client agree. */
function TesseraePattern({ id }: { id: string }) {
  const C = 6;
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const i = r * 5 + c;
      cells.push(
        <rect
          key={i}
          x={c * C + 0.5}
          y={r * C + 0.5}
          width={C - 1}
          height={C - 1}
          rx="0.8"
          fill={AU_TONES[(i * 13 + 5) % AU_TONES.length]}
        />
      );
    }
  }
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={30} height={30}>
      <rect width="30" height="30" fill={AU_GROUT} />
      {cells}
    </pattern>
  );
}

export function AuMark({ className = "" }: { className?: string }) {
  /* Letter skeletons, drawn as strokes and dressed by the pattern.
     The a: a round bowl with its stem on the right. The u: two
     stems joined by the bowl's own curve, the right stem running
     to the baseline. Round caps everywhere: his font is soft. */
  const stroke = { fill: "none" as const, strokeWidth: 17, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 150 70" className={className} aria-hidden>
      <defs>
        <TesseraePattern id="au-tess" />
      </defs>
      <g stroke="url(#au-tess)" {...stroke}>
        {/* a */}
        <circle cx="38" cy="42" r="18" />
        <path d="M 56 24 L 56 60" />
        {/* u */}
        <path d="M 84 12 L 84 42 A 19 19 0 0 0 122 42 L 122 12" />
        <path d="M 122 34 L 122 60" />
      </g>
    </svg>
  );
}

/* The full sign, as the client's own flyers set it: the tesserae au,
   then mosaic in a lowercase serif wearing the brand blue. The word
   picks its legible blue per sun through the brand-word rules in
   globals; the palettes have no say, because a sign is a sign. Size
   the lockup with a font-size on the wrapper: the mark rides at 1em. */
export function AuLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.5em] ${className}`}>
      <AuMark className="h-[1em] w-auto shrink-0" />
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
