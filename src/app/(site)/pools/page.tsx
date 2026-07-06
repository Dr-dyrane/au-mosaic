import type { Metadata } from "next";
import Link from "next/link";
import { POOL_SERVICES } from "@/lib/products";
import { DAY, OWN, VISUALIZER_SAMPLE } from "@/lib/images";
import { waPool } from "@/lib/wa";
import { CtaRow, PageHero, Section } from "@/components/ui";
import ThemeImage from "@/components/ThemeImage";

export const metadata: Metadata = {
  title: "Swimming pool construction in Lagos",
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
        image={OWN.terrace}
        imageLight={DAY.terrace}
        alt="An infinity pool edge meeting the sea at golden hour"
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

      <Section
        eyebrow="Before water"
        title="Choose on the surface."
        sub="A pool shell is enough. Test the colour before the water arrives."
      >
        <figure>
          <div className="relative -mx-5 aspect-[4/5] overflow-hidden rounded-none bg-shell sm:mx-0 sm:rounded-[26px] md:aspect-[16/10]">
            <ThemeImage
              dark={VISUALIZER_SAMPLE.pool.dark}
              light={VISUALIZER_SAMPLE.pool.light}
              alt={VISUALIZER_SAMPLE.pool.alt}
              fill
              quality={90}
              sizes="(max-width: 640px) 100vw, 90vw"
              className="media-lux object-cover"
            />
          </div>
          <figcaption className="mt-8">
            <Link href="/visualizer" className="link-hair text-dusk">
              Try it on a photo
            </Link>
          </figcaption>
        </figure>
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
