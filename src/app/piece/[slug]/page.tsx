import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPiece, getPieces } from "@/lib/catalog";
import { ENVIRONMENTS } from "@/lib/images";
import ThemeImage from "@/components/ThemeImage";
import SceneFrame, { SceneVars } from "@/components/SceneFrame";
import { waProduct } from "@/lib/wa";
import { TileSheet } from "@/components/Mosaic";
import { CtaRow } from "@/components/ui";
import Reveal from "@/components/Reveal";
import PieceBar from "@/components/PieceBar";
import TiltFrame from "@/components/TiltFrame";

/* The piece, presented the Apple way: the image is the screen, the words
   sit on it, nothing frames it. Facts follow below, quietly. */

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const pieces = await getPieces();
  return pieces.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const piece = await getPiece((await params).slug);
  if (!piece) return {};
  return {
    title: piece.name,
    description: piece.note ? `${piece.name}. ${piece.note}.` : `${piece.name}, from the ${piece.collection.toLowerCase()} collection.`,
    openGraph: piece.image ? { images: [{ url: piece.image }] } : undefined,
  };
}

export default async function PiecePage({ params }: { params: Params }) {
  const piece = await getPiece((await params).slug);
  if (!piece) notFound();
  const scene = ENVIRONMENTS.find((e) => e.href.endsWith(piece.groupId)) ?? ENVIRONMENTS[1];

  return (
    <>
      {/* Full-screen reveal: no borders, no containers, lit like a gallery. */}
      <section className="relative flex min-h-svh items-end overflow-hidden">
        <SceneVars light={piece.imageLight}>
          <TiltFrame className="absolute inset-0">
            <div className="absolute inset-0">
              {piece.image ? (
                <ThemeImage
                  dark={piece.image}
                  light={piece.imageLight}
                  alt={piece.name}
                  fill
                  priority
                  quality={90}
                  sizes="100vw"
                  className="kenburns media-lux object-cover"
                />
              ) : (
                <TileSheet colors={piece.colors || []} rows={12} cols={16} className="kenburns absolute inset-0 h-full w-full" />
              )}
            </div>
          </TiltFrame>
          <div className="vignette pointer-events-none absolute inset-0" />
          <div className="scrim-hero pointer-events-none absolute inset-0" />
          <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
            <Reveal>
              <p className="eyebrow scene-eyebrow">{piece.collection}</p>
              <h1 className="font-serif text-display-hero scene-title mt-4 max-w-3xl">
                {piece.name}
              </h1>
              {piece.note && (
                <p className="scene-sub mt-5 max-w-md text-[16px] leading-relaxed">{piece.note}.</p>
              )}
              <div className="mt-9 flex flex-wrap items-center gap-8">
                <a href={waProduct(piece.name)} target="_blank" rel="noopener" data-wa="piece-hero" className="btn-gold">
                  Enquire about this piece
                </a>
                <Link href={`/mosaic-tiles#${piece.groupId}`} className="link-hair scene-link">
                  The collection
                </Link>
              </div>
            </Reveal>
          </div>
        </SceneVars>
      </section>

      {/* Floating enquiry bar once the hero action scrolls away */}
      <PieceBar name={piece.name} href={waProduct(piece.name)} />

      {/* The piece in its room */}
      <section className="relative flex min-h-[62svh] items-end overflow-hidden">
        <SceneFrame dark={scene.src} light={scene.srcDay} alt={scene.place} fill quality={90} sizes="100vw" className="parallax-y media-lux object-cover">
          <div className="scrim-scene pointer-events-none absolute inset-0" />
          <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
            <Reveal>
              <p className="eyebrow scene-eyebrow">Seen in</p>
              <p className="font-serif text-display-section scene-title mt-3 max-w-xl">
                {scene.place}. {scene.line}
              </p>
            </Reveal>
          </div>
        </SceneFrame>
      </section>

      {/* The quiet facts */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-5 md:grid-cols-3">
          <Reveal className="panel">
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
          <Reveal delay={90} className="panel">
            <p className="eyebrow">From stock</p>
            <p className="font-serif mt-3 text-[20px]">Agric Market, Lagos</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">
              Real photos and today&apos;s price on WhatsApp, same day.
            </p>
          </Reveal>
          <Reveal delay={180} className="panel">
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
