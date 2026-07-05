import Image from "next/image";
import Link from "next/link";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import MediaBatchActions from "./MediaBatchActions";

export const dynamic = "force-dynamic";

type MediaFilters = {
  status?: string;
  role?: string;
  batch?: string;
};

const STATUSES = ["draft", "approved", "wired", "archived"] as const;
const ROLES = ["card", "applied", "window", "proof", "contact_sheet"] as const;

type MediaAsset = typeof schema.mediaAssets.$inferSelect;

const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  draft: "Draft",
  approved: "Approved",
  wired: "Live",
  archived: "Archived",
};

const ROLE_LABELS: Record<(typeof ROLES)[number], string> = {
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

function labelStatus(v: string) {
  return STATUS_LABELS[v as (typeof STATUSES)[number]] ?? v.replace(/_/g, " ");
}

function labelRole(v: string) {
  return ROLE_LABELS[v as (typeof ROLES)[number]] ?? v.replace(/_/g, " ");
}

function labelSun(v: string) {
  return SUN_LABELS[v] ?? v.replace(/_/g, " ");
}

function photoTitle(asset: MediaAsset) {
  if (asset.role === "contact_sheet") return "Prepared photo review";
  if (asset.role === "proof") return "Kitchen backsplash room example";
  return asset.title
    .replace(/ card, light$/i, "")
    .replace(/ card, dark$/i, "")
    .replace(/, light$/i, "")
    .replace(/, dark$/i, "");
}

function photoNote(asset: MediaAsset) {
  if (asset.role === "card") return "Product display for the website.";
  if (asset.role === "proof" || asset.role === "applied") return "Room example for the showroom.";
  if (asset.role === "window") return "Window scene for the website.";
  if (asset.role === "contact_sheet") return "Review sheet for the prepared photos.";
  return asset.notes;
}

function href(current: MediaFilters, patch: Partial<MediaFilters>) {
  const next = new URLSearchParams();
  const merged = { ...current, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value) next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/admin/media?${qs}` : "/admin/media";
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<MediaFilters>;
}) {
  const filters = await searchParams;
  const status = STATUSES.find((s) => s === filters.status);
  const role = ROLES.find((r) => r === filters.role);
  const batch = filters.batch === "batch-08" ? "batch-08" : undefined;

  const where: SQL[] = [];
  if (status) where.push(eq(schema.mediaAssets.status, status));
  if (role) where.push(eq(schema.mediaAssets.role, role));
  if (batch) where.push(eq(schema.mediaAssets.batch, batch));

  let rows: {
    asset: typeof schema.mediaAssets.$inferSelect;
    piece: { name: string; slug: string } | null;
  }[] = [];
  let quiet = false;
  try {
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
    rows =
      where.length > 0
        ? await base.where(and(...where)).orderBy(desc(schema.mediaAssets.createdAt))
        : await base.orderBy(desc(schema.mediaAssets.createdAt));
  } catch {
    quiet = true;
  }

  const totals = {
    all: rows.length,
    draft: rows.filter((r) => r.asset.status === "draft").length,
    approved: rows.filter((r) => r.asset.status === "approved").length,
    wired: rows.filter((r) => r.asset.status === "wired").length,
  };

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-7">
        <div>
          <p className="eyebrow">Photos</p>
          <h1 className="font-serif text-display-section mt-3">The photo room.</h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-dusk">
            Product displays, room examples, and showroom photos. Only live
            photos appear on the website.
          </p>
        </div>
        <Link href="/admin/pieces" className="link-hair text-dusk text-[13px]">
          The stockroom
        </Link>
      </div>

      <MediaBatchActions />

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Link href={href(filters, { status: undefined, role: undefined, batch: undefined })} className={`chip-solid ${!status && !role && !batch ? "is-on" : ""}`}>
          All {totals.all}
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={href(filters, { status: status === s ? undefined : s })} className={`chip-solid ${status === s ? "is-on" : ""}`}>
            {labelStatus(s)}
          </Link>
        ))}
        <span aria-hidden className="mx-1.5" />
        {ROLES.map((r) => (
          <Link key={r} href={href(filters, { role: role === r ? undefined : r })} className={`chip-solid ${role === r ? "is-on" : ""}`}>
            {labelRole(r)}
          </Link>
        ))}
        <span aria-hidden className="mx-1.5" />
        <Link href={href(filters, { batch: batch ? undefined : "batch-08" })} className={`chip-solid ${batch ? "is-on" : ""}`}>
          Prepared set
        </Link>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <div className="panel">
          <p className="eyebrow">Draft</p>
          <p className="font-serif mt-3 text-[26px] leading-none">{totals.draft}</p>
        </div>
        <div className="panel">
          <p className="eyebrow">Approved</p>
          <p className="font-serif mt-3 text-[26px] leading-none">{totals.approved}</p>
        </div>
        <div className="panel">
          <p className="eyebrow">Live</p>
          <p className="font-serif mt-3 text-[26px] leading-none">{totals.wired}</p>
        </div>
      </div>

      {quiet && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">The photo room is getting ready.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Refresh in a moment.
          </p>
        </div>
      )}

      {!quiet && rows.length === 0 && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">No photos here yet.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Add prepared photos to begin.
          </p>
        </div>
      )}

      {!quiet && rows.length > 0 && (
        <div className="-mx-5 mt-10 grid gap-x-5 gap-y-10 sm:mx-0 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ asset, piece }) => (
            <article key={asset.id} className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-none bg-shell sm:rounded-[22px]">
                <Image
                  src={asset.url}
                  alt={photoTitle(asset)}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="media-lux object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="px-5 sm:px-0">
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip-solid">{labelStatus(asset.status)}</span>
                  <span className="chip-solid">{labelRole(asset.role)}</span>
                  <span className="chip-solid">{labelSun(asset.sun)}</span>
                </div>
                <h2 className="font-serif mt-3 text-[20px] leading-snug">{photoTitle(asset)}</h2>
                {piece && (
                  <Link href={`/admin/pieces/${piece.slug}`} className="link-hair mt-2 inline-block text-dusk text-[13px]">
                    {piece.name}
                  </Link>
                )}
                {photoNote(asset) && (
                  <p className="mt-3 text-[13px] leading-relaxed text-mist">{photoNote(asset)}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
