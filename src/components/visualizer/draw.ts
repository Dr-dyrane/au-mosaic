import type { Pt, SurfaceLayer } from "./types";
import type { Piece } from "@/lib/products";
import { homography, mapPoint, clamp, pointInQuad } from "./geometry";

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

function clipQuad(ctx: CanvasRenderingContext2D, q: Pt[]) {
  ctx.beginPath();
  ctx.moveTo(q[0].x, q[0].y);
  for (let i = 1; i < q.length; i += 1) ctx.lineTo(q[i].x, q[i].y);
  ctx.closePath();
  ctx.clip();
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

function drawSurfaceLayer({
  ctx,
  origCtx,
  photo,
  sourceW,
  sourceH,
  width,
  height,
  layer,
  piece,
  mask,
}: {
  ctx: CanvasRenderingContext2D;
  origCtx: CanvasRenderingContext2D;
  photo: HTMLImageElement;
  sourceW: number;
  sourceH: number;
  width: number;
  height: number;
  layer: SurfaceLayer;
  piece: Piece;
  mask?: CanvasImageSource | null;
}) {
  if (!layer.visible) return;
  const tileColors = layer.customColors && layer.customColors.length > 0 ? layer.customColors : (piece.colors || ["#3aa9d6"]);
  const pattern = makePattern(tileColors, layer.tileSize, layer.groutLight);
  /* Without a mask the four-corner quad frames the tiles, as always. With
     a segmentation mask the tiles fill the whole frame and the mask decides
     where they show, so the shape follows the surface exactly. */
  const q = mask
    ? [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }]
    : layer.quad.map((p) => ({ x: p.x * width, y: p.y * height }));

  if (layer.prepMode !== "none" && !mask) {
    ctx.save();
    clipQuad(ctx, q);
    if (layer.prepMode === "blur") {
      drawBlurredPhoto(ctx, photo, sourceW, sourceH, width, height, 22, false);
      ctx.fillStyle = "rgba(214, 206, 190, 0.08)";
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.globalAlpha = 0.28;
      drawBlurredPhoto(ctx, photo, sourceW, sourceH, width, height, 20, false);
      ctx.globalAlpha = 1;
      ctx.fillStyle = sampleQuadColor(origCtx, q, width, height);
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  const overlay = document.createElement("canvas");
  overlay.width = width;
  overlay.height = height;
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

  /* Keep the warped tiles only where the mask is opaque, so the mosaic
     lands on the exact surface shape the model found and nowhere else.
     A failed mask draw is swallowed, leaving the full-frame tiles. */
  if (mask) {
    try {
      octx.globalCompositeOperation = "destination-in";
      octx.drawImage(mask, 0, 0, width, height);
      octx.globalCompositeOperation = "source-over";
    } catch {
      /* leave the overlay as it is */
    }
  }

  ctx.save();
  ctx.globalAlpha = layer.blend;
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(overlay, 0, 0);
  ctx.restore();

  if (!mask) {
    ctx.save();
    clipQuad(ctx, q);
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = layer.blend * (layer.prepMode === "none" ? 0.5 : 0.24);
    if (layer.prepMode === "none") {
      drawSource(ctx, photo, sourceW, sourceH, width, height, false);
    } else {
      drawBlurredPhoto(ctx, photo, sourceW, sourceH, width, height, 12, false);
    }
    ctx.restore();
  }
}

export { drawTriangle, makePattern, clipQuad, sampleQuadColor, drawBlurredPhoto, drawSource, drawSurfaceLayer };
