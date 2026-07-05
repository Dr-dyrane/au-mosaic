import Link from "next/link";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ADMIN_ACTION_INTENTS } from "@/components/admin-action-intents";
import MediaGrid from "./MediaGrid";
import MediaBatchAction from "./MediaBatchActions";
import { MediaCreateAction } from "./MediaForms";
import { loadMoreMediaRows, type MediaListFilters, type MediaListRow } from "./actions";

export const dynamic = "force-dynamic";

type MediaFilters = {
  status?: string;
  role?: string;
  batch?: string;
};

const STATUSES = ["draft", "approved", "wired", "archived"] as const;
const ROLES = ["card", "applied", "window", "proof", "contact_sheet"] as const;
const MEDIA_PAGE_SIZE = 24;

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

function labelStatus(v: string) {
  return STATUS_LABELS[v as (typeof STATUSES)[number]] ?? v.replace(/_/g, " ");
}

function labelRole(v: string) {
  return ROLE_LABELS[v as (typeof ROLES)[number]] ?? v.replace(/_/g, " ");
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

function asMediaListRow(row: {
  asset: typeof schema.mediaAssets.$inferSelect;
  piece: { name: string; slug: string } | null;
}): MediaListRow {
  return {
    asset: {
      id: row.asset.id,
      url: row.asset.url,
      title: row.asset.title,
      sun: row.asset.sun,
      role: row.asset.role,
      status: row.asset.status,
      pieceSlug: row.asset.pieceSlug,
      notes: row.asset.notes,
    },
    piece: row.piece,
  };
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
  const activeFilters: MediaListFilters = { status, role, batch };

  const where: SQL[] = [];
  if (status) where.push(eq(schema.mediaAssets.status, status));
  if (role) where.push(eq(schema.mediaAssets.role, role));
  if (batch) where.push(eq(schema.mediaAssets.batch, batch));

  let rows: MediaListRow[] = [];
  let initialDone = true;
  let pieces: { slug: string; name: string }[] = [];
  let quiet = false;
  let totals = {
    all: 0,
    draft: 0,
    approved: 0,
    wired: 0,
  };
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
    const query = where.length > 0 ? base.where(and(...where)) : base;
    const firstPage = await query
      .orderBy(desc(schema.mediaAssets.createdAt), desc(schema.mediaAssets.id))
      .limit(MEDIA_PAGE_SIZE + 1);
    rows = firstPage.slice(0, MEDIA_PAGE_SIZE).map(asMediaListRow);
    initialDone = firstPage.length <= MEDIA_PAGE_SIZE;

    const tallyBase = getDb()
      .select({
        all: sql<number>`count(*)::int`,
        draft: sql<number>`sum(case when ${schema.mediaAssets.status} = 'draft' then 1 else 0 end)::int`,
        approved: sql<number>`sum(case when ${schema.mediaAssets.status} = 'approved' then 1 else 0 end)::int`,
        wired: sql<number>`sum(case when ${schema.mediaAssets.status} = 'wired' then 1 else 0 end)::int`,
      })
      .from(schema.mediaAssets);
    const tallyQuery = where.length > 0 ? tallyBase.where(and(...where)) : tallyBase;
    const [tally] = await tallyQuery;
    totals = {
      all: Number(tally?.all ?? 0),
      draft: Number(tally?.draft ?? 0),
      approved: Number(tally?.approved ?? 0),
      wired: Number(tally?.wired ?? 0),
    };
  } catch {
    quiet = true;
  }
  try {
    pieces = await getDb()
      .select({ slug: schema.pieces.slug, name: schema.pieces.name })
      .from(schema.pieces)
      .orderBy(asc(schema.pieces.name));
  } catch {}

  return (
    <main>
      {!quiet && (
        <>
          <span
            hidden
            data-admin-action
            data-href="#media-add-photo"
            data-label="Add photo"
            data-room="photos"
            data-intent={ADMIN_ACTION_INTENTS.mediaCreate}
          />
          <MediaCreateAction pieces={pieces} />
          <MediaBatchAction />
        </>
      )}

      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-7">
        <div>
          <p className="eyebrow">Photos</p>
          <h1 className="font-serif text-display-section mt-3">The photo room.</h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-dusk">
            Product displays, room examples, and showroom photos. Only live
            photos appear on the website.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <Link href="/admin/pieces" className="link-hair text-dusk text-[12px]">
            The stockroom
          </Link>
        </div>
      </div>

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
        <MediaGrid
          key={`${status ?? ""}-${role ?? ""}-${batch ?? ""}`}
          initial={rows}
          initialDone={initialDone}
          loadMore={loadMoreMediaRows.bind(null, activeFilters)}
          pieces={pieces}
        />
      )}
    </main>
  );
}
