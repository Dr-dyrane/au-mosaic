import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import FilterSheet, { HUES, makeStockHref, type StockFilters } from "./FilterSheet";

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

  return (
    <main>
      <p className="eyebrow">Inventory</p>
      <h1 className="font-serif text-display-section mt-3">The book.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Everything you stock. The window shows only what you choose.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Link href="/admin/pieces/new" className="btn-gold">
          New piece
        </Link>
        <Link href="/admin/ranges" className="link-hair text-dusk text-[13px]">
          The ranges
        </Link>
        <FilterSheet current={filters} />
      </div>

      {/* The desk sees its filters laid out; the phone keeps them in
          the sheet. Links, so the URL remembers. */}
      <div className="mt-6 hidden flex-wrap items-center gap-2 sm:flex">
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
        <span aria-hidden className="mx-1 h-5 w-px bg-shell" />
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
      </div>

      {[
        { family: "mosaic", title: "The tiles" },
        { family: "pool", title: "The pool materials" },
      ].map((tier) => {
        if (filters.family && filters.family !== tier.family) return null;
        const tierRanges = ranges.filter((r) => r.family === tier.family);
        if (tierRanges.length === 0) return null;
        return (
          <section key={tier.family} className="mt-14">
            <h2 className="font-serif text-[26px]">{tier.title}</h2>
            {tierRanges.map((r) => {
              const items = rows.filter(
                (row) =>
                  row.piece.rangeSlug === r.slug &&
                  (!filters.low ||
                    (row.stock ? row.stock.quantitySheets <= row.stock.reorderAt : false)) &&
                  (!filters.hue || hueOf(row.piece.colors) === filters.hue)
              );
              if (items.length === 0) return null;
              return (
                <section key={r.slug} className="mt-8">
                  <p className="eyebrow">{r.name}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {items.map(({ piece, stock }) => {
                const qty = stock?.quantitySheets ?? 0;
                const low = stock ? qty <= stock.reorderAt : false;
                return (
                  <Link
                    key={piece.slug}
                    href={`/admin/pieces/${piece.slug}`}
                    className="panel group block transition-transform duration-300 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex gap-0.5">
                          {(piece.colors ?? []).slice(0, 4).map((c) => (
                            <span key={c} className="h-4 w-4 rounded-[4px]" style={{ background: c }} />
                          ))}
                        </span>
                        <p className="font-serif text-[18px] leading-snug transition-colors duration-300 group-hover:text-gold">
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

      {rows.length > 0 &&
        (filters.family || filters.low || filters.hue) &&
        rows.filter(
          (row) =>
            (!filters.family ||
              ranges.find((r) => r.slug === row.piece.rangeSlug)?.family === filters.family) &&
            (!filters.low ||
              (row.stock ? row.stock.quantitySheets <= row.stock.reorderAt : false)) &&
            (!filters.hue || hueOf(row.piece.colors) === filters.hue)
        ).length === 0 && (
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
