"use server";

import { revalidatePath, updateTag } from "next/cache";
import { put } from "@vercel/blob";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";
import { importBatch08Assets, promoteBatch08Assets } from "@/lib/media-batch-08";
import { asMediaListRows, type MediaListRow } from "./media-list";

export type MediaState = { ok: boolean; message: string } | null;

const ROLES = ["card", "applied", "window", "proof", "contact_sheet"] as const;
const STATUSES = ["draft", "approved", "wired", "archived"] as const;
const SUNS = ["night", "day", "single"] as const;
const MANUAL_SET = "owner-uploads";

type MediaAsset = typeof schema.mediaAssets.$inferSelect;
type MediaRole = (typeof ROLES)[number];
type MediaStatus = (typeof STATUSES)[number];
type MediaSun = (typeof SUNS)[number];
export type MediaListFilters = {
  status?: string;
  role?: string;
  batch?: string;
};

const MEDIA_LIST_PAGE = 24;

function refreshMediaAndWindow(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/media");
  if (id) revalidatePath(`/admin/media/${id}`);
  revalidatePath("/admin/pieces");
  revalidatePath("/", "layout");
  updateTag("catalog");
}

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function enumValue<T extends readonly string[]>(value: string, values: T, fallback: T[number]) {
  return values.includes(value) ? value as T[number] : fallback;
}

function mediaListWhere(filters: MediaListFilters) {
  const where: SQL[] = [];
  const status = STATUSES.find((s) => s === filters.status);
  const role = ROLES.find((r) => r === filters.role);
  const batch = filters.batch === "batch-08" ? "batch-08" : undefined;
  if (status) where.push(eq(schema.mediaAssets.status, status));
  if (role) where.push(eq(schema.mediaAssets.role, role));
  if (batch) where.push(eq(schema.mediaAssets.batch, batch));
  return where;
}

async function selectMediaListRows(filters: MediaListFilters, offset: number, limit: number) {
  const where = mediaListWhere(filters);
  const base = getDb()
    .select({
      asset: schema.mediaAssets,
      piece: {
        name: schema.pieces.name,
        slug: schema.pieces.slug,
      },
    })
    .from(schema.mediaAssets)
    .leftJoin(schema.pieces, eq(schema.pieces.slug, schema.mediaAssets.pieceSlug));
  const query = where.length > 0 ? base.where(and(...where)) : base;
  const rows = await query
    .orderBy(desc(schema.mediaAssets.createdAt), desc(schema.mediaAssets.id))
    .limit(limit)
    .offset(offset);
  return asMediaListRows(rows);
}

function cleanFilePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "photo";
}

function extFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function checkPhoto(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return "Choose a photograph first.";
  if (!file.type.startsWith("image/")) return "That is not a photograph.";
  if (file.size > 8 * 1024 * 1024) return "Too heavy. Keep it under 8MB.";
  return "";
}

function asPieceSlug(value: string) {
  return value ? value : null;
}

function needsLiveSlot(asset: Pick<MediaAsset, "status" | "role" | "sun" | "pieceSlug">) {
  return asset.status === "wired" && asset.role === "card";
}

function validateLiveSlot(asset: Pick<MediaAsset, "status" | "role" | "sun" | "pieceSlug">) {
  if (!needsLiveSlot(asset)) return "";
  if (!asset.pieceSlug) return "Choose the piece before making this photo live.";
  if (asset.sun !== "night" && asset.sun !== "day") {
    return "Choose day or night before making this photo live.";
  }
  return "";
}

async function clearLiveSlot(asset: MediaAsset) {
  if (!needsLiveSlot(asset) || !asset.pieceSlug) return;
  const db = getDb();
  if (asset.sun === "night") {
    await db
      .update(schema.pieces)
      .set({ cardImageNight: null, updatedAt: sql`now()` })
      .where(and(eq(schema.pieces.slug, asset.pieceSlug), eq(schema.pieces.cardImageNight, asset.url)));
  }
  if (asset.sun === "day") {
    await db
      .update(schema.pieces)
      .set({ cardImageDay: null, updatedAt: sql`now()` })
      .where(and(eq(schema.pieces.slug, asset.pieceSlug), eq(schema.pieces.cardImageDay, asset.url)));
  }
}

