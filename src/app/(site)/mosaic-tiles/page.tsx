import type { Metadata } from "next";
import { getMosaicRanges } from "@/lib/catalog";
import { DAY, OWN } from "@/lib/images";
import { waQuote } from "@/lib/wa";
import ProductSearch from "@/components/ProductSearch";
import { CtaRow, PageHero, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Mosaic tiles in Lagos, Nigeria",
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
        sub="Name the look. Real photos from stock, same day, on WhatsApp."
        image={OWN.borders}
        imageLight={DAY.borders}
        alt="A patterned mosaic waterline band above still pool water"
        cta={{ href: waQuote(), label: "Ask for samples" }}
      />

      <Section title="The ranges">
        <ProductSearch groups={ranges} />
      </Section>

      <Section
        tint
        eyebrow="For projects"
        title="Contractors and resellers, welcome."
        sub="Trade quantities from stock. Containers direct from Foshan. Factory prices, honest timelines."
      >
        <CtaRow href={waQuote()} label="Discuss a bulk order" />
      </Section>
    </>
  );
}
