import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import RangeForm from "../RangeForm";
import Back from "../../Back";

export const dynamic = "force-dynamic";

export default async function RangeEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [range] = await db.select().from(schema.ranges).where(eq(schema.ranges.slug, slug));
  if (!range) notFound();
  const pieces = await db
    .select({ slug: schema.pieces.slug, name: schema.pieces.name, published: schema.pieces.published })
    .from(schema.pieces)
    .where(eq(schema.pieces.rangeSlug, slug))
    .orderBy(asc(schema.pieces.sort));

  return (
    <main>
      <Back href="/admin/ranges" label="The ranges" />
      <h1 className="font-serif text-display-section mt-6">{range.name}</h1>
      <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-mist">{range.slug}</p>
      <RangeForm range={{ slug: range.slug, name: range.name, line: range.line, family: range.family, sort: range.sort }} />

      <section className="mt-12 max-w-xl">
        <p className="eyebrow">On this shelf</p>
        {pieces.length === 0 && (
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">
            Nothing yet. New pieces choose their shelf when they are made.
          </p>
        )}
        <ul className="mt-4 space-y-2.5">
          {pieces.map((p) => (
            <li key={p.slug} className="flex items-center justify-between gap-4">
              <Link href={`/admin/pieces/${p.slug}`} className="link-hair text-dusk text-[14px]">
                {p.name}
              </Link>
              {!p.published && <span className="chip-solid shrink-0">Off the site</span>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
