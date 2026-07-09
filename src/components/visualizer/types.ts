export type Pt = { x: number; y: number };
export type SurfaceId = "pool" | "wall" | "backsplash" | "shower" | "floor";
export type LoadSource = "upload" | "sample" | "default" | "camera";
export type PrepMode = "primer" | "blur" | "none";
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
  /* The four-corner quad above sets the perspective, how the tiles
     recede. Extent is where the mosaic actually shows: a freeform
     polygon painted by hand, any shape, so a cut-off or an L-return
     works. Null means use the quad, the old rectangle behaviour.
     Occlude holds what sits in front, the light and the chair, painted
     out so the mosaic stays behind them. */
  extent: Pt[] | null;
  occlude: Pt[][];
  pieceSlug: string;
  tileSize: number;
  blend: number;
  prepMode: PrepMode;
  groutLight: boolean;
  customColors: string[] | null;
  visible: boolean;
  accepted: boolean;
};
