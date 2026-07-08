import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, schema } from "@/db";
import { healSchema } from "@/db/heal";
import {
  BUYING_STEPS,
  MOSAIC_RANGES,
  POOL_MATERIALS,
  POOL_SERVICES,
  PIECES,
  pieceBySlug,
  type Piece,
  type Product,
  type ProductGroup,
} from "./products";
import { PROJECTS, projectBySlug, type Project } from "./projects";
import { CARD, DAY, OWN } from "./images";

/* The seam, flipped: law 10. The window now reads the book, so what
   he edits in the stockroom is what Lagos sees, photos included.
   The repo's own catalogue stands behind the book as the fallback,
   which keeps two old promises: the site still builds on machines
   with no database, and a database that stops answering never
   blanks the window. Reads hide behind one cached fetch under the
   catalog tag; every stockroom save revalidates it, so an edit
   reaches the window in the same minute without costing a query
   per visitor. One honest nuance: when the book answers, the book
   is the whole truth. A piece he unpublishes stays gone, never
   resurrected by the fallback; the fallback speaks only when the
   book is unreachable or has never been seeded. Trade facts now
   come from the book too: seed size, shade, and finish. */

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const VARIANTS = new Map<string, string[]>();
for (const g of [...MOSAIC_RANGES, ...POOL_MATERIALS]) {
  for (const i of g.items) {
    if (i.variants?.length) VARIANTS.set(i.slug ?? slugify(i.name), i.variants);
  }
}

type BookRange = typeof schema.ranges.$inferSelect;
type BookPiece = typeof schema.pieces.$inferSelect;
type Book = { ranges: BookRange[]; pieces: BookPiece[] };
type MediaAsset = typeof schema.mediaAssets.$inferSelect;

export type AppliedPromise = {
  title: string;
  line: string;
  href: string;
  src: string;
  srcDay?: string;
  alt: string;
};

const APPLIED_PROMISES: AppliedPromise[] = [
  {
    title: "Kitchen wall",
    line: "Aqua glass across the sink line.",
    href: "/piece/aqua-turquoise-blends",
    src: OWN.aquaBlends,
    srcDay: DAY.aquaBlends,
    alt: "Aqua mosaic applied across a kitchen wall",
  },
  {
    title: "Pool edge",
    line: "Blue chosen before the water arrives.",
    href: "/piece/deep-midnight-blends",
    src: OWN.poolEdge,
    srcDay: DAY.poolEdge,
    alt: "Blue mosaic at the edge of a swimming pool",
  },
  {
    title: "Gold room",
    line: "Mirror tesserae turn a wall into light.",
    href: "/piece/gold-metallic-accents",
    src: OWN.metallicRoom,
    srcDay: DAY.metallicRoom,
    alt: "Gold and silver mosaic in a warm interior room",
  },
  {
    title: "Custom wall",
    line: "Pictures made from colour.",
    href: "/piece/custom-murals",
    src: OWN.artGallery,
    srcDay: DAY.artGallery,
    alt: "A custom mosaic artwork displayed on a wall",
  },
];

const readBook = unstable_cache(
  async (): Promise<Book> => {
    try {
      await healSchema();
      const db = getDb();
      const ranges = await db.select().from(schema.ranges).orderBy(asc(schema.ranges.sort));
      const pieces = await db
        .select()
        .from(schema.pieces)
        .where(eq(schema.pieces.published, true))
        .orderBy(asc(schema.pieces.sort));
      return { ranges, pieces };
    } catch {
      return { ranges: [], pieces: [] };
    }
  },
  ["catalog-book"],
  { tags: ["catalog"], revalidate: 3600 }
);

const readApprovedShowroomProofs = unstable_cache(
  async (): Promise<MediaAsset[]> => {
    try {
      await healSchema();
      const db = getDb();
      return await db
        .select()
        .from(schema.mediaAssets)
        .where(
          and(
            eq(schema.mediaAssets.batch, "batch-08"),
            eq(schema.mediaAssets.role, "proof"),
            eq(schema.mediaAssets.status, "approved")
          )
        )
        .orderBy(asc(schema.mediaAssets.createdAt));
    } catch {
      return [];
    }
  },
  ["showroom-proofs"],
  { tags: ["catalog"], revalidate: 3600 }
);

/* The book, or null when it cannot speak or was never seeded. */
async function bookOrNull(): Promise<Book | null> {
  try {
    const book = await readBook();
    return book.pieces.length > 0 ? book : null;
  } catch {
    return null;
  }
}

