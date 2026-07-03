import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import NewPieceForm from "./NewPieceForm";

export const dynamic = "force-dynamic";

export default async function NewPiecePage() {
  const ranges = await getDb()
    .select({ slug: schema.ranges.slug, name: schema.ranges.name })
    .from(schema.ranges)
    .orderBy(asc(schema.ranges.sort));

  return (
    <main>
      <Link href="/admin/pieces" className="link-hair text-dusk text-[13px]">
        The stockroom
      </Link>
      <h1 className="font-serif text-display-section mt-6">A new piece.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        It enters the book first. Photos, story, stock, and the window
        come on its record page.
      </p>
      {ranges.length === 0 ? (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">It needs a shelf first.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Create a range, then the piece has somewhere to live.
          </p>
          <Link href="/admin/ranges/new" className="link-hair mt-5 inline-block text-dusk text-[13px]">
            New range
          </Link>
        </div>
      ) : (
        <NewPieceForm ranges={ranges} />
      )}
    </main>
  );
}
