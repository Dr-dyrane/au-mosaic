export type Pt = { x: number; y: number };
export type SurfaceId = "pool" | "wall" | "backsplash" | "shower" | "floor";
/* The interior faces of a pool shell. The near wall sits under the
   camera and is never tiled. The scan only ever points at
   floor/back/left/right; near stays geometry-only. */
export type ShellFaceId = "back" | "left" | "right" | "near" | "floor";
/* One interior face's segment: the mask data URI is the shape, the
   optional quad is the tile angle when geometry alone is too thin. */
export type FaceMask = { src: string; quad?: Pt[] };
export type LoadSource = "upload" | "sample" | "default" | "camera";
export type PrepMode = "primer" | "blur" | "none";
export type FitStatus = "unfitted" | "finding" | "suggested" | "adjusting" | "accepted";
export type FitSource = "default" | "analysis" | "segmentation" | "manual";
export type FitState = {
  status: FitStatus;
  source: FitSource;
  confidence: number | null;
  requestId: number | null;
  adjusted: boolean;
};
export type FitRequestContext = {
  id: number;
  photoRevision: number;
  layerId: string;
};
export type Homography = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
};
export type SnapResult = { quad: Pt[]; confidence: number };
export type PendingSnap = SnapResult & { surface: SurfaceId };
export type SurfaceLayer = {
  id: string;
  label: string;
  surface: SurfaceId;
  quad: Pt[];
  pieceSlug: string;
  tileSize: number;
  blend: number;
  prepMode: PrepMode;
  groutLight: boolean;
  customColors: string[] | null;
  /* The fal segment rides the layer as a data URI, so every surface
     keeps its own shape. */
  maskSrc: string | null;
  /* A pool can be a shell: the rim stays the quad, these four points
     are the floor, and faces join them. Null means flat. */
  shellFloor: Pt[] | null;
  /* A shelled pool holds one segment per interior face: each carries its
     data URI (the true shape) and, for a wall, its own fitted quad (the
     tile angle), since the thin shared-vertex wall geometry cannot cover
     a real receding wall. The floor omits its quad and rides the shell
     floor. Null or empty means the shell falls back to geometry. */
  faceMasks: Partial<Record<ShellFaceId, FaceMask>> | null;
  visible: boolean;
  fit: FitState;
};
