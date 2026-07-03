"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { PIECES } from "@/lib/products";
import { waProduct } from "@/lib/wa";

/* See it in your space. Upload a photo, drag the four stones to the
   corners of your surface, choose a piece: the colourway is laid onto
   the surface in perspective, keeping the photo's own light. Ends
   where every path in this house ends: WhatsApp. No libraries; the
   homography is forty lines of maths. */

type Pt = { x: number; y: number };

/* Solve the 3x3 homography mapping the unit square to quad q. */
function homography(q: Pt[]) {
  const [p0, p1, p2, p3] = q; // tl, tr, br, bl
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y;
  const sx = p0.x - p1.x + p2.x - p3.x;
  const sy = p0.y - p1.y + p2.y - p3.y;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - sy * dx2) / den;
  const h = (sy * dx1 - sx * dy1) / den;
  return {
    a: p1.x - p0.x + g * p1.x, b: p3.x - p0.x + h * p3.x, c: p0.x,
    d: p1.y - p0.y + g * p1.y, e: p3.y - p0.y + h * p3.y, f: p0.y,
    g, h,
  };
}

function mapPoint(H: ReturnType<typeof homography>, u: number, v: number): Pt {
  const w = H.g * u + H.h * v + 1;
  return { x: (H.a * u + H.b * v + H.c) / w, y: (H.d * u + H.e * v + H.f) / w };
}

