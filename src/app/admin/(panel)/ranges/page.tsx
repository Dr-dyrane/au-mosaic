import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import Back from "../Back";

/* The shelves of the book. Each range holds pieces; the site shows a
   range only when something published sits on it. */

export const dynamic = "force-dynamic";

export default async function RangesPage() {
  const db = getDb();
  const ranges = await db.select().from(schema.ranges).orderBy(asc(schema.ranges.sort));
  const counts = await db
    .select({ rangeSlug: schema.pieces.rangeSlug, n: count() })
    .from(schema.pieces)
    .groupBy(schema.pieces.rangeSlug);
  const published = await db
    .select({ rangeSlug: schema.pieces.rangeSlug, n: count() })
    .from(schema.pieces)
    .where(eq(schema.pieces.published, true))
    .groupBy(schema.pieces.rangeSlug);
  const nOf = new Map(counts.map((c) => [c.rangeSlug, c.n]));
  const pOf = new Map(published.map((c) => [c.rangeSlug, c.n]));

  return (
    <main>
      <Back href="/admin/pieces" label="The stockroom" />
      <p className="eyebrow mt-6">Inventory</p>
      <h1 className="font-serif text-display-section mt-3">The ranges.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        The shelves of the book. A range appears in the shop window only
        when it holds a piece that is on the site.
      </p>
      <div className="mt-8">
        <Link href="/admin/ranges/new" className="btn-gold">
          New range
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {ranges.map((r) => {
          const total = nOf.get(r.slug) ?? 0;
          const inWindow = pOf.get(r.slug) ?? 0;
          return (
            <Link
              key={r.slug}
              href={`/admin/ranges/${r.slug}`}
              className="panel group block transition-transform duration-300 active:scale-[0.99]"
            >
              <p className="font-serif text-[18px] leading-snug transition-colors duration-300 group-hover:text-gold">
                {r.name}
              </p>
              {r.line && <p className="mt-2 text-[13px] leading-relaxed text-dusk">{r.line}</p>}
              <p className="mt-4 text-[12px] uppercase tracking-[0.14em] text-mist">
                {r.family === "pool" ? "Pool materials" : "Mosaic"} · {total} in the book · {inWindow} in the window
              </p>
            </Link>
          );
        })}
      </div>

      {ranges.length === 0 && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">No shelves yet.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Create the first range, then add pieces to it.
          </p>
        </div>
      )}
    </main>
  );
}
