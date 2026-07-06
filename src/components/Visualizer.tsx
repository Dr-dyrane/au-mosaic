"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { IconClose } from "@/app/admin/(panel)/icons";
import { track } from "@vercel/analytics";
import { VISUALIZER_CONTEXTS, VISUALIZER_SAMPLE } from "@/lib/images";
import type { Piece } from "@/lib/products";
import { SITE } from "@/lib/site";
import { waProduct } from "@/lib/wa";

/* See it in your space. Upload a photo, drag the four stones to the
   corners of your surface, choose a piece: the colourway is laid onto
   the surface in perspective, keeping the photo's own light.

   The Apple details: a loupe magnifies under your finger while you
   place a stone, press and hold the photo to see the original, the
   render shimmers alive when it changes, sliders tick in the hand
   where the platform allows, and the surface modes move the same tile
   from pool to wall to floor. Ends where every path in this house ends:
   WhatsApp. No libraries; the homography is forty lines. */

type Pt = { x: number; y: number };
type SurfaceId = "pool" | "wall" | "backsplash" | "shower" | "floor";
type LoadSource = "upload" | "sample" | "default" | "camera";
type PrepMode = "primer" | "blur" | "none";
type Homography = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
};
type SnapResult = { quad: Pt[]; confidence: number };

function homography(q: Pt[]): Homography | null {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y;
  const sx = p0.x - p1.x + p2.x - p3.x;
  const sy = p0.y - p1.y + p2.y - p3.y;
  const den = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(den) < 1e-8) return null;
  const g = (sx * dy2 - sy * dx2) / den;
  const h = (sy * dx1 - sx * dy1) / den;
  if (![g, h].every(Number.isFinite)) return null;
  return {
    a: p1.x - p0.x + g * p1.x, b: p3.x - p0.x + h * p3.x, c: p0.x,
    d: p1.y - p0.y + g * p1.y, e: p3.y - p0.y + h * p3.y, f: p0.y,
    g, h,
  };
}

function mapPoint(H: Homography, u: number, v: number): Pt {
  const w = H.g * u + H.h * v + 1;
  return { x: (H.a * u + H.b * v + H.c) / w, y: (H.d * u + H.e * v + H.f) / w };
}

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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function clipQuad(ctx: CanvasRenderingContext2D, q: Pt[]) {
  ctx.beginPath();
  ctx.moveTo(q[0].x, q[0].y);
  for (let i = 1; i < q.length; i += 1) ctx.lineTo(q[i].x, q[i].y);
  ctx.closePath();
  ctx.clip();
}

function pointInQuad(point: Pt, q: Pt[]) {
  let inside = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i, i += 1) {
    const a = q[i];
    const b = q[j];
    const crosses = a.y > point.y !== b.y > point.y;
    if (crosses) {
      const x = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
      if (point.x < x) inside = !inside;
    }
  }
  return inside;
}

function sampleQuadColor(source: CanvasRenderingContext2D, q: Pt[], width: number, height: number) {
  const left = clamp(Math.floor(Math.min(...q.map((p) => p.x))), 0, width - 1);
  const right = clamp(Math.ceil(Math.max(...q.map((p) => p.x))), left + 1, width);
  const top = clamp(Math.floor(Math.min(...q.map((p) => p.y))), 0, height - 1);
  const bottom = clamp(Math.ceil(Math.max(...q.map((p) => p.y))), top + 1, height);
  let pixels: Uint8ClampedArray;
  try {
    pixels = source.getImageData(left, top, right - left, bottom - top).data;
  } catch {
    return "rgba(214, 206, 190, 0.78)";
  }
  const step = Math.max(8, Math.floor(Math.min(right - left, bottom - top) / 32));
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let y = 0; y < bottom - top; y += step) {
    for (let x = 0; x < right - left; x += step) {
      if (!pointInQuad({ x: left + x, y: top + y }, q)) continue;
      const i = (y * (right - left) + x) * 4;
      r += pixels[i];
      g += pixels[i + 1];
      b += pixels[i + 2];
      count += 1;
    }
  }
  if (!count) return "rgba(214, 206, 190, 0.78)";
  return `rgba(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}, 0.78)`;
}

function drawBlurredPhoto(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
  blur = 18,
  cover = false
) {
  const pad = Math.max(18, Math.round(Math.max(width, height) * 0.02));
  ctx.filter = `blur(${blur}px) saturate(0.82)`;
  drawSource(ctx, source, sourceWidth, sourceHeight, width, height, cover, pad);
  ctx.filter = "none";
}

function drawSource(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
  cover = false,
  pad = 0
) {
  if (!cover) {
    ctx.drawImage(source, -pad, -pad, width + pad * 2, height + pad * 2);
    return;
  }
  const scale = Math.max((width + pad * 2) / sourceWidth, (height + pad * 2) / sourceHeight);
  const drawW = sourceWidth * scale;
  const drawH = sourceHeight * scale;
  const dx = (width - drawW) / 2;
  const dy = (height - drawH) / 2;
  ctx.drawImage(source, dx - pad, dy - pad, drawW + pad * 2, drawH + pad * 2);
}

