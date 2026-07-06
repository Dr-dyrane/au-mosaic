"use client";

import { usePathname } from "next/navigation";
import { waGeneral } from "@/lib/wa";

/* The one action that always matters. Fixed, calm, thumb-reachable,
   clear of the home indicator, named on hover. It steps aside on
   piece pages, where the piece bar already carries the same action
   in house clothes: one floating chrome per screen, one gold path.
   Lucent glass and an outlined mark, in the house palette. No borrowed
   brand green; the room keeps its own light. */
export default function WhatsAppFloat() {
  const pathname = usePathname();
  if (pathname.startsWith("/piece/")) return null;

  return (
    <a
      href={waGeneral()}
      target="_blank"
      rel="noopener"
      data-wa="float"
      aria-label="Chat with AU Mosaic on WhatsApp"
      className="glass group fixed bottom-[calc(24px+env(safe-area-inset-bottom))] right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full text-ink shadow-lift transition-[transform,color] duration-300 hover:scale-105 hover:text-gold active:scale-95"
    >
      <span className="chip-glass pointer-events-none absolute right-full mr-3 hidden translate-x-1 whitespace-nowrap opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:inline-flex">
        Chat with the house
      </span>
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
        <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
      </svg>
    </a>
  );
}