async function putLiveSlot(asset: MediaAsset) {
  const problem = validateLiveSlot(asset);
  if (problem) throw new Error(problem);
  if (!needsLiveSlot(asset) || !asset.pieceSlug) return;
  const db = getDb();
  await db
    .update(schema.pieces)
    .set(
      asset.sun === "night"
        ? { cardImageNight: asset.url, updatedAt: sql`now()` }
        : { cardImageDay: asset.url, updatedAt: sql`now()` }
    )
    .where(eq(schema.pieces.slug, asset.pieceSlug));
}

async function mediaById(id: string) {
  const [asset] = await getDb().select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, id)).limit(1);
  return asset;
}

export async function loadMoreMediaRows(
  filters: MediaListFilters,
  offset: number
): Promise<{ items: MediaListRow[]; done: boolean }> {
  if (!(await hasSession())) return { items: [], done: true };
  const rows = await selectMediaListRows(filters, offset, MEDIA_LIST_PAGE + 1);
  return { items: rows.slice(0, MEDIA_LIST_PAGE), done: rows.length <= MEDIA_LIST_PAGE };
}

export async function createMediaAssetAction(_prev: MediaState, form: FormData): Promise<MediaState> {
  void _prev;
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const file = form.get("photo");
  const fileProblem = checkPhoto(file);
  if (fileProblem) return { ok: false, message: fileProblem };
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, message: "Photo uploads are not ready yet. Try again after setup." };
  }
  const title = text(form, "title") || "Untitled photo";
  const role = enumValue(text(form, "role"), ROLES, "card");
  const sun = enumValue(text(form, "sun"), SUNS, "single");
  const pieceSlug = asPieceSlug(text(form, "pieceSlug"));
  const notes = text(form, "notes");
  try {
    const photo = file as File;
    const ext = extFor(photo);
    const blob = await put(`media/${MANUAL_SET}/${Date.now()}-${cleanFilePart(title)}.${ext}`, photo, {
      access: "public",
      addRandomSuffix: false,
    });
    await getDb().insert(schema.mediaAssets).values({
      url: blob.url,
      title,
      batch: MANUAL_SET,
      sun,
      role,
      status: "draft",
      pieceSlug,
      notes,
      source: "Owner upload from the photo room.",
      originalPath: photo.name,
    });
  } catch (e) {
    console.error("[media] photo upload failed", e);
    return { ok: false, message: "The photo did not upload. Try once more." };
  }
  await logAction("added a photo", title, pieceSlug ?? "photo room");
  refreshMediaAndWindow();
  return { ok: true, message: "The photo is in." };
}

export async function updateMediaAssetAction(_prev: MediaState, form: FormData): Promise<MediaState> {
  void _prev;
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const id = text(form, "id");
  const title = text(form, "title");
  if (!id) return { ok: false, message: "Choose a photo first." };
  if (!title) return { ok: false, message: "The photo needs a title." };

  const next = {
    title,
    role: enumValue(text(form, "role"), ROLES, "card") as MediaRole,
    status: enumValue(text(form, "status"), STATUSES, "draft") as MediaStatus,
    sun: enumValue(text(form, "sun"), SUNS, "single") as MediaSun,
    pieceSlug: asPieceSlug(text(form, "pieceSlug")),
    notes: text(form, "notes"),
  };
  const problem = validateLiveSlot(next);
  if (problem) return { ok: false, message: problem };

  try {
    const before = await mediaById(id);
    if (!before) return { ok: false, message: "That photo is not in the room." };
    const after: MediaAsset = { ...before, ...next };
    await getDb()
      .update(schema.mediaAssets)
      .set({ ...next, updatedAt: sql`now()` })
      .where(eq(schema.mediaAssets.id, id));
    await clearLiveSlot(before);
    await putLiveSlot(after);
    await logAction("updated a photo", title, next.status === "wired" ? "live product display" : next.role);
  } catch (e) {
    console.error("[media] photo update failed", e);
    return { ok: false, message: e instanceof Error && e.message ? e.message : "The database did not answer. Try again." };
  }
  refreshMediaAndWindow(id);
  return { ok: true, message: next.status === "wired" ? "The product display is live." : "The photo is updated." };
}

