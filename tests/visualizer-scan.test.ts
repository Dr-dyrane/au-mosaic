import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCorners, VisualizerAiError } from "../src/lib/visualizer-ai";

/* The corner finder's gate. The vision model answers through a strict
   tool schema, but the normaliser trusts nothing: it clamps every point
   to the safe band and refuses a quad missing any corner, since a
   three-corner surface is nothing to snap a stone to. */

const q = (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => ({
  tl: { x: a, y: b }, tr: { x: c, y: d }, br: { x: e, y: f }, bl: { x: g, y: h },
});

test("a clean shell keeps its eight corners in app order", () => {
  const out = normalizeCorners({ rim: q(0.15, 0.35, 0.75, 0.32, 0.82, 0.48, 0.08, 0.52), floor: q(0.18, 0.52, 0.72, 0.5, 0.78, 0.68, 0.12, 0.7) }, true);
  assert.equal(out.shape, "shell");
  if (out.shape !== "shell") return;
  assert.deepEqual(out.rim, [{ x: 0.15, y: 0.35 }, { x: 0.75, y: 0.32 }, { x: 0.82, y: 0.48 }, { x: 0.08, y: 0.52 }]);
  assert.deepEqual(out.floor[2], { x: 0.78, y: 0.68 });
});

test("a clean single surface keeps its four corners", () => {
  const out = normalizeCorners({ quad: q(0.2, 0.2, 0.8, 0.2, 0.8, 0.8, 0.2, 0.8) }, false);
  assert.equal(out.shape, "surface");
  if (out.shape !== "surface") return;
  assert.deepEqual(out.quad, [{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.2 }, { x: 0.8, y: 0.8 }, { x: 0.2, y: 0.8 }]);
});

test("corners outside the frame are clamped to the safe band", () => {
  const out = normalizeCorners({ quad: q(-0.5, -0.5, 1.5, 0.2, 0.8, 1.5, 0.2, 0.8) }, false);
  if (out.shape !== "surface") throw new Error("expected surface");
  assert.deepEqual(out.quad[0], { x: 0.02, y: 0.02 });
  assert.deepEqual(out.quad[1], { x: 0.98, y: 0.2 });
});

test("a shell missing its floor throws", () => {
  assert.throws(() => normalizeCorners({ rim: q(0.15, 0.35, 0.75, 0.32, 0.82, 0.48, 0.08, 0.52) }, true), VisualizerAiError);
});

test("a quad missing a corner throws", () => {
  assert.throws(() => normalizeCorners({ quad: { tl: { x: 0.2, y: 0.2 }, tr: { x: 0.8, y: 0.2 }, br: { x: 0.8, y: 0.8 } } }, false), VisualizerAiError);
});

test("a non-record input throws", () => {
  assert.throws(() => normalizeCorners("not corners", false), VisualizerAiError);
  assert.throws(() => normalizeCorners(null, true), VisualizerAiError);
});