function detectSurfaceFrame(source: CanvasImageSource, sourceW: number, sourceH: number, surface: SurfaceId): SnapResult | null {
  if (sourceW < 80 || sourceH < 80) return null;

  const maxSide = 360;
  const scale = Math.min(1, maxSide / Math.max(sourceW, sourceH));
  const w = Math.max(80, Math.round(sourceW * scale));
  const h = Math.max(80, Math.round(sourceH * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }

  const lum = new Float32Array(w * h);
  for (let i = 0, j = 0; i < pixels.length; i += 4, j += 1) {
    lum[j] = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
  }

  const edgeX = new Float32Array(w * h);
  const edgeY = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      edgeX[i] = Math.abs(lum[i + 1] - lum[i - 1]);
      edgeY[i] = Math.abs(lum[i + w] - lum[i - w]);
    }
  }

  const smooth = (scores: Float32Array) => {
    const next = new Float32Array(scores.length);
    for (let i = 0; i < scores.length; i += 1) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - 2); j <= Math.min(scores.length - 1, i + 2); j += 1) {
        sum += scores[j];
        count += 1;
      }
      next[i] = sum / count;
    }
    return next;
  };

  const rowScores = (x0 = 0.05, x1 = 0.95) => {
    const scores = new Float32Array(h);
    const startX = Math.round(w * x0);
    const endX = Math.round(w * x1);
    for (let y = 1; y < h - 1; y += 1) {
      let sum = 0;
      for (let x = startX; x < endX; x += 1) sum += edgeY[y * w + x];
      scores[y] = sum / Math.max(1, endX - startX);
    }
    return smooth(scores);
  };

  const columnScores = (y0 = 0.05, y1 = 0.95) => {
    const scores = new Float32Array(w);
    const startY = Math.round(h * y0);
    const endY = Math.round(h * y1);
    for (let x = 1; x < w - 1; x += 1) {
      let sum = 0;
      for (let y = startY; y < endY; y += 1) sum += edgeX[y * w + x];
      scores[x] = sum / Math.max(1, endY - startY);
    }
    return smooth(scores);
  };

  const pick = (scores: Float32Array, from: number, to: number, fallback: number) => {
    const start = clamp(Math.round(scores.length * from), 1, scores.length - 2);
    const end = clamp(Math.round(scores.length * to), start + 1, scores.length - 2);
    let best = start;
    let bestScore = -1;
    let total = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      const score = scores[i];
      total += score;
      count += 1;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    const average = total / Math.max(1, count);
    return {
      value: clamp(best / Math.max(1, scores.length - 1), 0.02, 0.98),
      strength: bestScore / Math.max(1, average),
      fallback,
    };
  };

  const q = SURFACES[surface].quad;
  const rows = rowScores();
  const wallLike = surface === "wall" || surface === "backsplash" || surface === "shower";
  if (wallLike) {
    const topRange: Record<SurfaceId, [number, number]> = {
      pool: [0.25, 0.55],
      wall: [0.08, 0.45],
      backsplash: [0.2, 0.5],
      shower: [0.08, 0.38],
      floor: [0.35, 0.65],
    };
    const bottomRange: Record<SurfaceId, [number, number]> = {
      pool: [0.65, 0.95],
      wall: [0.5, 0.92],
      backsplash: [0.52, 0.78],
      shower: [0.62, 0.94],
      floor: [0.7, 0.98],
    };
    const top = pick(rows, topRange[surface][0], topRange[surface][1], q[0].y);
    const bottom = pick(rows, bottomRange[surface][0], bottomRange[surface][1], q[2].y);
    const y0 = Math.min(top.value, bottom.value - 0.22);
    const y1 = Math.max(bottom.value, y0 + 0.24);
    const cols = columnScores(clamp(y0 - 0.04, 0.02, 0.9), clamp(y1 + 0.04, 0.1, 0.98));
    const left = pick(cols, 0.04, 0.48, q[0].x);
    const right = pick(cols, 0.52, 0.96, q[1].x);
    const x0 = Math.min(left.value, right.value - 0.26);
    const x1 = Math.max(right.value, x0 + 0.28);
    const confidence = (top.strength + bottom.strength + left.strength + right.strength) / 4;
    if (confidence < 1.12 || x1 - x0 < 0.24 || y1 - y0 < 0.2) return null;
    return {
      quad: [
        { x: clamp(x0, 0.02, 0.92), y: clamp(y0, 0.02, 0.9) },
        { x: clamp(x1, 0.08, 0.98), y: clamp(y0, 0.02, 0.9) },
        { x: clamp(x1, 0.08, 0.98), y: clamp(y1, 0.1, 0.98) },
        { x: clamp(x0, 0.02, 0.92), y: clamp(y1, 0.1, 0.98) },
      ],
      confidence,
    };
  }

  const top = pick(rows, surface === "pool" ? 0.28 : 0.36, surface === "pool" ? 0.68 : 0.72, q[0].y);
  const bottom = pick(rows, 0.72, 0.98, q[2].y);
  const yTop = clamp(top.value, 0.16, 0.82);
  const yBottom = clamp(Math.max(bottom.value, yTop + 0.18), yTop + 0.18, 0.98);
  const topCols = columnScores(clamp(yTop - 0.1, 0.04, 0.86), clamp(yTop + 0.14, 0.12, 0.94));
  const lowerCols = columnScores(clamp(yTop, 0.08, 0.9), 0.98);
  const leftTop = pick(topCols, 0.04, 0.48, q[0].x);
  const rightTop = pick(topCols, 0.52, 0.96, q[1].x);
  const leftBottom = pick(lowerCols, 0.0, 0.42, q[3].x);
  const rightBottom = pick(lowerCols, 0.58, 1.0, q[2].x);
  const confidence = (top.strength + bottom.strength + leftTop.strength + rightTop.strength + leftBottom.strength + rightBottom.strength) / 6;
  const topWidth = rightTop.value - leftTop.value;
  const bottomWidth = rightBottom.value - leftBottom.value;
  if (confidence < 1.1 || topWidth < 0.22 || bottomWidth < 0.28 || yBottom - yTop < 0.16) return null;
  return {
    quad: [
      { x: clamp(leftTop.value, 0.02, 0.74), y: yTop },
      { x: clamp(rightTop.value, 0.26, 0.98), y: yTop },
      { x: clamp(Math.max(rightBottom.value, rightTop.value + 0.08), 0.34, 0.98), y: yBottom },
      { x: clamp(Math.min(leftBottom.value, leftTop.value - 0.08), 0.02, 0.66), y: yBottom },
    ],
    confidence,
  };
}

