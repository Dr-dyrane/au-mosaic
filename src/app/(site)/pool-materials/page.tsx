import type { Metadata } from "next";
import { getPoolMaterials } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { DAY, OWN } from "@/lib/images";
import { waQuote } from "@/lib/wa";
import { CtaRow, PageHero, ProductGroupBlock, Section } from "@/components/ui";
import ThemeImage from "@/components/ThemeImage";

export const metadata: Metadata = {
  title: "Swimming pool materials and equipment in Lagos",
  description:
    "Pumps, filter tanks, skimmers, lights, ladders, waterfalls, gum cement. Astral pool equipment in stock in Lagos.",
};

export default async function PoolMaterialsPage() {
  const materials = await getPoolMaterials();
  return (
    <>
      <PageHero
        eyebrow={`${SITE.poolBrand} equipment · in stock`}
        title="Everything a pool needs."
        sub="From the pump to the waterfall. Any item, photos and today's price on WhatsApp."
        image={OWN.materialsCounter}
        imageLight={DAY.materialsCounter}
        alt="Pool equipment and mosaic samples on a materials counter"
        cta={{ href: waQuote(), label: "Send us your materials list" }}
      />

      <Section title="The shelf">
        <div className="relative -mx-5 mb-14 aspect-[4/3] overflow-hidden rounded-none sm:mx-0 sm:rounded-[26px]">
          <ThemeImage
            dark={OWN.poolKit}
            light={DAY.poolKit}
            alt="A pump, filter tank, ladder, and fittings beside mosaic samples"
            fill
            quality={90}
            sizes="(max-width: 640px) 100vw, 90vw"
            className="media-lux object-cover"
          />
        </div>
        <div className="space-y-14">
          {materials.map((g) => (
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
