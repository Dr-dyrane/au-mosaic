import Link from "next/link";
import { count, desc, eq, ilike, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import EnquiryRow from "./EnquiryRow";
import Pager from "../Pager";

const PER_PAGE = 24;

/* Everyone he sells to, one search away. Cards lead with the name and
   the number he will tap next, newest people first. Search is a plain
   GET form, so it answers on the weakest connection before any script
   arrives. */

export const dynamic = "force-dynamic";

const field =
  "w-full rounded-[18px] bg-shell/60 px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-mist focus:bg-shell transition-colors duration-300";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q: raw, page: pageRaw } = await searchParams;
  const q = (raw ?? "").trim();
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);

  const db = getDb();
  const fresh = await db
    .select({
      enquiry: schema.enquiries,
      pieceName: schema.pieces.name,
    })
    .from(schema.enquiries)
    .leftJoin(schema.pieces, eq(schema.pieces.slug, schema.enquiries.pieceSlug))
    .where(eq(schema.enquiries.status, "new"))
    .orderBy(desc(schema.enquiries.createdAt))
    .limit(12);
  const where = q
    ? or(ilike(schema.customers.name, `%${q}%`), ilike(schema.customers.phone, `%${q}%`))
    : undefined;
  const [totalRow] = await db.select({ n: count() }).from(schema.customers).where(where);
  const total = totalRow.n;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const customers = await db
    .select()
    .from(schema.customers)
    .where(where)
    .orderBy(desc(schema.customers.createdAt))
    .limit(PER_PAGE)
    .offset((page - 1) * PER_PAGE);

  return (
    <main>
      <p className="eyebrow">People</p>
      <h1 className="font-serif text-display-section mt-3">The customers.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Tap a customer for their orders, their balance, their chat.
        {total > 0 && ` ${total} ${total === 1 ? "person" : "people"} in the book.`}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <form action="/admin/customers" method="get" className="min-w-0 flex-1 basis-64">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or phone"
            aria-label="Search name or phone"
            className={field}
          />
        </form>
        <Link href="/admin/customers/new" className="btn-gold shrink-0">
          New customer
        </Link>
      </div>

      {/* The site's WhatsApp taps land here until they are cleared.
          The chat itself lives in WhatsApp; this remembers it began. */}
      {fresh.length > 0 && (
        <section className="panel mt-8 max-w-2xl">
          <p className="font-serif text-[20px]">Fresh from the window</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-dusk">
            Taps on the site&apos;s WhatsApp buttons. Check the chat, then
            clear them here.
          </p>
          <div className="mt-4 divide-y divide-transparent">
            {fresh.map(({ enquiry, pieceName }) => (
              <EnquiryRow
                key={enquiry.id}
                id={enquiry.id}
                line={
                  pieceName
                    ? `Asked about ${pieceName} (${enquiry.source})`
                    : `Tapped from ${enquiry.source}`
                }
                when={new Date(enquiry.createdAt).toLocaleString("en-NG", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              />
            ))}
          </div>
        </section>
      )}

      {customers.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/admin/customers/${c.id}`}
              className="panel group block transition-transform duration-300 active:scale-[0.99]"
            >
              <p className="font-serif text-[18px] leading-snug transition-colors duration-300 group-hover:text-gold">
                {c.name}
              </p>
              <p className="mt-2 text-[13px] text-dusk">
                {[c.phone, c.area].filter(Boolean).join(" · ") || "No phone yet"}
              </p>
            </Link>
          ))}
        </div>
      )}

      <Pager
        page={page}
        pages={pages}
        makeHref={(p) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`}
      />

      {customers.length === 0 && (
        <div className="panel mt-10 max-w-md">
          {q ? (
            <>
              <p className="font-serif text-[20px]">No one matches.</p>
              <p className="mt-2 text-[14px] leading-relaxed text-dusk">
                Try fewer letters, or check the number.
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-[20px]">No customers yet.</p>
              <p className="mt-2 text-[14px] leading-relaxed text-dusk">
                The first one arrives with their first order. Or add them now
                and be ready.
              </p>
            </>
          )}
        </div>
      )}
    </main>
  );
}
