import type { Metadata } from "next";
import Link from "next/link";
import { getBuyingSteps, getPoolServices } from "@/lib/catalog";
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

const STACK = [
  { title: "Shell", body: "Shape, depth, steps, returns, and the site reality before finishes begin." },
  { title: "Surface", body: "Pool mosaic, waterline bands, coping, deck tile, grout, and adhesive." },
  { title: "Circulation", body: "Pump, filter tank, sand, skimmer, drain, nozzles, flange, and pipework." },
  { title: "Light and care", body: "Pool light, transformer, chlorinator, waterfall, and handover guidance." },
];

const SCENES = [
  {
    eyebrow: "Pool finish",
    title: "Blue chosen before the water arrives.",
    body: "The pool edge is where colour becomes atmosphere. We test the sheet against light, coping, and depth.",
    dark: OWN.poolEdge,
    light: DAY.poolEdge,
    alt: "Blue mosaic at the edge of a swimming pool",
  },
  {
    eyebrow: "Equipment",
    title: "The quiet machinery matters.",
    body: "A beautiful pool still needs the right pump, filter, fittings, and chemistry behind it.",
    dark: OWN.poolKit,
    light: DAY.poolKit,
    alt: "A pump, filter tank, ladder, and fittings beside mosaic samples",
  },
];

export default async function PoolsPage() {
  const [services, buyingSteps] = await Promise.all([getPoolServices(), getBuyingSteps()]);

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

      <Section
        eyebrow="Before water"
        title="Start with the empty pool."
        sub="The shell is the honest picture. Try the tile before water, light, and reflections make the decision harder."
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-stretch">
          <figure>
            <div className="relative -mx-5 aspect-[4/5] overflow-hidden rounded-none bg-shell sm:mx-0 sm:rounded-[26px] lg:aspect-[16/11]">
              <ThemeImage
                dark={VISUALIZER_SAMPLE.pool.dark}
                light={VISUALIZER_SAMPLE.pool.light}
                alt={VISUALIZER_SAMPLE.pool.alt}
                fill
                quality={90}
                sizes="(max-width: 640px) 100vw, 66vw"
                className="media-lux object-cover"
              />
            </div>
          </figure>
          <div className="panel flex flex-col justify-between">
            <div>
              <p className="eyebrow">Useful before beautiful</p>
              <h3 className="font-serif mt-4 text-[26px] leading-tight">See the surface first.</h3>
              <p className="mt-4 text-[14px] leading-relaxed text-dusk">
                This is the practical image for the visualizer: an empty pool, no tile yet, ready to wear the colour.
              </p>
              <div className="mt-8 space-y-5">
                <p className="text-[14px] leading-relaxed text-dusk">Test pool blues against the real shell.</p>
                <p className="text-[14px] leading-relaxed text-dusk">Compare day and night before ordering.</p>
                <p className="text-[14px] leading-relaxed text-dusk">Keep the dream tied to build decisions.</p>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-8">
              <Link href="/visualizer" className="link-hair text-dusk">
                Try the empty pool
              </Link>
              <Link href="/mosaic-tiles#pool-mosaics" className="link-hair text-dusk">
                Choose pool mosaics
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section title="What we take on">
        <div className="grid gap-5 md:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="panel">
              <h3 className="font-serif text-[20px]">{s.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-dusk">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        tint
        eyebrow="The stack"
        title="One quote, every layer."
        sub="A pool is not one purchase. It is a set of decisions that need to agree before the first swim."
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STACK.map((item) => (
            <div key={item.title} className="panel bg-paper/70">
              <h3 className="font-serif text-[20px]">{item.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-dusk">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Build scenes"
        title="The tile and the machinery belong together."
        sub="The page should show both: the pool people remember, and the parts that keep it alive."
      >
        <div className="grid gap-10 lg:grid-cols-2">
          {SCENES.map((scene) => (
            <article key={scene.title}>
              <div className="relative -mx-5 aspect-[4/5] overflow-hidden rounded-none bg-shell sm:mx-0 sm:rounded-[26px] md:aspect-[16/11]">
                <ThemeImage
                  dark={scene.dark}
                  light={scene.light}
                  alt={scene.alt}
                  fill
                  quality={90}
                  sizes="(max-width: 640px) 100vw, 45vw"
                  className="media-lux object-cover"
                />
              </div>
              <div className="mt-7 px-5 sm:px-0">
                <p className="eyebrow">{scene.eyebrow}</p>
                <h3 className="font-serif mt-3 text-[26px] leading-tight">{scene.title}</h3>
                <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">{scene.body}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        tint
        eyebrow="How it goes"
        title="Four steps to water."
        sub="The dream stays big. The next move stays simple."
      >
        <ol className="grid gap-5 md:grid-cols-4">
          {PROCESS.map((s, i) => (
            <li key={s.title} className="panel bg-paper/70">
              <p className="eyebrow">Step {i + 1}</p>
              <p className="font-serif mt-3 text-[20px]">{s.title}</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        eyebrow="Materials only"
        title="Already have hands on site?"
        sub="Use the same pool counter. We send real stock photos and quote the parts your tiler needs."
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] lg:items-center">
          <div className="relative -mx-5 aspect-[4/3] overflow-hidden rounded-none bg-shell sm:mx-0 sm:rounded-[26px]">
            <ThemeImage
              dark={OWN.materialsCounter}
              light={DAY.materialsCounter}
              alt="Pool equipment and mosaic samples on a materials counter"
              fill
              quality={90}
              sizes="(max-width: 640px) 100vw, 42vw"
              className="media-lux object-cover"
            />
          </div>
          <ol className="grid gap-5 sm:grid-cols-2">
            {buyingSteps.map((step, i) => (
              <li key={step.title} className="panel">
                <p className="eyebrow">Supply {i + 1}</p>
                <p className="font-serif mt-3 text-[20px]">{step.title}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section
        tint
        eyebrow="Construction quote"
        title="Bring the pool size. We will bring the path."
        sub="New build, renovation, mosaic replacement, or materials only. One message is enough to start."
      >
        <CtaRow
          href={waPool()}
          label="Get a construction quote"
          secondary={{ href: "/pool-materials", label: "See pool materials" }}
        />
      </Section>
    </>
  );
}
