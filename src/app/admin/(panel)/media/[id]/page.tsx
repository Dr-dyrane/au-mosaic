import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import AdminPhotoViewer from "@/components/AdminPhotoViewer";
import Back from "../../Back";
import { MediaAssetEditor } from "../MediaForms";
import { mediaPairKey } from "../media-list";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  approved: "Approved",
  wired: "Live",
  archived: "Archived",
};

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
  single: "Single",
};

function label(map: Record<string, string>, value: string) {
  return map[value] ?? value.replace(/_/g, " ");
}

function photoViewSources(asset: typeof schema.mediaAssets.$inferSelect, twin?: typeof schema.mediaAssets.$inferSelect) {
  if (!twin) return { src: asset.url, srcDay: undefined };
  if (asset.sun === "day" && twin.sun === "night") {
    return { src: twin.url, srcDay: asset.url };
  }
  if (asset.sun === "night" && twin.sun === "day") {
    return { src: asset.url, srcDay: twin.url };
  }
  return { src: asset.url, srcDay: undefined };
}

function photoTwinWhere(asset: typeof schema.mediaAssets.$inferSelect): SQL[] {
  const where = [
    eq(schema.mediaAssets.role, asset.role),
    eq(schema.mediaAssets.batch, asset.batch),
  ];
  where.push(
    asset.pieceSlug
      ? eq(schema.mediaAssets.pieceSlug, asset.pieceSlug)
      : isNull(schema.mediaAssets.pieceSlug),
  );
  return where;
}

export default async function MediaAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const db = getDb();
  const [asset] = await db
    .select()
    .from(schema.mediaAssets)
    .where(eq(schema.mediaAssets.id, id))
    .limit(1);
  if (!asset) notFound();

  const pieces = await db
    .select({ slug: schema.pieces.slug, name: schema.pieces.name })
    .from(schema.pieces)
    .orderBy(asc(schema.pieces.name));
  const connectedPiece = pieces.find((piece) => piece.slug === asset.pieceSlug);
  const candidates = await db
    .select()
    .from(schema.mediaAssets)
    .where(and(...photoTwinWhere(asset)));
  const pairKey = mediaPairKey(asset);
  const twin = candidates.find(
    (candidate) =>
      candidate.id !== asset.id &&
      candidate.sun !== asset.sun &&
      (candidate.sun === "day" || candidate.sun === "night") &&
      mediaPairKey(candidate) === pairKey,
  );
  const preview = photoViewSources(asset, twin);

  return (
    <main>
      <Back href="/admin/media" label="All photos" />
      <div className="mt-6 grid max-w-5xl gap-8 xl:grid-cols-[0.85fr_1fr]">
        <section>
          <p className="eyebrow">Photo</p>
          <h1 className="font-serif text-display-section mt-3">{asset.title}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="chip-solid">{label(STATUS_LABELS, asset.status)}</span>
            <span className="chip-solid">{label(ROLE_LABELS, asset.role)}</span>
            <span className="chip-solid">{label(SUN_LABELS, asset.sun)}</span>
          </div>
          {connectedPiece && (
            <Link
              href={`/admin/pieces/${connectedPiece.slug}`}
              className="link-hair mt-5 inline-block text-dusk text-[12px]"
            >
              {connectedPiece.name}
            </Link>
          )}
          <AdminPhotoViewer
            src={preview.src}
            srcDay={preview.srcDay}
            alt={asset.title}
            title={asset.title}
            eyebrow={label(ROLE_LABELS, asset.role)}
            description={asset.notes || undefined}
            triggerClassName="photo-slot relative mt-8 block aspect-[4/5] w-full overflow-hidden rounded-[26px]"
            actions={[
              { label: "All photos", href: "/admin/media" },
              ...(twin ? [{ label: `Edit ${label(SUN_LABELS, twin.sun).toLowerCase()} photo`, href: `/admin/media/${twin.id}` }] : []),
              ...(connectedPiece ? [{ label: connectedPiece.name, href: `/admin/pieces/${connectedPiece.slug}` }] : []),
            ]}
          >
            <Image
              src={asset.url}
              alt={asset.title}
              fill
              sizes="(max-width: 1279px) 100vw, 38vw"
              className="media-lux object-cover"
              priority
            />
          </AdminPhotoViewer>
        </section>
        <section className="panel self-start">
          <p className="font-serif text-[20px]">Edit photo.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Keep the title, use, light, and connected piece true.
          </p>
          <div className="mt-6">
            <MediaAssetEditor
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
          </div>
        </section>
      </div>
    </main>
  );
}
