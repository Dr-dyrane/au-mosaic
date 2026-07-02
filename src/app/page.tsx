import Link from "next/link";
import { SITE } from "@/lib/site";
import { BUYING_STEPS, MOSAIC_RANGES } from "@/lib/products";
import { waPool, waQuote } from "@/lib/wa";
import { TileSheet, WaterHero } from "@/components/Mosaic";
import { CtaRow, Section } from "@/components/ui";

const TRUST = [
  { n: SITE.yearsInBusiness, label: "years in mosaic" },
  { n: "1000s", label: "of tiles in stock" },
  { n: "Direct", label: "factory prices" },
  { n: "Pools", label: "built from scratch" },
];

const OFFERS = [
  {
    href: "/mosaic-tiles",
    title: "Mosaic tiles",
    body: "Every colour, every blend. Most mosaic samples you see online in Nigeria come from this store.",
  },
  {
    href: "/pool-materials",
    title: "Pool materials",
    body: "Pumps, filters, lights, gum cement. The full Astral range, on the shelf.",
  },
  {
    href: "/pools",
    title: "Pool construction",
    body: "New pools and renovations, from first sketch to first swim.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero: standing at the edge of the water */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <WaterHero className="rounded-[2rem] shadow-lift">
          <div className="px-6 py-16 sm:px-14 sm:py-24">
            <p className="text-xs font-semibold uppercase tracking-widest text-aqua">
              {SITE.location}
            </p>
            <h1 className="mt-3 max-w-2xl text-5xl font-semibold tracking-tight text-white sm:text-7xl">
              Everything mosaic.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/85">
              Nigeria&apos;s home of mosaic tiles and pool materials. Largest stock
              on ground, direct from our factory in {SITE.factory}.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={waQuote()}
                target="_blank"
                rel="noopener"
                className="rounded-full bg-white px-6 py-3.5 text-[15px] font-semibold text-pool-deep shadow-lift transition-transform hover:scale-[1.02] active:scale-95"
              >
                Get a quote on WhatsApp
              </a>
              <Link
                href="/mosaic-tiles"
                className="rounded-full px-5 py-3.5 text-[15px] font-semibold text-white/90 hover:bg-white/10"
              >
                Browse tiles
              </Link>
            </div>
          </div>
        </WaterHero>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.label} className="rounded-3xl bg-shell p-5 text-center shadow-lift">
              <p className="text-2xl font-semibold tracking-tight text-pool-deep">{t.n}</p>
              <p className="mt-1 text-sm text-dusk">{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we do */}
      <Section eyebrow="What we do" title="Tiles, materials, and the pool itself.">
        <div className="grid gap-4 md:grid-cols-3">
          {OFFERS.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              className="group rounded-3xl bg-shell p-6 shadow-lift transition-transform hover:-translate-y-0.5"
            >
              <h3 className="text-lg font-semibold tracking-tight">{o.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-dusk">{o.body}</p>
              <p className="mt-4 text-sm font-semibold text-pool group-hover:underline">Explore</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* Best sellers */}
      <Section
        tint
        eyebrow="Best sellers"
        title="Pool mosaics, always in demand."
        sub="Pools are being built everywhere, and mosaic is the tile they trust. These blends move fastest."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOSAIC_RANGES[0].items.map((t) => (
            <div key={t.name} className="overflow-hidden rounded-3xl bg-sand shadow-lift">
              {t.colors && <TileSheet colors={t.colors} rows={4} cols={8} className="h-28 w-full" />}
              <div className="p-5">
                <p className="font-semibold tracking-tight">{t.name}</p>
                {t.note && <p className="mt-1 text-sm text-dusk">{t.note}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <CtaRow href="/mosaic-tiles" label="See all mosaic ranges" />
        </div>
      </Section>

      {/* Education: why mosaics fall */}
      <Section
        eyebrow="Worth knowing"
        title="Why mosaics fall off. And why ours don't."
        sub="Nine times out of ten, it's the gum cement. Substandard adhesive fails, and the mosaic gets the blame. We sell and use adhesives that hold, and we'll tell you exactly what your tiler should use."
      >
        <CtaRow
          href={waQuote()}
          label="Ask us about gum cement"
          secondary={{ href: "/pool-materials#tiling-finishing", label: "See tiling materials" }}
        />
      </Section>

      {/* How buying works */}
      <Section
        tint
        eyebrow="How it works"
        title="Buying, the market way. Online."
        sub="The same way it works at our showroom, without the trip."
      >
        <ol className="grid gap-4 md:grid-cols-4">
          {BUYING_STEPS.map((s, i) => (
            <li key={s.title} className="rounded-3xl bg-sand p-5 shadow-lift">
              <p className="text-sm font-semibold text-terra">Step {i + 1}</p>
              <p className="mt-1 font-semibold tracking-tight">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-dusk">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="rounded-[2rem] bg-pool-deep px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Building a pool? Start with us.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/75">
            Tiles, materials, and construction from one store that has done it for {SITE.yearsInBusiness} years.
          </p>
          <div className="mt-7 flex justify-center">
            <CtaRow href={waPool()} label="Talk pools on WhatsApp" />
          </div>
        </div>
      </section>
    </>
  );
}
