import test from "node:test";
import assert from "node:assert/strict";
import { creaseEdges, deriveShellFloor, erodeMask, floorQuad, floorTrapezoidFromMask, wallTrapezoidFromMask } from "../src/components/visualizer/shellFit";
import type { BinaryMask } from "../src/components/visualizer/fitMask";
import type { Pt } from "../src/components/visualizer/types";

/* The shell derivation. A pool that already wears its shell asks the
   photo where the basin floor is; the answer must come from real interior
   creases and from nowhere else. Wrong here means walls folding at a line
   the water never drew, so the fixtures are painted pixel by pixel, and
   null is asserted as firmly as a fit. */

function blank(width: number, height: number): BinaryMask {
  return { data: new Uint8Array(width * height), width, height };
}

function fillRect(m: BinaryMask, x0: number, y0: number, x1: number, y1: number) {
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) m.data[y * m.width + x] = 1;
  }
}

/* Signed distance to a convex quad, positive inside. */
function quadDist(q: Pt[], x: number, y: number): number {
  let d = Infinity;
  for (let i = 0; i < 4; i += 1) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const cross = ((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x)) / len;
    d = Math.min(d, cross);
  }
  return d;
}

function fillQuad(m: BinaryMask, q: Pt[]) {
  for (let y = 0; y < m.height; y += 1) {
    for (let x = 0; x < m.width; x += 1) {
      if (quadDist(q, x + 0.5, y + 0.5) > 0) m.data[y * m.width + x] = 1;
    }
  }
}

function flatLuma(width: number, height: number, value: number): Uint8Array {
  return new Uint8Array(width * height).fill(value);
}

function segDist(x: number, y: number, a: Pt, b: Pt): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const lenSq = vx * vx + vy * vy;
  const t = lenSq ? Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / lenSq)) : 0;
  return Math.hypot(x - (a.x + t * vx), y - (a.y + t * vy));
}

/* Paint dark crease lines along a quad's four edges, a couple of pixels
   wide, the way a wall-meets-floor seam reads in a photo. */
function drawCreases(luma: Uint8Array, width: number, height: number, q: Pt[], dark: number) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      for (let i = 0; i < 4; i += 1) {
        if (segDist(x + 0.5, y + 0.5, q[i], q[(i + 1) % 4]) < 0.9) {
          luma[y * width + x] = dark;
          break;
        }
      }
    }
  }
}

/* The stage: a receding pool rim at the finder's own working scale, and
   a known floor quad well inside it. */
const W = 192;
const H = 144;
const RIM: Pt[] = [
  { x: 12, y: 10 }, { x: 180, y: 10 }, { x: 190, y: 136 }, { x: 4, y: 136 },
];
const FLOOR: Pt[] = [
  { x: 58, y: 55 }, { x: 134, y: 55 }, { x: 146, y: 118 }, { x: 46, y: 118 },
];

test("creases along a known interior floor give back its corners", () => {
  const mask = blank(W, H);
  fillQuad(mask, RIM);
  const luma = flatLuma(W, H, 200);
  drawCreases(luma, W, H, FLOOR, 60);
  const out = deriveShellFloor(mask, luma, RIM);
  assert.ok(out, "expected a derived floor");
  for (let i = 0; i < 4; i += 1) {
    const want = { x: FLOOR[i].x / W, y: FLOOR[i].y / H };
    assert.ok(Math.abs(out[i].x - want.x) <= 0.04, `corner ${i} x: got ${out[i].x.toFixed(3)}, want ${want.x.toFixed(3)}`);
    assert.ok(Math.abs(out[i].y - want.y) <= 0.04, `corner ${i} y: got ${out[i].y.toFixed(3)}, want ${want.y.toFixed(3)}`);
  }
});

test("the derived floor stays on the stage", () => {
  const mask = blank(W, H);
  fillQuad(mask, RIM);
  const luma = flatLuma(W, H, 200);
  drawCreases(luma, W, H, FLOOR, 60);
  const out = deriveShellFloor(mask, luma, RIM);
  assert.ok(out);
  for (const p of out) {
    assert.ok(p.x >= 0.02 && p.x <= 0.98, `x ${p.x} escaped the stage`);
    assert.ok(p.y >= 0.02 && p.y <= 0.98, `y ${p.y} escaped the stage`);
  }
});

