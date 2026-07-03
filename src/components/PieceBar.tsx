"use client";

import { useEffect, useRef, useState } from "react";

/* The Apple buy bar, the house way. A glass island rises once the hero
   action scrolls away, so the one thing that matters never leaves reach. */
export default function PieceBar({ name, href }: { name: string; href: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Sentinel: sits where the hero ends. */}
      <div ref={ref} aria-hidden className="h-px" />
      {show && (
        <div className="piece-bar glass fixed bottom-5 left-1/2 z-40 flex max-w-[calc(100vw-32px)] items-center gap-4 rounded-full py-2 pl-6 pr-2">
          <span className="font-serif truncate text-[15px]">{name}</span>
          <a
            href={href}
            target="_blank"
            rel="noopener"
            className="btn-gold whitespace-nowrap !px-5 !py-2.5"
          >
            Enquire
          </a>
        </div>
      )}
    </>
  );
}
