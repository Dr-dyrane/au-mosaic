import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { waGeneral } from "@/lib/wa";
import { MosaicBand } from "@/components/Mosaic";
import { CtaRow, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story of AU Mosaic and Pool Materials: creativity, mosaic tiles, and a decade of pools.",
};

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          It started with creativity.
        </h1>
        <div className="mt-6 max-w-xl space-y-5 text-lg leading-relaxed text-dusk">
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
        <MosaicBand rows={4} className="mt-12 h-32 w-full rounded-3xl shadow-lift" />
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
