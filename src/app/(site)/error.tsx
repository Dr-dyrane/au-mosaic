"use client";

import { useEffect } from "react";
import { waGeneral } from "@/lib/wa";

/* When the shop window breaks, the customer sees the house, not the
   machinery: a calm line, one gold Try again, and the chat that
   never goes down. The details whisper to the console for us; the
   maison never shows a stack trace. */

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[maison]", error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[70svh] max-w-6xl flex-col items-start justify-center px-5 sm:px-8">
      <p className="eyebrow">A moment</p>
      <h1 className="font-serif text-display-page mt-4 max-w-2xl">
        Something slipped.
      </h1>
      <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dusk">
        Not your fault, and nothing is lost. Try once more, or talk to
        us directly; the chat always answers.
      </p>
      <div className="mt-9 flex flex-wrap items-center gap-8">
        <button onClick={reset} className="btn-gold">
          Try again
        </button>
        <a
          href={waGeneral()}
          target="_blank"
          rel="noopener"
          data-wa="error"
          className="link-hair text-dusk"
        >
          Ask us directly
        </a>
      </div>
    </section>
  );
}
