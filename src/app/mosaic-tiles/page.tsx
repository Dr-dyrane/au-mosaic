import type { Metadata } from "next";
import { getMosaicRanges } from "@/lib/catalog";
import { IMG } from "@/lib/images";
import { waQuote } from "@/lib/wa";
import { CtaRow, PageHero, ProductGroupBlock, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Mosaic tiles",
  description:
    "Pool mosaics, glass mosaics, art mosaics, and bulk factory orders. Every colour, largest stock in Lagos.",
};

export default async function MosaicTilesPage() {
  const ranges = await getMosaicRanges();
  return (
    <>
      <PageHero
        eyebrow="The collection"
        title="Every colour you can name."
        sub="Tell us the look. Real photos and videos from stock follow the same day, on WhatsApp."
        image={IMG.bluePatternTiles}
        alt="Blue and white patterned mosaic tiles"
        cta={{ href: waQuote(), label: "Ask for samples" }}
      />

      <Section title="The ranges">
        <div className="space-y-14">
          {ranges.map((g) => (
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