test("a flat featureless photo answers null", () => {
  const mask = blank(W, H);
  fillQuad(mask, RIM);
  assert.equal(deriveShellFloor(mask, flatLuma(W, H, 200), RIM), null);
});

test("creases on the rim itself never reach the search", () => {
  /* The seam a pool coping draws sits on the mask boundary; the erosion
     must keep the Sobel window off it entirely. */
  const mask = blank(W, H);
  fillQuad(mask, RIM);
  const luma = flatLuma(W, H, 200);
  drawCreases(luma, W, H, RIM, 60);
  assert.equal(deriveShellFloor(mask, luma, RIM), null);
});

test("a floor nearly as big as the rim is refused", () => {
  const mask = blank(W, H);
  fillRect(mask, 10, 10, 182, 134);
  const rim: Pt[] = [
    { x: 10, y: 10 }, { x: 181, y: 10 }, { x: 181, y: 133 }, { x: 10, y: 133 },
  ];
  /* Six pixels inside the rim: past the erosion, so its creases are
     found, but above 0.80 of the rim's area, so the quad must lose. */
  const big: Pt[] = [
    { x: 16, y: 16 }, { x: 175, y: 16 }, { x: 175, y: 127 }, { x: 16, y: 127 },
  ];
  const luma = flatLuma(W, H, 200);
  drawCreases(luma, W, H, big, 60);
  assert.equal(deriveShellFloor(mask, luma, rim), null);
});

test("erodeMask pulls a block in one pixel per pass", () => {
  const m = blank(12, 12);
  fillRect(m, 1, 1, 11, 11);
  const out = erodeMask(m, 4);
  let count = 0;
  for (let y = 0; y < 12; y += 1) {
    for (let x = 0; x < 12; x += 1) {
      if (!out.data[y * 12 + x]) continue;
      count += 1;
      assert.ok(x >= 5 && x <= 6 && y >= 5 && y <= 6, `(${x}, ${y}) survived outside the core`);
    }
  }
  assert.equal(count, 4);
});

test("erodeMask treats the frame's edge as empty", () => {
  const m = blank(6, 6);
  fillRect(m, 0, 0, 6, 6);
  const out = erodeMask(m, 1);
  let count = 0;
  for (let y = 0; y < 6; y += 1) {
    for (let x = 0; x < 6; x += 1) {
      if (!out.data[y * 6 + x]) continue;
      count += 1;
      assert.ok(x >= 1 && x <= 4 && y >= 1 && y <= 4, `(${x}, ${y}) survived on the frame`);
    }
  }
  assert.equal(count, 16);
});

test("creaseEdges fires beside a dark column, not on it or the flat", () => {
  const m = blank(9, 9);
  fillRect(m, 1, 1, 8, 8);
  const luma = flatLuma(9, 9, 200);
  for (let y = 0; y < 9; y += 1) luma[y * 9 + 4] = 20;
  const pts = creaseEdges(m, luma);
  assert.equal(pts.length, 14);
  for (const p of pts) {
    assert.ok(p.x === 3 || p.x === 5, `x ${p.x} is not beside the column`);
  }
});

test("creaseEdges over a flat field is empty", () => {
  const m = blank(9, 9);
  fillRect(m, 1, 1, 8, 8);
  assert.deepEqual(creaseEdges(m, flatLuma(9, 9, 200)), []);
});

/* Two crease lines and their two parallels cross into a quad, but that
   quad straddles the rim's right edge. Every other gate passes, so the
   inside-rim corner check is the only thing that can refuse it: remove
   that check and these two tests flip. */
const RIM_SQUARE: Pt[] = [
  { x: 20, y: 20 }, { x: 160, y: 20 }, { x: 160, y: 120 }, { x: 20, y: 120 },
];

/* Edge points hugging a quad's four borders, so crease coverage scores
   the candidate near one and the only remaining gate is the rim. */
function borderPoints(q: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < 4; i += 1) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const steps = Math.round(Math.hypot(b.x - a.x, b.y - a.y));
    for (let s = 0; s <= steps; s += 1) {
      out.push({ x: a.x + ((b.x - a.x) * s) / steps, y: a.y + ((b.y - a.y) * s) / steps });
    }
  }
  return out;
}

