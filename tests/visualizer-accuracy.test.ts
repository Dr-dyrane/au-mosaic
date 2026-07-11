import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultShellFloor } from "../src/components/visualizer/shell";
import {
  convexIoU,
  scorePoolShell,
  type PoolShell,
  type PoolShellAcceptance,
} from "../src/components/visualizer/poolAccuracy";

type StarterFixture = {
  image: { width: number; height: number };
  acceptance: PoolShellAcceptance;
  gold: PoolShell;
  productionBaseline: PoolShell & { method: string };
};

const fixture = JSON.parse(
  readFileSync(
    join(__dirname, "..", "..", "tests", "fixtures", "visualizer", "starter-pool.json"),
    "utf8",
  ),
) as StarterFixture;

const size = fixture.image;

test("convex IoU is exact for equal and disjoint quads", () => {
  const a = [
    { x: 0, y: 0 },
    { x: 0.5, y: 0 },
    { x: 0.5, y: 0.5 },
    { x: 0, y: 0.5 },
  ];
  const b = a.map((point) => ({ ...point }));
  const c = a.map((point) => ({ x: point.x + 0.5, y: point.y + 0.5 }));
  assert.equal(convexIoU(a, b, size), 1);
  assert.equal(convexIoU(a, c, size), 0);
});

test("the owner's gold shell clears its own production gate", () => {
  const score = scorePoolShell(fixture.gold, fixture.gold, size, fixture.acceptance);
  assert.equal(score.passes, true);
  assert.equal(score.maxCornerError, 0);
  assert.equal(score.minFaceIoU, 1);
});

test("the current production auto-fit is a measured baseline, not an acceptance", () => {
  const score = scorePoolShell(
    fixture.productionBaseline,
    fixture.gold,
    size,
    fixture.acceptance,
  );
  assert.equal(score.passes, false);
  assert.equal(score.cornersOutsideTolerance, 8);
  assert.ok(score.meanCornerError > 0.127 && score.meanCornerError < 0.129);
  assert.ok(score.maxCornerError > 0.24 && score.maxCornerError < 0.242);
  assert.ok(score.minFaceIoU < 0.3);
});

test("the recorded production floor is still the fixed-percentage derivation", () => {
  const derived = defaultShellFloor(fixture.productionBaseline.rim);
  for (let i = 0; i < derived.length; i += 1) {
    assert.ok(Math.abs(derived[i].x - fixture.productionBaseline.floor[i].x) < 0.00001);
    assert.ok(Math.abs(derived[i].y - fixture.productionBaseline.floor[i].y) < 0.00001);
  }
});
