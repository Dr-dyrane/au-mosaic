import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide, waGuide } from "@/lib/journal";
import { SITE } from "@/lib/site";
import Reveal from "@/components/Reveal";

/* One guide: house voice above, search-plain title in the tab, FAQ
   answered on the page and in schema, and the close where every real
   conversation lives. Static, like the rest of the shop window. */

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return { title: guide.title, description: guide.description };
}

export default async function GuidePage({ params }: { params: Params }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();

  const base = SITE.url.replace(/\/$/, "");
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const crumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: "The journal", item: `${base}/journal` },
      { "@type": "ListItem", position: 3, name: guide.title, item: `${base}/journal/${guide.slug}` },
    ],
  };

  return (
    <article className="mx-auto max-w-6xl px-5 pt-40 pb-24 sm:px-8 sm:pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsLd) }}
      />
      <Reveal>
        <Link href="/journal" className="link-hair text-dusk text-[13px]">
          The journal
        </Link>
        <h1 className="font-serif text-display-page mt-6 max-w-2xl">{guide.h1}</h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dusk">{guide.line}</p>
      </Reveal>

      <div className="mt-16 max-w-2xl">
        {guide.sections.map((s, i) => (
          <Reveal key={s.h} delay={i === 0 ? 0 : 60} className={i === 0 ? "" : "mt-14"}>
            <h2 className="font-serif text-[26px]">{s.h}</h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 24)} className="mt-4 text-[16px] leading-relaxed text-dusk">
                {p}
              </p>
            ))}
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-20 max-w-2xl">
        <div className="panel">
          <p className="eyebrow">Asked every week</p>
          <div className="mt-2">
            {guide.faq.map((f) => (
              <div key={f.q} className="mt-6">
                <p className="font-serif text-[20px]">{f.q}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-dusk">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal className="mt-16">
        <div className="flex flex-wrap items-center gap-8">
          <a
            href={waGuide(guide)}
            target="_blank"
            rel="noopener"
            data-wa={`journal-${guide.slug}`}
            className="btn-gold"
          >
            {guide.waLabel}
          </a>
          <Link href={guide.related.href} className="link-hair text-dusk">
            {guide.related.label}
          </Link>
        </div>
      </Reveal>
    </article>
  );
}
