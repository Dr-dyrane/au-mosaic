import type { Metadata } from "next";
import { POOL_MATERIALS } from "@/lib/products";
import { SITE } from "@/lib/site";
import { waQuote } from "@/lib/wa";
import { CtaRow, ProductGroupBlock, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pool materials",
  description:
    "Pumps, filter tanks, skimmers, lights, ladders, waterfalls, gum cement. Astral pool equipment in stock in Lagos.",
};

export default function PoolMaterialsPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-28">
        <p className="eyebrow">{SITE.poolBrand} equipment · in stock</p>
        <h1 className="font-serif mt-4 max-w-2xl text-[clamp(2.4rem,6vw,4rem)] leading-[1.06]">
          Everything a pool needs.
        </h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dusk">
          From the pump to the waterfall. Any item, photos and today&apos;s
          price on WhatsApp.
        </p>
        <div className="mt-8">
          <CtaRow href={waQuote()} label="Send us your materials list" />
        </div>
      </section>

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
