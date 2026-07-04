import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import FilterSheet from "./FilterSheet";
import StockStarter from "./StockStarter";
import { HUES, SORTS, makeStockHref, type StockFilters } from "./stock-filters";

/* First colour decides the hue shelf: low saturation is neutral,
   then blue, green, or earth by the wheel. */
function hueOf(colors: string[] | null): string {
  const hex = colors?.[0];
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "neutral";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (max === 0 || d / max < 0.14) return "neutral";
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h >= 170 && h <= 260) return "blue";
  if (h >= 70 && h < 170) return "green";
  return "earth";
}

/* The stockroom, at a glance. Grouped the way the shop floor thinks:
   by range. Two truths per piece, always visible: is it on the site,
   and is it running out. Built for a phone held in one hand. */

export const dynamic = "force-dynamic";

export default async function PiecesPage({
  searchParams,
}: {
  searchParams: Promise<StockFilters>;
}) {
  const filters = await searchParams;
  const db = getDb();
  const ranges = await db.select().from(schema.ranges).orderBy(asc(schema.ranges.sort));
  const rows = await db
    .select({
      piece: schema.pieces,
      stock: schema.stockLevels,
    })
    .from(schema.pieces)
    .leftJoin(schema.stockLevels, eq(schema.stockLevels.pieceSlug, schema.pieces.slug))
    .orderBy(asc(schema.pieces.sort));

  /* One filter truth, computed once: the grid, the tier headings, and
     the empty state all read from the same list, so they can never
     disagree. */
  const familyOf = new Map(ranges.map((r) => [r.slug, r.family]));
  const visible = rows.filter(
    (row) =>
      (!filters.family || familyOf.get(row.piece.rangeSlug) === filters.family) &&
      (!filters.low ||
        (row.stock
          ? row.stock.reorderAt > 0 && row.stock.quantitySheets <= row.stock.reorderAt
          : false)) &&
      (!filters.hue || hueOf(row.piece.colors) === filters.hue)
  );
  const filtering = Boolean(filters.family || filters.low || filters.hue);
  const sort = filters.sort === "name" || filters.sort === "low" ? filters.sort : undefined;

  /* A shop is not handed over empty: while most shelves have never
     been touched (no count, no warn-me-at), the room offers one tap
     of believable starting numbers, his to correct. */
  const untouched = rows.filter(
    (r) => (r.stock?.quantitySheets ?? 0) === 0 && (r.stock?.reorderAt ?? 0) === 0
  ).length;
  const offerStarter = rows.length > 0 && untouched >= Math.ceil(rows.length * 0.8);

  /* Sorting rearranges inside each range; the shelves themselves
     stay where the shop floor knows them. */
  type Row = (typeof visible)[number];
  const arrange = (items: Row[]) => {
    if (sort === "name") {
      return [...items].sort((a, b) => a.piece.name.localeCompare(b.piece.name));
    }
    if (sort === "low") {
      const qty = (r: Row) => r.stock?.quantitySheets ?? 0;
      const isLow = (r: Row) =>
        r.stock ? r.stock.reorderAt > 0 && qty(r) <= r.stock.reorderAt : false;
      return [...items].sort(
        (a, b) => Number(isLow(b)) - Number(isLow(a)) || qty(a) - qty(b)
      );
    }
    return items;
  };

  return (
    <main>
      {/* Title left, the one gold right; the phone wraps it back
          under the thumb. */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-7">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1 className="font-serif text-display-section mt-3">The book.</h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk" data-tour="drafts">
            Everything you stock. The window shows only what you choose.
            {rows.filter((r) => !r.piece.published).length > 0 &&
              ` ${rows.filter((r) => !r.piece.published).length} waiting off the site.`}
          </p>
        </div>
        <Link href="/admin/pieces/new" className="btn-gold" data-tour="new-piece">
          New piece
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4" data-tour="stockroom">
        <Link href="/admin/ranges" className="link-hair text-dusk text-[13px]">
          The ranges
        </Link>
        <FilterSheet current={filters} />
        <button data-tour-start="stockroom" className="link-hair text-dusk text-[13px]">
          Learn this room
        </button>
      </div>

      {offerStarter && (
        <section className="panel mt-8 max-w-2xl" data-tour="stock-start">
          <p className="font-serif text-[20px]">The shelves are waiting.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Load believable starting counts on every untouched shelf,
            then correct them to your real numbers piece by piece.
            Selling down and restocking both begin here.
          </p>
          <StockStarter />
        </section>
      )}

      {/* The desk sees its filters laid out; the phone keeps them in
          the sheet. Links, so the URL remembers. */}
      <div className="mt-6 hidden flex-wrap items-center gap-2 sm:flex" data-tour="stock-filters">
        <Link href={makeStockHref(filters, { family: undefined })} className={`chip-solid ${!filters.family ? "is-on" : ""}`}>
          All
        </Link>
        <Link href={makeStockHref(filters, { family: "mosaic" })} className={`chip-solid ${filters.family === "mosaic" ? "is-on" : ""}`}>
          Tiles
        </Link>
        <Link href={makeStockHref(filters, { family: "pool" })} className={`chip-solid ${filters.family === "pool" ? "is-on" : ""}`}>
          Materials
        </Link>
        <Link href={makeStockHref(filters, { low: filters.low ? undefined : "1" })} className={`chip-solid ${filters.low ? "is-on" : ""}`}>
          Running low
        </Link>
        <span aria-hidden className="mx-1.5" />
        <span className="flex flex-wrap items-center gap-2" data-tour="stock-hues">
          {HUES.map((h) => (
            <Link
              key={h.key}
              href={makeStockHref(filters, { hue: filters.hue === h.key ? undefined : h.key })}
              aria-label={`${h.label} only`}
              className={`chip-solid ${filters.hue === h.key ? "is-on" : ""}`}
            >
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: h.dot }} />
            </Link>
          ))}
        </span>
        <span aria-hidden className="mx-1.5" />
        <span className="flex flex-wrap items-center gap-2" data-tour="stock-sorts">
          {SORTS.map((s) => (
            <Link
              key={s.label}
              href={makeStockHref(filters, { sort: s.key })}
              className={`chip-solid ${sort === s.key ? "is-on" : ""}`}
            >
              {s.label}
            </Link>
          ))}
        </span>
      </div>

      {[
        { family: "mosaic", title: "The tiles" },
        { family: "pool", title: "The pool materials" },
      ].map((tier) => {
        if (filters.family && filters.family !== tier.family) return null;
        const tierRanges = ranges.filter((r) => r.family === tier.family);
        const tierItems = visible.filter(
          (row) => familyOf.get(row.piece.rangeSlug) === tier.family
        );
        /* A heading never floats over nothing: the tier renders only
           when something survives the filter. */
        if (tierItems.length === 0) return null;
        return (
          <section key={tier.family} className="mt-14">
            <h2 className="font-serif text-[26px]" data-tour="families">{tier.title}</h2>
            {tierRanges.map((r) => {
              const items = arrange(
                tierItems.filter((row) => row.piece.rangeSlug === r.slug)
              );
              if (items.length === 0) return null;
              return (
                <section key={r.slug} className="mt-8">
                  <p className="eyebrow">{r.name}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map(({ piece, stock }) => {
                      const qty = stock?.quantitySheets ?? 0;
                      /* Warn-me-at 0 means he never asked to be warned. */
                      const low = stock ? stock.reorderAt > 0 && qty <= stock.reorderAt : false;
                      return (
                        <Link
                          key={piece.slug}
                          href={`/admin/pieces/${piece.slug}`}
                          data-tour="piece-card"
                          className="panel group block transition-transform duration-300 active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex shrink-0 gap-0.5">
                                {(piece.colors ?? []).slice(0, 4).map((c) => (
                                  <span key={c} className="h-4 w-4 rounded-[4px]" style={{ background: c }} />
                                ))}
                              </span>
                              <p className="truncate font-serif text-[18px] leading-snug transition-colors duration-300 group-hover:text-gold">
                                {piece.name}
                              </p>
                            </div>
                            {!piece.published && (
                              <span className="chip-solid shrink-0">Off the site</span>
                            )}
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-[13px] text-dusk">
                              {qty.toLocaleString()} {piece.unit} in stock
                            </p>
                            {low && (
                              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                                Running low
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </section>
        );
      })}

      {rows.length > 0 && filtering && visible.length === 0 && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">Nothing wears that filter.</p>
          <Link href="/admin/pieces" className="link-hair mt-4 inline-block text-dusk text-[13px]">
            Show everything
          </Link>
        </div>
      )}

      {rows.length === 0 && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">The stockroom is empty.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Run npm run db:seed once, and every piece on the site appears
            here ready to manage.
          </p>
        </div>
      )}
    </main>
  );
}
