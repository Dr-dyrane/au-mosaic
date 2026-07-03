import Link from "next/link";

/* A wrong address inside the office stays inside the office: the
   way home leads to the glance, never out to the shop window. */

export default function PanelNotFound() {
  return (
    <main className="flex min-h-[50svh] flex-col items-start justify-center">
      <p className="eyebrow">Not in the book</p>
      <h1 className="font-serif text-display-section mt-4 max-w-xl">
        That page is not in the book.
      </h1>
      <p className="mt-4 max-w-md text-[14px] leading-relaxed text-dusk">
        The record may have moved, or the address lost a letter. The
        glance knows where everything lives.
      </p>
      <div className="mt-8">
        <Link href="/admin" className="btn-gold">
          Back to the glance
        </Link>
      </div>
    </main>
  );
}
