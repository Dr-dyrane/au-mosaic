import type { ReactNode } from "react";
import Image from "next/image";
import { waProduct } from "@/lib/wa";
import type { Product, ProductGroup } from "@/lib/products";
import { TileSheet } from "./Mosaic";

/* Editorial building blocks. Photography separates; hairlines and
   whitespace structure. No cards, no borders, one loud thing per screen. */

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
  return (
    <section className={tint ? "hairline" : ""}>
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="font-serif mt-4 max-w-xl text-[clamp(1.8rem,4vw,2.8rem)] leading-tight">{title}</h2>
        {sub && <p className="mt-4 max-w-md text-[15px] leading-relaxed text-dusk">{sub}</p>}
        {children && <div className="mt-14">{children}</div>}
      </div>
    </section>
  );
}

export function ProductCard({ item }: { item: Product }) {
  const label = item.variants ? `${item.name} (${item.variants.join(", ")})` : item.name;
  return (
    <div className="group">
      <div className="relative aspect-[4/5] overflow-hidden bg-shell">
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
      </div>
      <h3 className="font-serif mt-5 text-[20px] leading-snug">{item.name}</h3>
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
