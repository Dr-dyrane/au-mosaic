"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { buzz } from "@/lib/backoffice";

/* The tour: a hand-rolled spotlight, no dependency. One giant
   box-shadow cuts a window onto the room's own element, a glass card
   says one line, the gold button walks forward, and the router
   carries the tour across rooms. Everything tracks as tour_step;
   finishing or skipping writes aumosaic.toured so the offer retires.
   Anything on any page can start it by wearing data-tour-start. */

type Step = { sel: string; page: string; title: string; line: string };

const STEPS: Step[] = [
  {
    sel: "[data-tour='pulse']",
    page: "/admin",
    title: "The glance",
    line: "Five numbers, three seconds: is the house okay.",
  },
  {
    sel: "[data-tour='new-order']",
    page: "/admin",
    title: "One gold button",
    line: "Every sale begins here. Each screen keeps exactly one gold.",
  },
  {
    sel: "[data-tour='orders']",
    page: "/admin/orders",
    title: "The orders",
    line: "List sits beside given. A discount is a number, not a feeling.",
  },
  {
    sel: "[data-tour='debts']",
    page: "/admin/debts",
    title: "Who owes what",
    line: "The longest forgotten debt on top, its reminder one tap away.",
  },
  {
    sel: "[data-tour='people']",
    page: "/admin/customers",
    title: "The people",
    line: "Site taps land fresh at the top. Clear them as you answer.",
  },
  {
    sel: "[data-tour='stockroom']",
    page: "/admin/pieces",
    title: "The stockroom",
    line: "Every piece, its stock, its photos, and the window switch.",
  },
  {
    sel: "[data-tour='rooms']",
    page: "/admin",
    title: "The rooms",
    line: "Everything is one tap from here. That is the tour.",
  },
];

const DONE_KEY = "aumosaic.toured";

type Box = { top: number; left: number; width: number; height: number };

function findTarget(sel: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>(sel)].find(
    (e) => e.getBoundingClientRect().width > 0
  );
}

function markToured() {
  try {
    localStorage.setItem(DONE_KEY, "1");
    window.dispatchEvent(new Event("aumosaic:toured"));
  } catch {}
}

export default function Tour() {
  const router = useRouter();
  const [i, setI] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const hunt = useRef(0);
  const step = i === null ? null : STEPS[i];

  const stop = useCallback((why: "done" | "skip") => {
    window.clearInterval(hunt.current);
    markToured();
    track(why === "done" ? "tour_done" : "tour_skip");
    setI(null);
    setBox(null);
  }, []);

  /* Find the step's element once its page has painted it; a target
     that never shows ends the tour kindly instead of hanging it. */
  const locate = useCallback((s: Step, then: (b: Box | null) => void) => {
    window.clearInterval(hunt.current);
    let tries = 0;
    hunt.current = window.setInterval(() => {
      tries += 1;
      const el = findTarget(s.sel);
      if (el) {
        window.clearInterval(hunt.current);
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
        window.setTimeout(() => {
          const r = el.getBoundingClientRect();
          then({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
        }, still ? 60 : 420);
      } else if (tries > 24) {
        window.clearInterval(hunt.current);
        then(null);
      }
    }, 140);
  }, []);

  function go(n: number) {
    if (n >= STEPS.length) {
      stop("done");
      return;
    }
    const s = STEPS[n];
    setI(n);
    setBox(null);
    track("tour_step", { step: n + 1, title: s.title });
    if (window.location.pathname !== s.page) router.push(s.page);
    locate(s, (b) => (b ? setBox(b) : stop("done")));
  }

  /* The latest go, reachable from stable listeners. */
  const goRef = useRef<(n: number) => void>(null);
  useEffect(() => {
    goRef.current = go;
  });

  /* Anything wearing data-tour-start opens the tour. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement | null)?.closest?.("[data-tour-start]");
      if (!t) return;
      e.preventDefault();
      buzz(3);
      track("tour_start");
      goRef.current?.(0);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  /* Escape leaves politely. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop("skip");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stop]);

  /* The window follows its element through resizes and scrolls. */
  useEffect(() => {
    if (!step) return;
    const follow = () => {
      const el = findTarget(step.sel);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBox({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
    };
    window.addEventListener("resize", follow);
    window.addEventListener("scroll", follow, true);
    return () => {
      window.removeEventListener("resize", follow);
      window.removeEventListener("scroll", follow, true);
    };
  }, [step]);

  /* VoiceOver walks in with each step. */
  useEffect(() => {
    if (i !== null) card.current?.focus({ preventScroll: true });
  }, [i]);

  if (!step || !box) return null;

  return (
    <>
      {/* The room waits while the tour speaks. */}
      <div className="fixed inset-0 z-[88]" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none fixed z-[89] rounded-[22px] transition-all duration-500"
        style={{
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
          boxShadow: "0 0 0 200vmax rgb(12 11 9 / 0.55)",
        }}
      />
      <div
        ref={card}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        className="glass fixed inset-x-5 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[90] rounded-[28px] p-5 outline-none sm:inset-x-auto sm:bottom-10 sm:left-1/2 sm:w-[22rem] sm:-translate-x-1/2"
      >
        <div className="flex items-center gap-1.5" aria-label={`Step ${(i ?? 0) + 1} of ${STEPS.length}`}>
          {STEPS.map((s, d) => (
            <span
              key={s.title}
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                d === i ? "bg-gold" : "bg-shell"
              }`}
            />
          ))}
        </div>
        <p className="font-serif mt-3 text-[20px]">{step.title}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-dusk">{step.line}</p>
        <div className="mt-5 flex items-center gap-6">
          <button
            onClick={() => {
              buzz(4);
              go((i ?? 0) + 1);
            }}
            className="btn-gold"
          >
            {i === STEPS.length - 1 ? "Done" : "Next"}
          </button>
          <button onClick={() => stop("skip")} className="link-hair text-dusk text-[13px]">
            Skip the tour
          </button>
        </div>
      </div>
    </>
  );
}

/* localStorage as the external store it is; the server pretends the
   tour is done so nothing flashes before hydration. */
function snapshot(): string {
  try {
    return localStorage.getItem(DONE_KEY) ?? "";
  } catch {
    return "1";
  }
}

function serverSnapshot(): string {
  return "1";
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("aumosaic:toured", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("aumosaic:toured", onChange);
  };
}

/* The first-login offer: one quiet card on the glance until the tour
   is taken or waved away. */
export function TourOffer() {
  const toured = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  if (toured === "1") return null;
  return (
    <div className="panel mt-8 max-w-md">
      <p className="font-serif text-[20px]">New here?</p>
      <p className="mt-2 text-[14px] leading-relaxed text-dusk">
        The tour walks the rooms in a minute, one step at a time.
      </p>
      <div className="mt-4 flex items-center gap-6">
        <button data-tour-start className="link-hair text-dusk text-[13px]">
          Take the tour
        </button>
        <button onClick={markToured} className="link-hair text-mist text-[12px]">
          Not now
        </button>
      </div>
    </div>
  );
}
