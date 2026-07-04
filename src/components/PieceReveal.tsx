import Link from "next/link";
import { OWN, DAY } from "@/lib/images";
import { waProduct } from "@/lib/wa";
import ThemeImage from "@/components/ThemeImage";
import SceneFrame, { SceneVars } from "@/components/SceneFrame";
import Reveal from "@/components/Reveal";
import PieceBar from "@/components/PieceBar";

/* Item 12, the piece reveal. Four acts, sequenced not blended: the stage,
   the material, the dream, the counter. Theatre is lawful on the window,
   so the stage and material hold dark in both suns (night frame, no light
   twin passed); the dream and counter follow the house's light. Prototyped
   on tiny-seed-gold, gated by slug in the piece page. Reuses the house's
   own primitives: SceneVars, ThemeImage, Reveal, PieceBar, the vignette,
   the scrims, and CSS scroll-driven parallax. No new dependency. */

type RevealPiece = {
  slug: string;
  name: string;
  collection: string;
  note?: string;
  image?: string;
  imageLight?: string;
  colors?: string[];
  variants?: string[];
  groupId: string;
};

export default function PieceReveal({ piece }: { piece: RevealPiece }) {
  const wa = waProduct(piece.name);
  const obj = piece.image ?? OWN.tinySeedGold;

  return (
    <>
      {/* ACT ONE — THE STAGE. A dark opening, the sheet lit alone. */}
      <section className="reveal-stage relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 py-24 text-center">
        <div className="vignette pointer-events-none absolute inset-0 z-[1]" />
        <Reveal>
          <div className="reveal-artwork">
            <ThemeImage
              dark={obj}
              alt={piece.name}
              fill
              priority
              quality={90}
              sizes="(max-width: 640px) 78vw, 520px"
              className="kenburns media-lux object-cover"
            />
          </div>
        </Reveal>
        <SceneVars>
          <div className="relative z-[2] mt-10">
            <Reveal delay={80}>
              <p className="eyebrow scene-eyebrow">{piece.collection}</p>
            </Reveal>
            <Reveal delay={160}>
              <h1 className="font-serif text-display-hero scene-title mt-3">{piece.name}</h1>
            </Reveal>
            <Reveal delay={240}>
              <p className="scene-sub mt-4 text-[16px]">Gold, cut small, set close.</p>
            </Reveal>
          </div>
        </SceneVars>
        <div className="reveal-cue absolute inset-x-0 bottom-7 z-[2]" aria-hidden>
          Scroll
          <i />
        </div>
      </section>

      {/* The floating enquiry bar rises once the stage scrolls away. */}
      <PieceBar name={piece.name} href={wa} />

      {/* ACT TWO — THE MATERIAL. Close enough to touch; light walks the tesserae. */}
      <section className="reveal-stage relative flex min-h-svh items-end overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <ThemeImage
            dark={obj}
            alt=""
            fill
            quality={85}
            sizes="100vw"
            className="reveal-macro-img media-lux object-cover"
          />
        </div>
        <div className="scrim-hero pointer-events-none absolute inset-0 z-[1]" />
        <div className="reveal-sweep pointer-events-none absolute inset-0 z-[1]" aria-hidden />
        <SceneVars>
          <div className="relative z-[2] mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
            <Reveal>
              <p className="eyebrow scene-eyebrow">The material</p>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="font-serif text-display-section scene-title mt-3 max-w-[16ch]">
                A thousand points of gold.
              </h2>
            </Reveal>
            <Reveal delay={180}>
              <p className="scene-sub mt-5 max-w-md text-[16px] leading-relaxed">
                Tiny seed, cut small and set close. Each tessera catches the light on its own, so the
                surface breathes instead of lying flat.
              </p>
            </Reveal>
          </div>
        </SceneVars>
      </section>

      {/* ACT THREE — THE DREAM. The pull-back into the room; the sun returns. */}
      <section className="relative flex min-h-[72svh] items-end overflow-hidden">
        <SceneFrame
          dark={OWN.goldAccents}
          light={DAY.goldAccents}
          alt="The vault of the house"
          fill
          quality={90}
          sizes="100vw"
          className="parallax-y media-lux object-cover"
        >
          <div className="scrim-scene pointer-events-none absolute inset-0" />
          <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
            <Reveal>
              <p className="eyebrow scene-eyebrow">Seen in</p>
              <p className="font-serif text-display-section scene-title mt-3 max-w-xl">
                The vault of the house. Where gold keeps its evening.
              </p>
              <Link href={`/mosaic-tiles#${piece.groupId}`} className="link-hair scene-link mt-6 inline-block">
                The material behind it
              </Link>
            </Reveal>
          </div>
        </SceneFrame>
      </section>

      {/* ACT FOUR — THE COUNTER. Shop-crisp: the facts and the one gold action. */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="reveal-counter-thumb mx-auto w-full max-w-[320px] md:max-w-none">
              <ThemeImage
                dark={obj}
                light={piece.imageLight}
                alt={piece.name}
                fill
                quality={85}
                sizes="(max-width: 768px) 78vw, 420px"
                className="media-lux object-cover"
              />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <p className="eyebrow">{piece.collection}</p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="font-serif text-display-section mt-2">{piece.name}</h2>
            </Reveal>
            {piece.colors && (
              <Reveal delay={140}>
                <div className="mt-6 flex gap-2.5" aria-label="Colourways">
                  {piece.colors.map((c) => (
                    <span key={c} className="h-7 w-7 rounded-full" style={{ background: c }} aria-hidden />
                  ))}
                </div>
              </Reveal>
            )}
            <Reveal delay={140}>
              <p className="mt-5 text-[14px] leading-relaxed text-dusk">
                {piece.note ? `${piece.note} · ` : ""}Agric Market, Lagos
              </p>
            </Reveal>
            <Reveal delay={220}>
              <div className="mt-8 flex flex-wrap items-center gap-7">
                <a href={wa} target="_blank" rel="noopener" data-wa="piece-counter" className="btn-gold">
                  Enquire about this piece
                </a>
                <Link href={`/visualizer?piece=${piece.slug}`} className="link-hair">
                  See it in your space
                </Link>
              </div>
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-7 max-w-md text-[13px] leading-relaxed text-mist">
                Real photos and today&apos;s price on WhatsApp, same day.
              </p>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
