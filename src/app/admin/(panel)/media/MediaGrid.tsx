"use client";

import Image from "next/image";
import Link from "next/link";
import AdminPhotoViewer from "@/components/AdminPhotoViewer";
import InfiniteList, { type Batch } from "@/components/InfiniteList";
import { MediaAssetControls, type PieceOption } from "./MediaForms";
import type { MediaListRow } from "./media-list";
import { labelStatus } from "./media-filter-model";
import { RowCheckbox, useSelect } from "../records/select";

const ROLE_LABELS: Record<string, string> = {
  card: "Product display",
  applied: "Room example",
  window: "Window scene",
  proof: "Showroom photo",
  contact_sheet: "Review sheet",
};

const SUN_LABELS: Record<string, string> = {
  day: "Day",
  night: "Night",
  single: "No pair",
};

function labelRole(value: string) {
  return ROLE_LABELS[value] ?? value.replace(/_/g, " ");
}

function labelSun(value: string) {
  return SUN_LABELS[value] ?? value.replace(/_/g, " ");
}

function photoViewSources(asset: MediaListRow["asset"]) {
  const twin = asset.twin;
  if (!twin) return { src: asset.url, srcDay: undefined };
  if (asset.sun === "day" && twin.sun === "night") {
    return { src: twin.url, srcDay: asset.url };
  }
  if (asset.sun === "night" && twin.sun === "day") {
    return { src: asset.url, srcDay: twin.url };
  }
  return { src: asset.url, srcDay: undefined };
}

function photoTitle(asset: MediaListRow["asset"]) {
  if (asset.role === "contact_sheet") return "Prepared photo review";
  if (asset.role === "proof") return "Kitchen backsplash room example";
  return asset.title
    .replace(/ card, light$/i, "")
    .replace(/ card, dark$/i, "")
    .replace(/, light$/i, "")
    .replace(/, dark$/i, "");
}

function photoNote(asset: MediaListRow["asset"]) {
  if (asset.role === "card") return "Product display for the website.";
  if (asset.role === "proof" || asset.role === "applied") return "Room example for the showroom.";
  if (asset.role === "window") return "Window scene for the website.";
  if (asset.role === "contact_sheet") return "Review sheet for the prepared photos.";
  return asset.notes;
}

function PhotoCard({
  row,
  pieces,
}: {
  row: MediaListRow;
  pieces: PieceOption[];
}) {
  const { asset, piece } = row;
  const title = photoTitle(asset);
  const note = photoNote(asset);
  const preview = photoViewSources(asset);
  const { mode, selected, toggle } = useSelect();
  const on = selected.has(asset.id);
  const meta = (
    <div className="px-5 sm:px-0">
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="chip-solid">{labelStatus(asset.status)}</span>
        <span className="chip-solid">{labelRole(asset.role)}</span>
        <span className="chip-solid">{labelSun(asset.sun)}</span>
      </div>
      <h2 className="font-serif mt-3 text-[20px] leading-snug">{title}</h2>
      {piece && (
        mode ? (
          <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-dusk">{piece.name}</p>
        ) : (
          <Link href={`/admin/pieces/${piece.slug}`} className="link-hair mt-2 inline-block text-dusk text-[12px]">
            {piece.name}
          </Link>
        )
      )}
      {note && (
        <p className="mt-3 text-[14px] leading-relaxed text-mist">{note}</p>
      )}
      {!mode && (
        <MediaAssetControls
          asset={{
            id: asset.id,
            title: asset.title,
            status: asset.status,
            role: asset.role,
            sun: asset.sun,
            pieceSlug: asset.pieceSlug,
            notes: asset.notes,
          }}
          pieces={pieces}
        />
      )}
    </div>
  );

  if (mode) {
    return (
      <button
        type="button"
        onClick={() => toggle(asset.id)}
        aria-pressed={on}
        className="group w-full text-left transition-transform duration-300 active:scale-[0.99]"
      >
        <div className="flex items-start gap-3">
          <RowCheckbox id={asset.id} />
          <div className="min-w-0 flex-1">
            <div className="photo-slot relative block aspect-[4/5] w-full overflow-hidden rounded-none sm:rounded-[22px]">
              <Image
                src={asset.url}
                alt={title}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="media-lux object-cover"
              />
            </div>
            {meta}
          </div>
        </div>
      </button>
    );
  }

  return (
    <article className="group">
      <AdminPhotoViewer
        src={preview.src}
        srcDay={preview.srcDay}
        alt={title}
        title={title}
        eyebrow={labelRole(asset.role)}
        description={note || undefined}
        triggerClassName="photo-slot relative block aspect-[4/5] w-full overflow-hidden rounded-none sm:rounded-[22px]"
        actions={[
          { label: "Edit photo", href: `/admin/media/${asset.id}` },
          ...(asset.twin
            ? [{ label: `Edit ${labelSun(asset.twin.sun).toLowerCase()} photo`, href: `/admin/media/${asset.twin.id}` }]
            : []),
          ...(piece ? [{ label: piece.name, href: `/admin/pieces/${piece.slug}` }] : []),
        ]}
      >
        <Image
          src={asset.url}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="media-lux object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </AdminPhotoViewer>
      {meta}
    </article>
  );
}

function PhotoSkeleton({ index }: { index: number }) {
  return (
    <article aria-hidden key={index}>
      <div className="skel aspect-[4/5] rounded-none sm:rounded-[22px]" />
      <div className="px-5 pt-5 sm:px-0">
        <div className="skel h-6 w-40 rounded-full" />
        <div className="skel mt-4 h-7 w-56 rounded-full" />
        <div className="skel mt-4 h-16 w-full rounded-[22px]" />
      </div>
    </article>
  );
}

export default function MediaGrid({
  initial,
  initialDone,
  loadMore,
  pieces,
}: {
  initial: MediaListRow[];
  initialDone: boolean;
  loadMore: (offset: number) => Promise<Batch<MediaListRow>>;
  pieces: PieceOption[];
}) {
  return (
    <InfiniteList
      initial={initial}
      initialDone={initialDone}
      loadMore={loadMore}
      className="-mx-5 mt-10 grid gap-x-5 gap-y-10 sm:mx-0 sm:grid-cols-2 lg:grid-cols-3"
      skeletonCount={6}
      renderItem={(row) => <PhotoCard key={row.asset.id} row={row} pieces={pieces} />}
      renderSkeleton={(index) => <PhotoSkeleton key={index} index={index} />}
    />
  );
}
