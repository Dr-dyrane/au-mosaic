"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { buzz } from "@/lib/backoffice";

/* The tour, second edition: chapters, not a lap. Still hand-rolled,
   still no dependency. "The basics" walks the rooms in seven steps;
   the deep chapters walk INTO them, field by field, and the flagship
   is the stockroom. Two kinds of step: "point" spotlights and the
   gold Next advances; "do" opens a window in the blocker and the tour
   advances only when the real element is tapped, so hands learn, not
   eyes. A chapters menu lives under Take the tour; each room offers
   its own chapter through data-tour-start="<chapter>". Finishing a
   chapter writes aumosaic.toured.<chapter>; any ending writes the
   legacy aumosaic.toured so the first-login offer retires. Escape
   always leaves politely. */

type Step = {
  sel: string;
  title: string;
  line: string;
  /* Walk to this page first; omitted means stay wherever the last
     step left us (the do steps navigate by themselves). */
  page?: string;
  /* "do" advances only when the spotlit element is really tapped. */
  kind?: "do";
  /* Some furniture exists on one size only: the filter chips on the
     desk, the sheet on the phone. Steps declare their side and the
     other side never sees them. */
  when?: "phone" | "desk";
  /* Data-dependent targets (a piece card in an empty book) skip
     kindly instead of ending the chapter. */
  optional?: boolean;
};

type Chapter = { key: string; name: string; blurb: string; steps: Step[] };

