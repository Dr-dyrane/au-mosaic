import type { Metadata } from "next";
import Image from "next/image";
import { POOL_SERVICES } from "@/lib/products";
import { IMG } from "@/lib/images";
import { waPool } from "@/lib/wa";
import { CtaRow, Section } from "@/components/ui";

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
      <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-28">
        <p className="eyebrow">Pool construction</p>
        <h1 className="font-serif mt-4 max-w-2xl text-[clamp(2.4rem,6vw,4rem)] leading-[1.06]">
          From first sketch to first swim.
        </h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dusk">
          The tiles, the materials, and the pool itself. One house, one
          responsibility.
        </p>
        <div className="mt-8">
          <CtaRow href={waPool()} label="Talk pools on WhatsApp" />
        </div>
        <div className="relative mt-16 aspect-[21/9] overflow-hidden">
          <Image src={IMG.rippledLaneWater} alt="Clear rippled pool water" fill sizes="100vw" className="object-cover" />
        </div>
      </section>

      <Section title="What we take on">
        <div className="grid gap-4 md:grid-cols-3">
          {POOL_SERVICES.map((s) => (
            <div key={s.title} className="hairline pt-6">
              <h3 className="font-serif text-[21px]">{s.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-dusk">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tint eyebrow="How it goes" title="Four steps to water.">
        <ol className="grid gap-4 md:grid-cols-4">
          {PROCESS.map((s, i) => (
            <li key={s.title} className="rounded-3xl bg-sand p-5 shadow-lift">
              <p className="text-sm font-semibold text-terra">Step {i + 1}</p>
              <p className="mt-1 font-semibold tracking-tight">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-dusk">{s.body}</p>
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
