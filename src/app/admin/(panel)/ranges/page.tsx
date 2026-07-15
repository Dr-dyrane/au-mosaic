import Link from "next/link";
import { and, asc, count, eq, isNotNull, isNull } from "drizzle-orm";
import { getDb, schema } from "@/db";
import Back from "../Back";
import { SelectableRow, SelectBar, SelectProvider, SelectToggle } from "../records/select";

/* The shelves of the book. Each range holds pieces; the site shows a
   range only when something published sits on it. */

export const dynamic = "force-dynamic";

export default async function RangesPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const db = getDb();
  const ranges = await db
    .select()
    .from(schema.ranges)
    .where(showArchived ? isNotNull(schema.ranges.archivedAt) : isNull(schema.ranges.archivedAt))
    .orderBy(asc(schema.ranges.sort));
  const counts = await db
    .select({ rangeSlug: schema.pieces.rangeSlug, n: count() })
    .from(schema.pieces)
    .where(isNull(schema.pieces.archivedAt))
    .groupBy(schema.pieces.rangeSlug);
  const published = await db
    .select({ rangeSlug: schema.pieces.rangeSlug, n: count() })
    .from(schema.pieces)
    .where(and(eq(schema.pieces.published, true), isNull(schema.pieces.archivedAt)))
    .groupBy(schema.pieces.rangeSlug);
  const nOf = new Map(counts.map((c) => [c.rangeSlug, c.n]));
  const pOf = new Map(published.map((c) => [c.rangeSlug, c.n]));

  return (
    <main>
      <span
        hidden
        data-admin-action
        data-href="/admin/ranges/new"
        data-label="New range"
        data-room="stock"
      />
      <Back href="/admin/pieces" label="Stock" />
      <p className="eyebrow mt-6">Stock</p>
      <h1 className="font-serif text-display-section mt-3">
        {showArchived ? "Archived shelves." : "Shelves."}
      </h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        {showArchived
          ? "Set aside. Bring back or remove."
          : "The shelves. A range shows when a published piece sits on it."}
      </p>
      <div className="mt-8">
        <Link href="/admin/ranges/new" className="btn-gold admin-page-action">
          New range
        </Link>
      </div>

      <SelectProvider entity="range" archived={showArchived}>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <SelectToggle />
        {showArchived ? (
          <Link href="/admin/ranges" className="link-hair text-dusk text-[12px]">
            Back to open
          </Link>
        ) : (
          <Link href="/admin/ranges?archived=1" className="link-hair text-dusk text-[12px]">
            Archived
          </Link>
        )}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {ranges.map((r) => {
          const total = nOf.get(r.slug) ?? 0;
          const inWindow = pOf.get(r.slug) ?? 0;
          return (
            <SelectableRow
              key={r.slug}
              id={r.slug}
              href={`/admin/ranges/${r.slug}`}
            >
              <p className="font-serif text-[20px] leading-snug transition-colors duration-300 group-hover:text-gold">
                {r.name}
              </p>
              {r.line && <p className="mt-2 text-[14px] leading-relaxed text-dusk">{r.line}</p>}
              <p className="mt-4 text-[12px] uppercase tracking-[0.14em] text-mist">
                {r.family === "pool" ? "Pool materials" : "Mosaic"} · {total} in the book · {inWindow} in the window
              </p>
            </SelectableRow>
          );
        })}
      </div>

      {ranges.length === 0 && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">
            {showArchived ? "Nothing archived." : "No shelves yet."}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            {showArchived
              ? "Ranges you set aside land here."
              : "Create the first range, then add pieces to it."}
          </p>
        </div>
      )}
      <SelectBar />
      </SelectProvider>
    </main>
  );
}
