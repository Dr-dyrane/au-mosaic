import Link from "next/link";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ADMIN_ACTION_INTENTS } from "@/components/admin-action-intents";
import MediaGrid from "./MediaGrid";
import MediaBatchAction from "./MediaBatchActions";
import { MediaCreateAction } from "./MediaForms";
import { loadMoreMediaRows, type MediaListFilters } from "./actions";
import MediaFilterSheet from "./MediaFilterSheet";
import { asMediaListRows, type MediaListRow } from "./media-list";
import {
  ROLES,
  STATUSES,
  activeMediaFilterLabels,
  type MediaFilterTotals,
  type MediaFilters,
} from "./media-filter-model";
import { SelectBar, SelectProvider, SelectToggle } from "../records/select";

export const dynamic = "force-dynamic";

const MEDIA_PAGE_SIZE = 24;

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
  let totals: MediaFilterTotals = {
    all: 0,
    draft: 0,
    approved: 0,
    wired: 0,
    archived: 0,
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
    rows = asMediaListRows(firstPage).slice(0, MEDIA_PAGE_SIZE);
    initialDone = firstPage.length <= MEDIA_PAGE_SIZE;

    const tallyBase = getDb()
      .select({
        all: sql<number>`count(*)::int`,
        draft: sql<number>`sum(case when ${schema.mediaAssets.status} = 'draft' then 1 else 0 end)::int`,
        approved: sql<number>`sum(case when ${schema.mediaAssets.status} = 'approved' then 1 else 0 end)::int`,
        wired: sql<number>`sum(case when ${schema.mediaAssets.status} = 'wired' then 1 else 0 end)::int`,
        archived: sql<number>`sum(case when ${schema.mediaAssets.status} = 'archived' then 1 else 0 end)::int`,
      })
      .from(schema.mediaAssets);
    const [tally] = await tallyBase;
    totals = {
      all: Number(tally?.all ?? 0),
      draft: Number(tally?.draft ?? 0),
      approved: Number(tally?.approved ?? 0),
      wired: Number(tally?.wired ?? 0),
      archived: Number(tally?.archived ?? 0),
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
  const activeLabels = activeMediaFilterLabels(activeFilters);

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
        <div className="hidden flex-wrap items-center gap-x-6 gap-y-4 sm:flex">
          <Link href="/admin/pieces" className="link-hair text-dusk text-[12px]">
            The stockroom
          </Link>
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

      {!quiet && (
        <SelectProvider entity="media" archived={status === "archived"}>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4" data-tour="media-filters">
            <MediaFilterSheet current={activeFilters} totals={totals} />
            <SelectToggle />
            {status === "archived" ? (
              <Link href="/admin/media" className="link-hair text-dusk text-[12px]">
                Back to open
              </Link>
            ) : (
              <Link href="/admin/media?status=archived" className="link-hair text-dusk text-[12px]">
                Archived
              </Link>
            )}
            {activeLabels.length > 0 && (
              <p className="text-[14px] leading-relaxed text-dusk">
                Showing <span className="text-ink">{activeLabels.join(" / ")}</span>
                <Link href="/admin/media" className="link-hair ml-4 text-dusk text-[12px]">
                  Clear
                </Link>
              </p>
            )}
          </div>

          <div className="mt-6 hidden gap-5 xl:grid xl:grid-cols-3">
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

          {rows.length === 0 && (
            <div className="panel mt-10 max-w-md">
              <p className="font-serif text-[20px]">
                {status === "archived" ? "Nothing archived." : "No photos here yet."}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-dusk">
                {status === "archived" ? "Photos you set aside land here." : "Upload once, then decide whether it is a product display, room example, or showroom photo."}
              </p>
            </div>
          )}

          {rows.length > 0 && (
          <MediaGrid
            key={`${status ?? ""}-${role ?? ""}-${batch ?? ""}`}
            initial={rows}
            initialDone={initialDone}
            loadMore={loadMoreMediaRows.bind(null, activeFilters)}
            pieces={pieces}
          />
          )}
          <SelectBar />
        </SelectProvider>
      )}
    </main>
  );
}
