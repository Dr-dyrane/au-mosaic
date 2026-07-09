import type { Pt, Homography } from "./types";

export function homography(q: Pt[]): Homography | null {
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

export function mapPoint(H: Homography, u: number, v: number): Pt {
  const w = H.g * u + H.h * v + 1;
  return { x: (H.a * u + H.b * v + H.c) / w, y: (H.d * u + H.e * v + H.f) / w };
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function pointInQuad(point: Pt, q: Pt[]) {
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

export function quadArea(q: Pt[]) {
  let sum = 0;
  for (let i = 0; i < q.length; i += 1) {
    const next = q[(i + 1) % q.length];
    sum += q[i].x * next.y - next.x * q[i].y;
  }
  return Math.abs(sum) / 2;
}

const MIN_QUAD_AREA = 0.018;

export function isValidQuad(q: Pt[]) {
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

export function quadDelta(a: Pt[], b: Pt[]) {
  return a.reduce((sum, point, index) => {
    const other = b[index];
    return sum + Math.hypot(point.x - other.x, point.y - other.y);
  }, 0) / Math.max(1, a.length);
}

export function setCorner(q: Pt[], index: number, point: Pt) {
  return q.map((pt, i) => (i === index ? point : pt));
}
