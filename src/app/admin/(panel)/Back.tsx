import Link from "next/link";

/* The way back, HIG style: a chevron that names where it goes. One
   size everywhere, a full thumb target, and it leans into the walk
   on hover. Subpages open with this so the owner never feels lost. */

export default function Back({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={`Back to ${label}`}
      className="group -ml-2 inline-flex min-h-11 items-center gap-1.5 pl-2 pr-3 text-[13px] text-dusk transition-colors duration-300 hover:text-ink"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
        aria-hidden
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label}
    </Link>
  );
}
