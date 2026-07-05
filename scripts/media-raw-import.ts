/* Image Atlas, Phase 2 — admin homes for the raw drops.
 *
 * The raw generator drops (brand-batch-*, product-ledger-*) are local-only:
 * .gitignore whitelists just the shipped .jpg, so these never deploy. To make
 * them findable in the Photos room without shipping them raw to the public
 * site, each is uploaded to Vercel Blob (as batch-08 already does) and given a
 * media_assets row at an honest, non-public status:
 *
 *   - contact sheets   -> role contact_sheet, status archived  (review record)
 *   - masters of a      -> status archived                      (provenance)
 *     shipped frame
 *   - distinct frames  -> status draft                          (Phase 3 candidate)
 *
 * Nothing here is wired (public). Run it like the seed, plus a Blob token:
 *   npx tsx scripts/media-raw-import.ts --dry   # classify, no writes
 *   npx tsx scripts/media-raw-import.ts         # upload + insert
 *                                               # needs DATABASE_URL + BLOB_READ_WRITE_TOKEN
 *
 * Idempotent: deduped by originalPath, so batch-08's own source files and any
 * prior run are skipped. Rows carry batch=<folder> and are reversible as a set.
 */

import { readFile, readdir } from "fs/promises";
import path from "path";

/* A plain `tsx script.ts` does not read .env the way Next does, so pull it in
   explicitly (mirrors scripts/seed.ts). Without this the DATABASE_URL check
   below falls to a dry run. */
for (const envFile of [".env", ".env.local"]) {
  try {
    process.loadEnvFile(envFile);
  } catch {
    /* file not present; fine */
  }
}

const ROOT = "public/media";
const FOLDERS = ["brand-batch-01", "brand-batch-02", "brand-batch-lagos", "product-ledger-2026-07-04"];

type Role = "card" | "applied" | "window" | "proof" | "contact_sheet";
type Sun = "night" | "day" | "single";
type Status = "draft" | "approved" | "wired" | "archived";

type Drop = {
  folder: string;
  file: string;
  localPath: string;
  title: string;
  role: Role;
  sun: Sun;
  status: Status;
  notes: string;
};

function humanize(base: string) {
  return base
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function roleOf(base: string): Role {
  if (base.includes("contact-sheet")) return "contact_sheet";
  if (base.startsWith("window-")) return "window";
  if (/^(sku|gap|commerce|plate)-/.test(base) || base.includes("-stock")) return "card";
  return "applied";
}

function sunOf(base: string): Sun {
  if (/(day|light)$/.test(base)) return "day";
  if (/(night|dark)$/.test(base)) return "night";
  return "single";
}

/* Reduce a filename to the subject it shares with its shipped twin, so a
 * hi-res master can be told apart from a genuinely new frame. Best effort;
 * both outcomes are non-public, so a miss only changes draft vs archived. */
function coreOf(base: string) {
  return base
    .replace(/-(day|night|light|dark)$/, "")
    .replace(/^(sku|gap|commerce|window|plate)-/, "")
    .replace(/-stock$/, "");
}

async function shippedCores(): Promise<Set<string>> {
  const set = new Set<string>();
  const files = await readdir(ROOT).catch(() => [] as string[]);
  for (const f of files) {
    if (f.endsWith(".jpg")) set.add(coreOf(f.replace(/\.jpg$/, "")));
  }
  return set;
}

async function enumerate(): Promise<Drop[]> {
  const cores = await shippedCores();
  const drops: Drop[] = [];
  for (const folder of FOLDERS) {
    const dir = path.join(ROOT, folder);
    const files = await readdir(dir).catch(() => [] as string[]);
    for (const file of files) {
      if (!file.endsWith(".png")) continue;
      const base = file.replace(/\.png$/, "");
      const role = roleOf(base);
      const isMaster = role !== "contact_sheet" && cores.has(coreOf(base));
      const status: Status = role === "contact_sheet" ? "archived" : isMaster ? "archived" : "draft";
      const notes =
        role === "contact_sheet"
          ? "Review sheet. Internal QA surface, never public."
          : isMaster
            ? "Hi-res master of a shipped frame. Provenance, not a public duplicate."
            : "Distinct unshipped frame. Candidate for a future surface (Image Atlas Phase 3).";
      drops.push({ folder, file, localPath: `${ROOT}/${folder}/${file}`, title: humanize(base), role, sun: sunOf(base), status, notes });
    }
  }
  return drops;
}

async function main() {
  const dry = process.argv.includes("--dry") || !process.env.DATABASE_URL;
  const drops = await enumerate();

  if (dry) {
    const tally: Record<string, number> = {};
    for (const d of drops) {
      const key = `${d.status}/${d.role}`;
      tally[key] = (tally[key] ?? 0) + 1;
    }
    console.log(`[dry] ${drops.length} raw drops would get admin-only homes:`);
    for (const [k, n] of Object.entries(tally).sort()) console.log(`  ${k.padEnd(24)} ${n}`);
    const byFolder: Record<string, number> = {};
    for (const d of drops) byFolder[d.folder] = (byFolder[d.folder] ?? 0) + 1;
    console.log(`[dry] by set:`, byFolder);
    console.log(`[dry] statuses: draft = candidates, archived = sheets + masters. None are wired (public).`);
    if (!process.env.DATABASE_URL) console.log("[dry] (no DATABASE_URL, so this was a dry run regardless)");
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is missing.");
  const { put } = await import("@vercel/blob");
  const { getDb, schema } = await import("@/db");
  const db = getDb();

  const existing = await db.select({ originalPath: schema.mediaAssets.originalPath }).from(schema.mediaAssets);
  const have = new Set(existing.map((r) => r.originalPath));

  let uploaded = 0;
  let skipped = 0;
  for (const d of drops) {
    if (have.has(d.localPath)) {
      skipped++;
      continue;
    }
    const body = await readFile(path.join(process.cwd(), d.localPath));
    const blob = await put(`media/atlas/${d.folder}/${d.file}`, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    await db.insert(schema.mediaAssets).values({
      url: blob.url,
      title: d.title,
      batch: d.folder,
      sun: d.sun,
      role: d.role,
      status: d.status,
      notes: d.notes,
      source: "Raw generator drop, admin-only home (Image Atlas Phase 2).",
      originalPath: d.localPath,
    });
    have.add(d.localPath);
    uploaded++;
  }

  console.log(`media-raw-import: uploaded ${uploaded}, skipped ${skipped} already present, from ${drops.length} raw drops.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
