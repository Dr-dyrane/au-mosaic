import { readFileSync } from "node:fs";
import { join } from "node:path";
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

const baseline = scorePoolShell(
  starter.productionBaseline,
  starter.gold,
  starter.image,
  starter.acceptance,
);
const candidate = scorePoolShell(
  solved.shell,
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
    shell: solved.shell,
    confidence: solved.confidence.toFixed(3),
    meanCornerError: percent(candidate.meanCornerError),
    maxCornerError: percent(candidate.maxCornerError),
    cornersOutsideTolerance: candidate.cornersOutsideTolerance,
    meanFaceIoU: percent(candidate.meanFaceIoU),
    passes: candidate.passes,
  },
  improvement: {
    meanCornerError: `${(baseline.meanCornerError / candidate.meanCornerError).toFixed(1)}x`,
    maxCornerError: `${(baseline.maxCornerError / candidate.maxCornerError).toFixed(1)}x`,
  },
}, null, 2));
