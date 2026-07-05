import Link from "next/link";
import { IconBack } from "./icons";

/* The way back, HIG style: a chevron that names where it goes. One
   size everywhere, a full thumb target, and it leans into the walk
   on hover. Subpages open with this so the owner never feels lost. */

export default function Back({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={`Back to ${label}`}
      data-tour="back"
      className="group -ml-2 inline-flex min-h-11 items-center gap-1.5 pl-2 pr-3 text-[14px] text-dusk transition-colors duration-300 hover:text-ink"
    >
      <IconBack className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
      {label}
    </Link>
  );
}
