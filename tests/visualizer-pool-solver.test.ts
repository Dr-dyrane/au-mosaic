import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import type { Pt } from "../src/components/visualizer/types";
import type { BinaryMask } from "../src/components/visualizer/fitMask";
import { pointInQuad } from "../src/components/visualizer/geometry";
import { buildShellFaces } from "../src/components/visualizer/shell";
import {
  buildPoolFacePrompts,
  VISIBLE_POOL_FACE_IDS,
} from "../src/components/visualizer/poolFacePrompts";
import {
  solvePoolShellFromMasks,
  type PoolFaceMasks,
  type VisiblePoolFaceId,
} from "../src/components/visualizer/poolShellSolver";
import { refinePoolRimWithLuma } from "../src/components/visualizer/poolRimRefiner";
import {
  isStablePoolShell,
  stabilizePoolShellEdges,
} from "../src/components/visualizer/poolEdgeRefiner";
import {
  scorePoolShell,
  type PoolShell,
  type PoolShellAcceptance,
} from "../src/components/visualizer/poolAccuracy";

type MaskFixture = {
  width: number;
  height: number;
  masks: Record<VisiblePoolFaceId, { counts: number[] }>;
  luma: { encoding: "deflate-base64"; data: string };
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

function fixtureLuma(fixture: MaskFixture) {
  const data = new Uint8Array(inflateSync(Buffer.from(fixture.luma.data, "base64")));
  assert.equal(data.length, fixture.width * fixture.height, "luma fixture length drifted");
  return { data, width: fixture.width, height: fixture.height };
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

function scaleMask(mask: BinaryMask, factor: number): BinaryMask {
  const width = mask.width * factor;
  const height = mask.height * factor;
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      data[y * width + x] = mask.data[Math.floor(y / factor) * mask.width + Math.floor(x / factor)];
    }
  }
  return { data, width, height };
}

function scaleLuma(luma: ReturnType<typeof fixtureLuma>, factor: number) {
  const width = luma.width * factor;
  const height = luma.height * factor;
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      data[y * width + x] = luma.data[
        Math.floor(y / factor) * luma.width + Math.floor(x / factor)
      ];
    }
  }
  return { data, width, height };
}

const starter = readJson<StarterFixture>("starter-pool.json");
const samFixture = readJson<MaskFixture>("starter-pool-sam2.json");
const nightSamFixture = readJson<MaskFixture>("starter-pool-night-sam2.json");

test("each pool decode names one face and rejects its neighbours", () => {
  const prompts = buildPoolFacePrompts(starter.productionBaseline.rim, starter.productionBaseline.floor);
  const faces = Object.fromEntries(
    buildShellFaces(starter.productionBaseline.rim, starter.productionBaseline.floor)
      .filter((face) => face.visible)
      .map((face) => [face.id, face.quad]),
  );
  for (const faceId of VISIBLE_POOL_FACE_IDS) {
    const facePrompts = prompts[faceId];
    assert.equal(facePrompts.length, 5);
    assert.equal(facePrompts.filter((prompt) => prompt.label === 1).length, 1);
    const positive = facePrompts.find((prompt) => prompt.label === 1);
    assert.ok(positive);
    assert.ok(pointInQuad(positive.point, faces[faceId]));
    for (const negative of facePrompts.filter((prompt) => prompt.label === 0)) {
      assert.equal(pointInQuad(negative.point, faces[faceId]), false);
    }
  }
});

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
  const masks = masksFromShell(shell);
  const solved = solvePoolShellFromMasks(masks);
  assert.ok(solved);
  const stabilized = stabilizePoolShellEdges(
    solved.shell,
    { width: 240, height: 300 },
    masks.back,
    { data: new Uint8Array(240 * 300).fill(128), width: 240, height: 300 },
  );
  assert.deepEqual(stabilized.shell, solved.shell);
  assert.equal(stabilized.backInsetsPx.top, 0);
  const score = scorePoolShell(stabilized.shell, shell, { width: 240, height: 300 }, {
    cornerToleranceDiagonal: 0.015,
    minFaceIoU: 0.9,
    minMeanFaceIoU: 0.94,
  });
  assert.ok(score.meanCornerError < 0.012);
  assert.ok(score.maxCornerError < 0.025);
  assert.ok(score.passes);
});

