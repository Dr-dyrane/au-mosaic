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
  visible: boolean;
  accepted: boolean;
};