const CHAPTERS: Chapter[] = [
  {
    key: "basics",
    name: "The basics",
    blurb: "Seven steps across the rooms, one minute.",
    steps: [
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
    ],
  },
  {
    key: "stockroom",
    name: "The stockroom, deeply",
    blurb: "Filters, the sheet, a new piece, and the whole record, hands on.",
    steps: [
      {
        sel: "[data-tour='stockroom']",
        page: "/admin/pieces",
        title: "The stockroom",
        line: "Everything you stock lives here; the window shows only what you choose.",
      },
      {
        sel: "[data-tour='families']",
        optional: true,
        title: "Two families",
        line: "The tiles first, the pool materials after, each range a shelf.",
      },
      {
        sel: "[data-tour='stock-filters']",
        title: "The quick filters",
        line: "All, Tiles, Materials, Running low: the decisions he makes every day stay one tap away.",
      },
      {
        sel: "[data-tour='stock-filter-open']",
        kind: "do",
        title: "The filter",
        line: "Tap Filter for colour, place, and order without crowding the room.",
      },
      {
        sel: "[data-tour='stock-sheet']",
        title: "The filter panel",
        line: "The long choices stay here. Each row is still a full, remembered view.",
      },
      {
        sel: "[data-tour='stock-sheet-close']",
        kind: "do",
        title: "Back to the shelf",
        line: "Close it, and the products stay in front.",
      },
      {
        sel: "[data-tour='drafts']",
        title: "Book and window",
        line: "Pieces waiting off the site are counted here, so a draft is never forgotten.",
      },
      {
        sel: "[data-tour='piece-card']",
        optional: true,
        title: "The two truths",
        line: "Every card says if a piece is off the site and when it runs low.",
      },
      {
        sel: "[data-tour='new-piece']",
        kind: "do",
        title: "A new piece",
        line: "Tap New piece: the birth certificate takes a minute.",
      },
      {
        sel: "[data-tour='np-name']",
        title: "The name",
        line: "What the customer hears; the site key is minted from it once and kept.",
      },
      {
        sel: "[data-tour='np-shelf']",
        title: "Its shelf",
        line: "Every piece hangs on a range, and the shelf decides where it shows.",
      },
      {
        sel: "[data-tour='np-line']",
        title: "One line",
        line: "The sentence under the name in the window.",
      },
      {
        sel: "[data-tour='colours']",
        title: "The colours",
        line: "Tap a tile for the phone's own wheel; add lays another, remove takes one away.",
      },
      {
        sel: "[data-tour='np-window']",
        title: "The window switch",
        line: "On shows it to customers today; off keeps it in the book until you are ready.",
      },
      {
        sel: "[data-tour='np-create']",
        title: "The one gold",
        line: "Create the piece makes it real; leave it for the day a real piece arrives.",
      },
      {
        sel: "[data-tour='back']",
        kind: "do",
        title: "Walk back",
        line: "Tap The stockroom to return to the shelf.",
      },
      {
        sel: "[data-tour='piece-card']",
        kind: "do",
        optional: true,
        title: "Open a record",
        line: "Tap the first card: a piece is a record with a face, not a row.",
      },
      {
        sel: "[data-tour='photos']",
        title: "The photographs",
        line: "Two slots, night and day, because the site shows each sun its own shot.",
      },
      {
        sel: "[data-tour='words']",
        title: "The words",
        line: "Name, line, story, and the price note: the piece page written from your hand.",
      },
      {
        sel: "[data-tour='colours']",
        title: "The colours again",
        line: "Change, add, or remove tiles; nothing lands until Save.",
      },
      {
        sel: "[data-tour='stock-count']",
        title: "In stock",
        line: "The number on the shelf right now; orders move it at the door.",
      },
      {
        sel: "[data-tour='unit']",
        title: "Counted in",
        line: "Sheets, bags, or units: the word this piece counts by.",
      },
      {
        sel: "[data-tour='warn-at']",
        title: "Warn me at",
        line: "At or below this number the piece reads Running low and the morning digest says so.",
      },
      {
        sel: "[data-tour='container']",
        title: "Container lands",
        line: "The date the next shipment arrives, so a promise has a day on it.",
      },
      {
        sel: "[data-tour='window']",
        title: "Show on the site",
        line: "The same window switch lives here; off hides the piece and loses nothing.",
      },
      {
        sel: "[data-tour='save']",
        title: "The sticky Save",
        line: "One Save keeps words and stock together, riding above your thumb on a long page.",
      },
    ],
  },
  {
    key: "orders",
    name: "Orders, deeply",
    blurb: "A sale from enquiry to settled, and where stock moves.",
    steps: [
      {
        sel: "[data-tour='orders']",
        page: "/admin/orders",
        title: "The orders",
        line: "Grouped by where each sale stands, settled tucked away.",
      },
      {
        sel: "[data-tour='order-new']",
        title: "New order",
        line: "Every sale begins here, as an enquiry with a name on it.",
      },
      {
        sel: "[data-tour='order-steps']",
        title: "The five steps",
        line: "Enquiry, Quoted, Deposit paid, Delivered, Settled: tap a chip to see one step.",
      },
      {
        sel: "[data-tour='order-card']",
        kind: "do",
        optional: true,
        title: "Open one",
        line: "Tap an order: the record holds the whole sale.",
      },
      {
        sel: "[data-tour='order-lines']",
        title: "The lines",
        line: "List sits beside given, and the gap prints in gold: the discount is a number now.",
      },
      {
        sel: "[data-tour='add-line']",
        title: "Add a line",
        line: "Pick a piece or describe the work; given left empty takes the list price.",
      },
      {
        sel: "[data-tour='payment']",
        title: "Record a payment",
        line: "Every naira in, and the balance keeps itself.",
      },
      {
        sel: "[data-tour='order-status']",
        title: "Move the step",
        line: "Crossing into Delivered takes stock off the shelf, so the house asks before it moves.",
      },
    ],
  },
  {
    key: "people",
    name: "People, deeply",
    blurb: "Search, new names, and the window taps.",
    steps: [
      {
        sel: "[data-tour='people']",
        page: "/admin/customers",
        title: "The people",
        line: "Orders, balance, chat: one tap from a name.",
      },
      {
        sel: "[data-tour='people-search']",
        title: "The search",
        line: "Name or phone and Enter; it answers on the weakest connection.",
      },
      {
        sel: "[data-tour='people-new']",
        title: "New customer",
        line: "Add them before the first order and be ready when it comes.",
      },
      {
        sel: "[data-tour='fresh']",
        optional: true,
        title: "Fresh from the window",
        line: "Every WhatsApp tap on the site lands here; check the chat, then clear it.",
      },
      {
        sel: "[data-tour='tie']",
        optional: true,
        title: "Give it a name",
        line: "Attach ties a window tap to a person, so the funnel counts people, not taps.",
      },
    ],
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

function markChapter(key: string) {
  try {
    localStorage.setItem(`${DONE_KEY}.${key}`, "1");
  } catch {}
}

function chapterSeen(key: string): boolean {
  try {
    return localStorage.getItem(`${DONE_KEY}.${key}`) === "1";
  } catch {
    return false;
  }
}

export default function Tour() {
  const router = useRouter();
  /* The running chapter carries only the steps this device can show. */
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [menu, setMenu] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const menuCard = useRef<HTMLDivElement>(null);
  const hunt = useRef(0);
  const chapterRef = useRef<Chapter | null>(null);
  const iRef = useRef(0);
  /* Whoever opened the tour gets the focus handed back at the end. */
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    chapterRef.current = chapter;
    iRef.current = i;
  });
  const step = chapter ? chapter.steps[i] : null;

  /* Three endings, honestly separated. Done marks the chapter Seen
     and lets its teaching retire. Skip is the owner leaving: the
     offer retires, the chapter stays unseen. Lost is the tour
     failing him, a target that never came: nothing is marked, the
     teaching stays, and the exact step is tracked so the failure
     has an address. A lost walk must never wear done's clothes. */
  const stop = useCallback((why: "done" | "skip" | "lost") => {
    window.clearInterval(hunt.current);
    const c = chapterRef.current;
    const key = c?.key ?? "";
    if (why !== "lost") markToured();
    if (why === "done" && key) markChapter(key);
    if (why === "lost") {
      const s = c?.steps[iRef.current];
      track("tour_lost", { chapter: key, step: iRef.current + 1, title: s?.title ?? "" });
    } else {
      track(why === "done" ? "tour_done" : "tour_skip", { chapter: key });
    }
    setChapter(null);
    setBox(null);
    setI(0);
    opener.current?.focus?.();
    opener.current = null;
  }, []);

  /* Find the step's element once its page has painted it. A required
     target that never shows ends the chapter kindly; an optional one
     steps past. Do steps that navigate get longer patience, because a
     server page takes its moment. */
  const locate = useCallback((s: Step, then: (b: Box | null) => void) => {
    window.clearInterval(hunt.current);
    let tries = 0;
    /* Optional pointers sit on pages already painted, so they give up
       fast; everything else may be waiting on a navigation, and a
       cold serverless page takes its moment: 60 tries is 8.4s. */
    const patience = s.optional && s.kind !== "do" ? 12 : 60;
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
      } else if (tries > patience) {
        window.clearInterval(hunt.current);
        then(null);
      }
    }, 140);
  }, []);

  function goWith(c: Chapter, n: number) {
    if (n >= c.steps.length) {
      stop("done");
      return;
    }
    const s = c.steps[n];
    setI(n);
    setBox(null);
    track("tour_step", { chapter: c.key, step: n + 1, title: s.title });
    if (s.page && window.location.pathname !== s.page) router.push(s.page);
    locate(s, (b) => {
      if (b) setBox(b);
      /* Any missing optional step skips forward, do or not; a
         missing required target ends the walk as lost, never as
         done: nothing gets marked Seen by a failure. */
      else if (s.optional) goWith(c, n + 1);
      else stop("lost");
    });
  }

  function start(c: Chapter) {
    const phone = window.matchMedia("(max-width: 639px)").matches;
    const fit = { ...c, steps: c.steps.filter((s) => !s.when || (s.when === "phone") === phone) };
    setMenu(false);
    buzz(3);
    track("tour_start", { chapter: c.key });
    setChapter(fit);
    goWith(fit, 0);
  }

  /* The latest walkers, reachable from stable listeners. */
  const goRef = useRef<(n: number) => void>(null);
  const startRef = useRef<(c: Chapter) => void>(null);
  useEffect(() => {
    goRef.current = (n) => {
      if (chapterRef.current) goWith(chapterRef.current, n);
    };
    startRef.current = start;
  });

  /* Anything wearing data-tour-start opens a chapter by key, or the
     chapters menu when it names none. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement | null)?.closest?.("[data-tour-start]");
      if (!t) return;
      e.preventDefault();
      opener.current = t as HTMLElement;
      const key = t.getAttribute("data-tour-start") || "menu";
      if (key === "menu") {
        buzz(3);
        setMenu(true);
        return;
      }
      const c = CHAPTERS.find((x) => x.key === key);
      if (c) startRef.current?.(c);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  /* Escape leaves politely: first the menu, then the tour. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu) setMenu(false);
      else if (chapterRef.current) stop("skip");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, stop]);

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

  /* A do step listens at the document, capture phase, and matches
     the tap against the selector rather than one found node: a
     re-render can swap the element under the spotlight, and a
     listener on a ghost node would leave the tour waiting forever. */
  useEffect(() => {
    if (!step || step.kind !== "do" || !box) return;
    const n = i + 1;
    const sel = step.sel;
    const onTap = (e: MouseEvent) => {
      const hit = (e.target as HTMLElement | null)?.closest?.(sel);
      if (!hit) return;
      buzz(4);
      window.setTimeout(() => goRef.current?.(n), 0);
    };
    document.addEventListener("click", onTap, true);
    return () => document.removeEventListener("click", onTap, true);
  }, [step, box, i]);

  /* VoiceOver walks in with each step, and into the menu. */
  useEffect(() => {
    if (chapter && box) card.current?.focus({ preventScroll: true });
  }, [chapter, i, box]);
  useEffect(() => {
    if (menu) menuCard.current?.focus({ preventScroll: true });
  }, [menu]);

  return (
    <>
      {menu && (
        <div className="fixed inset-0 layer-admin-tour">
          <button
            aria-label="Close the tour menu"
            onClick={() => setMenu(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <div
            ref={menuCard}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="The tour"
            className="glass fixed inset-x-5 bottom-[calc(96px+env(safe-area-inset-bottom))] rounded-[28px] p-6 outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[24rem] sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            <p className="font-serif text-[20px]">The tour</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-dusk">
              Start with the basics, or walk one room deeply.
            </p>
            <div className="mt-4 grid gap-1">
              {CHAPTERS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => start(c)}
                  className="rounded-[18px] px-4 py-3 text-left transition-colors duration-200 hover:bg-shell/60"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-serif text-[16px]">{c.name}</span>
                    {chapterSeen(c.key) && (
                      <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-mist">
                        Seen
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-dusk">
                    {c.blurb}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMenu(false)}
              className="link-hair text-dusk mt-4 text-[13px]"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {step && box && chapter && (
        <>
          {/* Point steps hold the whole room still; do steps leave a
              real window over the element so the tap lands. */}
          {step.kind === "do" ? (
            <>
              <div aria-hidden className="fixed inset-x-0 top-0 layer-admin-scrim" style={{ height: Math.max(0, box.top) }} />
              <div aria-hidden className="fixed inset-x-0 bottom-0 layer-admin-scrim" style={{ top: Math.max(0, box.top + box.height) }} />
              <div aria-hidden className="fixed left-0 layer-admin-scrim" style={{ top: Math.max(0, box.top), height: box.height, width: Math.max(0, box.left) }} />
              <div aria-hidden className="fixed right-0 layer-admin-scrim" style={{ top: Math.max(0, box.top), height: box.height, left: Math.max(0, box.left + box.width) }} />
            </>
          ) : (
            <div className="fixed inset-0 layer-admin-scrim" aria-hidden />
          )}
          <div
            aria-hidden
            className="pointer-events-none fixed layer-admin-highlight rounded-[22px] transition-all duration-500"
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
            className="glass fixed inset-x-5 bottom-[calc(96px+env(safe-area-inset-bottom))] layer-admin-tour-card rounded-[28px] p-5 outline-none sm:inset-x-auto sm:bottom-10 sm:left-1/2 sm:w-[22rem] sm:-translate-x-1/2"
          >
            {chapter.steps.length <= 8 ? (
              <div
                className="flex items-center gap-1.5"
                aria-label={`Step ${i + 1} of ${chapter.steps.length}`}
              >
                {chapter.steps.map((s, d) => (
                  <span
                    key={d}
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                      d === i ? "bg-gold" : "bg-shell"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[11px] uppercase tracking-[0.18em] text-mist">
                {i + 1} of {chapter.steps.length}
              </p>
            )}
            {step.kind === "do" && (
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                Your turn
              </p>
            )}
            <p className={`font-serif text-[20px] ${step.kind === "do" ? "mt-1.5" : "mt-3"}`}>
              {step.title}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-dusk">{step.line}</p>
            <div className="mt-5 flex items-center gap-6">
              {step.kind !== "do" && (
                <button
                  onClick={() => {
                    buzz(4);
                    goWith(chapter, i + 1);
                  }}
                  className="btn-gold"
                >
                  {i === chapter.steps.length - 1 ? "Done" : "Next"}
                </button>
              )}
              <button onClick={() => stop("skip")} className="link-hair text-dusk text-[13px]">
                Leave the tour
              </button>
            </div>
          </div>
        </>
      )}
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

/* The first-login offer: one quiet card on the glance until a tour
   is taken or waved away. It starts the basics; the deeper chapters
   wait in the menu and in their own rooms. */
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
        <button data-tour-start="basics" className="link-hair text-dusk text-[13px]">
          Take the tour
        </button>
        <button onClick={markToured} className="link-hair text-mist text-[12px]">
          Not now
        </button>
      </div>
    </div>
  );
}
