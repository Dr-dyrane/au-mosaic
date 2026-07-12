import type { Pt } from "./types";
import { buildShellFaces } from "./shell";
import { clamp } from "./geometry";
import type { VisiblePoolFaceId } from "./poolShellSolver";

export type PoolFacePrompt = {
  point: Pt;
  label: 0 | 1;
};

export const VISIBLE_POOL_FACE_IDS: VisiblePoolFaceId[] = ["back", "left", "right", "floor"];

function quadCentre(quad: Pt[]): Pt {
  const total = quad.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 },
  );
  return { x: total.x / quad.length, y: total.y / quad.length };
}

function midpoint(first: Pt, second: Pt): Pt {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function reflectedOutside(point: Pt, edge: Pt): Pt {
  return {
    x: clamp(edge.x * 2 - point.x, 0.01, 0.99),
    y: clamp(edge.y * 2 - point.y, 0.01, 0.99),
  };
}

/* Each decode gets its own face centre as foreground and every adjacent
   face centre as background. The prompts share one shell, so SAM separates
   the planes at their common seams instead of returning the whole basin. */
export function buildPoolFacePrompts(
  rim: Pt[],
  floor: Pt[],
): Record<VisiblePoolFaceId, PoolFacePrompt[]> {
  const centres = Object.fromEntries(
    buildShellFaces(rim, floor)
      .filter((face) => face.visible)
      .map((face) => [face.id, quadCentre(face.quad)]),
  ) as Record<VisiblePoolFaceId, Pt>;
  const faces = Object.fromEntries(
    buildShellFaces(rim, floor)
      .filter((face) => face.visible)
      .map((face) => [face.id, face.quad]),
  ) as Record<VisiblePoolFaceId, Pt[]>;

  return Object.fromEntries(
    VISIBLE_POOL_FACE_IDS.map((faceId) => {
      const quad = faces[faceId];
      /* Walls reflect across their rim edge onto the coping. The floor
         reflects across its near edge onto the foreground deck. */
      const outsideEdge = faceId === "floor"
        ? midpoint(quad[2], quad[3])
        : midpoint(quad[0], quad[1]);
      return [faceId, [
        { point: centres[faceId], label: 1 as const },
        ...VISIBLE_POOL_FACE_IDS
          .filter((otherId) => otherId !== faceId)
          .map((otherId) => ({ point: centres[otherId], label: 0 as const })),
        { point: reflectedOutside(centres[faceId], outsideEdge), label: 0 as const },
      ]];
    }),
  ) as Record<VisiblePoolFaceId, PoolFacePrompt[]>;
}
