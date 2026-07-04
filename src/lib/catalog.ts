import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb, schema } from "@/db";
import {
  MOSAIC_RANGES,
  POOL_MATERIALS,
  PIECES,
  pieceBySlug,
  type Piece,
  type Product,
  type ProductGroup,
} from "./products";
import { PROJECTS, projectBySlug, type Project } from "./projects";
import { CARD } from "./images";

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
   book is unreachable or has never been seeded. Variants remain
   curated garnish from the repo until the book learns a variants
   column. */

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

const readBook = unstable_cache(
  async (): Promise<Book> => {
    const db = getDb();
    const ranges = await db.select().from(schema.ranges).orderBy(asc(schema.ranges.sort));
    const pieces = await db
      .select()
      .from(schema.pieces)
      .where(eq(schema.pieces.published, true))
      .orderBy(asc(schema.pieces.sort));
    return { ranges, pieces };
  },
  ["catalog-book"],
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

function toProduct(p: BookPiece): Product & { slug: string } {
  return {
    slug: p.slug,
    name: p.name,
    note: p.line || undefined,
    colors: p.colors && p.colors.length > 0 ? p.colors : undefined,
    image: p.imageNight ?? undefined,
    imageLight: p.imageDay ?? undefined,
    variants: VARIANTS.get(p.slug),
  };
}

function groupsOf(book: Book, family: "mosaic" | "pool"): ProductGroup[] {
  return book.ranges
    .filter((r) => r.family === family)
    .map((r) => ({
      id: r.slug,
      title: r.name,
      blurb: r.line,
      items: book.pieces.filter((p) => p.rangeSlug === r.slug).map(toProduct),
    }))
    .filter((g) => g.items.length > 0);
}

function piecesOf(book: Book): Piece[] {
  const mosaic = new Map(
    book.ranges.filter((r) => r.family === "mosaic").map((r) => [r.slug, r])
  );
  return book.pieces
    .filter((p) => mosaic.has(p.rangeSlug))
    .map((p) => ({
      ...toProduct(p),
      collection: mosaic.get(p.rangeSlug)!.name,
      groupId: p.rangeSlug,
    }));
}

/* The grid wears the shop-style card where one exists, keyed by slug, over
   both the book and the fallback; the piece page still reads image, so the
   hero photo is untouched. */
function withCards(g: ProductGroup): ProductGroup {
  return {
    ...g,
    items: g.items.map((i) =>
      i.slug && CARD[i.slug] ? { ...i, card: CARD[i.slug].night, cardLight: CARD[i.slug].day } : i
    ),
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

export async function getPieces(): Promise<Piece[]> {
  const book = await bookOrNull();
  return book ? piecesOf(book) : PIECES;
}

export async function getPiece(slug: string): Promise<Piece | undefined> {
  const book = await bookOrNull();
  if (book) return piecesOf(book).find((p) => p.slug === slug);
  return pieceBySlug(slug);
}

/* Projects stay the repo's concept studies until real ones replace
   them through the same shape. */
export async function getProjects(): Promise<Project[]> {
  return PROJECTS;
}

export async function getProject(slug: string): Promise<Project | undefined> {
  return projectBySlug(slug);
}