function detectSurfaceQuad(image: HTMLImageElement, surface: SurfaceId): SnapResult | null {
  return detectSurfaceFrame(image, image.naturalWidth || image.width, image.naturalHeight || image.height, surface);
}

function detectVideoSurface(video: HTMLVideoElement, surface: SurfaceId): SnapResult | null {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) return null;
  return detectSurfaceFrame(video, video.videoWidth, video.videoHeight, surface);
}

const DEFAULT_QUAD: Pt[] = [
  { x: 0.28, y: 0.45 }, { x: 0.75, y: 0.45 }, { x: 0.92, y: 0.92 }, { x: 0.1, y: 0.92 },
];

const SAMPLE_POOL_QUAD: Pt[] = [
  { x: 0.31, y: 0.43 }, { x: 0.63, y: 0.43 }, { x: 0.77, y: 0.73 }, { x: 0.14, y: 0.73 },
];

const SURFACES: Record<SurfaceId, { label: string; line: string; quad: Pt[]; tileSize: number }> = {
  pool: {
    label: "Pool floor",
    line: "For shells and waterlines.",
    quad: SAMPLE_POOL_QUAD,
    tileSize: 26,
  },
  wall: {
    label: "Feature wall",
    line: "For rooms and murals.",
    quad: [
      { x: 0.22, y: 0.18 }, { x: 0.78, y: 0.18 }, { x: 0.78, y: 0.84 }, { x: 0.22, y: 0.84 },
    ],
    tileSize: 22,
  },
  backsplash: {
    label: "Backsplash",
    line: "For kitchens and sinks.",
    quad: [
      { x: 0.06, y: 0.34 }, { x: 0.94, y: 0.34 }, { x: 0.94, y: 0.68 }, { x: 0.06, y: 0.68 },
    ],
    tileSize: 18,
  },
  shower: {
    label: "Shower wall",
    line: "For baths and wet rooms.",
    quad: [
      { x: 0.25, y: 0.15 }, { x: 0.82, y: 0.15 }, { x: 0.82, y: 0.86 }, { x: 0.25, y: 0.86 },
    ],
    tileSize: 20,
  },
  floor: {
    label: "Room floor",
    line: "For large surfaces.",
    quad: [
      { x: 0.14, y: 0.53 }, { x: 0.86, y: 0.53 }, { x: 0.98, y: 0.97 }, { x: 0.02, y: 0.97 },
    ],
    tileSize: 24,
  },
};

const CONTEXTS: Array<{
  id: SurfaceId;
  label: string;
  src: string;
  piece: string;
}> = [
  { id: "pool", label: "Empty pool", src: VISUALIZER_SAMPLE.pool.src, piece: "classic-pool-blues" },
  { id: "wall", label: "Blank wall", src: VISUALIZER_CONTEXTS.featureWall.src, piece: "gold-metallic-accents" },
  { id: "backsplash", label: "Kitchen", src: VISUALIZER_CONTEXTS.backsplash.src, piece: "aqua-turquoise-blends" },
  { id: "shower", label: "Shower", src: VISUALIZER_CONTEXTS.showerWall.src, piece: "black-mosaic" },
  { id: "floor", label: "Open floor", src: VISUALIZER_CONTEXTS.roomFloor.src, piece: "stone-mosaic" },
];

const DEFAULT_PIECE = "classic-pool-blues";
const STORE_KEY = "aumosaic.viz";
const CORNER_LABELS = ["Top left", "Top right", "Bottom right", "Bottom left"] as const;
const MIN_QUAD_AREA = 0.018;
const buzz = (ms = 4) => {
  try { navigator.vibrate?.(ms); } catch {}
};

function quadArea(q: Pt[]) {
  let sum = 0;
  for (let i = 0; i < q.length; i += 1) {
    const next = q[(i + 1) % q.length];
    sum += q[i].x * next.y - next.x * q[i].y;
  }
  return Math.abs(sum) / 2;
}

function isValidQuad(q: Pt[]) {
  if (q.length !== 4 || q.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return false;
  if (quadArea(q) < MIN_QUAD_AREA) return false;
  let sign = 0;
  for (let i = 0; i < q.length; i += 1) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    const c = q[(i + 2) % q.length];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 0.002) return false;
    const nextSign = Math.sign(cross);
    if (sign && nextSign !== sign) return false;
    sign = nextSign;
  }
  return true;
}

function setCorner(q: Pt[], index: number, point: Pt) {
  return q.map((pt, i) => (i === index ? point : pt));
}

/* Saved controls, if the browser kept them. Safe on the server:
   the first rendered photo is still the house's empty pool. */
