"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* When a room breaks, the house stays calm. The owner gets a repair
   reference while the full detail stays in the logs. */

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const pathname = usePathname();
  useEffect(() => {
    console.error("[back office]", pathname, error);
  }, [error, pathname]);

  return (
    <main className="flex min-h-[50svh] flex-col items-start justify-center">
      <p className="eyebrow">A hiccup</p>
      <h1 className="font-serif text-display-section mt-4 max-w-xl">
        That did not go through.
      </h1>
      <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">
        Nothing is lost. Try again. If it keeps happening, send this
        note for repair.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-7">
        <button onClick={unstable_retry} className="btn-gold">
          Try again
        </button>
        <a href="/admin" className="link-hair text-dusk text-[12px]">
          Back to the glance
        </a>
      </div>
      <div className="panel mt-10 w-full max-w-xl">
        <p className="eyebrow">Repair note</p>
        <p className="mt-3 break-all text-[14px] leading-relaxed text-dusk">
          Room: {pathname}
        </p>
        {error.digest && (
          <p className="mt-1.5 break-all text-[14px] leading-relaxed text-dusk">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
