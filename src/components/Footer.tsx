import Link from "next/link";
import { NAV, SITE } from "@/lib/site";
import { waGeneral } from "@/lib/wa";
import { MosaicMark } from "./Mosaic";

export default function Footer() {
  return (
    <footer className="mt-24 bg-pool-deep text-white/90">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <MosaicMark className="h-8 w-8" />
            <span className="font-semibold tracking-tight text-white">{SITE.shortName}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
            {SITE.description}
          </p>
        </div>

        <div className="text-sm">
          <p className="font-semibold text-white">Visit</p>
          <p className="mt-3 text-white/70">{SITE.location}</p>
          <p className="mt-1 text-white/70">{SITE.hours}</p>
          <a href={waGeneral()} target="_blank" rel="noopener" className="mt-3 inline-block font-medium text-aqua hover:underline">
            Chat on WhatsApp
          </a>
        </div>

        <nav className="text-sm">
          <p className="font-semibold text-white">Explore</p>
          <ul className="mt-3 space-y-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-white/70 hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        {SITE.name} · {SITE.location} · {SITE.yearsInBusiness} years of mosaic
      </div>
    </footer>
  );
}
