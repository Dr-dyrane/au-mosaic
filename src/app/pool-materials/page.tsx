import type { Metadata } from "next";
import { POOL_MATERIALS } from "@/lib/products";
import { SITE } from "@/lib/site";
import { IMG } from "@/lib/images";
import { waQuote } from "@/lib/wa";
import { CtaRow, PageHero, ProductGroupBlock, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pool materials",
  description:
    "Pumps, filter tanks, skimmers, lights, ladders, waterfalls, gum cement. Astral pool equipment in stock in Lagos.",
};

export default function PoolMaterialsPage() {
  return (
    <>
      <PageHero
        eyebrow={`${SITE.poolBrand} equipment · in stock`}
        title="Everything a pool needs."
        sub="From the pump to the waterfall. Any item, photos and today's price on WhatsApp."
        image={IMG.rippledLaneWater}
        alt="Clear rippled pool water"
        cta={{ href: waQuote(), label: "Send us your materials list" }}
      />

      <Section title="The shelf">
        <div className="space-y-14">
          {POOL_MATERIALS.map((g) => (
            <ProductGroupBlock key={g.id} group={g} />
          ))}
        </div>
      </Section>

      <Section
        tint
        eyebrow="Worth knowing"
        title="The gum cement rule."
        sub="When mosaics fall off a pool wall, the adhesive failed, not the tile. Spanish Kerakoll holds. We will always tell you the honest difference between options and prices."
      >
        <CtaRow href={waQuote()} label="Ask which adhesive fits your job" />
      </Section>
    </>
  );
}
