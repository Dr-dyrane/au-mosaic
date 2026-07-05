"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";

/* Server actions are public HTTP endpoints whatever the UI hides, so
   every one re-checks the session before touching the ledger. One
   action saves the whole piece form: words, colours, visibility, and
   stock together, because one Save button is one thing to learn.
   Every write signs the book's history. */

export type SaveState = { ok: boolean; message: string } | null;

/* The seam is flipped: the window reads the book. Any write the
   site can see walks through here. updateTag over revalidateTag on
   purpose: the owner who saves and then opens the window must read
   his own write, not yesterday's cache. */
function refreshWindow() {
  updateTag("catalog");
  revalidatePath("/", "layout");
}

function parseColors(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((c) => c.trim())
    .filter((c) => /^#[0-9a-fA-F]{3,8}$/.test(c));
}

function toInt(v: FormDataEntryValue | null, fallback = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/* Photographs go to Vercel Blob and their URL into the piece record.
   Night and day are separate slots, same as the flagship renders
   them. Replacing leaves the old file orphaned in the store on
   purpose: nothing is ever lost. */
export async function uploadPhoto(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const slug = String(form.get("slug") ?? "");
  const which = String(form.get("which") ?? "");
  const file = form.get("photo");
  if (!slug || (which !== "night" && which !== "day")) {
    return { ok: false, message: "Missing piece or slot." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a photograph first." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "That is not a photograph." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, message: "Too heavy. Keep it under 8MB." };
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, message: "Photo uploads are not ready yet. Try again after setup." };
  }
  /* Two doors, two sentences: the store and the book fail in their
     own words, and each failure names itself in the runtime logs, so
     a silent catch can never send the owner guessing again. */
  let url: string;
  try {
    const ext = file.type === "image/png" ? "png" : "jpg";
    const blob = await put(`pieces/${slug}-${which}-${Date.now()}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    url = blob.url;
  } catch (e) {
    console.error("[photograph] the store refused the upload", e);
    return { ok: false, message: "The file did not upload. Try once more." };
  }
  try {
    await getDb()
      .update(schema.pieces)
      .set(
        which === "night"
          ? { imageNight: url, updatedAt: sql`now()` }
          : { imageDay: url, updatedAt: sql`now()` }
      )
      .where(eq(schema.pieces.slug, slug));
  } catch (e) {
    console.error("[photograph] the book did not take the URL", e);
    return { ok: false, message: "The photograph landed but the book did not take it. Try again." };
  }
  await logAction("put up a photograph", slug, which === "night" ? "the night slot" : "the day slot");
  revalidatePath(`/admin/pieces/${slug}`);
  revalidatePath("/admin/pieces");
  refreshWindow();
  return { ok: true, message: "The photograph is in." };
}

export async function removePhoto(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const slug = String(form.get("slug") ?? "");
  const which = String(form.get("which") ?? "");
  if (!slug || (which !== "night" && which !== "day")) {
    return { ok: false, message: "Missing piece or slot." };
  }
  try {
    await getDb()
      .update(schema.pieces)
      .set(
        which === "night"
          ? { imageNight: null, updatedAt: sql`now()` }
          : { imageDay: null, updatedAt: sql`now()` }
      )
      .where(eq(schema.pieces.slug, slug));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }
  await logAction("took down a photograph", slug, which === "night" ? "the night slot" : "the day slot");
  revalidatePath(`/admin/pieces/${slug}`);
  revalidatePath("/admin/pieces");
  refreshWindow();
  return { ok: true, message: "Taken down. The file stays in the store." };
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* Starting counts, deterministic by slug so the shelf looks
   lived-in rather than photocopied: mosaic in dozens of sheets,
   pool gear in single digits, warn-me-at set where the trade
   would set it. */
function starterCount(slug: string, family: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  if (family === "pool") {
    return { qty: 3 + (h % 14), reorderAt: 2 };
  }
  return { qty: 36 + (h % 12) * 12, reorderAt: 24 };
}

/* One tap loads the empty shop: only rows he has never touched
   (zero in stock, zero warn-me-at) receive counts, so running it
   twice, or late, can never overwrite a real number. He corrects
   them to truth piece by piece; the cycle of selling down and
   restocking starts from here. */
export async function stockTheShelves(): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const db = getDb();
  let filled = 0;
  try {
    const rows = await db
      .select({
        slug: schema.stockLevels.pieceSlug,
        qty: schema.stockLevels.quantitySheets,
        reorderAt: schema.stockLevels.reorderAt,
        family: schema.ranges.family,
      })
      .from(schema.stockLevels)
      .innerJoin(schema.pieces, eq(schema.pieces.slug, schema.stockLevels.pieceSlug))
      .innerJoin(schema.ranges, eq(schema.ranges.slug, schema.pieces.rangeSlug));

    for (const row of rows) {
      if (row.qty !== 0 || row.reorderAt !== 0) continue;
      const s = starterCount(row.slug, row.family);
      /* The write re-checks untouched, so two racing taps cannot
         both load the same shelf. */
      const touched = await db
        .update(schema.stockLevels)
        .set({ quantitySheets: s.qty, reorderAt: s.reorderAt, updatedAt: sql`now()` })
        .where(
          and(
            eq(schema.stockLevels.pieceSlug, row.slug),
            eq(schema.stockLevels.quantitySheets, 0),
            eq(schema.stockLevels.reorderAt, 0)
          )
        )
        .returning({ slug: schema.stockLevels.pieceSlug });
      if (touched.length > 0) filled++;
    }
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  if (filled === 0) {
    return { ok: true, message: "Nothing to load: every shelf already carries your own numbers." };
  }
  await logAction("stocked the shelves to start", "", `${filled} pieces`);
  revalidatePath("/admin/pieces");
  revalidatePath("/admin");
  return {
    ok: true,
    message: `${filled} shelves loaded. Correct them to your real counts as you go.`,
  };
}

/* A new piece enters the book as a draft: it gets its record, its
   stock row, and a slug minted once. The window comes later, when he
   flips the switch. */
export async function createPiece(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const name = String(form.get("name") ?? "").trim();
  const rangeSlug = String(form.get("rangeSlug") ?? "");
  if (!name) return { ok: false, message: "The piece needs a name." };
  if (!rangeSlug) return { ok: false, message: "Choose a shelf for it." };
  const base = slugify(name);
  if (!base) return { ok: false, message: "The name needs at least one letter." };

  const db = getDb();
  let slug: string;
  try {
    const existing = await db.select({ slug: schema.pieces.slug }).from(schema.pieces);
    const taken = new Set(existing.map((p) => p.slug));
    slug = base;
    let n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;

    await db.insert(schema.pieces).values({
      slug,
      rangeSlug,
      name,
      line: String(form.get("line") ?? "").trim(),
      colors: parseColors(String(form.get("colors") ?? "")),
      published: form.get("published") === "on",
    });
    await db.insert(schema.stockLevels).values({ pieceSlug: slug }).onConflictDoNothing();
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }
  await logAction("created the piece", name);
  revalidatePath("/admin/pieces");
  revalidatePath("/admin");
  refreshWindow();
  redirect(`/admin/pieces/${slug}`);
}

export async function savePiece(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };

  const slug = String(form.get("slug") ?? "");
  const name = String(form.get("name") ?? "").trim();
  if (!slug) return { ok: false, message: "Missing piece." };
  if (!name) return { ok: false, message: "The piece needs a name." };

  const db = getDb();
  const etaRaw = String(form.get("containerEta") ?? "").trim();

  try {
    await db
      .update(schema.pieces)
      .set({
        name,
        line: String(form.get("line") ?? "").trim(),
        story: String(form.get("story") ?? "").trim(),
        priceNote: String(form.get("priceNote") ?? "").trim() || "Quote per job",
        colors: parseColors(String(form.get("colors") ?? "")),
        unit: String(form.get("unit") ?? "").trim() || "sheets",
        published: form.get("published") === "on",
        updatedAt: sql`now()`,
      })
      .where(eq(schema.pieces.slug, slug));

    await db
      .insert(schema.stockLevels)
      .values({
        pieceSlug: slug,
        quantitySheets: toInt(form.get("quantitySheets")),
        reorderAt: toInt(form.get("reorderAt")),
        containerEta: etaRaw || null,
      })
      .onConflictDoUpdate({
        target: schema.stockLevels.pieceSlug,
        set: {
          quantitySheets: toInt(form.get("quantitySheets")),
          reorderAt: toInt(form.get("reorderAt")),
          containerEta: etaRaw || null,
          updatedAt: sql`now()`,
        },
      });
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }

  await logAction("saved the piece", name);
  revalidatePath("/admin/pieces");
  revalidatePath(`/admin/pieces/${slug}`);
  revalidatePath("/admin");
  refreshWindow();
  return { ok: true, message: "Saved. The window sees it too." };
}
