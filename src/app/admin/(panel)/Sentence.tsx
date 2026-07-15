"use client";

import { useEffect, useRef, useState } from "react";

/* The sentence that answers a save. It takes focus so VoiceOver
   hears it the moment it lands; successes make their point and fade,
   failures stay until he acts. Opacity only, so reduced motion has
   nothing to object to. Failure speaks in words, not colour: "Not
   saved." leads and the ink stays ink, never gold, so the two answers
   read apart without any eye for hue. */

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
      className={`text-[14px] outline-none transition-opacity duration-500 ${
        state.ok ? "text-dusk" : "text-ink"
      } ${gone ? "opacity-0" : "opacity-100"}`}
    >
      {gone ? "" : state.ok ? state.message : `Not saved. ${state.message}`}
    </p>
  );
}
