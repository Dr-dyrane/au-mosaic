import Link from "next/link";
import { NAV, SITE } from "@/lib/site";
import { getFacts } from "@/lib/facts";
import { waGeneral } from "@/lib/wa";
import { AuLockup } from "./Mosaic";
import PalettePicker from "./PalettePicker";

export default async function Footer() {
  /* Visit facts come from the book he edits; site.ts stands behind. */
  const facts = await getFacts();
  return (
    <footer className="mt-32 px-2 pb-2 sm:px-6 sm:pb-4">
      <div className="mx-auto max-w-[1400px] rounded-[28px] bg-shell/70 sm:rounded-[40px]">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 pb-10 pt-16 sm:px-8 md:grid-cols-3">
        <div>
          <AuLockup className="text-[16px]" />
          <p className="font-serif mt-6 max-w-xs text-[20px] leading-snug text-dusk">
            Everything mosaic, and the water it belongs to.
          </p>
        </div>

        <div>
          <p className="eyebrow">Visit</p>
          <p className="mt-5 text-[14px] leading-relaxed text-dusk">{facts.location}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-dusk">{facts.hours}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-dusk">{facts.phoneDisplay}</p>
          <a href={waGeneral()} target="_blank" rel="noopener" data-wa="footer" className="link-hair mt-6 text-dusk">
            WhatsApp the house
          </a>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            <a href={facts.instagram} target="_blank" rel="noopener" className="text-[14px] text-dusk transition-colors duration-300 hover:text-ink">
              Instagram
            </a>
            <a href={SITE.telegram} target="_blank" rel="noopener" className="text-[14px] text-dusk transition-colors duration-300 hover:text-ink">
              Telegram samples
            </a>
          </div>
        </div>

        <nav>
          <p className="eyebrow">Explore</p>
          <ul className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2.5">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-[14px] text-dusk transition-colors duration-300 hover:text-ink">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/projects" className="text-[14px] text-dusk transition-colors duration-300 hover:text-ink">
                Projects
              </Link>
            </li>
            <li>
              <Link href="/lagos" className="text-[14px] text-dusk transition-colors duration-300 hover:text-ink">
                Rooted in Lagos
              </Link>
            </li>
            <li>
              <Link href="/atelier" className="text-[14px] text-dusk transition-colors duration-300 hover:text-ink">
                The Atelier
              </Link>
            </li>
            <li>
              <Link href="/how-we-work" className="text-[14px] text-dusk transition-colors duration-300 hover:text-ink">
                How we work
              </Link>
            </li>
            <li>
              <Link href="/interiors" className="text-[14px] text-dusk transition-colors duration-300 hover:text-ink">
                Interiors
              </Link>
            </li>
            <li>
              <Link href="/visualizer" className="text-[14px] text-dusk transition-colors duration-300 hover:text-ink">
                See it in your space
              </Link>
            </li>
            <li>
              <Link href="/journal" className="text-[14px] text-dusk transition-colors duration-300 hover:text-ink">
                The journal
              </Link>
            </li>
          </ul>
        </nav>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pb-8 pt-2 sm:px-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-mist">{SITE.name}</p>
          <PalettePicker />
          <p className="text-[11px] uppercase tracking-[0.18em] text-mist">Lagos · Foshan</p>
        </div>
      </div>
    </footer>
  );
}
