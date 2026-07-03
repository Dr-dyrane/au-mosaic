import Link from "next/link";
import { waGeneral } from "@/lib/wa";

/* Even the wrong door should feel like the house. */
export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70svh] max-w-6xl flex-col items-start justify-center px-5 sm:px-8">
      <p className="eyebrow">404</p>
      <h1 className="font-serif text-display-page mt-4 max-w-2xl">
        This room does not exist.
      </h1>
      <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dusk">
        The piece may have moved, or the address lost a letter on the way.
      </p>
      <div className="mt-9 flex flex-wrap items-center gap-8">
        <Link href="/" className="btn-gold">
          Back to the house
        </Link>
        <a href={waGeneral()} target="_blank" rel="noopener" data-wa="404" className="link-hair text-dusk">
          Ask us directly
        </a>
      </div>
    </section>
  );
}
