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
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Pools, from first sketch to first swim.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-dusk">
          We sell the tiles and the materials. We also build the pool. One team,
          one responsibility, no finger-pointing.
        </p>
        <div className="mt-8">
          <CtaRow href={waPool()} label="Talk pools on WhatsApp" />
        </div>
        <div className="relative mt-12 h-56 overflow-hidden rounded-3xl shadow-lift sm:h-72">
          <Image src={IMG.rippledLaneWater} alt="Clear rippled pool water" fill sizes="100vw" className="object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        </div>
      </section>

      <Section title="What we take on">
        <div className="grid gap-4 md:grid-cols-3">
          {POOL_SERVICES.map((s) => (
            <div key={s.title} className="rounded-3xl bg-shell p-6 shadow-lift">
              <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-dusk">{s.body}</p>
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
