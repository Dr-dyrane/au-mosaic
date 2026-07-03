import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import PieceForm from "./PieceForm";

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
      <Link href="/admin/pieces" className="link-hair text-dusk text-[13px]">
        All pieces
      </Link>
      <h1 className="font-serif text-display-section mt-6">{piece.name}</h1>
      <p className="mt-2 text-[13px] uppercase tracking-[0.14em] text-mist">
        {piece.slug} · lives at /piece/{piece.slug}
      </p>
      <PieceForm
        piece={{
          slug: piece.slug,
          name: piece.name,
          line: piece.line,
          story: piece.story,
          priceNote: piece.priceNote,
          colors: piece.colors ?? [],
          published: piece.published,
        }}
        stock={{
          quantitySheets: stock?.quantitySheets ?? 0,
          reorderAt: stock?.reorderAt ?? 0,
          containerEta: stock?.containerEta ?? null,
        }}
      />
    </main>
  );
}