function readStore(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

/* The pieces arrive from the page, which asked the catalog, which
   asks the book: the visualizer lays what the stockroom publishes. */
export default function Visualizer({ initialPiece, pieces }: { initialPiece?: string; pieces: Piece[] }) {
  const [pieceSlug, setPieceSlug] = useState(() => {
    if (pieces.some((p) => p.slug === initialPiece)) return initialPiece as string;
    const starter = pieces.find((p) => p.slug === DEFAULT_PIECE);
    if (starter) return starter.slug;
    return pieces[0].slug;
  });
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [quad, setQuad] = useState<Pt[]>(() => (readStore().quad as Pt[]) || DEFAULT_QUAD);
  const [surface, setSurface] = useState<SurfaceId>("pool");
  const [tileSize, setTileSize] = useState(() => (readStore().tileSize as number) || 26);
  const [blend, setBlend] = useState(() => {
    const b = readStore().blend;
    return typeof b === "number" ? b : 0.85;
  });
  const [prepMode, setPrepMode] = useState<PrepMode>(() => {
    const p = readStore().prepMode;
    return p === "none" || p === "blur" || p === "primer" ? p : "primer";
  });
  const [groutLight, setGroutLight] = useState(() => {
    const g = readStore().groutLight;
    return typeof g === "boolean" ? g : true;
  });
  const [holding, setHolding] = useState(false);
  const [tick, setTick] = useState(0);
  const [loupe, setLoupe] = useState<Pt | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveTracking, setLiveTracking] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [snapMessage, setSnapMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const objectUrls = useRef<Set<string>>(new Set());
  const dragging = useRef<number | null>(null);
  const dragFrame = useRef<number | null>(null);
  const liveFrame = useRef<number | null>(null);
  const liveDetectAt = useRef(0);
  const dragPoint = useRef<Pt | null>(null);
  const loadSeq = useRef(0);
  const primerColor = useRef("rgba(214, 206, 190, 0.78)");
  const livePrimerColor = useRef("rgba(214, 206, 190, 0.78)");
  const holdingRef = useRef(false);
  const restored = useRef(false);

  const piece = pieces.find((p) => p.slug === pieceSlug)!;
  const pattern = useMemo(() => {
    if (typeof document === "undefined") return null;
    return makePattern(piece.colors || ["#3aa9d6"], tileSize, groutLight);
  }, [piece.colors, tileSize, groutLight]);

  const revokeObjectUrl = useCallback((url: string) => {
    if (!objectUrls.current.has(url)) return;
    URL.revokeObjectURL(url);
    objectUrls.current.delete(url);
  }, []);

  const objectUrl = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    objectUrls.current.add(url);
    return url;
  }, []);

  const loadImage = useCallback((src: string, from: LoadSource, nextQuad?: Pt[]) => {
    const ticket = loadSeq.current + 1;
    loadSeq.current = ticket;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (ticket !== loadSeq.current) {
        revokeObjectUrl(src);
        return;
      }
      const shouldSnap = !nextQuad && (from === "upload" || from === "camera");
      const snapped = shouldSnap ? detectSurfaceQuad(img, surface) : null;
      if (snapped) {
        setQuad(snapped.quad);
        setSnapMessage("Surface found. Drag corners to refine.");
        track("viz_autosnap", { source: from, surface, confidence: Math.round(snapped.confidence * 100) });
      } else if (nextQuad) {
        setQuad(nextQuad);
        setSnapMessage(null);
      } else if (shouldSnap) {
        setQuad(SURFACES[surface].quad);
        setSnapMessage("Best starter fit. Drag corners to refine.");
        track("viz_autosnap", { source: from, surface, status: "fallback" });
      }
      setPhoto(img);
      if (from !== "default") track("viz_photo", { source: from });
      revokeObjectUrl(src);
    };
    img.onerror = () => {
      if (ticket === loadSeq.current) setSnapMessage("That image did not open. Try another photo.");
      revokeObjectUrl(src);
    };
    img.src = src;
  }, [revokeObjectUrl, surface]);

  const stopCamera = useCallback(() => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setCameraOpen(false);
    setLiveTracking(false);
  }, [cameraStream]);

  const openCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera needs a secure browser. Choose a photo instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setCameraStream(stream);
      setCameraOpen(true);
      setLiveTracking(true);
      setSnapMessage("Live preview is on. Move slowly, then refine the corners.");
      buzz(6);
      track("viz_camera_open", {});
    } catch {
      setCameraError("Camera did not open. Choose a photo instead.");
    }
  };

  const snapCamera = async () => {
    const video = videoRef.current;
    if (!video || !cameraStream) return;
    const canvas = document.createElement("canvas");
    const stage = canvasRef.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round((stage?.clientWidth || video.videoWidth || 1280) * dpr));
    canvas.height = Math.max(1, Math.round((stage?.clientHeight || video.videoHeight || 720) * dpr));
    const ctx = canvas.getContext("2d");
    if (ctx) drawSource(ctx, video, video.videoWidth || canvas.width, video.videoHeight || canvas.height, canvas.width, canvas.height, true);
    canvas.toBlob(
      (blob) => {
        if (blob) loadImage(objectUrl(blob), "camera");
        else loadImage(canvas.toDataURL("image/jpeg", 0.92), "camera", SURFACES[surface].quad);
        track("viz_camera_snap", { method: "live-frame" });
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  /* The feature opens on its own before-state. User photos are chosen,
     not silently restored, so the first view always makes sense. */
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    loadImage(VISUALIZER_SAMPLE.pool.src, "default", SAMPLE_POOL_QUAD);
  }, [loadImage]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cameraStream) return;
    video.srcObject = cameraStream;
    void video.play().catch(() => {
      setCameraError("Camera preview did not start. Choose a photo instead.");
    });
    return () => {
      video.srcObject = null;
    };
  }, [cameraStream]);

  useEffect(() => () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
  }, [cameraStream]);

  useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current.clear();
  }, []);

  useEffect(() => () => {
    if (dragFrame.current !== null) cancelAnimationFrame(dragFrame.current);
    if (liveFrame.current !== null) cancelAnimationFrame(liveFrame.current);
  }, []);

  useEffect(() => {
    if (!photo) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          STORE_KEY,
          JSON.stringify({ quad, tileSize, blend, prepMode, groutLight, pieceSlug })
        );
      } catch {}
    }, 600);
    return () => clearTimeout(id);
  }, [photo, quad, tileSize, blend, prepMode, groutLight, pieceSlug]);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    loadImage(objectUrl(f), "upload");
  };

  const findSurface = (id = surface) => {
    const video = videoRef.current;
    const found = cameraOpen && video ? detectVideoSurface(video, id) : photo ? detectSurfaceQuad(photo, id) : null;
    if (!found) {
      setSnapMessage("No clean edge yet. Drag corners to refine.");
      track("viz_autosnap", { surface: id, status: "miss" });
      buzz(2);
      return;
    }
    setSurface(id);
    setTileSize(SURFACES[id].tileSize);
    setLiveTracking(false);
    setQuad(found.quad);
    setSnapMessage(found.confidence > 1.35 ? "Surface found. Drag corners to refine." : "Best edge found. Drag corners to refine.");
    track("viz_autosnap", { surface: id, confidence: Math.round(found.confidence * 100) });
    buzz(8);
  };

  const fitSurface = (id: SurfaceId) => {
    const next = SURFACES[id];
    const video = videoRef.current;
    setSurface(id);
    setTileSize(next.tileSize);
    const found = cameraOpen && video ? detectVideoSurface(video, id) : photo ? detectSurfaceQuad(photo, id) : null;
    if (found) {
      setQuad(found.quad);
      setSnapMessage("Surface found. Drag corners to refine.");
    } else {
      setQuad(next.quad);
      setSnapMessage("Starter fit. Drag corners to refine.");
    }
    buzz(4);
    track("viz_surface", { surface: id, autosnap: !!found });
  };

  const loadContext = (id: SurfaceId) => {
    const context = CONTEXTS.find((item) => item.id === id);
    if (!context) return;
    const next = SURFACES[id];
    setSurface(id);
    setTileSize(next.tileSize);
    if (pieces.some((p) => p.slug === context.piece)) setPieceSlug(context.piece);
    loadImage(context.src, "sample", next.quad);
    setSnapMessage(null);
    buzz(6);
    track("viz_context", { surface: id });
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const isLive = Boolean(cameraOpen && video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0);
    const liveVideo = isLive ? video! : null;
    const source = liveVideo ?? photo;
    if (!canvas || !source || !pattern) return;
    const sourceW = liveVideo ? liveVideo.videoWidth : photo!.naturalWidth;
    const sourceH = liveVideo ? liveVideo.videoHeight : photo!.naturalHeight;
    const coverMode = cameraOpen;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const maxW = 1400;
    const scale = Math.min(1, maxW / sourceW);
    const W = coverMode ? Math.max(1, Math.round((canvas.clientWidth || window.innerWidth) * dpr)) : Math.round(sourceW * scale);
    const Hh = coverMode ? Math.max(1, Math.round((canvas.clientHeight || window.innerHeight) * dpr)) : Math.round(sourceH * scale);
    canvas.width = W;
    canvas.height = Hh;
    const ctx = canvas.getContext("2d")!;
    drawSource(ctx, source, sourceW, sourceH, W, Hh, coverMode);

    /* Keep the untouched photo for press-and-hold compare. */
    const orig = document.createElement("canvas");
    orig.width = W;
    orig.height = Hh;
    const origCtx = orig.getContext("2d")!;
    drawSource(origCtx, source, sourceW, sourceH, W, Hh, coverMode);
    originalRef.current = orig;

    const q = quad.map((p) => ({ x: p.x * W, y: p.y * Hh }));

    if (holdingRef.current) return;

    if (prepMode !== "none") {
      ctx.save();
      clipQuad(ctx, q);
      if (prepMode === "blur") {
        drawBlurredPhoto(ctx, source, sourceW, sourceH, W, Hh, 22, coverMode);
        ctx.fillStyle = "rgba(214, 206, 190, 0.08)";
        ctx.fillRect(0, 0, W, Hh);
      } else {
        ctx.globalAlpha = 0.28;
        drawBlurredPhoto(ctx, source, sourceW, sourceH, W, Hh, 20, coverMode);
        ctx.globalAlpha = 1;
        if (dragging.current === null) {
          const nextPrimer = sampleQuadColor(origCtx, q, W, Hh);
          if (isLive) livePrimerColor.current = nextPrimer;
          else primerColor.current = nextPrimer;
        }
        ctx.fillStyle = isLive ? livePrimerColor.current : primerColor.current;
        ctx.fillRect(0, 0, W, Hh);
      }
      ctx.restore();
    }

    const overlay = document.createElement("canvas");
    overlay.width = W;
    overlay.height = Hh;
    const octx = overlay.getContext("2d")!;
    const H = homography(q);
    if (!H) return;
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

    ctx.save();
    ctx.globalAlpha = blend;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(overlay, 0, 0);
    ctx.restore();

    ctx.save();
    clipQuad(ctx, q);
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = blend * (prepMode === "none" ? 0.5 : 0.24);
    if (prepMode === "none") {
      drawSource(ctx, source, sourceW, sourceH, W, Hh, coverMode);
    } else {
      drawBlurredPhoto(ctx, source, sourceW, sourceH, W, Hh, 12, coverMode);
    }
    ctx.restore();
    if (!cameraOpen) setTick((t) => t + 1);
  }, [cameraOpen, photo, quad, pattern, blend, prepMode]);

  useEffect(() => {
    if (cameraOpen) return;
    const frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [cameraOpen, render]);

  useEffect(() => {
    if (!cameraOpen) return;
    let mounted = true;
    const loop = (now: number) => {
      if (!mounted) return;
      render();
      const video = videoRef.current;
      if (liveTracking && dragging.current === null && video && now > liveDetectAt.current) {
        const found = detectVideoSurface(video, surface);
        if (found && isValidQuad(found.quad)) {
          setQuad(found.quad);
          setSnapMessage("Live surface found. Drag corners to refine.");
        } else {
          setSnapMessage("Live preview is on. Drag corners if the surface drifts.");
        }
        liveDetectAt.current = now + 1300;
      }
      liveFrame.current = requestAnimationFrame(loop);
    };
    liveFrame.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (liveFrame.current !== null) cancelAnimationFrame(liveFrame.current);
      liveFrame.current = null;
    };
  }, [cameraOpen, liveTracking, render, surface]);

  const pointerPos = (e: React.PointerEvent): Pt => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / rect.width, 0.02, 0.98),
      y: clamp((e.clientY - rect.top) / rect.height, 0.02, 0.98),
    };
  };

  const updateCorner = useCallback((index: number, point: Pt) => {
    const safePoint = { x: clamp(point.x, 0.02, 0.98), y: clamp(point.y, 0.02, 0.98) };
    setQuad((current) => {
      const next = setCorner(current, index, safePoint);
      if (isValidQuad(next)) return next;
      return current;
    });
  }, []);

  /* The loupe: what your finger is hiding, shown above it at 2.5x. */
  const drawLoupe = (p: Pt) => {
    const src = canvasRef.current;
    const dst = loupeRef.current;
    if (!src || !dst) return;
    const size = 120;
    dst.width = size;
    dst.height = size;
    const zoom = 2.5;
    const sx = p.x * src.width - size / (2 * zoom);
    const sy = p.y * src.height - size / (2 * zoom);
    const ctx = dst.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(src, sx, sy, size / zoom, size / zoom, 0, 0, size, size);
    ctx.strokeStyle = "#c2a15c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2 - 10);
    ctx.lineTo(size / 2, size / 2 + 10);
    ctx.moveTo(size / 2 - 10, size / 2);
    ctx.lineTo(size / 2 + 10, size / 2);
    ctx.stroke();
  };

  const holdEnd = () => {
    if (!holding) return;
    holdingRef.current = false;
    setHolding(false);
    render();
  };

  const queueCornerDrag = (index: number, point: Pt) => {
    dragPoint.current = point;
    setLoupe(point);
    if (dragFrame.current !== null) return;
    dragFrame.current = requestAnimationFrame(() => {
      dragFrame.current = null;
      const nextPoint = dragPoint.current;
      if (!nextPoint || dragging.current !== index) return;
      updateCorner(index, nextPoint);
      drawLoupe(nextPoint);
    });
  };

  const finishDrag = () => {
    if (dragFrame.current !== null) {
      cancelAnimationFrame(dragFrame.current);
      dragFrame.current = null;
    }
    if (dragging.current !== null && dragPoint.current) updateCorner(dragging.current, dragPoint.current);
    if (dragging.current !== null) buzz(4);
    dragging.current = null;
    dragPoint.current = null;
    setLoupe(null);
    holdEnd();
  };

  const nudgeCorner = (index: number, dx: number, dy: number) => {
    const current = quad[index];
    const next = { x: clamp(current.x + dx, 0.02, 0.98), y: clamp(current.y + dy, 0.02, 0.98) };
    setLiveTracking(false);
    updateCorner(index, next);
    setLoupe(next);
    requestAnimationFrame(() => drawLoupe(next));
    buzz(2);
    track("viz_adjust", { corner: index, method: "keyboard" });
  };

  const onCornerKey = (index: number, e: KeyboardEvent<SVGCircleElement>) => {
    const step = e.shiftKey ? 0.04 : 0.012;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    nudgeCorner(index, move[0], move[1]);
  };

  const holdStart = (e: React.PointerEvent) => {
    if ((e.target as Element).tagName === "circle") return;
    if (!originalRef.current || !canvasRef.current) return;
    holdingRef.current = true;
    setHolding(true);
    buzz(6);
    track("viz_compare", {});
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.drawImage(originalRef.current, 0, 0);
  };

  const share = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    track("viz_share", { piece: piece.slug });
    buzz(8);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `au-mosaic-${piece.slug}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: `${piece.name} · ${SITE.url.replace(/^https?:\/\//, "")}` });
          return;
        } catch {}
      }
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = file.name;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setSnapMessage("Preview saved. Attach it in WhatsApp.");
      window.open(waProduct(`${piece.name} (visualised in my space)`), "_blank");
    }, "image/png");
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    track("viz_download", { piece: piece.slug });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `au-mosaic-${piece.slug}.png`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }, "image/png");
  };

  const surfaceOptions = (
    <div>
      <p className="eyebrow">Surface fit</p>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 py-2 sm:-mx-2 sm:px-2">
        {(Object.entries(SURFACES) as Array<[SurfaceId, (typeof SURFACES)[SurfaceId]]>).map(([id, item]) => (
          <button
            key={id}
            onClick={() => fitSurface(id)}
            aria-pressed={surface === id}
            className={`shrink-0 rounded-full px-5 py-3 text-left transition-all duration-300 active:scale-95 ${
              surface === id ? "bg-shell text-ink shadow-lift" : "bg-shell/40 text-dusk hover:bg-shell/60"
            }`}
          >
            <span className="block text-[12px] font-semibold uppercase tracking-[0.18em]">{item.label}</span>
            <span className="mt-1 block text-[12px] normal-case tracking-normal text-mist">{item.line}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const contextOptions = (
    <div className="mt-7">
      <p className="eyebrow">Start from</p>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 py-2 sm:-mx-2 sm:px-2">
        {CONTEXTS.map((context) => (
          <button
            key={context.id}
            onClick={() => loadContext(context.id)}
            className="shrink-0 rounded-full bg-shell/40 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-dusk transition-all duration-300 hover:bg-shell/60 active:scale-95"
          >
            {context.label}
          </button>
        ))}
      </div>
    </div>
  );

  const pieceOptions = (
    <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 py-3 sm:-mx-2 sm:px-2">
      {pieces.map((p) => (
        <button
          key={p.slug}
          onClick={() => {
            setPieceSlug(p.slug);
            buzz(4);
            track("viz_piece", { piece: p.slug });
          }}
          aria-pressed={p.slug === pieceSlug}
          title={p.name}
          className={`flex h-12 shrink-0 items-center gap-2 rounded-full px-4 transition-all duration-300 active:scale-95 ${
            p.slug === pieceSlug ? "scale-[1.04] bg-shell text-ink shadow-lift" : "bg-shell/40 text-dusk hover:bg-shell/60"
          }`}
        >
          <span className="flex gap-0.5">
            {(p.colors || []).slice(0, 4).map((c, i) => (
              <span key={`${c}-${i}`} className="h-4 w-4 rounded-[4px]" style={{ background: c }} />
            ))}
          </span>
          <span className="whitespace-nowrap text-[12px] font-semibold">{p.name}</span>
        </button>
      ))}
    </div>
  );

  const lightOptions = (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
      <div className="panel">
        <p className="eyebrow">Tile size</p>
        <input
          type="range"
          min={14}
          max={48}
          value={tileSize}
          onChange={(e) => {
            setTileSize(+e.target.value);
            buzz(2);
          }}
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
          onChange={(e) => {
            setBlend(+e.target.value / 100);
            buzz(2);
          }}
          className="mt-4 w-full accent-[#c2a15c]"
          aria-label="Blend"
        />
      </div>
      <div className="panel">
        <p className="eyebrow">Prep surface</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {([
            ["primer", "Primer"],
            ["blur", "Blur"],
            ["none", "Original"],
          ] as Array<[PrepMode, string]>).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={prepMode === mode}
              onClick={() => {
                setPrepMode(mode);
                buzz(3);
                track("viz_prep", { mode });
              }}
              className={`rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-300 active:scale-95 ${
                prepMode === mode ? "bg-shell text-ink shadow-lift" : "bg-shell/40 text-dusk hover:bg-shell/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-mist">Primer hides old tile.</p>
      </div>
      <div className="panel flex items-center justify-between gap-4">
        <p className="eyebrow">Grout</p>
        <button
          onClick={() => {
            setGroutLight(!groutLight);
            buzz(4);
          }}
          className="link-hair text-dusk"
        >
          {groutLight ? "Light" : "Dark"}
        </button>
      </div>
    </div>
  );

  const refineControls = (
    <>
      {surfaceOptions}
      {contextOptions}
      <div className="mt-8">
        <p className="eyebrow">Colourway</p>
        <div className="mt-2">{pieceOptions}</div>
      </div>
      <div className="mt-8">{lightOptions}</div>
    </>
  );

  const mobileSnippetClass = "group rounded-[26px] bg-shell/45 px-5 py-4 shadow-lift";
  const mobileSummaryClass = "flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden";
  const mobileRefineSnippets = (
    <div className="mt-6 space-y-3 md:hidden" data-viz="mobile-snippets">
      <details className={mobileSnippetClass}>
        <summary className={mobileSummaryClass}>
          <span>
            <span className="eyebrow block">Surface</span>
            <span className="mt-1 block font-serif text-[20px]">{SURFACES[surface].label}</span>
          </span>
          <span className="link-hair text-dusk group-open:text-ink">Choose</span>
        </summary>
        <div className="mt-5">
          {surfaceOptions}
          {contextOptions}
        </div>
      </details>
      <details className={mobileSnippetClass}>
        <summary className={mobileSummaryClass}>
          <span>
            <span className="eyebrow block">Colourway</span>
            <span className="mt-1 block font-serif text-[20px]">{piece.name}</span>
          </span>
          <span className="link-hair text-dusk group-open:text-ink">Swap</span>
        </summary>
        <div className="mt-5">{pieceOptions}</div>
      </details>
      <details className={mobileSnippetClass}>
        <summary className={mobileSummaryClass}>
          <span>
            <span className="eyebrow block">Finish</span>
            <span className="mt-1 block font-serif text-[20px]">{prepMode === "primer" ? "Primer" : prepMode === "blur" ? "Blur" : "Original"}</span>
          </span>
          <span className="link-hair text-dusk group-open:text-ink">Tune</span>
        </summary>
        <div className="mt-5">{lightOptions}</div>
      </details>
    </div>
  );

  const exposedRefinement = (
    <aside className="hidden min-w-0 md:block lg:sticky lg:top-28" data-viz="exposed-refinement">
      <div className="mb-6">
        <p className="eyebrow">Refine</p>
        <p className="font-serif mt-2 text-[26px]">Make the surface yours.</p>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-dusk">
          Surface, colour, light, grout.
        </p>
      </div>
      {refineControls}
    </aside>
  );

  const stage = (
    <div
      ref={wrapRef}
      className={
        cameraOpen
          ? "relative h-full w-full overflow-hidden bg-sand"
          : "relative -mx-5 w-[calc(100%+2.5rem)] min-w-0 overflow-hidden rounded-none sm:mx-0 sm:w-full sm:max-w-full sm:rounded-[26px]"
      }
    >
      <canvas ref={canvasRef} className={cameraOpen ? "block h-full w-full" : "block h-auto w-full max-w-full"} />
      {!cameraOpen && <div key={tick} className="viz-sweep pointer-events-none absolute inset-0" aria-hidden />}
      <p id="viz-corner-help" className="sr-only">
        Focus a brass corner and use the arrow keys to nudge the surface. Hold shift for a larger move.
      </p>
      <svg
        className="absolute inset-0 h-full w-full touch-none"
        aria-describedby="viz-corner-help"
        onPointerDown={holdStart}
        onPointerMove={(e) => {
          if (dragging.current === null) return;
          const p = pointerPos(e);
          queueCornerDrag(dragging.current, p);
        }}
        onPointerUp={finishDrag}
        onPointerLeave={finishDrag}
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
              opacity={holding ? 0 : 0.9}
            />
          );
        })}
        {quad.map((p, i) => (
          <circle
            key={`c${i}`}
            cx={`${p.x * 100}%`}
            cy={`${p.y * 100}%`}
            r="14"
            tabIndex={0}
            role="button"
            aria-label={`${CORNER_LABELS[i]} surface corner. Use arrow keys to nudge.`}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            fill="var(--t-brass)"
            fillOpacity={holding ? 0 : 0.9}
            stroke="#14110b"
            strokeWidth="2"
            style={{ cursor: "grab" }}
            onFocus={() => {
              setLoupe(p);
              requestAnimationFrame(() => drawLoupe(p));
            }}
            onBlur={() => setLoupe(null)}
            onKeyDown={(e) => onCornerKey(i, e)}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.target as Element).setPointerCapture(e.pointerId);
              setLiveTracking(false);
              dragging.current = i;
              const p2 = pointerPos(e);
              dragPoint.current = p2;
              buzz(6);
              setLoupe(p2);
              requestAnimationFrame(() => drawLoupe(p2));
              track("viz_adjust", { corner: i });
            }}
          />
        ))}
      </svg>
      {loupe && (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            left: `calc(${loupe.x * 100}% - 60px)`,
            top: `calc(${loupe.y * 100}% - 150px)`,
          }}
        >
          <canvas
            ref={loupeRef}
            className="rounded-full"
            style={{ boxShadow: "0 0 0 2px var(--t-brass), 0 14px 40px -12px rgb(0 0 0 / 0.6)" }}
          />
        </div>
      )}
      {holding && <span className="chip-glass absolute left-1/2 top-4 -translate-x-1/2">Original</span>}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="panel mb-7 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Your space</p>
          <p className="font-serif mt-2 text-[20px]">Live camera or one photo.</p>
          <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-dusk">
            We find the surface. You refine it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="btn-gold cursor-pointer">
            Use your photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <button type="button" onClick={openCamera} className="link-hair text-dusk">
            Live camera
          </button>
        </div>
      </div>

      {photo && (
        <>
          {!cameraOpen && (
            <>
              <div
                className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-10"
                data-viz="workspace"
              >
                <div className="min-w-0">
                  {stage}
                  <p className="mt-3 text-[12px] uppercase tracking-[0.18em] text-mist">
                    Find surface, then drag corners to refine. Press and hold to compare.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-6">
                    <button type="button" onClick={() => findSurface()} className="link-hair text-dusk">
                      Find surface
                    </button>
                    <p className="text-[12px] uppercase tracking-[0.18em] text-mist">
                      {snapMessage ?? "The stones stay editable."}
                    </p>
                  </div>
                </div>
                {exposedRefinement}
              </div>
              {mobileRefineSnippets}
            </>
          )}

          {cameraError && <p className="mt-4 text-[14px] leading-relaxed text-dusk">{cameraError}</p>}

          <Dialog.Root open={refineOpen} onOpenChange={setRefineOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[92] bg-sand/70 backdrop-blur-[18px]" />
              <Dialog.Content className="filter-surface fixed inset-x-0 bottom-0 z-[93] max-h-[86svh] overflow-y-auto rounded-t-[28px] px-5 py-7 outline-none sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,980px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:px-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <Dialog.Title className="eyebrow">Refine</Dialog.Title>
                    <Dialog.Description className="mt-2 text-[14px] leading-relaxed text-dusk">
                      Choose the surface, colour, light, and grout.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close
                    aria-label="Close refine panel"
                    className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-dusk transition-colors duration-300 hover:text-ink"
                  >
                    <IconClose className="h-4 w-4" />
                  </Dialog.Close>
                </div>
                <div className="mt-7">{refineControls}</div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {!cameraOpen && (
            <div className="mt-10 flex flex-wrap items-center gap-8">
              <button onClick={share} className="btn-gold" data-wa="visualizer">
                Send it to the house
              </button>
              <button onClick={download} className="link-hair text-dusk">
                Download the preview
              </button>
            </div>
          )}
        </>
      )}

      <Dialog.Root open={cameraOpen} onOpenChange={(open) => !open && stopCamera()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-sand/80" />
          <Dialog.Content className="fixed inset-0 z-[91] overflow-hidden bg-sand outline-none">
            <Dialog.Title className="sr-only">Live camera</Dialog.Title>
            <Dialog.Description className="sr-only">
              Point the camera at the surface. The mosaic preview follows the live frame.
            </Dialog.Description>
            {cameraOpen && stage}
            <video ref={videoRef} muted playsInline autoPlay className="sr-only" />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5 sm:p-8">
              <div className="glass pointer-events-auto max-w-[min(360px,calc(100vw-104px))] px-5 py-4">
                <p className="eyebrow">Live preview</p>
                <p className="mt-2 text-[14px] leading-relaxed text-dusk">
                  Move slowly. Drag the four stones if the surface drifts.
                </p>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close live camera"
                  className="glass pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors duration-300 hover:text-gold"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <div className="glass pointer-events-auto mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-5 px-5 py-4 sm:justify-between">
                <div className="min-w-[180px] flex-1">
                  <p className="eyebrow">{liveTracking ? "Tracking" : "Manual fit"}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-mist">
                    {snapMessage ?? "Move slowly. The surface stays editable."}
                  </p>
                </div>
                <button type="button" onClick={snapCamera} className="btn-gold">
                  Use this view
                </button>
                <div className="flex flex-wrap items-center justify-center gap-5">
                  {!liveTracking && (
                    <button
                      type="button"
                      onClick={() => {
                        setLiveTracking(true);
                        liveDetectAt.current = 0;
                        setSnapMessage("Tracking live surface.");
                      }}
                      className="link-hair text-dusk"
                    >
                      Track again
                    </button>
                  )}
                  <button type="button" onClick={() => setRefineOpen(true)} className="link-hair text-dusk">
                    Refine
                  </button>
                  <button type="button" onClick={share} className="link-hair text-dusk" data-wa="visualizer-live">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