test("floorQuad refuses a candidate whose corners fall outside the rim", () => {
  /* Lines y=40, y=100, x=120, x=220 cross at a rectangle whose right
     edge sits past the rim (max x 160). Area 0.43 of the rim, convex,
     fully covered, so only the inside-rim check stands between it and a
     wrong floor. */
  const lines = [
    { theta: Math.PI / 2, rho: 40 },
    { theta: Math.PI / 2, rho: 100 },
    { theta: 0, rho: 120 },
    { theta: 0, rho: 220 },
  ];
  const edges = borderPoints([
    { x: 120, y: 40 }, { x: 220, y: 40 }, { x: 220, y: 100 }, { x: 120, y: 100 },
  ]);
  assert.equal(floorQuad(lines, edges, RIM_SQUARE, 240, 140), null);
});

test("floorQuad keeps a candidate whose corners sit inside the rim", () => {
  /* The same lines with the far edge pulled in to x=150, now wholly
     inside the rim, must be accepted, so the refusal above is the rim
     check and not a blanket no. */
  const lines = [
    { theta: Math.PI / 2, rho: 40 },
    { theta: Math.PI / 2, rho: 100 },
    { theta: 0, rho: 90 },
    { theta: 0, rho: 150 },
  ];
  const floor: Pt[] = [
    { x: 90, y: 40 }, { x: 150, y: 40 }, { x: 150, y: 100 }, { x: 90, y: 100 },
  ];
  const got = floorQuad(lines, borderPoints(floor), RIM_SQUARE, 240, 140);
  assert.ok(got, "an interior candidate should be kept");
  for (let i = 0; i < 4; i += 1) {
    assert.ok(Math.abs(got.quad[i].x - floor[i].x) <= 1, `corner ${i} x drifted`);
    assert.ok(Math.abs(got.quad[i].y - floor[i].y) <= 1, `corner ${i} y drifted`);
  }
});

/* The extent reads: a face's own mask gives a clean tile frame without
   any crease guess. The floor reads its far and near width; the wall
   reads its near and far height. Both must decline a shape they cannot
   trust, since a bad frame streaks the tiles across the whole face. */

test("a receding floor mask reads a trapezoid, far edge narrower than near", () => {
  const m = blank(100, 100);
  fillQuad(m, [{ x: 40, y: 18 }, { x: 60, y: 18 }, { x: 90, y: 82 }, { x: 10, y: 82 }]);
  const q = floorTrapezoidFromMask(m);
  assert.ok(q, "a clean floor mask should fit");
  const topW = q![1].x - q![0].x;
  const botW = q![2].x - q![3].x;
  assert.ok(botW > topW, "near edge should read wider than far");
  assert.ok(q![0].y < q![3].y, "far edge should sit above near edge");
});

test("a floor mask read wider far than near is declined", () => {
  const m = blank(100, 100);
  fillQuad(m, [{ x: 10, y: 18 }, { x: 90, y: 18 }, { x: 60, y: 82 }, { x: 40, y: 82 }]);
  assert.equal(floorTrapezoidFromMask(m), null);
});

test("a sliver too short to trust is declined", () => {
  const m = blank(100, 100);
  fillRect(m, 20, 48, 80, 51);
  assert.equal(floorTrapezoidFromMask(m), null);
});

test("a receding wall mask reads a trapezoid, near edge taller than far", () => {
  const m = blank(100, 100);
  /* Tall on the left (near), short on the right (far). */
  fillQuad(m, [{ x: 15, y: 15 }, { x: 85, y: 42 }, { x: 85, y: 58 }, { x: 15, y: 85 }]);
  const q = wallTrapezoidFromMask(m);
  assert.ok(q, "a clean wall mask should fit");
  const leftH = q![3].y - q![0].y;
  const rightH = q![2].y - q![1].y;
  assert.ok(leftH > rightH, "near (left) edge should read taller than far (right)");
});

test("a wall mask too narrow to trust is declined", () => {
  const m = blank(100, 100);
  fillRect(m, 48, 20, 51, 80);
  assert.equal(wallTrapezoidFromMask(m), null);
});
