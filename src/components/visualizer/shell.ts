import type { Pt, ShellFaceId } from "./types";
import { clamp } from "./geometry";

/* The pool shell, as geometry only. The rim IS the layer quad; the floor
   is four more points; five faces join them into a box interior. Corner
   order everywhere is the app's own: tl, tr, br, bl. Pure and node-safe
   so the tests can hold it without a browser. */

export type ShellFace = {
  id: ShellFaceId;
  quad: Pt[];
  visible: boolean;
};

/* Faces in draw order, floor last so it reads dominant when hand-dragged
   shapes overlap. Each face reuses the very point objects it was given:
   drag a stone and every face holding that corner follows. The near wall
   sits under the camera, so it draws nothing. */
export function buildShellFaces(rim: Pt[], floor: Pt[]): ShellFace[] {
  const [rtl, rtr, rbr, rbl] = rim;
  const [ftl, ftr, fbr, fbl] = floor;
  return [
    { id: "back", quad: [rtl, rtr, ftr, ftl], visible: true },
    { id: "left", quad: [rbl, rtl, ftl, fbl], visible: true },
    { id: "right", quad: [rtr, rbr, fbr, ftr], visible: true },
    { id: "near", quad: [rbr, rbl, fbl, fbr], visible: false },
    { id: "floor", quad: [ftl, ftr, fbr, fbl], visible: true },
  ];
}

/* A first floor that reads like a basin on a typical pool photo: each rim
   corner pulled toward the centroid, the far edge pushed down a little
   more because it recedes. Deterministic and simple; the stones refine
   it by hand. */
export function defaultShellFloor(rim: Pt[]): Pt[] {
  const cx = rim.reduce((sum, p) => sum + p.x, 0) / rim.length;
  const cy = rim.reduce((sum, p) => sum + p.y, 0) / rim.length;
  const top = Math.min(...rim.map((p) => p.y));
  const bottom = Math.max(...rim.map((p) => p.y));
  const drop = (bottom - top) * 0.1;
  return rim.map((p, i) => ({
    x: clamp(p.x + (cx - p.x) * 0.3, 0.02, 0.98),
    y: clamp(p.y + (cy - p.y) * 0.3 + (i < 2 ? drop : 0), 0.02, 0.98),
  }));
}
