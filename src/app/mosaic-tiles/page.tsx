import type { Metadata } from "next";
import { MOSAIC_RANGES } from "@/lib/products";
import { waQuote } from "@/lib/wa";
import { TileSheet } from "@/components/Mosaic";
import { CtaRow, ProductGroupBlock, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Mosaic tiles",
  description:
    "Pool mosaics, glass mosaics, art mosaics, and bulk factory orders. Every colour, largest stock in Lagos.",
};

export default function MosaicTilesPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Mosaic tiles, every colour you can name.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-dusk">
          Tell us the look you want. We send real photos and videos from stock,
          same day, on WhatsApp.
        </p>
        <div className="mt-8">
          <CtaRow href={waQuote()} label="Ask for samples" />
        </div>
        <TileSheet
          colors={["#1179a8", "#2fb9cf", "#67d6e5", "#a8def2", "#134e5e", "#f5f1e8"]}
          rows={4}
          cols={26}
          className="mt-12 h-28 w-full rounded-3xl shadow-lift"
        />
      </section>

      <Section title="Ranges">
        <div className="space-y-14">
          {MOSAIC_RANGES.map((g) => (
            <ProductGroupBlock key={g.id} group={g} />
          ))}
        </div>
      </Section>

      <Section
        tint
        eyebrow="For projects"
        title="Contractor or reseller?"
        sub="We supply trade quantities from stock, and order containers directly from our factory in Foshan for large projects. Factory prices, honest timelines."
      >
        <CtaRow href={waQuote()} label="Discuss a bulk order" />
      </Section>
    </>
  );
}
