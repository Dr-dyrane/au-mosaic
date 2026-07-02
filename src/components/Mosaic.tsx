/* Deterministic mosaic graphics. No images needed: the brand IS the pattern.
   Colours cycle through a pool-to-terracotta palette with an index hash, so
   server and client always render the same tiles (no hydration drift). */

const PALETTE = [
  "#0e7490", "#155e75", "#38cfe0", "#7fdde9", "#d7f3f7",
  "#0e7490", "#134e5e", "#38cfe0", "#a5e8f0", "#c05f2b",
  "#0e7490", "#38cfe0", "#134e5e", "#7fdde9", "#e8b48e",
];

const tone = (i: number) => PALETTE[(i * 7 + 3) % PALETTE.length];

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

/** Wide mosaic band used as the hero artwork. */
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
