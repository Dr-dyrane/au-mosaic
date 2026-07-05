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
      "imported media",
      "Batch 08",
      `${result.uploaded} uploaded, ${result.skipped} already on the bench`
    );
    revalidatePath("/admin/media");
    return {
      ok: true,
      message:
        result.uploaded > 0
          ? `${result.uploaded} files entered the media room.`
          : "Batch 08 was already in the media room.",
    };
  } catch (e) {
    console.error("[media] Batch 08 import failed", e);
    return { ok: false, message: "Batch 08 could not enter the media room. Check the photo store and try again." };
  }
}

export async function promoteBatch08Action(_prev: MediaState, _form: FormData): Promise<MediaState> {
  void _prev;
  void _form;
  if (!(await hasSession())) return { ok: false, message: "Signed out. Sign in again." };
  try {
    const result = await promoteBatch08Assets();
    await logAction(
      "promoted media",
      "Batch 08",
      `${result.wired} product cards wired, ${result.proofApproved} proof frames approved`
    );
    refreshMediaAndWindow();
    return {
      ok: true,
      message: `${result.wired} product cards wired. The kitchen pair stays proof.`,
    };
  } catch (e) {
    console.error("[media] Batch 08 promotion failed", e);
    return { ok: false, message: "Promote after Batch 08 has entered the room." };
  }
}
