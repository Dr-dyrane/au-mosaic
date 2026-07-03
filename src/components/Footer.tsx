import Link from "next/link";
import { NAV, SITE } from "@/lib/site";
import { waGeneral } from "@/lib/wa";
import { MosaicMark } from "./Mosaic";

export default function Footer() {
  return (
    <footer className="mt-32 px-4 pb-4 sm:px-6">
      <div className="mx-auto max-w-[1400px] rounded-[40px] bg-shell/70">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 pb-10 pt-16 sm:px-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <MosaicMark className="h-7 w-7" />
            <span className="font-serif text-[20px] tracking-wide">AU Mosaic</span>
          </div>
          <p className="font-serif mt-6 max-w-xs text-[20px] leading-snug text-dusk">
            Everything mosaic, and the water it belongs to.
          </p>
        </div>

        <div>
          <p className="eyebrow">Visit</p>
          <p className="mt-5 text-[14px] leading-relaxed text-dusk">{SITE.location}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-dusk">{SITE.hours}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-dusk">{SITE.phoneDisplay}</p>
          <a href={waGeneral()} target="_blank" rel="noopener" data-wa="footer" className="link-hair mt-6 text-dusk">
            WhatsApp the house
          </a>
        </div>

        <nav>
          <p className="eyebrow">Explore</p>
          <ul className="mt-5 space-y-2.5">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-[14px] text-dusk transition-colors duration-300 hover:text-ink">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pb-8 pt-2 sm:px-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-mist">{SITE.name}</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-mist">Lagos · Foshan</p>
        </div>
      </div>
    </footer>
  );
}
