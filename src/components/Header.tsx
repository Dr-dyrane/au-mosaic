"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { EXPLORE, NAV, SITE } from "@/lib/site";
import { waQuote } from "@/lib/wa";
import { AuLockup } from "./Mosaic";
import ThemeToggle from "./ThemeToggle";

/* Island navigation. A floating glass pill; the page moves beneath it.
   It condenses as you scroll and opens its menu from the island itself. */

const subscribe = (fn: () => void) => {
  window.addEventListener("scroll", fn, { passive: true });
  return () => window.removeEventListener("scroll", fn);
};
const getScrolled = () => window.scrollY > 24;

export default function Header() {
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [explorePath, setExplorePath] = useState<string | null>(null);
  const exploreRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribe, getScrolled, () => false);
  const open = openPath === pathname;
  const explore = explorePath === pathname;

  /* Explore dismisses on an outside tap; touch has no hover to leave.
     (Menu links close themselves on click; no route-change effect needed.) */
  useEffect(() => {
    if (!explore) return;
    const onDown = (e: PointerEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setExplorePath(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [explore]);

  /* While the mobile menu is open, lock the page so the panel scrolls, not
     the page behind it. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
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
          <Link href="/" className="flex items-center" onClick={() => setOpenPath(null)} aria-label="AU Mosaic, home">
            {/* The sign as the client's flyers set it: tesserae au,
                serif mosaic in the brand blue. */}
            <AuLockup className={`transition-all duration-500 ${scrolled ? "text-[12px]" : "text-[14px]"}`} />
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

            {/* The one Explore door: the bar reads five at rest; the editorial
                rooms open on hover or tap, dismiss on an outside tap. */}
            <div
              ref={exploreRef}
              className="relative"
              onMouseEnter={() => setExplorePath(pathname)}
              onMouseLeave={() => setExplorePath(null)}
            >
              <button
                type="button"
                onClick={() => setExplorePath(explore ? null : pathname)}
                aria-expanded={explore}
                aria-haspopup="menu"
                className={`flex items-center gap-1.5 whitespace-nowrap py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${
                  explore ? "text-ink" : "text-dusk hover:text-ink"
                }`}
              >
                Explore
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden className={`transition-transform duration-300 ${explore ? "rotate-180" : ""}`}>
                  <path d="M2.5 4 5 6.5 7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className={`absolute right-0 top-full pt-4 transition-opacity duration-300 ${explore ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
                <div
                  role="menu"
                  className={`glass w-60 rounded-[24px] p-2.5 transition-transform duration-300 ${explore ? "translate-y-0" : "-translate-y-1"}`}
                >
                  {EXPLORE.map((e) => (
                    <Link
                      key={e.href}
                      href={e.href}
                      role="menuitem"
                      aria-current={isActive(e.href) ? "page" : undefined}
                      onClick={() => setExplorePath(null)}
                      className={`block rounded-[16px] px-4 py-2.5 text-[13px] transition-colors duration-200 hover:bg-shell/60 ${
                        isActive(e.href) ? "text-gold" : "text-dusk hover:text-ink"
                      }`}
                    >
                      {e.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
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
            onClick={() => setOpenPath(open ? null : pathname)}
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
            className="island-panel glass absolute left-1/2 top-full mt-2 max-h-[calc(100dvh-6rem)] w-[min(92vw,340px)] overflow-y-auto overscroll-contain rounded-[28px] p-7 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
            aria-label="Menu"
          >
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpenPath(null)}
                className={`font-serif block py-3 text-[20px] transition-colors duration-300 ${
                  isActive(n.href) ? "text-gold" : "text-ink"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <p className="eyebrow mt-6">Explore</p>
            <div className="mt-1">
              {EXPLORE.map((e) => (
                <Link
                  key={e.href}
                  href={e.href}
                  onClick={() => setOpenPath(null)}
                  className={`block py-2 text-[15px] transition-colors duration-300 ${
                    isActive(e.href) ? "text-gold" : "text-dusk hover:text-ink"
                  }`}
                >
                  {e.label}
                </Link>
              ))}
            </div>
            <a href={waQuote()} target="_blank" rel="noopener" data-wa="menu" className="btn-gold mt-6 inline-block">
              Enquire on WhatsApp
            </a>
            <p className="mt-5 text-[12px] tracking-wide text-mist">{SITE.location} · {SITE.hours}</p>
          </nav>
        )}
      </div>
    </header>
  );
}
