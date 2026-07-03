"use client";

import { useEffect, useRef, useState } from "react";

/* The sentence that answers a save. It takes focus so VoiceOver
   hears it the moment it lands; successes make their point and fade,
   failures stay until he acts. Opacity only, so reduced motion has
   nothing to object to. */

type State = { ok: boolean; message: string } | null;

export default function Sentence({ state }: { state: State }) {
  const ref = useRef<HTMLParagraphElement>(null);
  /* The fade remembers which answer it faded, so every new save
     arrives at full voice. */
  const [faded, setFaded] = useState<State>(null);
  const gone = state !== null && faded === state;

  useEffect(() => {
    if (!state) return;
    ref.current?.focus({ preventScroll: true });
    if (state.ok) {
      const t = setTimeout(() => setFaded(state), 4000);
      return () => clearTimeout(t);
    }
  }, [state]);

  if (!state) return null;
  return (
    <p
      ref={ref}
      tabIndex={-1}
      role="status"
      className={`text-[13px] outline-none transition-opacity duration-500 ${
        state.ok ? "text-dusk" : "text-gold"
      } ${gone ? "opacity-0" : "opacity-100"}`}
    >
      {gone ? "" : state.message}
    </p>
  );
}
