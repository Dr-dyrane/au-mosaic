import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Pt } from "../src/components/visualizer/types";
import type { BinaryMask } from "../src/components/visualizer/fitMask";
import { pointInQuad } from "../src/components/visualizer/geometry";
import { buildShellFaces } from "../src/components/visualizer/shell";
import {
  solvePoolShellFromMasks,
  type PoolFaceMasks,
  type VisiblePoolFaceId,
} from "../src/components/visualizer/poolShellSolver";
import {
  scorePoolShell,
  type PoolShell,
  type PoolShellAcceptance,
} from "../src/components/visualizer/poolAccuracy";

type MaskFixture = {
  width: number;
  height: number;
  masks: Record<VisiblePoolFaceId, { counts: number[] }>;
};

type StarterFixture = {
  image: { width: number; height: number };
  acceptance: PoolShellAcceptance;
  gold: PoolShell;
  productionBaseline: PoolShell;
};

function readJson<T>(name: string): T {
  return JSON.parse(
    readFileSync(
      join(__dirname, "..", "..", "tests", "fixtures", "visualizer", name),
      "utf8",
    ),
  ) as T;
}

function decodeMask(width: number, height: number, counts: number[]): BinaryMask {
  const data = new Uint8Array(width * height);
  let offset = 0;
  let value = 0;
  for (const count of counts) {
    if (value) data.fill(1, offset, offset + count);
    offset += count;
    value = value ? 0 : 1;
  }
  assert.equal(offset, data.length, "mask RLE length drifted");
  return { data, width, height };
}

function fixtureMasks(fixture: MaskFixture): PoolFaceMasks {
  return Object.fromEntries(
    Object.entries(fixture.masks).map(([face, value]) => [
      face,
      decodeMask(fixture.width, fixture.height, value.counts),
    ]),
  ) as PoolFaceMasks;
}

function rasterQuad(quad: Pt[], width: number, height: number): BinaryMask {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pointInQuad({ x: (x + 0.5) / width, y: (y + 0.5) / height }, quad)) {
        data[y * width + x] = 1;
      }
    }
  }
  return { data, width, height };
}

function masksFromShell(shell: PoolShell, width = 240, height = 300): PoolFaceMasks {
  const masks = {} as PoolFaceMasks;
  for (const face of buildShellFaces(shell.rim, shell.floor)) {
    if (face.visible) masks[face.id as VisiblePoolFaceId] = rasterQuad(face.quad, width, height);
  }
  return masks;
}

const starter = readJson<StarterFixture>("starter-pool.json");
const samFixture = readJson<MaskFixture>("starter-pool-sam2.json");

test("a clean four-face mask reconstructs one shared shell", () => {
  const shell: PoolShell = {
    rim: [
      { x: 0.28, y: 0.3 },
      { x: 0.62, y: 0.29 },
      { x: 0.94, y: 0.42 },
      { x: 0.06, y: 0.5 },
    ],
    floor: [
      { x: 0.31, y: 0.41 },
      { x: 0.59, y: 0.4 },
      { x: 0.88, y: 0.76 },
      { x: 0.12, y: 0.76 },
    ],
  };
  const solved = solvePoolShellFromMasks(masksFromShell(shell));
  assert.ok(solved);
  const score = scorePoolShell(solved.shell, shell, { width: 240, height: 300 }, {
    cornerToleranceDiagonal: 0.015,
    minFaceIoU: 0.9,
    minMeanFaceIoU: 0.94,
  });
  assert.ok(score.meanCornerError < 0.012);
  assert.ok(score.maxCornerError < 0.025);
});

test("the starter SAM masks beat the production fixed-floor baseline", () => {
  const solved = solvePoolShellFromMasks(fixtureMasks(samFixture));
  assert.ok(solved);
  const candidate = scorePoolShell(solved.shell, starter.gold, starter.image, starter.acceptance);
  const baseline = scorePoolShell(
    starter.productionBaseline,
    starter.gold,
    starter.image,
    starter.acceptance,
  );
  assert.ok(candidate.meanCornerError < 0.03);
  assert.ok(candidate.maxCornerError < 0.08);
  assert.ok(candidate.meanCornerError < baseline.meanCornerError * 0.25);
  assert.ok(candidate.maxCornerError < baseline.maxCornerError * 0.35);
  assert.ok(solved.confidence > 0.45);
});

test("the mask solver is deterministic", () => {
  const masks = fixtureMasks(samFixture);
  assert.deepEqual(solvePoolShellFromMasks(masks), solvePoolShellFromMasks(masks));
});

test("a missing face cannot claim a complete pool shell", () => {
  const masks = fixtureMasks(samFixture);
  masks.floor = { data: new Uint8Array(masks.floor.data.length), width: masks.floor.width, height: masks.floor.height };
  assert.equal(solvePoolShellFromMasks(masks), null);
});
