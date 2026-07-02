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
    <header className="sticky top-0 z-40 bg-sand/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <MosaicMark className="h-8 w-8" />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight">{SITE.shortName}</span>
            <span className="block text-[10px] font-medium uppercase tracking-widest text-mist">
              and Pool Materials
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                pathname === n.href ? "bg-ink/5 text-ink" : "text-dusk hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <ThemeToggle />
          <a
            href={waQuote()}
            target="_blank"
            rel="noopener"
            className="ml-1 rounded-full bg-pool px-4 py-2 text-sm font-semibold text-white shadow-lift transition-transform hover:scale-[1.03] active:scale-95"
          >
            Get a quote
          </a>
        </nav>

        <div className="ml-auto flex items-center md:hidden"><ThemeToggle /></div>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="mx-4 mb-4 rounded-3xl bg-shell p-3 shadow-lift md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-[15px] font-medium text-ink active:bg-ink/5"
            >
              {n.label}
            </Link>
          ))}
          <a
            href={waQuote()}
            target="_blank"
            rel="noopener"
            className="mt-2 block rounded-2xl bg-pool px-4 py-3 text-center text-[15px] font-semibold text-white"
          >
            Get a quote on WhatsApp
          </a>
        </nav>
      )}
    </header>
  );
}
