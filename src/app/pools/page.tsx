import type { Metadata } from "next";
import { POOL_SERVICES } from "@/lib/products";
import { LUX } from "@/lib/images";
import { waPool } from "@/lib/wa";
import { CtaRow, PageHero, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pool construction",
  description:
    "New swimming pools built from scratch, renovations, and mosaic replacement in Lagos and beyond.",
};

const PROCESS = [
  { title: "Talk", body: "Your space, your budget, your picture of the pool." },
  { title: "Plan", body: "Size, depth, finish, and equipment. A clear quote per job." },
  { title: "Build", body: "Structure, plumbing, tiling. Our materials, our hands." },
  { title: "Swim", body: "Handover with the water running and the lights on." },
];

export default function PoolsPage() {
  return (
    <>
      <PageHero
        eyebrow="Pool construction"
        title="From first sketch to first swim."
        sub="The tiles, the materials, and the pool itself. One house, one responsibility."
        image={LUX.infinityTerrace}
        alt="An infinity pool meeting the mountains"
        cta={{ href: waPool(), label: "Talk pools on WhatsApp" }}
      />

      <Section title="What we take on">
        <div className="grid gap-5 md:grid-cols-3">
          {POOL_SERVICES.map((s) => (
            <div key={s.title} className="panel">
              <h3 className="font-serif text-[20px]">{s.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-dusk">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tint eyebrow="How it goes" title="Four steps to water.">
        <ol className="grid gap-5 md:grid-cols-4">
          {PROCESS.map((s, i) => (
            <li key={s.title} className="rounded-[24px] bg-sand/80 p-6">
              <p className="eyebrow">Step {i + 1}</p>
              <p className="font-serif mt-3 text-[20px]">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-dusk">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        eyebrow="Already have a tiler?"
        title="We work with your people too."
        sub="Buy the materials from us and your tiler installs. No tiler? We recommend one we trust."
      >
        <CtaRow href={waPool()} label="Get a construction quote" />
      </Section>
    </>
  );
}