async function approvedKitchenProof(): Promise<AppliedPromise | null> {
  try {
    const rows = await readApprovedShowroomProofs();
    const night = rows.find((row) => row.sun === "night");
    const day = rows.find((row) => row.sun === "day");
    if (!night && !day) return null;
    const pieceSlug = night?.pieceSlug ?? day?.pieceSlug;
    return {
      title: "Kitchen wall",
      line: "Aqua glass across the sink line.",
      href: pieceSlug ? `/piece/${pieceSlug}` : "/mosaic-tiles",
      src: night?.url ?? day!.url,
      srcDay: day?.url ?? night?.url,
      alt: "Aqua mosaic showroom proof across a kitchen wall",
    };
  } catch {
    return null;
  }
}

function toProduct(p: BookPiece): Product & { slug: string } {
  return {
    slug: p.slug,
    name: p.name,
    note: p.line || undefined,
    colors: p.colors && p.colors.length > 0 ? p.colors : undefined,
    applicationTags: cleanList(p.applicationTags),
    image: p.imageNight ?? undefined,
    imageLight: p.imageDay ?? undefined,
    card: p.cardImageNight ?? undefined,
    cardLight: p.cardImageDay ?? undefined,
    variants: bookVariants(p),
  };
}

function bookVariants(p: BookPiece): string[] | undefined {
  const values = [p.seedSize, p.shade, p.finish]
    .map((v) => (v ?? "").trim())
    .filter(Boolean);
  return values.length > 0 ? values : VARIANTS.get(p.slug);
}

function cleanList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value.map((v) => String(v ?? "").trim()).filter(Boolean);
  return list.length > 0 ? list : undefined;
}

function withCard<T extends Product>(i: T): T {
  if (i.card) return i;
  if (!i.slug || !CARD[i.slug]) return i;
  return { ...i, card: CARD[i.slug].night, cardLight: CARD[i.slug].day };
}

function groupsOf(book: Book, family: "mosaic" | "pool"): ProductGroup[] {
  return book.ranges
    .filter((r) => r.family === family)
    .map((r) => ({
      id: r.slug,
      title: r.name,
      blurb: r.line,
      items: book.pieces.filter((p) => p.rangeSlug === r.slug).map(toProduct).map(withCard),
    }))
    .filter((g) => g.items.length > 0);
}

function piecesOf(book: Book, family?: "mosaic" | "pool"): Piece[] {
  const catalogueRanges = new Map(
    book.ranges
      .filter((r) => (family ? r.family === family : true))
      .map((r) => [r.slug, r])
  );
  return book.pieces
    .filter((p) => catalogueRanges.has(p.rangeSlug))
    .map((p) => ({
      ...toProduct(p),
      collection: catalogueRanges.get(p.rangeSlug)!.name,
      groupId: p.rangeSlug,
    }))
    .map(withCard);
}

/* The grid wears the shop-style card where one exists, keyed by slug, over
   both the book and the fallback; the piece page still reads image, so the
   hero photo is untouched. */
function withCards(g: ProductGroup): ProductGroup {
  return {
    ...g,
    items: g.items.map(withCard),
  };
}

export async function getMosaicRanges(): Promise<ProductGroup[]> {
  const book = await bookOrNull();
  return (book ? groupsOf(book, "mosaic") : MOSAIC_RANGES).map(withCards);
}

export async function getPoolMaterials(): Promise<ProductGroup[]> {
  const book = await bookOrNull();
  return book ? groupsOf(book, "pool") : POOL_MATERIALS;
}

export async function getPoolServices() {
  return POOL_SERVICES;
}

export async function getBuyingSteps() {
  return BUYING_STEPS;
}

export async function getPieces(): Promise<Piece[]> {
  const book = await bookOrNull();
  return book ? piecesOf(book, "mosaic") : PIECES;
}

export async function getAllPieces(): Promise<Piece[]> {
  const book = await bookOrNull();
  return book ? piecesOf(book) : PIECES;
}

export async function getPiece(slug: string): Promise<Piece | undefined> {
  const book = await bookOrNull();
  if (book) return piecesOf(book).find((p) => p.slug === slug);
  return pieceBySlug(slug);
}

export async function getAppliedPromises(): Promise<AppliedPromise[]> {
  const proof = await approvedKitchenProof();
  return proof ? [proof, ...APPLIED_PROMISES.slice(1)] : APPLIED_PROMISES;
}

/* Projects stay the repo's concept studies until real ones replace
   them through the same shape. */
export async function getProjects(): Promise<Project[]> {
  return PROJECTS;
}

export async function getProject(slug: string): Promise<Project | undefined> {
  return projectBySlug(slug);
}
