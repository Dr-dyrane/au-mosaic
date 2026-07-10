import test from "node:test";
import assert from "node:assert/strict";
import { normalizeScan, VisualizerAiError } from "../src/lib/visualizer-ai";

/* The scene reader's gate. Haiku answers through a strict tool schema,
   but the normaliser trusts nothing: it clamps, trims, dedupes, and
   throws before a bad scan can reach a paying customer's screen. */

function surface(overrides: Record<string, unknown> = {}) {
  return {
    kind: "pool",
    name: "the pool",
    tap: { x: 0.5, y: 0.6 },
    occluders: [],
    confidence: 0.8,
    ...overrides,
  };
}

function scan(overrides: Record<string, unknown> = {}) {
  return {
    scene: "An empty pool.",
    surfaces: [surface()],
    prepMode: "primer",
    note: "We found the pool.",
    confidence: 0.85,
    ...overrides,
  };
}

test("a clean scan passes through untouched", () => {
  const out = normalizeScan(scan());
  assert.equal(out.scene, "An empty pool.");
  assert.equal(out.prepMode, "primer");
  assert.equal(out.note, "We found the pool.");
  assert.equal(out.confidence, 0.85);
  assert.deepEqual(out.surfaces, [
    { kind: "pool", name: "the pool", tap: { x: 0.5, y: 0.6 }, occluders: [], confidence: 0.8 },
  ]);
});

test("a surface with a made-up kind is dropped", () => {
  const out = normalizeScan(scan({
    surfaces: [surface({ kind: "ceiling" }), surface({ kind: "wall", name: "the left wall" })],
  }));
  assert.equal(out.surfaces.length, 1);
  assert.equal(out.surfaces[0].kind, "wall");
});

test("six surfaces are capped at five", () => {
  const out = normalizeScan(scan({
    surfaces: [
      surface({ kind: "pool" }),
      surface({ kind: "wall" }),
      surface({ kind: "backsplash" }),
      surface({ kind: "shower" }),
      surface({ kind: "floor" }),
      surface({ kind: "floor", name: "the other floor" }),
    ],
  }));
  assert.equal(out.surfaces.length, 5);
});

test("duplicate kinds keep the more confident sighting", () => {
  const out = normalizeScan(scan({
    surfaces: [
      surface({ kind: "wall", name: "the dim wall", confidence: 0.3 }),
      surface({ kind: "wall", name: "the sunlit wall", confidence: 0.9 }),
    ],
  }));
  assert.equal(out.surfaces.length, 1);
  assert.equal(out.surfaces[0].name, "the sunlit wall");
  assert.equal(out.surfaces[0].confidence, 0.9);
});

test("a tap outside the frame is clamped to the safe band", () => {
  const out = normalizeScan(scan({
    surfaces: [surface({ tap: { x: -0.5, y: 1.5 } })],
  }));
  assert.deepEqual(out.surfaces[0].tap, { x: 0.02, y: 0.98 });
});

test("an honest zero confidence stays zero", () => {
  const out = normalizeScan(scan({
    confidence: 0,
    surfaces: [surface({ confidence: 0 })],
  }));
  assert.equal(out.confidence, 0);
  assert.equal(out.surfaces[0].confidence, 0);
});

test("long strings are trimmed to their caps", () => {
  const out = normalizeScan(scan({
    scene: `  ${"s".repeat(80)}  `,
    note: "n".repeat(120),
    surfaces: [surface({
      name: `  ${"w".repeat(40)}  `,
      occluders: ["  a ladder  ", "o".repeat(50), "", "a rail", "a hose", "a net"],
    })],
  }));
  assert.equal(out.scene, "s".repeat(64));
  assert.equal(out.note, "n".repeat(96));
  assert.equal(out.surfaces[0].name, "w".repeat(32));
  assert.deepEqual(out.surfaces[0].occluders, ["a ladder", "o".repeat(40), "a rail", "a hose"]);
});

test("a scan with no usable surface throws", () => {
  assert.throws(() => normalizeScan(scan({ surfaces: [] })), VisualizerAiError);
  assert.throws(() => normalizeScan(scan({ surfaces: [surface({ kind: "sky" })] })), VisualizerAiError);
  assert.throws(() => normalizeScan("not a scan"), VisualizerAiError);
});
