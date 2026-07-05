"use client";

import { useActionState, useEffect, useRef } from "react";
import Sentence from "../Sentence";
import { keepValues } from "../keep";
import {
  archiveMediaAssetAction,
  createMediaAssetAction,
  replaceMediaAssetAction,
  updateMediaAssetAction,
  type MediaState,
} from "./actions";

type PieceOption = {
  slug: string;
  name: string;
};

type MediaAssetForm = {
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

export function MediaCreateForm({ pieces }: { pieces: PieceOption[] }) {
  const [state, action, pending] = useActionState<MediaState, FormData>(createMediaAssetAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section id="add-photo" className="panel mt-8 max-w-5xl scroll-mt-8">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
        <div>
          <p className="font-serif text-[20px]">Add a photo.</p>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-dusk">
            Upload once, then decide whether it is a product display, room example, or showroom photo.
          </p>
        </div>
        <Sentence state={state} />
      </div>
      <form ref={formRef} onSubmit={keepValues(action)} className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <label htmlFor="media-title" className={label}>Title</label>
          <input id="media-title" name="title" required placeholder="Gold mosaic column" className={field} />
        </div>
        <div>
          <label htmlFor="media-role" className={label}>Use</label>
          <select id="media-role" name="role" defaultValue="card" className={field}>
            {roles.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="media-sun" className={label}>Light</label>
          <select id="media-sun" name="sun" defaultValue="single" className={field}>
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
        <div className="lg:col-span-2">
          <label htmlFor="media-file" className={label}>Photograph</label>
          <input
            id="media-file"
            type="file"
            name="photo"
            accept="image/*"
            required
            className="file-soft block w-full text-[14px]"
          />
        </div>
        <div className="lg:col-span-3">
          <label htmlFor="media-notes" className={label}>Note</label>
          <textarea id="media-notes" name="notes" rows={2} placeholder="Where this photo belongs." className={field} />
        </div>
        <div className="flex flex-wrap items-center gap-5 lg:col-span-3">
          <button type="submit" disabled={pending} className="btn-gold disabled:opacity-60">
            {pending ? "Adding..." : "Add photo"}
          </button>
        </div>
      </form>
    </section>
  );
}

export function MediaAssetControls({
  asset,
  pieces,
}: {
  asset: MediaAssetForm;
  pieces: PieceOption[];
}) {
  const [updateState, updateAction, updatePending] = useActionState<MediaState, FormData>(updateMediaAssetAction, null);
  const [replaceState, replaceAction, replacePending] = useActionState<MediaState, FormData>(replaceMediaAssetAction, null);
  const [archiveState, archiveAction, archivePending] = useActionState<MediaState, FormData>(archiveMediaAssetAction, null);
  const replaceRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (replaceState?.ok) replaceRef.current?.reset();
  }, [replaceState]);

  return (
    <details className="mt-5 group">
      <summary className="flex list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <span className="link-hair text-dusk text-[13px]">Edit photo</span>
        <span className="text-[12px] text-mist group-open:hidden">Open</span>
        <span className="hidden text-[12px] text-mist group-open:inline">Close</span>
      </summary>
      <div className="mt-5 grid gap-5">
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
            <button type="submit" disabled={updatePending} className="link-hair text-dusk text-[13px] disabled:opacity-60">
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
            <button type="submit" disabled={replacePending} className="link-hair text-dusk text-[13px] disabled:opacity-60">
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
    </details>
  );
}
