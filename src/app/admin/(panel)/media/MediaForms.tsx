"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import AdminSheet from "@/components/AdminSheet";
import { ADMIN_ACTION_INTENTS } from "@/components/admin-action-intents";
import { useAdminSurface } from "@/components/admin-surface-router";
import Sentence from "../Sentence";
import { keepValues } from "../keep";
import {
  archiveMediaAssetAction,
  createMediaAssetAction,
  replaceMediaAssetAction,
  updateMediaAssetAction,
  type MediaState,
} from "./actions";

export type PieceOption = {
  slug: string;
  name: string;
};

export type MediaAssetForm = {
  id: string;
  title: string;
  status: string;
  role: string;
  sun: string;
  pieceSlug: string | null;
  notes: string;
};

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[14px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";
const label = "eyebrow mb-2.5 block";

const statuses = [
  ["draft", "Draft"],
  ["approved", "Approved"],
  ["wired", "Live"],
  ["archived", "Archived"],
] as const;

const roles = [
  ["card", "Product display"],
  ["applied", "Room example"],
  ["window", "Window scene"],
  ["proof", "Showroom photo"],
  ["contact_sheet", "Review sheet"],
] as const;

const suns = [
  ["night", "Night"],
  ["day", "Day"],
  ["single", "Single"],
] as const;

function PieceSelect({ pieces, current }: { pieces: PieceOption[]; current?: string | null }) {
  return (
    <select name="pieceSlug" defaultValue={current ?? ""} className={field} aria-label="Linked piece">
      <option value="">No piece</option>
      {pieces.map((piece) => (
        <option key={piece.slug} value={piece.slug}>
          {piece.name}
        </option>
      ))}
    </select>
  );
}

export function MediaCreateForm({
  pieces,
  surface = "panel",
  showIntro = true,
  idPrefix = "media",
}: {
  pieces: PieceOption[];
  surface?: "panel" | "plain";
  showIntro?: boolean;
  idPrefix?: string;
}) {
  const [state, action, pending] = useActionState<MediaState, FormData>(createMediaAssetAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const plain = surface === "plain";
  const formGrid = `${showIntro ? "mt-6" : ""} grid gap-5 ${plain ? "" : "lg:grid-cols-[1.2fr_1fr_1fr]"}`;
  const twoWide = plain ? "" : "lg:col-span-2";
  const fullWide = plain ? "" : "lg:col-span-3";

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section id={plain ? undefined : "add-photo"} className={plain ? "scroll-mt-8" : "panel mt-8 max-w-5xl scroll-mt-8"}>
      {showIntro ? (
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
          <div>
            <p className="font-serif text-[20px]">Add a photo.</p>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-dusk">
              Upload once, then decide whether it is a product display, room example, or showroom photo.
            </p>
          </div>
          <Sentence state={state} />
        </div>
      ) : (
        <Sentence state={state} />
      )}
      <form ref={formRef} onSubmit={keepValues(action)} className={formGrid}>
        <div>
          <label htmlFor={`${idPrefix}-title`} className={label}>Title</label>
          <input id={`${idPrefix}-title`} name="title" required placeholder="Gold mosaic column" className={field} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-role`} className={label}>Use</label>
          <select id={`${idPrefix}-role`} name="role" defaultValue="card" className={field}>
            {roles.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-sun`} className={label}>Light</label>
          <select id={`${idPrefix}-sun`} name="sun" defaultValue="single" className={field}>
            {suns.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Piece</label>
          <PieceSelect pieces={pieces} />
        </div>
        <div className={twoWide}>
          <label htmlFor={`${idPrefix}-file`} className={label}>Photograph</label>
          <input
            id={`${idPrefix}-file`}
            type="file"
            name="photo"
            accept="image/*"
            required
            className="file-soft block w-full text-[14px]"
          />
        </div>
        <div className={fullWide}>
          <label htmlFor={`${idPrefix}-notes`} className={label}>Note</label>
          <textarea id={`${idPrefix}-notes`} name="notes" rows={2} placeholder="Where this photo belongs." className={field} />
        </div>
        <div className={`flex flex-wrap items-center gap-5 ${fullWide}`}>
          <button type="submit" disabled={pending} className="btn-gold disabled:opacity-60">
            {pending ? "Adding..." : "Add photo"}
          </button>
        </div>
      </form>
    </section>
  );
}

export function MediaCreateAction({ pieces }: { pieces: PieceOption[] }) {
  const surface = useAdminSurface(
    { kind: "media-create", pieces },
    { id: "media-add-photo", intent: ADMIN_ACTION_INTENTS.mediaCreate }
  );

  return (
    <AdminSheet
      open={surface.sheetOpen}
      onOpenChange={surface.setSheetOpen}
      title="Add photo"
      description="Upload once, then decide where it belongs."
      id="media-add-photo"
    >
      <MediaCreateForm pieces={pieces} surface="plain" showIntro={false} idPrefix="media-sheet" />
    </AdminSheet>
  );
}

export function MediaAssetControls({
  asset,
}: {
  asset: MediaAssetForm;
  pieces: PieceOption[];
}) {
  const href = `/admin/media/${asset.id}`;

  return (
    <Link href={href} className="link-hair mt-5 inline-block text-dusk text-[12px]">
      Edit photo
    </Link>
  );
}

export function MediaAssetEditor({
  asset,
  pieces,
  fullHref,
}: {
  asset: MediaAssetForm;
  pieces: PieceOption[];
  fullHref?: string;
}) {
  const [updateState, updateAction, updatePending] = useActionState<MediaState, FormData>(updateMediaAssetAction, null);
  const [replaceState, replaceAction, replacePending] = useActionState<MediaState, FormData>(replaceMediaAssetAction, null);
  const [archiveState, archiveAction, archivePending] = useActionState<MediaState, FormData>(archiveMediaAssetAction, null);
  const replaceRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (replaceState?.ok) replaceRef.current?.reset();
  }, [replaceState]);

  return (
    <div className="grid gap-5">
      {fullHref && (
        <Link href={fullHref} className="link-hair justify-self-start text-dusk text-[12px]">
          Open page
        </Link>
      )}
      <form onSubmit={keepValues(updateAction)} className="grid gap-5">
        <input type="hidden" name="id" value={asset.id} />
        <div>
          <label htmlFor={`title-${asset.id}`} className={label}>Title</label>
          <input id={`title-${asset.id}`} name="title" defaultValue={asset.title} required className={field} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`status-${asset.id}`} className={label}>Status</label>
            <select id={`status-${asset.id}`} name="status" defaultValue={asset.status} className={field}>
              {statuses.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`role-${asset.id}`} className={label}>Use</label>
            <select id={`role-${asset.id}`} name="role" defaultValue={asset.role} className={field}>
              {roles.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`sun-${asset.id}`} className={label}>Light</label>
            <select id={`sun-${asset.id}`} name="sun" defaultValue={asset.sun} className={field}>
              {suns.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Piece</label>
            <PieceSelect pieces={pieces} current={asset.pieceSlug} />
          </div>
        </div>
        <div>
          <label htmlFor={`notes-${asset.id}`} className={label}>Note</label>
          <textarea id={`notes-${asset.id}`} name="notes" rows={3} defaultValue={asset.notes} className={field} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={updatePending} className="link-hair text-dusk text-[12px] disabled:opacity-60">
            {updatePending ? "Saving..." : "Save details"}
          </button>
          <Sentence state={updateState} />
        </div>
      </form>

      <form ref={replaceRef} onSubmit={keepValues(replaceAction)} className="grid gap-3">
        <input type="hidden" name="id" value={asset.id} />
        <label htmlFor={`replace-${asset.id}`} className={label}>Replace file</label>
        <input
          id={`replace-${asset.id}`}
          type="file"
          name="photo"
          accept="image/*"
          className="file-soft block w-full text-[14px]"
        />
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={replacePending} className="link-hair text-dusk text-[12px] disabled:opacity-60">
            {replacePending ? "Replacing..." : "Replace photo"}
          </button>
          <Sentence state={replaceState} />
        </div>
      </form>

      {asset.status !== "archived" && (
        <form action={archiveAction} className="flex flex-wrap items-center gap-4">
          <input type="hidden" name="id" value={asset.id} />
          <button type="submit" disabled={archivePending} className="link-hair text-mist text-[12px] disabled:opacity-60">
            {archivePending ? "Archiving..." : "Archive photo"}
          </button>
          <Sentence state={archiveState} />
        </form>
      )}
    </div>
  );
}
