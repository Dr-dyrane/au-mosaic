"use client";

import { usePathname } from "next/navigation";
import { waGeneral } from "@/lib/wa";

/* The one action that always matters. Fixed, calm, thumb-reachable,
   clear of the home indicator, named on hover. It steps aside on
   piece pages, where the piece bar already carries the same action
   in house clothes: one floating chrome per screen, one gold path.
   Whether it keeps its seat elsewhere is the funnel's decision now;
   the float signs its taps, and the source panel will say. */
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
      className="group fixed bottom-[calc(24px+env(safe-area-inset-bottom))] right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#1da851] text-white shadow-lift transition-transform duration-300 hover:scale-105 active:scale-95"
    >
      <span className="chip-glass pointer-events-none absolute right-full mr-3 hidden translate-x-1 whitespace-nowrap opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:inline-flex">
        Chat with the house
      </span>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5v-.5c0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3Z" />
      </svg>
    </a>
  );
}
