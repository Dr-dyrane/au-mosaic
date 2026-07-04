import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPiece, getPieces } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { scriptJson } from "@/lib/jsonld";
import PieceReveal from "@/components/PieceReveal";

/* Every piece page is the four-act reveal now: item 12, generalised. The
   reveal component is data-driven (object from the shop card or the hero
   photo, dream from a family map, copy generic with per-slug bespoke), so
   one route opens the whole catalogue in the shop.app product-detail way. */

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const pieces = await getPieces();
  return pieces.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const piece = await getPiece((await params).slug);
  if (!piece) return {};
  return {
    title: `${piece.name} · ${piece.collection}, Lagos`,
    description: piece.note ? `${piece.name}. ${piece.note}.` : `${piece.name}, from the ${piece.collection.toLowerCase()} collection.`,
    openGraph: piece.image ? { images: [{ url: piece.image }] } : undefined,
  };
}

export default async function PiecePage({ params }: { params: Params }) {
  const piece = await getPiece((await params).slug);
  if (!piece) notFound();

  /* Structured data, honest to the house: a Product without a price,
     because every job is quoted in the chat, and the path that led here.
     Absolute URLs; search engines read no relative paths. */
  const base = SITE.url.replace(/\/$/, "");
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: piece.name,
    description: piece.note ? `${piece.name}. ${piece.note}.` : `${piece.name}, ${piece.collection.toLowerCase()}.`,
    ...(piece.image
      ? { image: piece.image.startsWith("http") ? piece.image : `${base}${piece.image}` }
      : {}),
    category: piece.collection,
    brand: { "@type": "Brand", name: SITE.shortName },
    url: `${base}/piece/${piece.slug}`,
  };
  const crumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: "Mosaic tiles", item: `${base}/mosaic-tiles` },
      { "@type": "ListItem", position: 3, name: piece.name, item: `${base}/piece/${piece.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: scriptJson(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: scriptJson(crumbsLd) }} />
      <PieceReveal piece={piece} />
    </>
  );
}
