import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { LUX } from "@/lib/images";
import { waGeneral } from "@/lib/wa";
import { MosaicBand } from "@/components/Mosaic";
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
        image={LUX.villaPalms}
        alt="A villa resting beside still water"
      />

      <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-24">
        <div className="max-w-xl space-y-6 text-[16px] leading-relaxed text-dusk">
          <p>
            There are many tiles in the construction business. Mosaic is not the
            common one. That was the point. Mosaic keeps creativity alive while
            doing serious business, and it became ours: all kinds, all colours.
          </p>
          <p>
            Mosaic led to pools, because mosaic is what pools trust. So we
            learned pools properly, from materials to construction. Today we
            sell the tiles, stock the equipment, and build and renovate the
            pools themselves.
          </p>
          <p>
            The ambition is simple to say: be the place everyone in Nigeria
            goes to for everything mosaic. One day, we intend to build the
            largest mosaic artwork in the world. Watch us.
          </p>
        </div>
        <MosaicBand rows={3} className="mt-16 h-24 w-full rounded-[22px]" />
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
