import Link from "next/link";
import { SITE } from "@/lib/site";
import { getMosaicRanges, getProjects } from "@/lib/catalog";
import { DAY, ENVIRONMENTS, OWN } from "@/lib/images";
import { waPool, waQuote } from "@/lib/wa";
import Reveal from "@/components/Reveal";
import Proof from "@/components/Proof";
import SceneFrame from "@/components/SceneFrame";
import ThemeImage from "@/components/ThemeImage";
import ProjectCard from "@/components/ProjectCard";
import { ProductCard } from "@/components/ui";

/* The Mosaic Maison. Story first, products second. One loud thing per
   screen; everything else whispers. */

const MATERIALS = [
  { title: "Pool mosaic", line: "Designed for water, light, and time.", href: "/mosaic-tiles#pool-mosaics", src: OWN.poolBlues, srcDay: DAY.poolBlues },
  { title: "Glass mosaic", line: "Colour you can stand in.", href: "/mosaic-tiles#glass-mosaics", src: OWN.glassJewels, srcDay: DAY.glassJewels },
  { title: "Art mosaic", line: "Pictures made of stone and glass.", href: "/mosaic-tiles#feature-mosaics", src: OWN.koiMural, srcDay: DAY.koiMural },
];

export default async function Home() {
  const ranges = await getMosaicRanges();
  const projects = (await getProjects()).slice(0, 2);
  const picks = [
    { ...ranges[0].items[0], collection: "Pool mosaic" },
    { ...ranges[0].items[3], collection: "Pool mosaic" },
    { ...ranges[1].items[0], collection: "Glass mosaic" },
    { ...ranges[2].items[0], collection: "Art mosaic" },
    { ...ranges[2].items[1], collection: "Art mosaic" },
  ];
  return (
    <>
      {/* Cinematic hero: the island floats over it, the image owns the screen */}
      <section className="relative flex min-h-svh items-end overflow-hidden">
        <SceneFrame
          dark={OWN.heroDusk}
          light={DAY.heroDusk}
          alt="A villa over an infinity pool of aquamarine mosaic"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="kenburns media-lux object-cover"
        >
          <div className="scrim-hero pointer-events-none absolute inset-0" />
          <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
            <Reveal>
              <p className="eyebrow scene-eyebrow">AU Mosaic · Lagos</p>
              <h1 className="font-serif text-display-hero scene-title mt-5 max-w-3xl">
                Spaces that begin with water.
              </h1>
              <p className="scene-sub mt-6 max-w-md text-[16px] leading-relaxed">
                Mosaic for pools, walls, and rooms people remember.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-8">
                <a href={waQuote()} target="_blank" rel="noopener" data-wa="hero" className="btn-gold">
                  Begin a project
                </a>
                <Link href="/mosaic-tiles" className="link-hair scene-link">
                  View the collection
                </Link>
              </div>
            </Reveal>
          </div>
        </SceneFrame>
      </section>

      {/* Environments: the dream first */}
      <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
        <Reveal>
          <p className="eyebrow">Environments</p>
          <h2 className="font-serif text-display-section mt-4 max-w-xl">
            Begin with the dream.
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-dusk">
            Nobody buys tiles. They buy the villa, the evening, the calm.
            The materials come after.
          </p>
        </Reveal>

        <div className="-mx-5 mt-16 grid gap-x-8 gap-y-20 sm:mx-0 sm:grid-cols-2">
          {ENVIRONMENTS.map((e, i) => (
            <Reveal key={e.place} delay={(i % 2) * 90} className={i % 2 === 1 ? "sm:mt-24" : ""}>
              <Link href={e.href} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-none sm:rounded-[26px]">
                  <SceneFrame
                    dark={e.src}
                    light={e.srcDay}
                    alt={e.place}
                    fill
                    quality={90}
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="img-glide media-lux object-cover"
                  >
                    <div className="scrim-card pointer-events-none absolute inset-0" />
                    <div className="scene-deepen absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 p-7 sm:p-8">
                      <p className="eyebrow scene-eyebrow">{e.place}</p>
                      <p className="font-serif scene-title mt-2 text-[26px] leading-snug">{e.line}</p>
                      <div className="cap-reveal mt-3">
                        <p className="scene-sub max-w-xs text-[14px] leading-relaxed">{e.materials}</p>
                        <span className="link-hair scene-link mt-5">The materials behind it</span>
                      </div>
                    </div>
                  </SceneFrame>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Materials: three ways to build with light */}
      <section className="px-4 sm:px-6">
        <div className="mx-auto max-w-[1400px] rounded-[40px] bg-shell/70">
          <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
            <Reveal>
              <p className="eyebrow">Materials</p>
              <h2 className="font-serif text-display-section mt-4 max-w-xl">
                Three ways to build with light.
              </h2>
            </Reveal>
            <div className="-mx-5 mt-16 grid gap-10 sm:mx-0 sm:grid-cols-3">
              {MATERIALS.map((m, i) => (
                <Reveal key={m.title} delay={i * 90}>
                  <Link href={m.href} className="group block">
                    <div className="relative aspect-square overflow-hidden rounded-none sm:rounded-[22px]">
                      <ThemeImage dark={m.src} light={m.srcDay} alt={m.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="img-glide media-lux object-cover" />
                    </div>
                    <div className="px-5 sm:px-0">
                      <h3 className="font-serif mt-6 text-[20px] transition-colors duration-300 group-hover:text-gold">{m.title}</h3>
                      <p className="mt-2 text-[14px] text-dusk">{m.line}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lifestyle: one full-bleed breath */}
      <section className="relative flex min-h-[70svh] items-center overflow-hidden">
        <SceneFrame
          dark={OWN.villaPalms}
          light={DAY.villaPalms}
          alt="A stone villa and palms mirrored in still mosaic water"
          fill
          quality={90}
          sizes="100vw"
          className="parallax-y media-lux object-cover"
        >
          <div className="scrim-wash pointer-events-none absolute inset-0" />
          <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
            <Reveal>
              <p className="font-serif text-display-section scene-title max-w-2xl">
                The room people remember is the one you built slowly.
              </p>
            </Reveal>
          </div>
        </SceneFrame>
      </section>

      {/* The collection: five, not five hundred */}
      <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
        <Reveal>
          <p className="eyebrow">The collection</p>
          <h2 className="font-serif text-display-section mt-4 max-w-xl">
            Five pieces. The rest when you are ready.
          </h2>
        </Reveal>
        <div className="-mx-5 mt-16 grid gap-x-8 gap-y-16 sm:mx-0 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((p, i) => (
            <Reveal key={p.name} delay={(i % 3) * 80}>
              <ProductCard item={p} collection={p.collection} />
            </Reveal>
          ))}
          <Reveal delay={160} className="mx-5 sm:mx-0">
            <Link href="/mosaic-tiles" className="panel group flex h-full min-h-64 flex-col justify-center">
              <p className="font-serif text-[26px] leading-snug transition-colors duration-300 group-hover:text-gold">
                Explore the collection
              </p>
              <p className="mt-2 text-[14px] text-mist">Every range, every colour, from stock.</p>
              <span className="link-hair mt-6 text-dusk">Enter</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Craftsmanship */}
      <section>
        <div className="mx-auto max-w-6xl gap-16 px-5 py-28 sm:grid sm:grid-cols-2 sm:px-8 sm:py-36">
          <Reveal className="-mx-5 sm:mx-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-none sm:rounded-[26px]">
              <ThemeImage dark={OWN.craftHands} light={DAY.craftHands} alt="Gloved hands pressing blue mosaic into fresh adhesive" fill quality={90} sizes="(max-width: 640px) 100vw, 50vw" className="media-lux object-cover" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-10 sm:mt-0">
              <p className="eyebrow">Craft</p>
              <h2 className="font-serif text-display-section mt-4">
                Why our surfaces last.
              </h2>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-dusk">
                Mosaic fails when the adhesive fails. Ours does not. Spanish
                Kerakoll sits beneath every surface we install, and we tell
                every client the honest difference before they buy.
              </p>
              <a href={waPool()} target="_blank" rel="noopener" data-wa="craft" className="link-hair mt-8 text-dusk">
                Build a pool with us
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The proof: the stat prose becomes four stones the eye can
          rest on, every one true across the counter. */}
      <section className="mx-auto max-w-6xl px-5 pb-28 sm:px-8 sm:pb-36">
        <Proof />
      </section>

      {/* The work: two projects, then the rest */}
      <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
        <Reveal>
          <p className="eyebrow">Projects</p>
          <h2 className="font-serif text-display-section mt-4 max-w-xl">
            The work speaks quietly.
          </h2>
        </Reveal>
        <div className="-mx-5 mt-16 grid gap-x-8 gap-y-16 sm:mx-0 sm:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 2) * 90}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-12">
            <Link href="/projects" className="link-hair text-dusk">
              All projects
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Final invitation */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-32 text-center sm:px-8 sm:py-44">
          <Reveal>
            <p className="eyebrow">{SITE.location}</p>
            <h2 className="font-serif text-display-page mx-auto mt-5 max-w-2xl">
              Begin your project.
            </h2>
            <p className="mx-auto mt-5 max-w-sm text-[14px] leading-relaxed text-dusk">
              One message starts it. Photos and a quote follow the same day.
            </p>
            <div className="mt-10">
              <a href={waQuote()} target="_blank" rel="noopener" data-wa="close" className="btn-gold">
                Speak with the house
              </a>
            </div>
            <p className="mt-6 text-[12px] tracking-wide text-mist">{SITE.phoneDisplay} · {SITE.hours}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
