import { and, desc, eq, gt } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { CatalogPiece } from "./extract-order";

/* The catalogue the engine is grounded in, and the only place a
   suggested price comes from. Prices are read from the order book,
   never from the model: the last price the owner gave for a piece is
   offered back as a starting point, still to be confirmed by hand. */

export async function loadCatalog(): Promise<CatalogPiece[]> {
  const db = getDb();
  const rows = await db
    .select({
      slug: schema.pieces.slug,
      name: schema.pieces.name,
      unit: schema.pieces.unit,
      range: schema.ranges.name,
    })
    .from(schema.pieces)
    .innerJoin(schema.ranges, eq(schema.ranges.slug, schema.pieces.rangeSlug))
    .where(eq(schema.pieces.published, true));
  return rows.map((r) => ({ slug: r.slug, name: r.name, unit: r.unit, range: r.range }));
}

/* The last price actually given for a piece, newest order first. A
   suggestion for the owner to confirm, drawn from the ledger. */
export async function lastGivenPriceKobo(slug: string): Promise<number | null> {
  const db = getDb();
  const [row] = await db
    .select({ kobo: schema.orderItems.givenPriceKobo })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
    .where(and(eq(schema.orderItems.pieceSlug, slug), gt(schema.orderItems.givenPriceKobo, 0)))
    .orderBy(desc(schema.orders.createdAt))
    .limit(1);
  return row ? row.kobo : null;
}
