"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { NAV, SITE } from "@/lib/site";
import { waQuote } from "@/lib/wa";
import { AuMark } from "./Mosaic";
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
  /* Pieces belong to the collection: /piece/* lights the Mosaic tiles tab. */
  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/mosaic-tiles" && pathname.startsWith("/piece"));

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div className="pointer-events-auto relative">
        <div
          className={`glass flex items-center rounded-full transition-all duration-500 ${
            scrolled ? "gap-4 px-4 py-2" : "gap-5 px-5 py-2.5"
          }`}
        >
          <Link href="/" className="flex items-baseline gap-1.5" onClick={() => setOpen(false)} aria-label="AU Mosaic, home">
            {/* The mark already says au; sized to the word so it reads
                as one name: aumosaic. */}
            <AuMark className={`w-auto self-center transition-all duration-500 ${scrolled ? "h-[15px]" : "h-[17px]"}`} />
            <span className="whitespace-nowrap text-[17px] font-semibold tracking-tight">mosaic</span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`whitespace-nowrap py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${
                  isActive(n.href) ? "text-gold" : "text-dusk hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />
          <a
            href={waQuote()}
            target="_blank"
            rel="noopener"
            data-wa="nav"
            className="link-hair hidden whitespace-nowrap text-ink lg:inline-block"
          >
            Enquire
          </a>

          <button
            className="flex h-9 w-9 items-center justify-center text-ink transition-transform active:scale-90 lg:hidden"
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
            className="island-panel glass absolute left-1/2 top-full mt-2 w-[min(92vw,340px)] rounded-[28px] p-7 lg:hidden"
            aria-label="Menu"
          >
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`font-serif block py-3 text-[20px] transition-colors duration-300 ${
                  isActive(n.href) ? "text-gold" : "text-ink"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <a href={waQuote()} target="_blank" rel="noopener" data-wa="menu" className="btn-gold mt-5 inline-block">
              Enquire on WhatsApp
            </a>
            <p className="mt-5 text-[12px] tracking-wide text-mist">{SITE.location} · {SITE.hours}</p>
          </nav>
        )}
      </div>
    </header>
  );
}
