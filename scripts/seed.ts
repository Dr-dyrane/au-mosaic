/* Seed the back office from the flagship's own catalogue, so day one
   of the CRM starts with every range and piece the site already
   sells, stock at zero, waiting for his real counts.

   Run: npm run db:seed (tsx carries it; plain Node cannot resolve
   the catalogue's extensionless imports).

   Idempotent: upserts by slug, safe to run twice. Relative imports on
   purpose; this runs outside Next's path aliases. */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { MOSAIC_RANGES } from "../src/lib/products";

process.loadEnvFile(".env");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");
const db = drizzle(neon(url), { schema, casing: "snake_case" });

async function main() {
  let rangeCount = 0;
  let pieceCount = 0;

  for (const [gi, g] of MOSAIC_RANGES.entries()) {
    await db
      .insert(schema.ranges)
      .values({ slug: g.id, name: g.title, line: g.blurb, sort: gi })
      .onConflictDoUpdate({
        target: schema.ranges.slug,
        set: { name: g.title, line: g.blurb, sort: gi },
      });
    rangeCount++;

    for (const [pi, item] of g.items.entries()) {
      if (!item.slug) continue;
      const values = {
        slug: item.slug,
        rangeSlug: g.id,
        name: item.name,
        line: item.note ?? "",
        colors: item.colors ?? [],
        imageNight: item.image ?? null,
        imageDay: item.imageLight ?? null,
        sort: pi,
      };
      await db
        .insert(schema.pieces)
        .values(values)
        .onConflictDoUpdate({
          target: schema.pieces.slug,
          set: { ...values, updatedAt: sql`now()` },
        });
      await db
        .insert(schema.stockLevels)
        .values({ pieceSlug: item.slug })
        .onConflictDoNothing();
      pieceCount++;
    }
  }

  console.log(`Seeded ${rangeCount} ranges, ${pieceCount} pieces, stock rows ready.`);
}

main().then(() => process.exit(0));
