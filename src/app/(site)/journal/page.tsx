import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/journal";
import Reveal from "@/components/Reveal";

/* The Journal's shelf: five guides, each one answer to a question
   people actually search. Typography carries it; the imagery stays
   with the collection. */

export const metadata: Metadata = {
  title: "Mosaic and pool guides for Lagos",
  description:
    "Short, honest guides from AU Mosaic: choosing mosaic tiles, pool tiles, pool construction, pumps, and how prices work in Lagos.",
};

export default function JournalPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-40 pb-24 sm:px-8 sm:pb-32">
      <Reveal>
        <p className="eyebrow">The journal</p>
        <h1 className="font-serif text-display-page mt-4 max-w-2xl">
          Notes from the house.
        </h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dusk">
          Short answers to the questions we hear every week. Each one
          ends where the real conversation happens.
        </p>
      </Reveal>
      <div className="mt-16 grid gap-5 md:grid-cols-2">
        {GUIDES.map((g, i) => (
          <Reveal key={g.slug} delay={(i % 2) * 90}>
            <Link href={`/journal/${g.slug}`} className="panel group block h-full">
              <p className="eyebrow">Guide</p>
              <p className="font-serif mt-3 text-[26px] leading-snug transition-colors duration-300 group-hover:text-gold">
                {g.h1}
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-dusk">{g.line}</p>
              <span className="link-hair mt-5 inline-block text-dusk text-[13px]">
                Read the guide
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
