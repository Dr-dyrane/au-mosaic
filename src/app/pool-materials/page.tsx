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
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-pool">
          {SITE.poolBrand} equipment · in stock
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Everything a pool needs.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-dusk">
          From the pump to the waterfall. Tap any item for photos and today&apos;s
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
