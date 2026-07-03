import {
  MOSAIC_RANGES,
  POOL_MATERIALS,
  PIECES,
  pieceBySlug,
  type Piece,
  type ProductGroup,
} from "./products";
import { PROJECTS, projectBySlug, type Project } from "./projects";

/* The read path. Pages ask the catalog, never the file. Today the catalog
   reads the repo; the Phase 2 dashboard swaps THIS module for a database
   or CMS read and nothing above it changes. Async on purpose, so the swap
   is mechanical: same signatures, different source. */

export async function getMosaicRanges(): Promise<ProductGroup[]> {
  return MOSAIC_RANGES;
}

export async function getPoolMaterials(): Promise<ProductGroup[]> {
  return POOL_MATERIALS;
}

export async function getPieces(): Promise<Piece[]> {
  return PIECES;
}

export async function getPiece(slug: string): Promise<Piece | undefined> {
  return pieceBySlug(slug);
}

export async function getProjects(): Promise<Project[]> {
  return PROJECTS;
}

export async function getProject(slug: string): Promise<Project | undefined> {
  return projectBySlug(slug);
}
