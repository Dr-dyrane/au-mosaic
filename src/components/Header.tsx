"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { NAV, SITE } from "@/lib/site";
import { waQuote } from "@/lib/wa";
import { MosaicMark } from "./Mosaic";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-sand/80 backdrop-blur-md hairline-b">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <MosaicMark className="h-7 w-7" />
          <span className="leading-tight">
            <span className="font-serif block text-[17px] tracking-wide">AU Mosaic</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.28em] text-mist">
              The house of mosaic
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
                pathname === n.href ? "text-gold" : "text-dusk hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <ThemeToggle />
          <a href={waQuote()} target="_blank" rel="noopener" className="link-hair text-ink">
            Enquire
          </a>
        </nav>

        <div className="ml-auto flex items-center md:hidden"><ThemeToggle /></div>
        <button
          className="flex h-10 w-10 items-center justify-center text-ink md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <path d="M3 7h14M3 13h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="hairline bg-sand px-5 pb-8 pt-4 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="font-serif block py-3.5 text-[22px] text-ink"
            >
              {n.label}
            </Link>
          ))}
          <a
            href={waQuote()}
            target="_blank"
            rel="noopener"
            className="btn-gold mt-6 inline-block"
          >
            Enquire on WhatsApp
          </a>
          <p className="mt-5 text-[12px] tracking-wide text-mist">{SITE.location} · {SITE.hours}</p>
        </nav>
      )}
    </header>
  );
}