/* Draw src triangle -> dst triangle with an affine map. */
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  s: [Pt, Pt, Pt],
  d: [Pt, Pt, Pt]
) {
  const [s0, s1, s2] = s;
  const [d0, d1, d2] = d;
  const den = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(den) < 1e-9) return;
  const a = (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / den;
  const b = (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / den;
  const c = (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / den;
  const dd = (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / den;
  const e = (d0.x * (s1.x * s2.y - s2.x * s1.y) + d1.x * (s2.x * s0.y - s0.x * s2.y) + d2.x * (s0.x * s1.y - s1.x * s0.y)) / den;
  const f = (d0.y * (s1.x * s2.y - s2.x * s1.y) + d1.y * (s2.x * s0.y - s0.x * s2.y) + d2.y * (s0.x * s1.y - s1.x * s0.y)) / den;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0.x, d0.y);
  ctx.lineTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.closePath();
  ctx.clip();
  ctx.setTransform(a, b, c, dd, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/* A seamless sheet of the piece's colourway, glass tiles on grout. */
function makePattern(colors: string[], tile: number, groutLight: boolean) {
  const cols = Math.max(6, Math.round(512 / tile));
  const size = cols * tile;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = groutLight ? "#e9e4da" : "#242019";
  ctx.fillRect(0, 0, size, size);
  const g = Math.max(1, tile * 0.06);
  for (let r = 0; r < cols; r++) {
    for (let q = 0; q < cols; q++) {
      const i = r * cols + q;
      ctx.fillStyle = colors[(i * 13 + 5) % colors.length];
      const x = q * tile, y = r * tile;
      ctx.beginPath();
      ctx.roundRect(x + g, y + g, tile - 2 * g, tile - 2 * g, tile * 0.12);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.roundRect(x + g * 1.6, y + g * 1.6, (tile - 2 * g) * 0.5, (tile - 2 * g) * 0.28, tile * 0.1);
      ctx.fill();
    }
  }
  return c;
}

const DEFAULT_QUAD: Pt[] = [
  { x: 0.28, y: 0.45 }, { x: 0.75, y: 0.45 }, { x: 0.92, y: 0.92 }, { x: 0.1, y: 0.92 },
];

export default function Visualizer({ initialPiece }: { initialPiece?: string }) {
  const pieces = PIECES;
  const [pieceSlug, setPieceSlug] = useState(
    pieces.some((p) => p.slug === initialPiece) ? (initialPiece as string) : pieces[0].slug
  );
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [quad, setQuad] = useState<Pt[]>(DEFAULT_QUAD);
  const [tileSize, setTileSize] = useState(26);
  const [blend, setBlend] = useState(0.85);
  const [groutLight, setGroutLight] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);

  const piece = pieces.find((p) => p.slug === pieceSlug)!;

  const loadImage = (src: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setPhoto(img);
      track("viz_photo", { source: src.startsWith("blob:") ? "upload" : "sample" });
    };
    img.src = src;
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    loadImage(URL.createObjectURL(f));
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo) return;
    const maxW = 1400;
    const scale = Math.min(1, maxW / photo.naturalWidth);
    const W = Math.round(photo.naturalWidth * scale);
    const Hh = Math.round(photo.naturalHeight * scale);
    canvas.width = W;
    canvas.height = Hh;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(photo, 0, 0, W, Hh);

    const q = quad.map((p) => ({ x: p.x * W, y: p.y * Hh }));
    const pattern = makePattern(piece.colors || ["#3aa9d6"], tileSize, groutLight);

    /* Warp the pattern onto an overlay via subdivided triangles. */
    const overlay = document.createElement("canvas");
    overlay.width = W;
    overlay.height = Hh;
    const octx = overlay.getContext("2d")!;
    const H = homography(q);
    const N = 18;
    const P = pattern.width;
    for (let r = 0; r < N; r++) {
      for (let cq = 0; cq < N; cq++) {
        const u0 = cq / N, u1 = (cq + 1) / N, v0 = r / N, v1 = (r + 1) / N;
        const s00 = { x: u0 * P, y: v0 * P }, s10 = { x: u1 * P, y: v0 * P };
        const s11 = { x: u1 * P, y: v1 * P }, s01 = { x: u0 * P, y: v1 * P };
        const d00 = mapPoint(H, u0, v0), d10 = mapPoint(H, u1, v0);
        const d11 = mapPoint(H, u1, v1), d01 = mapPoint(H, u0, v1);
        drawTriangle(octx, pattern, [s00, s10, s11], [d00, d10, d11]);
        drawTriangle(octx, pattern, [s00, s11, s01], [d00, d11, d01]);
      }
    }

    /* Lay the sheet with the photo's own light: multiply keeps shadow,
       a soft screen pass returns the highlights. */
    ctx.save();
    ctx.globalAlpha = blend;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(overlay, 0, 0);
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = blend * 0.5;
    ctx.drawImage(photo, 0, 0, W, Hh);
    ctx.restore();
  }, [photo, quad, piece, tileSize, blend, groutLight]);

  useEffect(() => {
    render();
  }, [render]);

  const pointerPos = (e: React.PointerEvent): Pt => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const share = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    track("viz_share", { piece: piece.slug });
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `au-mosaic-${piece.slug}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            text: `${piece.name} · au-mosaic.shop`,
          });
          return;
        } catch {}
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      window.open(waProduct(`${piece.name} (visualised in my space)`), "_blank");
    }, "image/png");
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    track("viz_download", { piece: piece.slug });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `au-mosaic-${piece.slug}.png`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      {/* Step 1: the photo */}
      {!photo && (
        <div className="panel flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Step one</p>
            <p className="font-serif mt-2 text-[20px]">Your space, one photo.</p>
            <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-dusk">
              A pool, a wall, a floor. Straight on works best.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="btn-gold cursor-pointer">
              Choose a photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
            <button onClick={() => loadImage("/media/private-pool.jpg")} className="link-hair text-dusk">
              Try the sample pool
            </button>
          </div>
        </div>
      )}

      {photo && (
        <>
          {/* The canvas and the stones */}
          <div ref={wrapRef} className="relative -mx-5 overflow-hidden rounded-none sm:mx-0 sm:rounded-[26px]">
            <canvas ref={canvasRef} className="block h-auto w-full" />
            <svg
              className="absolute inset-0 h-full w-full touch-none"
              onPointerMove={(e) => {
                if (dragging.current === null) return;
                const p = pointerPos(e);
                setQuad((q) => q.map((pt, i) => (i === dragging.current ? p : pt)));
              }}
              onPointerUp={() => (dragging.current = null)}
              onPointerLeave={() => (dragging.current = null)}
            >
              {quad.map((p, i) => {
                const n = quad[(i + 1) % 4];
                return (
                  <line
                    key={i}
                    x1={`${p.x * 100}%`}
                    y1={`${p.y * 100}%`}
                    x2={`${n.x * 100}%`}
                    y2={`${n.y * 100}%`}
                    stroke="var(--t-brass)"
                    strokeWidth="2"
                    strokeDasharray="6 5"
                    opacity="0.9"
                  />
                );
              })}
              {quad.map((p, i) => (
                <circle
                  key={i}
                  cx={`${p.x * 100}%`}
                  cy={`${p.y * 100}%`}
                  r="14"
                  fill="var(--t-brass)"
                  fillOpacity="0.9"
                  stroke="#14110b"
                  strokeWidth="2"
                  style={{ cursor: "grab" }}
                  onPointerDown={(e) => {
                    (e.target as Element).setPointerCapture(e.pointerId);
                    dragging.current = i;
                    track("viz_adjust", { corner: i });
                  }}
                />
              ))}
            </svg>
          </div>
          <p className="mt-3 text-[12px] uppercase tracking-[0.18em] text-mist">
            Drag the four stones to the corners of your surface
          </p>

          {/* The pieces */}
          <div className="mt-10 flex gap-3 overflow-x-auto pb-2">
            {pieces.map((p) => (
              <button
                key={p.slug}
                onClick={() => {
                  setPieceSlug(p.slug);
                  track("viz_piece", { piece: p.slug });
                }}
                aria-pressed={p.slug === pieceSlug}
                title={p.name}
                className={`flex h-12 shrink-0 items-center gap-2 rounded-full px-4 transition-transform active:scale-95 ${
                  p.slug === pieceSlug ? "bg-shell ring-2 ring-gold" : "bg-shell/50"
                }`}
              >
                <span className="flex gap-0.5">
                  {(p.colors || []).slice(0, 4).map((c) => (
                    <span key={c} className="h-4 w-4 rounded-[4px]" style={{ background: c }} />
                  ))}
                </span>
                <span className="whitespace-nowrap text-[12px] font-semibold">{p.name}</span>
              </button>
            ))}
          </div>

          {/* The controls */}
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <div className="panel">
              <p className="eyebrow">Tile size</p>
              <input
                type="range"
                min={14}
                max={48}
                value={tileSize}
                onChange={(e) => setTileSize(+e.target.value)}
                className="mt-4 w-full accent-[#c2a15c]"
                aria-label="Tile size"
              />
            </div>
            <div className="panel">
              <p className="eyebrow">Blend with the light</p>
              <input
                type="range"
                min={40}
                max={100}
                value={blend * 100}
                onChange={(e) => setBlend(+e.target.value / 100)}
                className="mt-4 w-full accent-[#c2a15c]"
                aria-label="Blend"
              />
            </div>
            <div className="panel flex items-center justify-between gap-4">
              <p className="eyebrow">Grout</p>
              <button onClick={() => setGroutLight(!groutLight)} className="link-hair text-dusk">
                {groutLight ? "Light" : "Dark"}
              </button>
            </div>
          </div>

          {/* The door out */}
          <div className="mt-10 flex flex-wrap items-center gap-8">
            <button onClick={share} className="btn-gold" data-wa="visualizer">
              Send it to the house
            </button>
            <button onClick={download} className="link-hair text-dusk">
              Download the preview
            </button>
            <label className="link-hair cursor-pointer text-dusk">
              New photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
