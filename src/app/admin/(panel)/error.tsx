"use client";

/* When a room breaks, the house stays calm. No stack traces at the
   owner; one sentence and one way forward. */

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[50svh] flex-col items-start justify-center">
      <p className="eyebrow">A hiccup</p>
      <h1 className="font-serif text-display-section mt-4 max-w-xl">
        That did not go through.
      </h1>
      <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">
        Nothing is lost. Try again; if it keeps happening, close the app
        and open it once more.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-7">
        <button onClick={reset} className="btn-gold">
          Try again
        </button>
        <a href="/admin" className="link-hair text-dusk text-[13px]">
          Back to the glance
        </a>
      </div>
    </main>
  );
}
