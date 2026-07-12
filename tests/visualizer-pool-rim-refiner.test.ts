import test from "node:test";
import assert from "node:assert/strict";
import type { Pt } from "../src/components/visualizer/types";
import {
  findPoolWallInnerEdge,
  type LumaImage,
} from "../src/components/visualizer/poolRimRefiner";

function edgeImage(far: Pt, near: Pt, width = 240, height = 300): LumaImage {
  const data = new Uint8Array(width * height);
  const ax = far.x * (width - 1);
  const ay = far.y * (height - 1);
  const bx = near.x * (width - 1);
  const by = near.y * (height - 1);
  const dx = bx - ax;
  const dy = by - ay;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const side = dx * (y - ay) - dy * (x - ax);
      data[y * width + x] = side >= 0 ? 48 : 220;
    }
  }
  return { data, width, height };
}

test("the side refiner finds the inner coping edge below the mask rim", () => {
  const far = { x: 0.3, y: 0.31 };
  const maskNear = { x: 0.04, y: 0.42 };
  const innerNear = { x: 0.04, y: 0.5 };
  const floorNear = { x: 0.04, y: 0.76 };
  const found = findPoolWallInnerEdge(edgeImage(far, innerNear), far, maskNear, floorNear);
  assert.ok(found);
  assert.ok(Math.abs(found.y - innerNear.y) < 0.012);
  assert.ok(found.strength > 1.45);
});

test("a flat wall leaves the SAM rim untouched", () => {
  const luma = { data: new Uint8Array(240 * 300).fill(128), width: 240, height: 300 };
  assert.equal(
    findPoolWallInnerEdge(
      luma,
      { x: 0.3, y: 0.31 },
      { x: 0.04, y: 0.42 },
      { x: 0.04, y: 0.76 },
    ),
    null,
  );
});
