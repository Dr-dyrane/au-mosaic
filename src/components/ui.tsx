import type { ReactNode } from "react";
import Link from "next/link";
import { waProduct } from "@/lib/wa";
import type { Product, ProductGroup } from "@/lib/products";
import { TileSheet } from "./Mosaic";
import Reveal from "./Reveal";
import ThemeImage from "./ThemeImage";

/* Editorial building blocks. Photography, whitespace, and lucent surfaces
   structure everything. No borders, no lines, one loud thing per screen.
   Tinted sections float as inset squircle bands. */

export function Section({
  eyebrow,
  title,
  sub,
  children,
  tint = false,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  children?: ReactNode;
  tint?: boolean;
}) {
  const inner = (
    <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="font-serif text-display-section mt-4 max-w-xl">{title}</h2>
      {sub && <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">{sub}</p>}
      {children && <div className="mt-14">{children}</div>}
    </div>
  );
  if (!tint) return <section>{inner}</section>;
  return (
    <section className="px-2 sm:px-6">
      <div className="mx-auto max-w-[1400px] rounded-[28px] bg-shell/70 sm:rounded-[40px]">{inner}</div>
    </section>
  );
}

/* Every page opens like a scene: full-bleed image, words on it, the island
   floating above. One skeleton, five pages, zero drift. */
export function PageHero({
  eyebrow,
  title,
  sub,
  image,
  imageLight,
  alt,
  cta,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  image: string;
  imageLight?: string;
  alt: string;
  cta?: { href: string; label: string };
}) {
  return (
    <section className="relative flex min-h-[58svh] items-end overflow-hidden">
      <ThemeImage dark={image} light={imageLight} alt={alt} fill priority quality={90} sizes="100vw" className="kenburns media-lux object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(12,11,9,0.5) 0%, rgba(12,11,9,0.1) 40%, rgba(12,11,9,0.82) 100%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="font-serif text-display-page mt-4 max-w-2xl text-white">{title}</h1>
          {sub && <p className="mt-5 max-w-md text-[16px] leading-relaxed text-white/75">{sub}</p>}
          {cta && (
            <div className="mt-9">
              <a href={cta.href} target="_blank" rel="noopener" data-wa="hero" className="btn-gold">
                {cta.label}
              </a>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

/* Media runs edge to edge on phones (bleed the parent grid with
   -mx-5 sm:mx-0); the words keep their margin. */
export function ProductCard({ item, collection }: { item: Product; collection?: string }) {
  const label = item.variants ? `${item.name} (${item.variants.join(", ")})` : item.name;
  const media = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden rounded-none bg-shell sm:rounded-[22px]">
        {item.image ? (
          <ThemeImage
            dark={item.image}
            light={item.imageLight}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="img-glide media-lux object-cover"
          />
        ) : item.colors ? (
          <TileSheet colors={item.colors} rows={8} cols={7} className="img-glide h-full w-full" />
        ) : null}
        {item.slug && (
          <span className="chip-glass cap-reveal absolute bottom-4 right-4">View the piece</span>
        )}
      </div>
      <div className="px-5 sm:px-0">
        {collection && <p className="eyebrow mt-6">{collection}</p>}
        <h3
          className={`font-serif ${collection ? "mt-2" : "mt-5"} text-[20px] leading-snug transition-colors duration-300 group-hover:text-gold`}
        >
          {item.name}
        </h3>
      </div>
    </>
  );
  return (
    <div className="group">
      {item.slug ? (
        <Link href={`/piece/${item.slug}`} className="block">
          {media}
        </Link>
      ) : (
        media
      )}
      <div className="px-5 sm:px-0">
        {item.variants && (
          <p className="mt-1.5 text-[12px] uppercase tracking-[0.14em] text-mist">{item.variants.join(" · ")}</p>
        )}
        {item.note && <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">{item.note}</p>}
        <a href={waProduct(label)} target="_blank" rel="noopener" data-wa="card" className="link-hair mt-4 text-dusk">
          Enquire
        </a>
      </div>
    </div>
  );
}

export function ProductGroupBlock({ group }: { group: ProductGroup }) {
  return (
    <div id={group.id} className="scroll-mt-24">
      <p className="eyebrow">{group.title}</p>
      <p className="font-serif mt-3 max-w-lg text-[20px] leading-snug">{group.blurb}</p>
      <div className="-mx-5 mt-10 grid gap-x-8 gap-y-14 sm:mx-0 sm:grid-cols-2 lg:grid-cols-3">
        {group.items.map((item) => (
          <ProductCard key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
}

export function CtaRow({ href, label, secondary }: { href: string; label: string; secondary?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-center gap-8">
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noopener"
        data-wa="cta"
        className="btn-gold"
      >
        {label}
      </a>
      {secondary && (
        <a href={secondary.href} className="link-hair text-dusk">
          {secondary.label}
        </a>
      )}
    </div>
  );
}
