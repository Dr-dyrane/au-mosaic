"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";

/* Ranges are the shelves of the book. Their slug is minted once from
   the first name and never changes, because pieces hang off it. */

export type SaveState = { ok: boolean; message: string } | null;

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueRangeSlug(base: string) {
  const db = getDb();
  const existing = await db.select({ slug: schema.ranges.slug }).from(schema.ranges);
  const taken = new Set(existing.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function createRange(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "The range needs a name." };
  const base = slugify(name);
  if (!base) return { ok: false, message: "The name needs at least one letter." };

  const familyRaw = String(form.get("family") ?? "mosaic");
  const family = familyRaw === "pool" ? ("pool" as const) : ("mosaic" as const);
  let slug: string;
  try {
    slug = await uniqueRangeSlug(base);
    await getDb().insert(schema.ranges).values({
      slug,
      name,
      line: String(form.get("line") ?? "").trim(),
      family,
      sort: parseInt(String(form.get("sort") ?? "0"), 10) || 0,
    });
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }
  await logAction("created the range", name);
  revalidatePath("/admin/ranges");
  revalidatePath("/admin/pieces");
  redirect(`/admin/ranges/${slug}`);
}

export async function saveRange(_prev: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const slug = String(form.get("slug") ?? "");
  const name = String(form.get("name") ?? "").trim();
  if (!slug) return { ok: false, message: "Missing range." };
  if (!name) return { ok: false, message: "The range needs a name." };
  try {
    const familyRaw = String(form.get("family") ?? "mosaic");
    await getDb()
      .update(schema.ranges)
      .set({
        name,
        line: String(form.get("line") ?? "").trim(),
        family: familyRaw === "pool" ? "pool" : "mosaic",
        sort: parseInt(String(form.get("sort") ?? "0"), 10) || 0,
      })
      .where(eq(schema.ranges.slug, slug));
  } catch {
    return { ok: false, message: "The database did not answer. Try again." };
  }
  await logAction("saved the range", name);
  revalidatePath("/admin/ranges");
  revalidatePath(`/admin/ranges/${slug}`);
  revalidatePath("/admin/pieces");
  return { ok: true, message: "Saved." };
}
