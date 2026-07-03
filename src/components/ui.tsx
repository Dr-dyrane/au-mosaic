import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { waProduct } from "@/lib/wa";
import type { Product, ProductGroup } from "@/lib/products";
import { TileSheet } from "./Mosaic";
import Reveal from "./Reveal";

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
      <h2 className="font-serif mt-4 max-w-xl text-[clamp(1.8rem,4vw,2.8rem)] leading-tight">{title}</h2>
      {sub && <p className="mt-4 max-w-md text-[15px] leading-relaxed text-dusk">{sub}</p>}
      {children && <div className="mt-14">{children}</div>}
    </div>
  );
  if (!tint) return <section>{inner}</section>;
  return (
    <section className="px-4 sm:px-6">
      <div className="mx-auto max-w-[1400px] rounded-[40px] bg-shell/70">{inner}</div>
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
  alt,
  cta,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  image: string;
  alt: string;
  cta?: { href: string; label: string };
}) {
  return (
    <section className="relative flex min-h-[58svh] items-end overflow-hidden">
      <Image src={image} alt={alt} fill priority sizes="100vw" className="object-cover" />
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
          <h1 className="font-serif mt-4 max-w-2xl text-[clamp(2.4rem,6.5vw,4.2rem)] leading-[1.05] text-white">
            {title}
          </h1>
          {sub && <p className="mt-5 max-w-md text-[16px] leading-relaxed text-white/75">{sub}</p>}
          {cta && (
            <div className="mt-9">
              <a href={cta.href} target="_blank" rel="noopener" className="btn-gold">
                {cta.label}
              </a>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export function ProductCard({ item, collection }: { item: Product; collection?: string }) {
  const label = item.variants ? `${item.name} (${item.variants.join(", ")})` : item.name;
  const media = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-shell">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="img-glide object-cover"
          />
        ) : item.colors ? (
          <TileSheet colors={item.colors} rows={8} cols={7} className="img-glide h-full w-full" />
        ) : null}
        {item.slug && (
          <span className="chip-glass cap-reveal absolute bottom-4 right-4">View the piece</span>
        )}
      </div>
      {collection && <p className="eyebrow mt-6">{collection}</p>}
      <h3
        className={`font-serif ${collection ? "mt-2" : "mt-5"} text-[20px] leading-snug transition-colors duration-300 group-hover:text-gold`}
      >
        {item.name}
      </h3>
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
      {item.variants && (
        <p className="mt-1.5 text-[12px] uppercase tracking-[0.14em] text-mist">{item.variants.join(" · ")}</p>
      )}
      {item.note && <p className="mt-1.5 text-[14px] leading-relaxed text-dusk">{item.note}</p>}
      <a href={waProduct(label)} target="_blank" rel="noopener" className="link-hair mt-4 text-dusk">
        Enquire
      </a>
    </div>
  );
}

export function ProductGroupBlock({ group }: { group: ProductGroup }) {
  return (
    <div id={group.id} className="scroll-mt-24">
      <p className="eyebrow">{group.title}</p>
      <p className="font-serif mt-3 max-w-lg text-[22px] leading-snug">{group.blurb}</p>
      <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
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
