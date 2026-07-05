"use server";

import { revalidatePath, updateTag } from "next/cache";
import { hasSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";
import { importBatch08Assets, promoteBatch08Assets } from "@/lib/media-batch-08";

export type MediaState = { ok: boolean; message: string } | null;

function refreshMediaAndWindow() {
  revalidatePath("/admin/media");
  revalidatePath("/admin/pieces");
  revalidatePath("/", "layout");
  updateTag("catalog");
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
