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

/* The floor of the basin, derived so the box reads as a volume going away
   from the camera instead of a flat frame. The far pair is pulled well in
   (narrow) and dropped just under the back wall; the near pair barely moves
   in and lifts up off the near coping. So the floor recedes: narrow and high
   at the back, wide and low at the front, its side walls leaning toward the
   back. That directional depth is the difference between a 3D basin and a
   symmetric shrunk frame. Deterministic; the stones refine it by hand. */
export function defaultShellFloor(rim: Pt[]): Pt[] {
  const [tl, tr, br, bl] = rim;
  const cx = (tl.x + tr.x + br.x + bl.x) / 4;
  const top = Math.min(tl.y, tr.y);
  const bottom = Math.max(bl.y, br.y);
  const h = bottom - top;
  const mk = (p: Pt, kx: number, dy: number): Pt => ({
    x: clamp(p.x + (cx - p.x) * kx, 0.02, 0.98),
    y: clamp(p.y + dy, 0.02, 0.98),
  });
  return [
    mk(tl, 0.3, h * 0.12),
    mk(tr, 0.3, h * 0.12),
    mk(br, 0.1, -h * 0.1),
    mk(bl, 0.1, -h * 0.1),
  ];
}

/* A pool read often comes back nearly rectangular, which throws away the
   perspective the eye should see: the far coping, deeper in the scene, is
   narrower than the near coping. So a flat read gets a gentle recede, its
   far pair pulled toward centre onto the narrower back edge; a read that
   already narrows toward the back is trusted as it is. The near pair never
   moves, so the front lip the finder found is kept exactly. */
export function perspectiveRim(rim: Pt[]): Pt[] {
  const [tl, tr, br, bl] = rim;
  const farW = Math.abs(tr.x - tl.x);
  const nearW = Math.abs(br.x - bl.x);
  if (nearW <= 0 || farW / nearW < 0.9) return rim;
  const cx = (tl.x + tr.x + br.x + bl.x) / 4;
  const pull = (p: Pt): Pt => ({ x: clamp(p.x + (cx - p.x) * 0.14, 0.02, 0.98), y: p.y });
  return [pull(tl), pull(tr), br, bl];
}
