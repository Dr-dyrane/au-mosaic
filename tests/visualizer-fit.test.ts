import test from "node:test";
import assert from "node:assert/strict";
import { extremeCorners, fitMask, largestComponent, solidity } from "../src/components/visualizer/fit";
import type { BinaryMask, FitResult } from "../src/components/visualizer/fit";
import type { Pt } from "../src/components/visualizer/types";

/* The mask-to-plane engine. A tap buys one segment from the model and this
   geometry decides whether the outline deserves four fitted corners or a
   plain clip. Wrong here means tiles lying about perspective, so the
   fixtures are drawn pixel by pixel, not mocked. */

function blank(width: number, height: number): BinaryMask {
  return { data: new Uint8Array(width * height), width, height };
}

function fillRect(m: BinaryMask, x0: number, y0: number, x1: number, y1: number, v = 1) {
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) m.data[y * m.width + x] = v;
  }
}

/* Signed distance to a convex quad, positive inside, for rasterising
   fixtures with a controlled amount of edge wobble. */
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

/* Seeded LCG so the jitter never depends on the run. */
function makeRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function fillQuad(m: BinaryMask, q: Pt[], jitter = 0, seed = 1) {
  const rand = makeRand(seed);
  for (let y = 0; y < m.height; y += 1) {
    for (let x = 0; x < m.width; x += 1) {
      const wobble = (rand() * 2 - 1) * jitter;
      if (quadDist(q, x + 0.5, y + 0.5) + wobble > 0) m.data[y * m.width + x] = 1;
    }
  }
}

/* Truth corners live in pixels; the engine answers in 0..1. Three percent
   of the frame is the agreed slack. */
function assertCorners(result: FitResult, truth: Pt[], width: number, height: number) {
  assert.equal(result.kind, "quad");
  if (result.kind !== "quad") return;
  for (let i = 0; i < 4; i += 1) {
    const got = result.quad[i];
    const want = { x: truth[i].x / width, y: truth[i].y / height };
    assert.ok(Math.abs(got.x - want.x) <= 0.03, `corner ${i} x: got ${got.x.toFixed(3)}, want ${want.x.toFixed(3)}`);
    assert.ok(Math.abs(got.y - want.y) <= 0.03, `corner ${i} y: got ${got.y.toFixed(3)}, want ${want.y.toFixed(3)}`);
  }
}

test("a clean rectangle fits four corners", () => {
  const m = blank(160, 120);
  fillRect(m, 24, 18, 136, 102);
  const truth = [
    { x: 24, y: 18 },
    { x: 135, y: 18 },
    { x: 135, y: 101 },
    { x: 24, y: 101 },
  ];
  assertCorners(fitMask(m), truth, 160, 120);
});

test("a wall trapezoid keeps its perspective", () => {
  const m = blank(160, 120);
  const truth = [
    { x: 38, y: 20 },
    { x: 126, y: 32 },
    { x: 140, y: 96 },
    { x: 22, y: 102 },
  ];
  fillQuad(m, truth, 1.5, 7);
  assertCorners(fitMask(m), truth, 160, 120);
});

test("a window hole does not break the wall", () => {
  const m = blank(160, 120);
  const truth = [
    { x: 38, y: 20 },
    { x: 126, y: 32 },
    { x: 140, y: 96 },
    { x: 22, y: 102 },
  ];
  fillQuad(m, truth, 1.5, 7);
  fillRect(m, 60, 45, 100, 75, 0);
  assertCorners(fitMask(m), truth, 160, 120);
});

test("furniture bites push the floor to clip", () => {
  const m = blank(160, 120);
  fillRect(m, 10, 10, 150, 110);
  fillRect(m, 30, 10, 60, 80, 0);
  fillRect(m, 90, 10, 120, 80, 0);
  assert.deepEqual(fitMask(m), { kind: "clip" });
});

test("an L-shaped room stays a clip", () => {
  const m = blank(160, 120);
  fillRect(m, 10, 10, 150, 110);
  fillRect(m, 70, 10, 150, 85, 0);
  assert.deepEqual(fitMask(m), { kind: "clip" });
});

test("speckle noise loses to the main rectangle", () => {
  const m = blank(160, 120);
  fillRect(m, 40, 30, 120, 90);
  for (const [x, y] of [[8, 8], [150, 12], [6, 104], [148, 100], [80, 6]]) {
    fillRect(m, x, y, x + 2, y + 2);
  }
  const truth = [
    { x: 40, y: 30 },
    { x: 119, y: 30 },
    { x: 119, y: 89 },
    { x: 40, y: 89 },
  ];
  assertCorners(fitMask(m), truth, 160, 120);
});

/* A floor's outline is not its plane, so the floor kind skips the Hough
   ladder and answers with the extreme corners, the level receding
   trapezoid the app has always trusted for pools. */
test("a floor trapezoid takes the extreme corners, not the Hough outline", () => {
  const m = blank(160, 120);
  const shape = [
    { x: 38, y: 20 },
    { x: 126, y: 32 },
    { x: 140, y: 96 },
    { x: 22, y: 102 },
  ];
  fillQuad(m, shape, 1.5, 7);
  const extremes = extremeCorners(m);
  assert.ok(extremes);
  assertCorners(fitMask(m, "floor"), extremes, 160, 120);
});

test("furniture bites push the floor kind to clip too", () => {
  const m = blank(160, 120);
  fillRect(m, 10, 10, 150, 110);
  fillRect(m, 30, 10, 60, 80, 0);
  fillRect(m, 90, 10, 120, 80, 0);
  assert.deepEqual(fitMask(m, "floor"), { kind: "clip" });
});

test("a clean rectangle as a floor still lands on its corners", () => {
  const m = blank(160, 120);
  fillRect(m, 24, 18, 136, 102);
  const truth = [
    { x: 24, y: 18 },
    { x: 135, y: 18 },
    { x: 135, y: 101 },
    { x: 24, y: 101 },
  ];
  assertCorners(fitMask(m, "floor"), truth, 160, 120);
});

test("an empty mask is a clip", () => {
  assert.deepEqual(fitMask(blank(64, 64)), { kind: "clip" });
});

test("largestComponent keeps only the biggest island", () => {
  const m = blank(6, 3);
  m.data[0] = 1;
  m.data[1] = 1;
  m.data[6] = 1;
  m.data[5] = 1;
  const out = largestComponent(m);
  assert.ok(out);
  assert.equal(out.data[0], 1);
  assert.equal(out.data[1], 1);
  assert.equal(out.data[6], 1);
  assert.equal(out.data[5], 0);
});

test("largestComponent of nothing is null", () => {
  assert.equal(largestComponent(blank(4, 4)), null);
});

test("solidity of a full rectangle is exactly one", () => {
  const m = blank(4, 4);
  fillRect(m, 0, 0, 4, 4);
  assert.equal(solidity(m), 1);
});

test("solidity of an L is area over the cut hull", () => {
  const m = blank(4, 4);
  fillRect(m, 0, 0, 4, 4);
  fillRect(m, 2, 0, 4, 2, 0);
  assert.ok(Math.abs(solidity(m) - 12 / 14) < 1e-9);
});
