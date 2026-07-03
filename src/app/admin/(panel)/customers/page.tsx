import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";
import { getDb, schema } from "@/db";

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
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: raw } = await searchParams;
  const q = (raw ?? "").trim();

  const db = getDb();
  const customers = q
    ? await db
        .select()
        .from(schema.customers)
        .where(
          or(
            ilike(schema.customers.name, `%${q}%`),
            ilike(schema.customers.phone, `%${q}%`)
          )
        )
        .orderBy(desc(schema.customers.createdAt))
    : await db
        .select()
        .from(schema.customers)
        .orderBy(desc(schema.customers.createdAt));

  return (
    <main>
      <p className="eyebrow">People</p>
      <h1 className="font-serif text-display-section mt-3">The customers.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Tap a customer for their orders, their balance, their chat.
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
