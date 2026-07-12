import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import type { BinaryMask } from "../src/components/visualizer/fitMask";
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
import { refinePoolRimWithLuma } from "../src/components/visualizer/poolRimRefiner";
import { stabilizePoolShellEdges } from "../src/components/visualizer/poolEdgeRefiner";

type StarterFixture = {
  image: { width: number; height: number };
  acceptance: PoolShellAcceptance;
  gold: PoolShell;
  productionBaseline: PoolShell;
};

type MaskFixture = {
  width: number;
  height: number;
  masks: Record<VisiblePoolFaceId, { counts: number[] }>;
  luma: { encoding: "deflate-base64"; data: string };
};

const root = join(__dirname, "..");
const fixtureDir = join(root, "tests", "fixtures", "visualizer");
const readJson = <T>(name: string): T => JSON.parse(
  readFileSync(join(fixtureDir, name), "utf8"),
) as T;

function decodeMask(width: number, height: number, counts: number[]): BinaryMask {
  const data = new Uint8Array(width * height);
  let offset = 0;
  let value = 0;
  for (const count of counts) {
    if (value) data.fill(1, offset, offset + count);
    offset += count;
    value = value ? 0 : 1;
  }
  if (offset !== data.length) throw new Error("mask-rle-length");
  return { data, width, height };
}

const starter = readJson<StarterFixture>("starter-pool.json");
const maskFixture = readJson<MaskFixture>("starter-pool-sam2.json");
const masks = Object.fromEntries(
  Object.entries(maskFixture.masks).map(([face, mask]) => [
    face,
    decodeMask(maskFixture.width, maskFixture.height, mask.counts),
  ]),
) as PoolFaceMasks;
const solved = solvePoolShellFromMasks(masks);
if (!solved) throw new Error("starter-shell-not-solved");
const luma = new Uint8Array(inflateSync(Buffer.from(maskFixture.luma.data, "base64")));
if (luma.length !== maskFixture.width * maskFixture.height) throw new Error("starter-luma-length");
const refined = refinePoolRimWithLuma(solved.shell, {
  data: luma,
  width: maskFixture.width,
  height: maskFixture.height,
});
const stabilized = stabilizePoolShellEdges(refined.shell, {
  width: maskFixture.width,
  height: maskFixture.height,
}, masks.back, {
  data: luma,
  width: maskFixture.width,
  height: maskFixture.height,
});

const baseline = scorePoolShell(
  starter.productionBaseline,
  starter.gold,
  starter.image,
  starter.acceptance,
);
const candidate = scorePoolShell(
  stabilized.shell,
  starter.gold,
  starter.image,
  starter.acceptance,
);
const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

console.log(JSON.stringify({
  productionBaseline: {
    meanCornerError: percent(baseline.meanCornerError),
    maxCornerError: percent(baseline.maxCornerError),
    cornersOutsideTolerance: baseline.cornersOutsideTolerance,
    meanFaceIoU: percent(baseline.meanFaceIoU),
    passes: baseline.passes,
  },
  maskJointSolver: {
    shell: stabilized.shell,
    confidence: solved.confidence.toFixed(3),
    refinedSides: refined.refinedSides,
    edgeStrength: refined.strength.toFixed(2),
    backInsetsPx: stabilized.backInsetsPx,
    nearAligned: stabilized.nearAligned,
    meanCornerError: percent(candidate.meanCornerError),
    maxCornerError: percent(candidate.maxCornerError),
    cornersOutsideTolerance: candidate.cornersOutsideTolerance,
    faceIoU: Object.fromEntries(
      Object.entries(candidate.faceIoU).map(([face, value]) => [face, percent(value)]),
    ),
    meanFaceIoU: percent(candidate.meanFaceIoU),
    minFaceIoU: percent(candidate.minFaceIoU),
    passes: candidate.passes,
  },
  improvement: {
    meanCornerError: `${(baseline.meanCornerError / candidate.meanCornerError).toFixed(1)}x`,
    maxCornerError: `${(baseline.maxCornerError / candidate.maxCornerError).toFixed(1)}x`,
  },
}, null, 2));
