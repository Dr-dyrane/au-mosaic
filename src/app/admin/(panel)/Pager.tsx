import Link from "next/link";

/* One quiet pager for every long list: where you are, and the two
   directions. Links, not buttons: the URL carries the page, so back
   and share behave. */

export default function Pager({
  page,
  pages,
  makeHref,
}: {
  page: number;
  pages: number;
  makeHref: (p: number) => string;
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="mt-10 flex items-center gap-6">
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className="link-hair text-dusk text-[12px]">
          Newer
        </Link>
      ) : (
        <span className="text-[12px] text-mist">Newer</span>
      )}
      <span className="text-[11px] uppercase tracking-[0.18em] text-mist">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={makeHref(page + 1)} className="link-hair text-dusk text-[12px]">
          Older
        </Link>
      ) : (
        <span className="text-[12px] text-mist">Older</span>
      )}
    </nav>
  );
}
