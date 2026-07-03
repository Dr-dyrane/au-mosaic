import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PIECES, pieceBySlug } from "@/lib/products";
import { ENVIRONMENTS } from "@/lib/images";
import { waProduct } from "@/lib/wa";
import { TileSheet } from "@/components/Mosaic";
import { CtaRow } from "@/components/ui";
import Reveal from "@/components/Reveal";
import PieceBar from "@/components/PieceBar";

/* The piece, presented the Apple way: the image is the screen, the words
   sit on it, nothing frames it. Facts follow below, quietly. */

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return PIECES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const piece = pieceBySlug((await params).slug);
  if (!piece) return {};
  return {
    title: piece.name,
    description: piece.note ? `${piece.name}. ${piece.note}.` : `${piece.name}, from the ${piece.collection.toLowerCase()} collection.`,
    openGraph: piece.image ? { images: [{ url: piece.image }] } : undefined,
  };
}

export default async function PiecePage({ params }: { params: Params }) {
  const piece = pieceBySlug((await params).slug);
  if (!piece) notFound();
  const scene = ENVIRONMENTS.find((e) => e.href.endsWith(piece.groupId)) ?? ENVIRONMENTS[1];

  return (
    <>
      {/* Full-screen reveal: no borders, no containers. */}
      <section className="relative flex min-h-svh items-end overflow-hidden">
        {piece.image ? (
          <Image
            src={piece.image}
            alt={piece.name}
            fill
            priority
            sizes="100vw"
            className="kenburns object-cover"
          />
        ) : (
          <TileSheet colors={piece.colors || []} rows={12} cols={16} className="kenburns absolute inset-0 h-full w-full" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,11,9,0.42) 0%, rgba(12,11,9,0.06) 38%, rgba(12,11,9,0.85) 100%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
          <Reveal>
            <p className="eyebrow">{piece.collection}</p>
            <h1 className="font-serif mt-4 max-w-3xl text-[clamp(2.6rem,7vw,5rem)] leading-[1.05] text-white">
              {piece.name}
            </h1>
            {piece.note && (
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/80">{piece.note}.</p>
            )}
            <div className="mt-9 flex flex-wrap items-center gap-8">
              <a href={waProduct(piece.name)} target="_blank" rel="noopener" className="btn-gold">
                Enquire about this piece
              </a>
              <Link href={`/mosaic-tiles#${piece.groupId}`} className="link-hair text-white">
                The collection
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Floating enquiry bar once the hero action scrolls away */}
      <PieceBar name={piece.name} href={waProduct(piece.name)} />

      {/* The piece in its room */}
      <section className="relative flex min-h-[62svh] items-end overflow-hidden">
        <Image src={scene.src} alt={scene.place} fill sizes="100vw" className="object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,11,9,0.25) 0%, rgba(12,11,9,0.05) 45%, rgba(12,11,9,0.72) 100%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
          <Reveal>
            <p className="eyebrow">Seen in</p>
            <p className="font-serif mt-3 max-w-xl text-[clamp(1.7rem,4vw,2.6rem)] leading-tight text-white">
              {scene.place}. {scene.line}
            </p>
          </Reveal>
        </div>
      </section>

      {/* The quiet facts */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-4 md:grid-cols-3">
          <Reveal className="hairline pt-6">
            <p className="eyebrow">Colourways</p>
            {piece.colors && (
              <div className="mt-4 flex gap-2.5">
                {piece.colors.map((c) => (
                  <span key={c} className="h-7 w-7 rounded-full" style={{ background: c }} aria-hidden />
                ))}
              </div>
            )}
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">
              {piece.variants ? piece.variants.join(" · ") : "Every shade, by the sheet. Ask for the range."}
            </p>
          </Reveal>
          <Reveal delay={90} className="hairline pt-6">
            <p className="eyebrow">From stock</p>
            <p className="font-serif mt-3 text-[20px]">Agric Market, Lagos</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">
              Real photos and today&apos;s price on WhatsApp, same day.
            </p>
          </Reveal>
          <Reveal delay={180} className="hairline pt-6">
            <p className="eyebrow">For projects</p>
            <p className="font-serif mt-3 text-[20px]">Factory direct</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">
              Containers from our Foshan line for large orders.
            </p>
          </Reveal>
        </div>
        <div className="mt-16">
          <CtaRow
            href={waProduct(piece.name)}
            label="Begin with this piece"
            secondary={{ href: "/mosaic-tiles", label: "Explore every range" }}
          />
        </div>
      </section>
    </>
  );
}
