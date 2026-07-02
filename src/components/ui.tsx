import type { ReactNode } from "react";
import { waProduct } from "@/lib/wa";
import type { Product, ProductGroup } from "@/lib/products";

/* Shared building blocks. Calm cards, no borders, tint and shadow only. */

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
    <section className={tint ? "bg-shell" : ""}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-widest text-pool">{eyebrow}</p>
        )}
        <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        {sub && <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-dusk">{sub}</p>}
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  );
}

export function ProductCard({ item }: { item: Product }) {
  const label = item.variants ? `${item.name} (${item.variants.join(", ")})` : item.name;
  return (
    <a
      href={waProduct(label)}
      target="_blank"
      rel="noopener"
      className="group flex flex-col justify-between rounded-3xl bg-shell p-5 shadow-lift transition-transform hover:-translate-y-0.5"
    >
      <div>
        <p className="font-semibold tracking-tight">{item.name}</p>
        {item.variants && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.variants.map((v) => (
              <span key={v} className="rounded-full bg-aqua-soft px-2.5 py-1 text-xs font-medium text-pool-deep">
                {v}
              </span>
            ))}
          </div>
        )}
        {item.note && <p className="mt-2 text-sm leading-relaxed text-dusk">{item.note}</p>}
      </div>
      <p className="mt-4 text-sm font-semibold text-pool group-hover:underline">
        Photos and price on WhatsApp
      </p>
    </a>
  );
}

export function ProductGroupBlock({ group }: { group: ProductGroup }) {
  return (
    <div id={group.id}>
      <h3 className="text-xl font-semibold tracking-tight">{group.title}</h3>
      <p className="mt-1 max-w-xl text-[15px] text-dusk">{group.blurb}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {group.items.map((item) => (
          <ProductCard key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
}

export function CtaRow({ href, label, secondary }: { href: string; label: string; secondary?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noopener"
        className="rounded-full bg-pool px-6 py-3.5 text-[15px] font-semibold text-white shadow-lift transition-transform hover:scale-[1.02] active:scale-95"
      >
        {label}
      </a>
      {secondary && (
        <a
          href={secondary.href}
          className="rounded-full px-5 py-3.5 text-[15px] font-semibold text-pool-deep hover:bg-ink/5"
        >
          {secondary.label}
        </a>
      )}
    </div>
  );
}
