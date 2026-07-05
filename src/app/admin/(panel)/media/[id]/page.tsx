import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import AdminPhotoViewer from "@/components/AdminPhotoViewer";
import Back from "../../Back";
import { MediaAssetEditor } from "../MediaForms";

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
            src={asset.url}
            alt={asset.title}
            title={asset.title}
            eyebrow={label(ROLE_LABELS, asset.role)}
            description={asset.notes || undefined}
            triggerClassName="photo-slot relative mt-8 block aspect-[4/5] w-full overflow-hidden rounded-[26px]"
            actions={[
              { label: "All photos", href: "/admin/media" },
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
