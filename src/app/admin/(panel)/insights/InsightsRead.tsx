"use client";

import { useEffect, useState } from "react";

/* The read, in words. It asks the same figures the page draws for a
   short plain-language interpretation and two or three moves, then
   shows them after the charts have already painted. If the model is
   not configured or does not answer, it steps aside quietly and the
   numbers below carry the room. */

type Read = { headline: string; detail: string; moves: string[] };
type State =
  | { phase: "loading" }
  | { phase: "ready"; read: Read }
  | { phase: "away" };

export default function InsightsRead({ months }: { months: number }) {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let live = true;
    fetch(`/admin/api/insights?months=${months}`, { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((data: { ok?: boolean; read?: Read }) => {
        if (!live) return;
        if (data.ok && data.read && data.read.headline) setState({ phase: "ready", read: data.read });
        else setState({ phase: "away" });
      })
      .catch(() => live && setState({ phase: "away" }));
    return () => {
      live = false;
    };
  }, [months]);

  if (state.phase === "away") return null;

  return (
    <section className="panel">
      <p className="eyebrow">The read</p>
      {state.phase === "loading" ? (
        <p className="mt-3 text-[14px] leading-relaxed text-dusk">Reading the pattern...</p>
      ) : (
        <>
          <h2 className="font-serif text-[26px] leading-[1.15] mt-3">{state.read.headline}</h2>
          {state.read.detail && (
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-dusk">{state.read.detail}</p>
          )}
          {state.read.moves.length > 0 && (
            <div className="mt-5 grid gap-2.5">
              {state.read.moves.map((m, i) => (
                <p key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-ink">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden />
                  {m}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
