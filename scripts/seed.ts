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
import { MOSAIC_RANGES, POOL_MATERIALS } from "../src/lib/products";
import { SITE } from "../src/lib/site";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

process.loadEnvFile(".env");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");
const db = drizzle(neon(url), { schema, casing: "snake_case" });

async function main() {
  let rangeCount = 0;
  let pieceCount = 0;

  const families = [
    { groups: MOSAIC_RANGES, family: "mosaic" as const, unit: "sheets" },
    { groups: POOL_MATERIALS, family: "pool" as const, unit: "units" },
  ];

  for (const { groups, family, unit } of families) {
    for (const [gi, g] of groups.entries()) {
      await db
        .insert(schema.ranges)
        .values({ slug: g.id, name: g.title, line: g.blurb, family, sort: gi })
        .onConflictDoUpdate({
          target: schema.ranges.slug,
          set: { name: g.title, line: g.blurb, family, sort: gi },
        });
      rangeCount++;

      for (const [pi, item] of g.items.entries()) {
        const slug = item.slug ?? slugify(item.name);
        if (!slug) continue;
        const values = {
          slug,
          rangeSlug: g.id,
          name: item.name,
          line: item.note ?? "",
          colors: item.colors ?? [],
          imageNight: item.image ?? null,
          imageDay: item.imageLight ?? null,
          unit,
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
          .values({ pieceSlug: slug })
          .onConflictDoNothing();
        pieceCount++;
      }
    }
  }

  /* House facts, seeded once and never overwritten: his edits win. */
  const facts: Record<string, string> = {
    whatsapp: SITE.whatsapp,
    phone_display: SITE.phoneDisplay,
    hours: SITE.hours,
    location: SITE.address,
    instagram: SITE.instagram,
  };
  for (const [key, value] of Object.entries(facts)) {
    await db.insert(schema.settings).values({ key, value }).onConflictDoNothing();
  }

  console.log(`Seeded ${rangeCount} ranges, ${pieceCount} pieces, both families, house facts, stock rows ready.`);
}

main().then(() => process.exit(0));
