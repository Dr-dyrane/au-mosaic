import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";
import { MOSAIC_RANGES } from "@/lib/products";
import { ENVIRONMENTS, IMG, LUX } from "@/lib/images";
import { waPool, waQuote } from "@/lib/wa";
import Reveal from "@/components/Reveal";
import { ProductCard } from "@/components/ui";

/* The Mosaic Maison. Story first, products second. One loud thing per
   screen; everything else whispers. */

const COLLECTION_PICKS = [
  { ...MOSAIC_RANGES[0].items[0], collection: "Pool mosaic" },
  { ...MOSAIC_RANGES[0].items[3], collection: "Pool mosaic" },
  { ...MOSAIC_RANGES[1].items[0], collection: "Glass mosaic" },
  { ...MOSAIC_RANGES[2].items[0], collection: "Art mosaic" },
  { ...MOSAIC_RANGES[2].items[1], collection: "Art mosaic" },
];

const MATERIALS = [
  { title: "Pool mosaic", line: "Designed for water, light, and time.", href: "/mosaic-tiles#pool-mosaics", src: IMG.poolBlueMosaic },
  { title: "Glass mosaic", line: "Colour you can stand in.", href: "/mosaic-tiles#glass-mosaics", src: IMG.vibrantGlassMosaic },
  { title: "Art mosaic", line: "Pictures made of stone and glass.", href: "/mosaic-tiles#feature-mosaics", src: IMG.fishMosaicPool },
];

export default function Home() {
  return (
    <>
      {/* Cinematic hero */}
      <section className="relative flex min-h-[92svh] items-end overflow-hidden">
        <Image
          src={LUX.villaDusk}
          alt="A villa pool holding the last light of dusk"
          fill
          priority
          sizes="100vw"
          className="kenburns object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,11,9,0.55) 0%, rgba(12,11,9,0.12) 40%, rgba(12,11,9,0.82) 100%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
          <Reveal>
            <p className="eyebrow">AU Mosaic · Lagos</p>
            <h1 className="font-serif mt-5 max-w-3xl text-[clamp(2.8rem,8vw,5.5rem)] leading-[1.04] text-white">
              Spaces that begin with water.
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/80">
              Mosaic for pools, walls, and rooms people remember.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-8">
              <a href={waQuote()} target="_blank" rel="noopener" className="btn-gold">
                Begin a project
              </a>
              <Link href="/mosaic-tiles" className="link-hair text-white">
                View the collection
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Environments: the dream first */}
      <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
        <Reveal>
          <p className="eyebrow">Environments</p>
          <h2 className="font-serif mt-4 max-w-xl text-[clamp(1.9rem,4vw,3rem)] leading-tight">
            Begin with the dream.
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-dusk">
            Nobody buys tiles. They buy the villa, the evening, the calm.
            The materials come after.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-x-8 gap-y-20 sm:grid-cols-2">
          {ENVIRONMENTS.map((e, i) => (
            <Reveal key={e.place} delay={(i % 2) * 90} className={i % 2 === 1 ? "sm:mt-24" : ""}>
              <Link href={e.href} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={e.src}
                    alt={e.place}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="img-glide object-cover"
                  />
                </div>
                <p className="eyebrow mt-7">{e.place}</p>
                <p className="font-serif mt-3 text-[26px] leading-snug">{e.line}</p>
                <p className="mt-3 text-[14px] leading-relaxed text-mist">{e.materials}</p>
                <span className="link-hair mt-6 text-dusk">The materials behind it</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Materials: three ways to build with light */}
      <section className="hairline">
        <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
          <Reveal>
            <p className="eyebrow">Materials</p>
            <h2 className="font-serif mt-4 max-w-xl text-[clamp(1.9rem,4vw,3rem)] leading-tight">
              Three ways to build with light.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-10 sm:grid-cols-3">
            {MATERIALS.map((m, i) => (
              <Reveal key={m.title} delay={i * 90}>
                <Link href={m.href} className="group block">
                  <div className="relative aspect-square overflow-hidden">
                    <Image src={m.src} alt={m.title} fill sizes="33vw" className="img-glide object-cover" />
                  </div>
                  <h3 className="font-serif mt-6 text-[22px]">{m.title}</h3>
                  <p className="mt-2 text-[14px] text-dusk">{m.line}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Lifestyle: one full-bleed breath */}
      <section className="relative flex min-h-[70svh] items-center overflow-hidden">
        <Image
          src={LUX.villaPalms}
          alt="A villa resting beside still water"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(12,11,9,0.45)]" />
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
          <Reveal>
            <p className="font-serif max-w-2xl text-[clamp(1.8rem,4.5vw,3.2rem)] leading-tight text-white">
              The room people remember is the one you built slowly.
            </p>
          </Reveal>
        </div>
      </section>

      {/* The collection: five, not five hundred */}
      <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
        <Reveal>
          <p className="eyebrow">The collection</p>
          <h2 className="font-serif mt-4 max-w-xl text-[clamp(1.9rem,4vw,3rem)] leading-tight">
            Five pieces. The rest when you are ready.
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTION_PICKS.map((p, i) => (
            <Reveal key={p.name} delay={(i % 3) * 80}>
              <ProductCard item={p} collection={p.collection} />
            </Reveal>
          ))}
          <Reveal delay={160}>
            <Link href="/mosaic-tiles" className="group flex h-full min-h-64 flex-col justify-center hairline p-8">
              <p className="font-serif text-[24px] leading-snug">Explore the collection</p>
              <p className="mt-2 text-[14px] text-mist">Every range, every colour, from stock.</p>
              <span className="link-hair mt-6 text-dusk">Enter</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Craftsmanship */}
      <section className="hairline">
        <div className="mx-auto max-w-6xl gap-16 px-5 py-28 sm:grid sm:grid-cols-2 sm:px-8 sm:py-36">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image src={IMG.bluePatternTiles} alt="Patterned mosaic, laid by hand" fill sizes="50vw" className="object-cover" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-10 sm:mt-0">
              <p className="eyebrow">Craft</p>
              <h2 className="font-serif mt-4 text-[clamp(1.9rem,4vw,3rem)] leading-tight">
                Why our surfaces last.
              </h2>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-dusk">
                Mosaic fails when the adhesive fails. Ours does not. Spanish
                Kerakoll sits beneath every surface we install, and we tell
                every client the honest difference before they buy.
              </p>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-dusk">
                Ten years in the market. Our own factory line in {SITE.factory}.
                The largest mosaic stock on the ground in Lagos.
              </p>
              <a href={waPool()} target="_blank" rel="noopener" className="link-hair mt-8 text-dusk">
                Build a pool with us
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final invitation */}
      <section className="hairline">
        <div className="mx-auto max-w-6xl px-5 py-32 text-center sm:px-8 sm:py-44">
          <Reveal>
            <p className="eyebrow">{SITE.location}</p>
            <h2 className="font-serif mx-auto mt-5 max-w-2xl text-[clamp(2.2rem,6vw,4rem)] leading-tight">
              Begin your project.
            </h2>
            <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-dusk">
              One message starts it. Photos and a quote follow the same day.
            </p>
            <div className="mt-10">
              <a href={waQuote()} target="_blank" rel="noopener" className="btn-gold">
                Speak with the house
              </a>
            </div>
            <p className="mt-6 text-[13px] tracking-wide text-mist">{SITE.phoneDisplay} · {SITE.hours}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
