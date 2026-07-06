"use client";

import { useEffect } from "react";

/* A calm boundary for the admin routes outside the main shell, the
   invoice view above all. Without this, an error there falls through
   to the public error page instead of a quiet, in-house recovery. */

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[back office]", error);
  }, [error]);

  return (
    <main className="flex min-h-[60svh] flex-col items-start justify-center px-6">
      <p className="eyebrow">A hiccup</p>
      <h1 className="mt-4 max-w-xl font-serif text-display-section">
        That did not go through.
      </h1>
      <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">
        Nothing is lost. Try again, or head back to the book.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-7">
        <button onClick={unstable_retry} className="btn-gold">
          Try again
        </button>
        <a href="/admin" className="link-hair text-[12px] text-dusk">
          Back to the glance
        </a>
      </div>
      {error.digest && (
        <div className="panel mt-10 w-full max-w-xl">
          <p className="eyebrow">Repair note</p>
          <p className="mt-3 break-all text-[14px] leading-relaxed text-dusk">
            Reference: {error.digest}
          </p>
        </div>
      )}
    </main>
  );
}
