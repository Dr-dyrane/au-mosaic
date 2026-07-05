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

function label(v: string) {
  return v.replace(/_/g, " ");
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
          <p className="eyebrow">Media</p>
          <h1 className="font-serif text-display-section mt-3">The bench.</h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-dusk">
            Drafts, product cards, proof, and window cinema. The site sees
            only what gets promoted.
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
            {label(s)}
          </Link>
        ))}
        <span aria-hidden className="mx-1.5" />
        {ROLES.map((r) => (
          <Link key={r} href={href(filters, { role: role === r ? undefined : r })} className={`chip-solid ${role === r ? "is-on" : ""}`}>
            {label(r)}
          </Link>
        ))}
        <span aria-hidden className="mx-1.5" />
        <Link href={href(filters, { batch: batch ? undefined : "batch-08" })} className={`chip-solid ${batch ? "is-on" : ""}`}>
          Batch 08
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
          <p className="eyebrow">Wired</p>
          <p className="font-serif mt-3 text-[26px] leading-none">{totals.wired}</p>
        </div>
      </div>

      {quiet && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">The media table is waking.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Refresh after the schema healer runs.
          </p>
        </div>
      )}

      {!quiet && rows.length === 0 && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">Nothing is on the bench yet.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Import Batch 08 to begin.
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
                  alt={asset.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="media-lux object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="px-5 sm:px-0">
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip-solid">{label(asset.status)}</span>
                  <span className="chip-solid">{label(asset.role)}</span>
                  <span className="chip-solid">{asset.sun}</span>
                </div>
                <h2 className="font-serif mt-3 text-[20px] leading-snug">{asset.title}</h2>
                {piece && (
                  <Link href={`/admin/pieces/${piece.slug}`} className="link-hair mt-2 inline-block text-dusk text-[13px]">
                    {piece.name}
                  </Link>
                )}
                {asset.notes && (
                  <p className="mt-3 text-[13px] leading-relaxed text-mist">{asset.notes}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
