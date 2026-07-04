import Link from "next/link";
import { OWN, DAY, CARD } from "@/lib/images";
import { waProduct } from "@/lib/wa";
import ThemeImage from "@/components/ThemeImage";
import SceneFrame, { SceneVars } from "@/components/SceneFrame";
import Reveal from "@/components/Reveal";
import PieceBar from "@/components/PieceBar";

/* Item 12, generalised. Every piece page is a four-act reveal now, the
   shop.app product-detail discipline built the maison way. The acts are
   data-driven so one component serves the whole catalogue:
   - the object (stage, material, counter) is the piece's shop-style card
     where one exists, else its own hero photo;
   - the dream (act three) is a cinematic window frame chosen by a family
     map, with a per-slug override for the gold pieces;
   - the copy is generic and honest, with a bespoke override kept for
     tiny-seed-gold, the piece the reveal debuted on.
   Theatre is lawful on the window: the stage and material hold dark in
   both suns; the dream and counter follow the light. Reduced motion
   collapses every act to stills; act heights are phone-first in svh. */

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

type Dream = { night: string; day?: string; line: string; alt: string };

const DREAM_BY_SLUG: Record<string, Dream> = {
  "tiny-seed-gold": { night: OWN.metallicRoom, day: DAY.metallicRoom, line: "The gold takes the room, and holds the evening in it.", alt: "The gold room at evening" },
  "gold-metallic-accents": { night: OWN.metallicRoom, day: DAY.metallicRoom, line: "Gold, silver, and rose, the room's own light.", alt: "A metallic mosaic room" },
};

const DREAM_BY_GROUP: Record<string, Dream> = {
  "pool-mosaics": { night: OWN.poolEdge, day: DAY.poolEdge, line: "Where the blue begins.", alt: "A pool edge in seed-blue mosaic" },
  "glass-mosaics": { night: OWN.showroomWall, day: DAY.showroomWall, line: "Every colour, within reach.", alt: "The showroom wall, the full range sampled" },
  "feature-mosaics": { night: OWN.artGallery, day: DAY.artGallery, line: "Made to be looked at.", alt: "A commissioned mosaic art panel" },
  "bulk-orders": { night: OWN.showroomWall, day: DAY.showroomWall, line: "Every colour, by the container.", alt: "The showroom wall, the full range sampled" },
};

function dreamFor(p: RevealPiece): Dream {
  /* Render both types. When a product card is the stage object, the dream is
     the piece's own applied mosaic, its legacy cinematic scene, so the product
     and the application both show. When there is no card, the applied image is
     already the object, so the dream is a family window frame instead. */
  if (CARD[p.slug] && p.image) {
    return { night: p.image, day: p.imageLight, line: "Made real, tessera by tessera.", alt: `${p.name}, applied` };
  }
  return DREAM_BY_SLUG[p.slug] ?? DREAM_BY_GROUP[p.groupId] ?? DREAM_BY_GROUP["glass-mosaics"];
}

type Copy = { stageSub?: string; materialTitle: string; materialBody: string };

const COPY: Record<string, Copy> = {
  "tiny-seed-gold": {
    stageSub: "Gold, cut small, set close.",
    materialTitle: "A thousand points of gold.",
    materialBody: "Tiny seed, cut small and set close. Each tessera catches the light on its own, so the surface breathes instead of lying flat.",
  },
};

const GENERIC_COPY: Copy = {
  materialTitle: "Close enough to touch.",
  materialBody: "Cut and set by hand, each tessera catches the light on its own, so the surface breathes instead of lying flat.",
};

/* Two image types per tile, rendered both. The product simple (the shop card)
   is the object under the spotlight; the applied mosaic (the piece's own
   cinematic scene) becomes the dream. Where a piece has no product card, its
   own image is the object and the dream is a family window frame. */
function objectOf(p: RevealPiece): { night: string; day?: string } {
  const c = CARD[p.slug];
  return c ? { night: c.night, day: c.day } : { night: p.image ?? "", day: p.imageLight };
}

export default function PieceReveal({ piece }: { piece: RevealPiece }) {
  const wa = waProduct(piece.name);
  const obj = objectOf(piece);
  const dream = dreamFor(piece);
  const copy = COPY[piece.slug] ?? GENERIC_COPY;
  const stageSub = copy.stageSub ?? piece.note;

  return (
    <>
      {/* ACT ONE — THE STAGE. A dark opening, the sheet lit alone. */}
      <section className="reveal-stage relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 py-24 text-center">
        <div className="vignette pointer-events-none absolute inset-0 z-[1]" />
        <Reveal>
          <div className="reveal-artwork">
            <ThemeImage
              dark={obj.night}
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
            {stageSub && (
              <Reveal delay={240}>
                <p className="scene-sub mt-4 text-[16px]">{stageSub}</p>
              </Reveal>
            )}
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
            dark={obj.night}
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
                {copy.materialTitle}
              </h2>
            </Reveal>
            <Reveal delay={180}>
              <p className="scene-sub mt-5 max-w-md text-[16px] leading-relaxed">{copy.materialBody}</p>
            </Reveal>
          </div>
        </SceneVars>
      </section>

      {/* ACT THREE — THE DREAM. The pull-back into the room; the sun returns. */}
      <section className="relative flex min-h-[72svh] items-end overflow-hidden">
        <SceneFrame
          dark={dream.night}
          light={dream.day}
          alt={dream.alt}
          fill
          quality={90}
          sizes="100vw"
          className="parallax-y media-lux object-cover"
        >
          <div className="scrim-scene pointer-events-none absolute inset-0" />
          <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
            <Reveal>
              <p className="eyebrow scene-eyebrow">Seen in</p>
              <p className="font-serif text-display-section scene-title mt-3 max-w-xl">{dream.line}</p>
              <Link href={`/mosaic-tiles#${piece.groupId}`} className="link-hair scene-link mt-6 inline-block">
                The range behind it
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
                dark={obj.night}
                light={obj.day}
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
                <div className="mt-6 flex flex-wrap gap-2.5" aria-label="Colourways">
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
