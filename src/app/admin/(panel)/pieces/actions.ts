"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";

/* Server actions are public HTTP endpoints whatever the UI hides, so
   every one re-checks the session before touching the ledger. One
   action saves the whole piece form: words, colours, visibility, and
   stock together, because one Save button is one thing to learn. */

export type SaveState = { ok: boolean; message: string } | null;

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

  revalidatePath("/admin/pieces");
  revalidatePath(`/admin/pieces/${slug}`);
  revalidatePath("/admin");
  return { ok: true, message: "Saved." };
}
