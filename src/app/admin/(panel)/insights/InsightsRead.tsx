"use client";

import { useEffect, useState } from "react";

/* The read, in words. It asks the same figures the page draws for a
   short plain-language interpretation and two or three moves, then
   shows them after the charts have already painted. If the model is
   not configured or does not answer, it steps aside quietly and the
   numbers below carry the room. */

type Read = { headline: string; signals: string[]; moves: string[] };
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
      <p className="eyebrow">Read</p>
      {state.phase === "loading" ? (
        <p className="mt-3 text-[14px] leading-relaxed text-dusk">Reading the pattern...</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] lg:items-start">
          <div>
            <h2 className="font-serif mt-3 text-[20px] leading-[1.2]">{state.read.headline}</h2>
          </div>
          {state.read.signals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {state.read.signals.slice(0, 3).map((s, i) => (
                <span key={i} className="rounded-full bg-shell/55 px-3 py-2 text-[12px] leading-tight text-dusk">
                  {s}
                </span>
              ))}
            </div>
          )}
          {state.read.moves.length > 0 && (
            <div className="lg:col-span-2 grid gap-2.5 sm:grid-cols-2">
              {state.read.moves.slice(0, 2).map((m, i) => (
                <p key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-ink">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden />
                  {m}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
