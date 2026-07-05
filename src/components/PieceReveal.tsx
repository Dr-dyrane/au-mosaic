import Link from "next/link";
import { OWN, DAY } from "@/lib/images";
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
  applicationTags?: string[];
  card?: string;
  cardLight?: string;
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

/* The dream caption, per piece, spoken over its own applied scene. A piece
   with no line of its own yet falls to the quiet default. */
const APPLIED_LINE: Record<string, string> = {
  "classic-pool-blues": "The deep end, tiled in blue.",
  "solid-colour-glass": "A wall that keeps to one colour.",
  "gold-metallic-accents": "Metal gathers the evening in.",
  "custom-murals": "Made to be looked at twice.",
  "plain-blue-small-seed": "The blue that reads as clean water.",
  "mixed-blue-big-seed": "Water, never one flat blue.",
  "plain-white-mosaic": "Light, with the volume up.",
  "black-mosaic": "Water gone dark and still.",
  "green-mosaic": "The colour a courtyard wears.",
  "orange-mosaic": "One warm wall, and the room wakes.",
  "tiny-seed-gold": "The gold takes the room, and holds the evening in it.",
  "silver-crystal-mosaic": "Light, broken into a thousand facets.",
  "stone-mosaic": "A quiet room, kept quiet.",
  "hexagon-marble": "The bath, floored in marble.",
};

function dreamFor(p: RevealPiece): Dream {
  /* Render both types. When a product card is the stage object, the dream is
     the piece's own applied mosaic, its legacy cinematic scene, so the product
     and the application both show. When there is no card, the applied image is
     already the object, so the dream is a family window frame instead. */
  if (p.card && p.image) {
    return { night: p.image, day: p.imageLight, line: APPLIED_LINE[p.slug] ?? "Made real, tessera by tessera.", alt: `${p.name}, applied` };
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
  "classic-pool-blues": {
    materialTitle: "Every blue the water knows.",
    materialBody: "Small seed and big, deep to light, mixed in one sheet. The whole range a pool moves through from the deep end to the steps.",
  },
  "solid-colour-glass": {
    materialTitle: "One clean colour, edge to edge.",
    materialBody: "Solid glass, cut square. Crystal, stone, chess board, or a shade matched to order. No pattern to hide in, just the colour itself.",
  },
  "gold-metallic-accents": {
    materialTitle: "Three metals, all mirror.",
    materialBody: "Gold, silver, and rose-gold mirror. Each piece catches the room and hands it back a little warmer than it left.",
  },
  "custom-murals": {
    materialTitle: "Your drawing, in glass.",
    materialBody: "Cut and set by hand to your own design. A crest, a koi, a name. Whatever the picture, it arrives one piece at a time.",
  },
  "plain-blue-small-seed": {
    materialTitle: "The pool classic, small seed.",
    materialBody: "Fine blue seed, even across the sheet. The tile that has lined more Lagos pools than any other, for the plain reason that it works.",
  },
  "mixed-blue-big-seed": {
    materialTitle: "Deep to light, one sheet.",
    materialBody: "Big seed, blues blended dark to pale in a single sheet, so the water shifts shade the way real water does under moving light.",
  },
  "plain-white-mosaic": {
    materialTitle: "Clean light, nothing added.",
    materialBody: "Plain white glass set close. The surface that makes a small room feel larger and a pool read bright to the floor.",
  },
  "black-mosaic": {
    materialTitle: "Shadow, matte or gloss.",
    materialBody: "Black glass in two moods: matte drinks the light, gloss throws it back. Either one turns a wall or a pool deep and quiet.",
  },
  "green-mosaic": {
    materialTitle: "Green, for rooms that breathe.",
    materialBody: "A living green across the sheet. At home behind a kitchen counter, along a bath, or in a courtyard where the leaves already agree.",
  },
  "orange-mosaic": {
    materialTitle: "A warm accent, on purpose.",
    materialBody: "Orange glass with real heat in it. A single band or a whole wall, for a room that wants a pulse, not another neutral.",
  },
  "silver-crystal-mosaic": {
    materialTitle: "Cut like crystal, set like tile.",
    materialBody: "Faceted glass that behaves like cut crystal. Every piece a small prism, so the whole sheet flickers as you move past it.",
  },
  "stone-mosaic": {
    materialTitle: "Matte stone, no shine at all.",
    materialBody: "Natural stone cut to mosaic and left matte. Warm on a wall, quiet in a room that would rather be calm than loud.",
  },
  "hexagon-marble": {
    materialTitle: "Marble, cut to the honeycomb.",
    materialBody: "Real marble in small hexagons, veined no two alike, tessellating across a bath wall the way honeycomb always meant to.",
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
  return p.card ? { night: p.card, day: p.cardLight } : { night: p.image ?? "", day: p.imageLight };
}

export default function PieceReveal({ piece }: { piece: RevealPiece }) {
  const wa = waProduct(piece.name);
  const obj = objectOf(piece);
  const dream = dreamFor(piece);
  const copy = COPY[piece.slug] ?? GENERIC_COPY;
  const stageSub = copy.stageSub ?? piece.note;

  /* The stage holds dark in both suns. A dark studio card sinks into it and
     the sheet dies. Worst of all for dark tiles, which vanish outright. So a
     carded piece is lit here by its light-ground card: the vignette feathers
     its edges into the black and it reads as a sample under the spotlight. An
     un-carded piece keeps its own hero photo, which already carries the light. */
  const stageImg = piece.card ? piece.cardLight ?? obj.night : obj.night;

  return (
    <>
      {/* ACT ONE. THE STAGE. A dark opening, the sheet lit alone. */}
      <section className="reveal-stage relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 py-24 text-center">
        <div className="vignette pointer-events-none absolute inset-0 z-[1]" />
        <Reveal>
          <div className="reveal-artwork">
            <ThemeImage
              dark={stageImg}
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

      {/* ACT TWO. THE MATERIAL. Close enough to touch; light walks the tesserae. */}
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

      {/* ACT THREE. THE DREAM. The pull-back into the room; the sun returns. */}
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

      {/* ACT FOUR. THE COUNTER. Shop-crisp: the facts and the one gold action. */}
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
                  {piece.colors.map((c, i) => (
                    <span key={`${c}-${i}`} className="h-7 w-7 rounded-full" style={{ background: c }} aria-hidden />
                  ))}
                </div>
              </Reveal>
            )}
            <Reveal delay={140}>
              <p className="mt-5 text-[14px] leading-relaxed text-dusk">
                {piece.note ? `${piece.note} · ` : ""}Agric Market, Lagos
              </p>
            </Reveal>
            {piece.applicationTags && piece.applicationTags.length > 0 && (
              <Reveal delay={180}>
                <div className="mt-6 flex flex-wrap gap-2" aria-label="Applications">
                  {piece.applicationTags.map((tag) => (
                    <span key={tag} className="chip-solid">{tag}</span>
                  ))}
                </div>
              </Reveal>
            )}
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
