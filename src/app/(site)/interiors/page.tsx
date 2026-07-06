import type { Metadata } from "next";
import Image from "next/image";
import { INTERIORS, INTERIOR_SCENES } from "@/lib/images";
import { wa } from "@/lib/wa";
import { CtaRow, PageHero, Section } from "@/components/ui";
import Reveal from "@/components/Reveal";

const description =
  "Mosaic as the room's one great surface: feature walls, baths, and floors in glass, stone, and metal.";
export const metadata: Metadata = {
  title: "Interiors",
  description,
  openGraph: { title: "Interiors · AU Mosaic", description },
  twitter: { title: "Interiors · AU Mosaic", description },
};

const waWall = () =>
  wa("Hello AU Mosaic, I'd like a mosaic feature wall or floor. Here's the space: ");

export default function InteriorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Interiors"
        title="A wall of light, in any room."
        sub="Set at scale, mosaic stops being a border and becomes the one surface a room is remembered by."
        image={INTERIORS.aqua}
        alt="A sunlit stone interior with a tall arched aqua glass-mosaic feature wall"
        cta={{ href: waWall(), label: "Design a wall" }}
      />

      <Section eyebrow="The surface" title="Not a border. The room.">
        <div className="max-w-2xl space-y-6 text-[16px] leading-relaxed text-dusk">
          <p>
            A single tile is a detail. A mosaic wall is a decision, a whole
            surface that catches the light and moves with it, the way water does.
          </p>
          <p>
            Feature walls, baths, floors: glass for depth, stone for calm, metal
            for the one line that catches the eye. The scenes here are the
            ambition, shown so you can picture your own.
          </p>
        </div>
      </Section>

      <Section eyebrow="In the room" title="Glass, stone, and light." tint>
        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2">
          {INTERIOR_SCENES.map((scene) => (
            <Reveal key={scene.src}>
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-sand">
                  <Image
                    src={scene.src}
                    alt={scene.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="media-lux object-cover"
                  />
                </div>
                <figcaption className="mt-5">
                  <p className="font-serif text-[20px] leading-snug">{scene.place}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">{scene.line}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Begin"
        title="Send the wall you want to change."
        sub="A photo and a rough size is enough. We will tell you what mosaic can do with it, and what it costs, per job."
      >
        <CtaRow href={waWall()} label="Design a wall" secondary={{ href: "/mosaic-tiles", label: "The ranges" }} />
      </Section>
    </>
  );
}
