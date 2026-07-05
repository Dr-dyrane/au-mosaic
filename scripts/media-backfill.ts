/* Backfill the photo room.
 *
 * The Photos CRUD reads the media_assets table, which only ever received
 * the 15-image batch-08 "prepared set". Every other shipped photo was wired
 * straight into src/lib/images.ts and the piece records, so it never appears
 * in the gallery. This registers each shipped image as a "wired" (Live)
 * media row, so the Photos room becomes the single source of truth.
 *
 *   npx tsx scripts/media-backfill.ts --dry   # print what would change
 *   npx tsx scripts/media-backfill.ts         # write (needs DATABASE_URL)
 *
 * Idempotent: rows are deduped by url and skipped if already present, so it
 * is safe to re-run. Backfilled rows carry batch="backfill" so they stay a
 * distinguishable, reversible set. Urls are the local /media paths the site
 * already serves; no blob upload is needed.
 */

import { getDb, schema } from "@/db";
import { CARD, DAY, ENVIRONMENTS, OWN } from "@/lib/images";

type Role = "card" | "applied" | "window" | "proof" | "contact_sheet";
type Sun = "night" | "day" | "single";

type Candidate = {
  url: string;
  title: string;
  role: Role;
  sun: Sun;
  pieceSlug?: string;
  notes: string;
};

const SOURCE = "Backfilled from src/lib/images.ts: the house's own shipped imagery.";
const dayOf = DAY as Record<string, string | undefined>;

function humanize(key: string) {
  return key
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/* One curated list, deduped by url. Order matters: the first role a file
 * earns wins, so a plate registered as a product card is not re-registered
 * as a scene, and a scene used in the window cinema keeps the window role. */
function buildCandidates(): Candidate[] {
  const out: Candidate[] = [];

  // 1. Product cards, per slug (night + day).
  for (const [slug, pair] of Object.entries(CARD)) {
    out.push({ url: pair.night, title: `${humanize(slug)} card, dark`, role: "card", sun: "night", pieceSlug: slug, notes: "Product display for the website." });
    out.push({ url: pair.day, title: `${humanize(slug)} card, light`, role: "card", sun: "day", pieceSlug: slug, notes: "Product display for the website." });
  }

  // 2. Window cinema (night + day).
  for (const env of ENVIRONMENTS) {
    out.push({ url: env.src, title: `${env.place}, dark`, role: "window", sun: "night", notes: "Window scene for the website." });
    if (env.srcDay) out.push({ url: env.srcDay, title: `${env.place}, light`, role: "window", sun: "day", notes: "Window scene for the website." });
  }

  // 3. Everything else in images.ts: applied mosaic scenes and plates.
  for (const [key, url] of Object.entries(OWN)) {
    out.push({ url, title: `${humanize(key)}, dark`, role: "applied", sun: "night", notes: "Applied scene for the website." });
    const day = dayOf[key];
    if (day) out.push({ url: day, title: `${humanize(key)}, light`, role: "applied", sun: "day", notes: "Applied scene for the website." });
  }

  const seen = new Set<string>();
  return out.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}

async function main() {
  const dry = process.argv.includes("--dry") || !process.env.DATABASE_URL;
  const candidates = buildCandidates();

  if (dry) {
    console.log(`[dry] ${candidates.length} shipped images would be registered as Live:`);
    for (const c of candidates) {
      console.log(`  ${c.role.padEnd(8)} ${c.sun.padEnd(6)} ${c.url}${c.pieceSlug ? `  → ${c.pieceSlug}` : ""}`);
    }
    const byRole = candidates.reduce<Record<string, number>>((acc, c) => ((acc[c.role] = (acc[c.role] ?? 0) + 1), acc), {});
    console.log(`[dry] totals:`, byRole, `= ${candidates.length}`);
    if (!process.env.DATABASE_URL) console.log("[dry] (no DATABASE_URL set, so this was a dry run regardless)");
    return;
  }

  const db = getDb();
  const existing = await db.select({ url: schema.mediaAssets.url }).from(schema.mediaAssets);
  const have = new Set(existing.map((r) => r.url));
  const pieceRows = await db.select({ slug: schema.pieces.slug }).from(schema.pieces);
  const validSlugs = new Set(pieceRows.map((r) => r.slug));

  let inserted = 0;
  let skipped = 0;
  for (const c of candidates) {
    if (have.has(c.url)) {
      skipped++;
      continue;
    }
    await db.insert(schema.mediaAssets).values({
      url: c.url,
      title: c.title,
      batch: "backfill",
      sun: c.sun,
      role: c.role,
      status: "wired",
      pieceSlug: c.pieceSlug && validSlugs.has(c.pieceSlug) ? c.pieceSlug : null,
      notes: c.notes,
      source: SOURCE,
      originalPath: c.url.startsWith("/media/") ? `public${c.url}` : c.url,
    });
    have.add(c.url);
    inserted++;
  }

  console.log(`media-backfill: inserted ${inserted}, skipped ${skipped} already present, from ${candidates.length} shipped images.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
