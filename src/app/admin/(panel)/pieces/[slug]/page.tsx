import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import PieceForm from "./PieceForm";
import PhotoPanel from "./PhotoPanel";
import Back from "../../Back";
import { Touch } from "../../touched";

export const dynamic = "force-dynamic";

export default async function PieceEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [piece] = await db.select().from(schema.pieces).where(eq(schema.pieces.slug, slug));
  if (!piece) notFound();
  const [stock] = await db
    .select()
    .from(schema.stockLevels)
    .where(eq(schema.stockLevels.pieceSlug, slug));

  return (
    <main>
      <Back href="/admin/pieces" label="All pieces" />
      <h1 className="font-serif text-display-section mt-6">{piece.name}</h1>
      <Touch href={`/admin/pieces/${piece.slug}`} label={piece.name} room="Stockroom" />
      <p className="mt-2 text-[13px] uppercase tracking-[0.14em] text-mist">
        {piece.slug} · lives at /piece/{piece.slug}
      </p>
      {/* A record with a face: on the desk the face holds the left
          column and the facts the right, side by side the way he
          reads them. The phone keeps its single file. */}
      <div className="mt-8 grid max-w-3xl items-start gap-8 xl:max-w-none xl:grid-cols-2 xl:gap-10">
      <PhotoPanel
        slug={piece.slug}
        name={piece.name}
        line={piece.line}
        imageNight={piece.imageNight}
        imageDay={piece.imageDay}
      />
      <PieceForm
        piece={{
          slug: piece.slug,
          name: piece.name,
          line: piece.line,
          story: piece.story,
          priceNote: piece.priceNote,
          colors: piece.colors ?? [],
          seedSize: piece.seedSize ?? "",
          shade: piece.shade ?? "",
          finish: piece.finish ?? "",
          applicationTags: Array.isArray(piece.applicationTags) ? piece.applicationTags : [],
          unit: piece.unit,
          published: piece.published,
        }}
        stock={{
          quantitySheets: stock?.quantitySheets ?? 0,
          reorderAt: stock?.reorderAt ?? 0,
          containerEta: stock?.containerEta ?? null,
        }}
      />
      </div>
    </main>
  );
}
