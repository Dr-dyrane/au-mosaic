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
      <section className="mx-auto max-w-6xl px-5 pt-36 sm:px-8 sm:pt-44">
        <p className="eyebrow">The collection</p>
        <h1 className="font-serif mt-4 max-w-2xl text-[clamp(2.4rem,6vw,4rem)] leading-[1.06]">
          Every colour you can name.
        </h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dusk">
          Tell us the look. Real photos and videos from stock follow the
          same day, on WhatsApp.
        </p>
        <div className="mt-8">
          <CtaRow href={waQuote()} label="Ask for samples" />
        </div>
        <TileSheet
          colors={["#1179a8", "#2fb9cf", "#67d6e5", "#a8def2", "#134e5e", "#f5f1e8"]}
          rows={3}
          cols={30}
          className="mt-14 h-20 w-full"
        />
      </section>

      <Section title="The ranges">
        <div className="space-y-14">
          {MOSAIC_RANGES.map((g) => (
            <ProductGroupBlock key={g.id} group={g} />
          ))}
        </div>
      </Section>

      <Section
        tint
        eyebrow="For projects"
        title="Contractors and resellers, welcome."
        sub="Trade quantities from stock. Containers direct from our factory line in Foshan for large projects. Factory prices, honest timelines."
      >
        <CtaRow href={waQuote()} label="Discuss a bulk order" />
      </Section>
    </>
  );
}
