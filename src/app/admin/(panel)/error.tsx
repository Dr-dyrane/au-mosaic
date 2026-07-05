"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* When a room breaks, the house stays calm, but it does not stay
   vague: the room, the message, and the digest (the key that finds
   the exact line in the server logs) are printed quietly. This
   boundary lives behind the door, so the details are the owner's. */

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
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
        Nothing is lost. Try again; if it keeps happening, send the
        details below to the engineer.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-7">
        <button onClick={reset} className="btn-gold">
          Try again
        </button>
        <a href="/admin" className="link-hair text-dusk text-[12px]">
          Back to the glance
        </a>
      </div>
      <div className="panel mt-10 w-full max-w-xl">
        <p className="eyebrow">For the engineer</p>
        <p className="mt-3 break-all text-[14px] leading-relaxed text-dusk">
          Room: {pathname}
        </p>
        <p className="mt-1.5 break-all text-[14px] leading-relaxed text-dusk">
          Says: {error.message || "(the server kept the message)"}
        </p>
        {error.digest && (
          <p className="mt-1.5 break-all text-[14px] leading-relaxed text-dusk">
            Digest: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
