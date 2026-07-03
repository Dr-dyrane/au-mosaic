import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

/* The stockroom, at a glance. Grouped the way the shop floor thinks:
   by range. Two truths per piece, always visible: is it on the site,
   and is it running out. Built for a phone held in one hand. */

export const dynamic = "force-dynamic";

export default async function PiecesPage() {
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
        The book holds everything you stock. The site is the shop window:
        it shows only the pieces you put in it. Tap a piece to change its
        words, photos, stock, or its place in the window.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-8">
        <Link href="/admin/pieces/new" className="btn-gold">
          New piece
        </Link>
        <Link href="/admin/ranges" className="link-hair text-dusk text-[13px]">
          The ranges
        </Link>
      </div>

      {[
        { family: "mosaic", title: "The tiles" },
        { family: "pool", title: "The pool materials" },
      ].map((tier) => {
        const tierRanges = ranges.filter((r) => r.family === tier.family);
        if (tierRanges.length === 0) return null;
        return (
          <section key={tier.family} className="mt-14">
            <h2 className="font-serif text-[26px]">{tier.title}</h2>
            {tierRanges.map((r) => {
              const items = rows.filter((row) => row.piece.rangeSlug === r.slug);
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
