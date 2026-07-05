"use client";

import { useEffect } from "react";
import { waGeneral } from "@/lib/wa";
import "./globals.css";

/* Last wall of the house: if the root shell itself slips, the visitor
   still sees AU Mosaic, one recovery button, and the chat path. */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[maison-root]", error);
  }, [error]);

  return (
    <html
      lang="en"
      data-theme="light"
      data-palette="royal"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-sand font-sans text-ink">
        <title>Something slipped · AU Mosaic</title>
        <main className="mx-auto flex min-h-svh max-w-6xl flex-col items-start justify-center px-5 sm:px-8">
          <p className="eyebrow">A moment</p>
          <h1 className="font-serif text-display-page mt-4 max-w-2xl">
            Something slipped.
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dusk">
            Not your fault, and nothing is lost. Try once more, or talk to
            us directly.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-8">
            <button onClick={unstable_retry} className="btn-gold">
              Try again
            </button>
            <a
              href={waGeneral()}
              target="_blank"
              rel="noopener"
              data-wa="global-error"
              className="link-hair text-dusk"
            >
              Ask us directly
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