export async function replaceMediaAssetAction(_prev: MediaState, form: FormData): Promise<MediaState> {
  void _prev;
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const id = text(form, "id");
  const file = form.get("photo");
  const fileProblem = checkPhoto(file);
  if (!id) return { ok: false, message: "Choose a photo first." };
  if (fileProblem) return { ok: false, message: fileProblem };
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, message: "Photo uploads are not ready yet. Try again after setup." };
  }

  try {
    const before = await mediaById(id);
    if (!before) return { ok: false, message: "That photo is not in the room." };
    const photo = file as File;
    const ext = extFor(photo);
    const blob = await put(`media/replacements/${id}-${Date.now()}.${ext}`, photo, {
      access: "public",
      addRandomSuffix: false,
    });
    const after: MediaAsset = { ...before, url: blob.url, originalPath: photo.name };
    await getDb()
      .update(schema.mediaAssets)
      .set({ url: blob.url, originalPath: photo.name, updatedAt: sql`now()` })
      .where(eq(schema.mediaAssets.id, id));
    await clearLiveSlot(before);
    await putLiveSlot(after);
    await logAction("replaced a photo", before.title, "the old file stays");
  } catch (e) {
    console.error("[media] photo replace failed", e);
    return { ok: false, message: e instanceof Error && e.message ? e.message : "The file did not upload. Try once more." };
  }
  refreshMediaAndWindow(id);
  return { ok: true, message: "The photo was replaced. The old file stays." };
}

export async function archiveMediaAssetAction(_prev: MediaState, form: FormData): Promise<MediaState> {
  void _prev;
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  const id = text(form, "id");
  if (!id) return { ok: false, message: "Choose a photo first." };
  try {
    const before = await mediaById(id);
    if (!before) return { ok: false, message: "That photo is not in the room." };
    if (before.status === "archived") return { ok: true, message: "Already archived." };
    await getDb()
      .update(schema.mediaAssets)
      .set({ status: "archived", updatedAt: sql`now()` })
      .where(eq(schema.mediaAssets.id, id));
    await clearLiveSlot(before);
    await logAction("archived a photo", before.title, "the file stays");
  } catch (e) {
    console.error("[media] photo archive failed", e);
    return { ok: false, message: "The database did not answer. Try again." };
  }
  refreshMediaAndWindow(id);
  return { ok: true, message: "Archived. The file stays in the room." };
}

export async function importBatch08Action(_prev: MediaState, _form: FormData): Promise<MediaState> {
  void _prev;
  void _form;
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  try {
    const result = await importBatch08Assets();
    await logAction(
      "added prepared photos",
      "Prepared photos",
      `${result.uploaded} added, ${result.skipped} already in the photo room`
    );
    revalidatePath("/admin/media");
    return {
      ok: true,
      message:
        result.uploaded > 0
          ? `${result.uploaded} photos entered the photo room.`
          : "The prepared photos are already in the photo room.",
    };
  } catch (e) {
    console.error("[media] prepared photos import failed", e);
    return { ok: false, message: "The prepared photos could not be added. Try again." };
  }
}

export async function promoteBatch08Action(_prev: MediaState, _form: FormData): Promise<MediaState> {
  void _prev;
  void _form;
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  try {
    const result = await promoteBatch08Assets();
    await logAction(
      "made product photos live",
      "Prepared photos",
      `${result.wired} product displays live, ${result.proofApproved} room examples approved`
    );
    refreshMediaAndWindow();
    return {
      ok: true,
      message: `${result.wired} product displays are live. The kitchen pair stays as a room example.`,
    };
  } catch (e) {
    console.error("[media] prepared photos publish failed", e);
    return { ok: false, message: "Add the prepared photos before making them live." };
  }
}