test("the starter SAM masks beat the production fixed-floor baseline", () => {
  const masks = fixtureMasks(samFixture);
  const solved = solvePoolShellFromMasks(masks);
  assert.ok(solved);
  const refined = refinePoolRimWithLuma(solved.shell, fixtureLuma(samFixture));
  const stabilized = stabilizePoolShellEdges(
    refined.shell,
    { width: samFixture.width, height: samFixture.height },
    masks.back,
    fixtureLuma(samFixture),
  );
  const candidate = scorePoolShell(
    stabilized.shell,
    starter.gold,
    starter.image,
    starter.acceptance,
  );
  const baseline = scorePoolShell(
    starter.productionBaseline,
    starter.gold,
    starter.image,
    starter.acceptance,
  );
  assert.ok(candidate.meanCornerError < 0.01);
  assert.ok(candidate.maxCornerError < 0.015);
  assert.equal(candidate.cornersOutsideTolerance, 0);
  assert.ok(candidate.minFaceIoU >= starter.acceptance.minFaceIoU);
  assert.ok(candidate.meanFaceIoU >= starter.acceptance.minMeanFaceIoU);
  assert.ok(candidate.passes);
  assert.ok(candidate.meanCornerError < baseline.meanCornerError * 0.25);
  assert.ok(candidate.maxCornerError < baseline.maxCornerError * 0.35);
  assert.ok(solved.confidence > 0.45);
});

test("the mask solver is deterministic", () => {
  const masks = fixtureMasks(samFixture);
  assert.deepEqual(solvePoolShellFromMasks(masks), solvePoolShellFromMasks(masks));
});

test("edge stabilization is stable across mask resolutions", () => {
  const masks = fixtureMasks(samFixture);
  const solved = solvePoolShellFromMasks(masks);
  assert.ok(solved);
  const luma = fixtureLuma(samFixture);
  const regular = stabilizePoolShellEdges(
    solved.shell,
    { width: samFixture.width, height: samFixture.height },
    masks.back,
    luma,
  ).shell;
  const doubled = stabilizePoolShellEdges(
    solved.shell,
    { width: samFixture.width * 2, height: samFixture.height * 2 },
    scaleMask(masks.back, 2),
    scaleLuma(luma, 2),
  ).shell;
  const regularPoints = [...regular.rim, ...regular.floor];
  const doubledPoints = [...doubled.rim, ...doubled.floor];
  const drift = regularPoints.map((point, index) =>
    Math.hypot(point.x - doubledPoints[index].x, point.y - doubledPoints[index].y));
  assert.ok(Math.max(...drift) < 0.002);
});

test("the night pool expands a thin mask rim before it reaches the canvas", () => {
  const masks = fixtureMasks(nightSamFixture);
  const solved = solvePoolShellFromMasks(masks);
  assert.ok(solved);
  assert.equal(solved.requiresRefinement, true);
  assert.ok(solved.confidence > 0.75);
  const luma = fixtureLuma(nightSamFixture);
  const rimRefined = refinePoolRimWithLuma(solved.shell, luma);
  assert.equal(rimRefined.refinedSides, 2);
  const stabilized = stabilizePoolShellEdges(
    rimRefined.shell,
    { width: nightSamFixture.width, height: nightSamFixture.height },
    masks.back,
    luma,
  );
  assert.ok(isStablePoolShell(stabilized.shell));
});

test("a missing face cannot claim a complete pool shell", () => {
  const masks = fixtureMasks(samFixture);
  masks.floor = { data: new Uint8Array(masks.floor.data.length), width: masks.floor.width, height: masks.floor.height };
  assert.equal(solvePoolShellFromMasks(masks), null);
});
