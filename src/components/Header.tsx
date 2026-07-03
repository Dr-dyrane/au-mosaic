"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { NAV, SITE } from "@/lib/site";
import { waQuote } from "@/lib/wa";
import { MosaicMark } from "./Mosaic";
import ThemeToggle from "./ThemeToggle";

/* Island navigation. A floating glass pill; the page moves beneath it.
   It condenses as you scroll and opens its menu from the island itself. */

const subscribe = (fn: () => void) => {
  window.addEventListener("scroll", fn, { passive: true });
  return () => window.removeEventListener("scroll", fn);
};
const getScrolled = () => window.scrollY > 24;

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribe, getScrolled, () => false);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div className="pointer-events-auto relative">
        <div
          className={`flex items-center rounded-full border border-hairline bg-sand/75 backdrop-blur-xl transition-all duration-500 ${
            scrolled ? "gap-4 px-4 py-2 shadow-lift" : "gap-5 px-5 py-2.5"
          }`}
        >
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)} aria-label="AU Mosaic, home">
            <MosaicMark className={`transition-all duration-500 ${scrolled ? "h-5 w-5" : "h-6 w-6"}`} />
            <span className="font-serif whitespace-nowrap text-[15px] tracking-wide">AU Mosaic</span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${
                  pathname === n.href ? "text-gold" : "text-dusk hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <span className="hidden h-4 w-px bg-hairline lg:block" aria-hidden />
          <ThemeToggle />
          <a
            href={waQuote()}
            target="_blank"
            rel="noopener"
            className="link-hair hidden whitespace-nowrap text-ink lg:inline-block"
          >
            Enquire
          </a>

          <button
            className="flex h-9 w-9 items-center justify-center text-ink lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M3 7h14M3 13h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav
            className="island-panel absolute left-1/2 top-full mt-2 w-[min(92vw,340px)] rounded-[28px] border border-hairline bg-sand/90 p-7 backdrop-blur-xl lg:hidden"
            aria-label="Menu"
          >
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`font-serif block py-3 text-[21px] transition-colors duration-300 ${
                  pathname === n.href ? "text-gold" : "text-ink"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <a href={waQuote()} target="_blank" rel="noopener" className="btn-gold mt-5 inline-block">
              Enquire on WhatsApp
            </a>
            <p className="mt-5 text-[12px] tracking-wide text-mist">{SITE.location} · {SITE.hours}</p>
          </nav>
        )}
      </div>
    </header>
  );
}
