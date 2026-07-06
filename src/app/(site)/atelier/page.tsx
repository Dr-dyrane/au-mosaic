import type { Metadata } from "next";
import Image from "next/image";
import { ATELIER, ATELIER_SCENES } from "@/lib/images";
import { wa } from "@/lib/wa";
import { CtaRow, PageHero, Section } from "@/components/ui";
import Reveal from "@/components/Reveal";

const description =
  "Mosaic at the height of the craft: glass, stone, and metal set the old way, for pools, baths, and walls that mean to last.";
export const metadata: Metadata = {
  title: "The Atelier",
  description,
  openGraph: { title: "The Atelier · AU Mosaic", description },
  twitter: { title: "The Atelier · AU Mosaic", description },
};

const waDesign = () =>
  wa("Hello AU Mosaic, I'd like to design a mosaic pool or feature. Here's what I have in mind: ");

export default function AtelierPage() {
  return (
    <>
      <PageHero
        eyebrow="The Atelier"
        title="The oldest art, in glass and water."
        sub="Mosaic is a picture built one tessera at a time, a craft older than the cities it decorates. This is the tradition we work in."
        image={ATELIER.atrium}
        alt="A columned atrium with a deep blue glass-mosaic pool lit by warm arched light"
        cta={{ href: waDesign(), label: "Design with us" }}
      />

      <Section eyebrow="The craft" title="Patience, made permanent.">
        <div className="max-w-2xl space-y-6 text-[16px] leading-relaxed text-dusk">
          <p>
            A mosaic is not printed or poured. It is set, tessera by tessera,
            colour by colour, until a surface holds light the way water does.
            The method is old; the patience is the whole art.
          </p>
          <p>
            We bring that tradition to Lagos water. Glass, stone, and metal,
            chosen for the pool, the bath, the wall, and meant to outlast the
            room they sit in.
          </p>
          <p>
            The scenes here are the ambition, not a portfolio: what the material
            can become when it is given room. Bring us your space, and we will
            tell you honestly what it can hold.
          </p>
        </div>
      </Section>

      <Section eyebrow="In the material" title="Glass, stone, and metal." tint>
        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2">
          {ATELIER_SCENES.map((scene) => (
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
        title="A pool is a long conversation."
        sub="The best ones start with a picture and a measurement. Send us both, and we will meet you in the middle, in glass, stone, and water."
      >
        <CtaRow href={waDesign()} label="Design with us" secondary={{ href: "/pools", label: "Pool construction" }} />
      </Section>
    </>
  );
}
