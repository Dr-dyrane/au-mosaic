import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildShellFaces, defaultShellFloor } from "../src/components/visualizer/shell";
import { isValidQuad, pointInQuad } from "../src/components/visualizer/geometry";
import type { Pt } from "../src/components/visualizer/types";

/* DEFAULT_QUAD, copied verbatim from constants.ts: that module pulls the
   image manifest through the app's path alias, which node's test runner
   cannot resolve, and the shell must stay node-safe. A guard below reads
   the source and fails loudly the day the copy drifts. */
const DEFAULT_QUAD: Pt[] = [
  { x: 0.28, y: 0.45 }, { x: 0.75, y: 0.45 }, { x: 0.92, y: 0.92 }, { x: 0.1, y: 0.92 },
];

test("the copied rim still matches DEFAULT_QUAD in constants", () => {
  const source = readFileSync(
    join(__dirname, "..", "..", "src", "components", "visualizer", "constants.ts"),
    "utf8"
  );
  const block = source.match(/export const DEFAULT_QUAD[^;]*;/)?.[0];
  assert.ok(block, "DEFAULT_QUAD not found in constants.ts");
  const pairs = [...block.matchAll(/\{\s*x:\s*([\d.]+),\s*y:\s*([\d.]+)\s*\}/g)]
    .map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
  assert.deepEqual(pairs, DEFAULT_QUAD, "constants.ts moved; update the copy above");
});

/* The pool shell. Five faces share eight points; drag one stone and every
   face holding that corner must follow, so the tests assert identity, not
   equality. Wrong here means walls tearing away from the floor. */

const rim: Pt[] = [
  { x: 0.2, y: 0.3 },
  { x: 0.8, y: 0.3 },
  { x: 0.9, y: 0.9 },
  { x: 0.1, y: 0.9 },
];
const floor: Pt[] = [
  { x: 0.32, y: 0.48 },
  { x: 0.68, y: 0.48 },
  { x: 0.74, y: 0.78 },
  { x: 0.26, y: 0.78 },
];

test("five faces arrive in draw order with the floor last", () => {
  const faces = buildShellFaces(rim, floor);
  assert.deepEqual(faces.map((f) => f.id), ["back", "left", "right", "near", "floor"]);
});

test("adjacent faces share the very same point objects", () => {
  const faces = buildShellFaces(rim, floor);
  const [back, left, right, near, floorFace] = faces;
  /* Back's floor corners are the floor face's own points. */
  assert.equal(back.quad[3], floorFace.quad[0]);
  assert.equal(back.quad[2], floorFace.quad[1]);
  /* Left shares rim tl with back, and floor tl and bl with the floor. */
  assert.equal(left.quad[1], back.quad[0]);
  assert.equal(left.quad[2], floorFace.quad[0]);
  assert.equal(left.quad[3], floorFace.quad[3]);
  /* Right shares rim tr with back, and floor tr and br with the floor. */
  assert.equal(right.quad[0], back.quad[1]);
  assert.equal(right.quad[3], floorFace.quad[1]);
  assert.equal(right.quad[2], floorFace.quad[2]);
  /* Near shares rim br and bl with right and left, floor bl and br
     with the floor. */
  assert.equal(near.quad[0], right.quad[1]);
  assert.equal(near.quad[1], left.quad[0]);
  assert.equal(near.quad[2], floorFace.quad[3]);
  assert.equal(near.quad[3], floorFace.quad[2]);
  /* And every rim point is the very object handed in. */
  assert.equal(back.quad[0], rim[0]);
  assert.equal(back.quad[1], rim[1]);
  assert.equal(right.quad[1], rim[2]);
  assert.equal(left.quad[0], rim[3]);
});

test("near is the only face the camera never sees", () => {
  const faces = buildShellFaces(rim, floor);
  assert.deepEqual(faces.filter((f) => !f.visible).map((f) => f.id), ["near"]);
});

test("the default floor stays on the stage", () => {
  const out = defaultShellFloor(DEFAULT_QUAD);
  for (const p of out) {
    assert.ok(p.x >= 0.02 && p.x <= 0.98, `x ${p.x} escaped the stage`);
    assert.ok(p.y >= 0.02 && p.y <= 0.98, `y ${p.y} escaped the stage`);
  }
});

test("the default floor sits strictly inside the rim", () => {
  const out = defaultShellFloor(DEFAULT_QUAD);
  for (const p of out) {
    assert.ok(pointInQuad(p, DEFAULT_QUAD), `(${p.x}, ${p.y}) not inside the rim`);
  }
});

test("every face of the default shell is a drawable quad", () => {
  const out = defaultShellFloor(DEFAULT_QUAD);
  for (const face of buildShellFaces(DEFAULT_QUAD, out)) {
    assert.ok(isValidQuad(face.quad), `${face.id} failed isValidQuad`);
  }
});
