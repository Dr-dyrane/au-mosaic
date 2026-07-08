import type { Pt, SurfaceId } from "./types";
import { VISUALIZER_CONTEXTS, VISUALIZER_SAMPLE } from "@/lib/images";

export const DEFAULT_QUAD: Pt[] = [
  { x: 0.28, y: 0.45 }, { x: 0.75, y: 0.45 }, { x: 0.92, y: 0.92 }, { x: 0.1, y: 0.92 },
];

export const SAMPLE_POOL_QUAD: Pt[] = [
  { x: 0.31, y: 0.43 }, { x: 0.63, y: 0.43 }, { x: 0.77, y: 0.73 }, { x: 0.14, y: 0.73 },
];

export const SURFACES: Record<SurfaceId, { label: string; line: string; quad: Pt[]; tileSize: number }> = {
  pool: {
    label: "Pool floor",
    line: "For shells and waterlines.",
    quad: SAMPLE_POOL_QUAD,
    tileSize: 26,
  },
  wall: {
    label: "Feature wall",
    line: "For rooms and murals.",
    quad: [
      { x: 0.22, y: 0.18 }, { x: 0.78, y: 0.18 }, { x: 0.78, y: 0.84 }, { x: 0.22, y: 0.84 },
    ],
    tileSize: 22,
  },
  backsplash: {
    label: "Backsplash",
    line: "For kitchens and sinks.",
    quad: [
      { x: 0.06, y: 0.34 }, { x: 0.94, y: 0.34 }, { x: 0.94, y: 0.68 }, { x: 0.06, y: 0.68 },
    ],
    tileSize: 18,
  },
  shower: {
    label: "Shower wall",
    line: "For baths and wet rooms.",
    quad: [
      { x: 0.25, y: 0.15 }, { x: 0.82, y: 0.15 }, { x: 0.82, y: 0.86 }, { x: 0.25, y: 0.86 },
    ],
    tileSize: 20,
  },
  floor: {
    label: "Room floor",
    line: "For large surfaces.",
    quad: [
      { x: 0.14, y: 0.53 }, { x: 0.86, y: 0.53 }, { x: 0.98, y: 0.97 }, { x: 0.02, y: 0.97 },
    ],
    tileSize: 24,
  },
};

export const CONTEXTS: Array<{
  id: SurfaceId;
  label: string;
  src: string;
  piece: string;
}> = [
  { id: "pool", label: "Empty pool", src: VISUALIZER_SAMPLE.pool.src, piece: "classic-pool-blues" },
  { id: "wall", label: "Blank wall", src: VISUALIZER_CONTEXTS.featureWall.src, piece: "gold-metallic-accents" },
  { id: "backsplash", label: "Kitchen", src: VISUALIZER_CONTEXTS.backsplash.src, piece: "aqua-turquoise-blends" },
  { id: "shower", label: "Shower", src: VISUALIZER_CONTEXTS.showerWall.src, piece: "black-mosaic" },
  { id: "floor", label: "Open floor", src: VISUALIZER_CONTEXTS.roomFloor.src, piece: "stone-mosaic" },
];
export const QUICK_SURFACES: SurfaceId[] = ["pool", "wall", "backsplash", "shower", "floor"];

export const DEFAULT_PIECE = "classic-pool-blues";
export const STORE_KEY = "aumosaic.viz";
export const CORNER_LABELS = ["Top left", "Top right", "Bottom right", "Bottom left"] as const;
export const FIRST_LAYER_ID = "surface-1";
export const LAYER_LABELS: Record<SurfaceId, string> = {
  pool: "Pool",
  wall: "Wall",
  backsplash: "Backsplash",
  shower: "Shower",
  floor: "Floor",
};
export const PREFERRED_PIECES: Record<SurfaceId, string> = {
  pool: "classic-pool-blues",
  wall: "aqua-turquoise-blends",
  backsplash: "aqua-turquoise-blends",
  shower: "black-mosaic",
  floor: "stone-mosaic",
};
export const NEXT_SURFACE: Record<SurfaceId, SurfaceId[]> = {
  pool: ["wall", "floor", "backsplash", "shower", "pool"],
  wall: ["floor", "backsplash", "shower", "pool", "wall"],
  backsplash: ["floor", "wall", "shower", "pool", "backsplash"],
  shower: ["floor", "wall", "backsplash", "pool", "shower"],
  floor: ["wall", "backsplash", "shower", "pool", "floor"],
};
