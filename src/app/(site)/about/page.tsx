import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { DAY, OWN } from "@/lib/images";
import { waGeneral } from "@/lib/wa";
import ThemeImage from "@/components/ThemeImage";
import { CtaRow, PageHero, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story of AU Mosaic and Pool Materials: creativity, mosaic tiles, and a decade of pools.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="The house"
        title="It started with creativity."
        image={OWN.villaPalms}
        imageLight={DAY.villaPalms}
        alt="A stone villa and palms mirrored in still mosaic water"
      />

      <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-24">
        <div className="max-w-xl space-y-6 text-[16px] leading-relaxed text-dusk">
          <p>
            Every tile shop sells the common thing. We chose the one that
            keeps creativity alive: mosaic. All kinds, all colours.
          </p>
          <p>
            Mosaic led us to pools, because pools trust mosaic. We learned
            them properly. Today we sell the tiles, stock the equipment,
            and build the pools themselves.
          </p>
          <p>
            The ambition is simple: everything mosaic in Nigeria starts
            here. One day, the largest mosaic artwork in the world.
            Watch us.
          </p>
        </div>
        <div className="relative -mx-5 mt-16 aspect-[21/9] overflow-hidden rounded-none sm:mx-0 sm:rounded-[26px]">
          <ThemeImage
            dark={OWN.craftHands}
            light={DAY.craftHands}
            alt="Hands pressing mosaic into fresh adhesive"
            fill
            quality={90}
            sizes="(max-width: 640px) 100vw, 60vw"
            className="media-lux object-cover"
          />
        </div>
      </section>

      <Section
        eyebrow="The facts"
        title="Ten years, one market, one factory."
        sub={`A showroom at ${SITE.location}. A team that runs with or without the boss around. Goods sourced directly from our factory in ${SITE.factory}, which is why our prices are hard to beat.`}
      >
        <CtaRow href={waGeneral()} label="Say hello on WhatsApp" />
      </Section>
    </>
  );
}
