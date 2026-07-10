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

/* Rebuilding the 512px tile sheet every frame stutters cheap phones, so
   finished sheets live here keyed by what actually changes their pixels.
   Twelve entries covers every layer a session realistically holds; past
   that the oldest key goes, since Map keeps insertion order. */
const patternCache = new Map<string, HTMLCanvasElement>();

function getPattern(colors: string[], tile: number, groutLight: boolean) {
  const key = `${tile}|${groutLight}|${colors.join(",")}`;
  const hit = patternCache.get(key);
  if (hit) return hit;
  const made = makePattern(colors, tile, groutLight);
  if (patternCache.size >= 12) {
    patternCache.delete(patternCache.keys().next().value!);
  }
  patternCache.set(key, made);
  return made;
}

function clipQuad(ctx: CanvasRenderingContext2D, q: Pt[]) {
  ctx.beginPath();
  ctx.moveTo(q[0].x, q[0].y);
  for (let i = 1; i < q.length; i += 1) ctx.lineTo(q[i].x, q[i].y);
  ctx.closePath();
  ctx.clip();
}

function fillQuadPath(ctx: CanvasRenderingContext2D, q: Pt[]) {
  ctx.beginPath();
  ctx.moveTo(q[0].x, q[0].y);
  for (let i = 1; i < q.length; i += 1) ctx.lineTo(q[i].x, q[i].y);
  ctx.closePath();
  ctx.fill();
}

/* The finishing pass. Once the tiles are laid, we settle them into the
   photo's own light with two thin veils, each one cut to the surface so
   nothing spills past its edge. Shape from the mask when we have it, the
   four corner quad otherwise. Both veils are translucent, so the real
   tile colour still reads through; we are grounding the mosaic in the
   light, not repainting it. No depth wash, no water: those dulled the
   stones, so the render stays crisp. */
function finishSurface(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  q: Pt[],
  mask: CanvasImageSource | null
) {
  const region = document.createElement("canvas");
  region.width = width;
  region.height = height;
  const rx = region.getContext("2d");
  if (!rx) return;
  rx.fillStyle = "#000";
  if (mask) {
    try {
      rx.drawImage(mask, 0, 0, width, height);
    } catch {
      fillQuadPath(rx, q);
    }
  } else {
    fillQuadPath(rx, q);
  }

  const span = Math.hypot(width, height);

  const stamp = (
    paint: (fx: CanvasRenderingContext2D) => void,
    blend: GlobalCompositeOperation,
    alpha: number
  ) => {
    const f = document.createElement("canvas");
    f.width = width;
    f.height = height;
    const fx = f.getContext("2d");
    if (!fx) return;
    paint(fx);
    fx.globalCompositeOperation = "destination-in";
    fx.drawImage(region, 0, 0);
    fx.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.globalCompositeOperation = blend;
    ctx.globalAlpha = alpha;
    ctx.drawImage(f, 0, 0);
    ctx.restore();
  };

  /* Seat: a soft dark rim just inside the edge, so the mosaic sits into
     the recess instead of floating on the photo. */
  stamp((fx) => {
    fx.fillStyle = "rgba(0,0,0,0.6)";
    fx.fillRect(0, 0, width, height);
    fx.globalCompositeOperation = "destination-out";
    fx.filter = `blur(${Math.max(4, Math.round(span * 0.012))}px)`;
    fx.drawImage(region, 0, 0);
    fx.filter = "none";
    fx.globalCompositeOperation = "source-over";
  }, "multiply", 0.5);

  /* Gloss: one soft band of light across the glass. */
  stamp((fx) => {
    const g = fx.createLinearGradient(q[0].x, q[0].y, q[2].x, q[2].y);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.46, "rgba(255,255,255,0.08)");
    g.addColorStop(0.5, "rgba(255,255,255,0.16)");
    g.addColorStop(0.54, "rgba(255,255,255,0.08)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    fx.fillStyle = g;
    fx.fillRect(0, 0, width, height);
  }, "screen", 0.7);
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
  finish,
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
  finish?: boolean;
}) {
  if (!layer.visible) return;
  const tileColors = layer.customColors && layer.customColors.length > 0 ? layer.customColors : (piece.colors || ["#3aa9d6"]);
  const pattern = getPattern(tileColors, layer.tileSize, layer.groutLight);
  /* The four-corner quad always frames the tiles and sets their
     perspective, so dragging it lays them onto a receding surface. A
     segmentation mask, when present, then clips the tiles to the exact
     surface shape the model found. Shape from the mask, angle from the
     corners. */
  const q = layer.quad.map((p) => ({ x: p.x * width, y: p.y * height }));

  /* The prep coat hides whatever the surface wore before, since the tiles
     land with multiply and old grout would ghost through. One painter
     feeds both the quad-clipped path and the mask-cut path so the two
     cannot drift. */
  const paintPrep = (target: CanvasRenderingContext2D) => {
    if (layer.prepMode === "blur") {
      drawBlurredPhoto(target, photo, sourceW, sourceH, width, height, 22, false);
      target.fillStyle = "rgba(214, 206, 190, 0.08)";
      target.fillRect(0, 0, width, height);
    } else {
      target.globalAlpha = 0.28;
      drawBlurredPhoto(target, photo, sourceW, sourceH, width, height, 20, false);
      target.globalAlpha = 1;
      target.fillStyle = sampleQuadColor(origCtx, q, width, height);
      target.fillRect(0, 0, width, height);
    }
  };

  if (layer.prepMode !== "none") {
    if (mask) {
      /* Cut the coat to the mask the same way finishSurface stamps its
         veils. A mask that will not draw leaves the photo untouched. */
      const prep = document.createElement("canvas");
      prep.width = width;
      prep.height = height;
      const px = prep.getContext("2d");
      if (px) {
        paintPrep(px);
        try {
          px.globalCompositeOperation = "destination-in";
          px.drawImage(mask, 0, 0, width, height);
          px.globalCompositeOperation = "source-over";
          ctx.drawImage(prep, 0, 0);
        } catch {
          /* skip the coat rather than flood the frame */
        }
      }
    } else {
      ctx.save();
      clipQuad(ctx, q);
      paintPrep(ctx);
      ctx.restore();
    }
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

  /* Settle the laid tiles into the photo's light. Skipped mid-drag so the
     corners stay quick; it lands the moment the corner is let go. */
  if (finish !== false) finishSurface(ctx, width, height, q, mask ?? null);
}

export { drawTriangle, makePattern, clipQuad, sampleQuadColor, drawBlurredPhoto, drawSource, drawSurfaceLayer };
