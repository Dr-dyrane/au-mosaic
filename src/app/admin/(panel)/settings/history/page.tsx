import { count, desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import Back from "../../Back";
import Pager from "../../Pager";

/* The book's history, read-only and append-only: who did what, in
   sentences, newest first. Before the audit table lands it teaches
   the command instead of erroring. */

export const dynamic = "force-dynamic";

const PER_PAGE = 50;

function fmtWhen(d: Date | string) {
  return new Date(d).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;
  const pageAsked = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);

  let total: number | null = null;
  let rows: { at: Date; who: string; action: string; subject: string; detail: string }[] = [];
  let pages = 1;
  let page = 1;
  try {
    const db = getDb();
    const [totalRow] = await db.select({ n: count() }).from(schema.auditLog);
    total = totalRow.n;
    pages = Math.max(1, Math.ceil(total / PER_PAGE));
    page = Math.min(pageAsked, pages);
    rows = await db
      .select({
        at: schema.auditLog.at,
        who: schema.auditLog.who,
        action: schema.auditLog.action,
        subject: schema.auditLog.subject,
        detail: schema.auditLog.detail,
      })
      .from(schema.auditLog)
      .orderBy(desc(schema.auditLog.at))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE);
  } catch {
    total = null;
  }

  return (
    <main>
      <Back href="/admin/settings" label="Settings" />
      <p className="eyebrow mt-6">The record</p>
      <h1 className="font-serif text-display-section mt-3">The book&apos;s history.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
        Who did what, and when. Nothing here is ever edited or removed.
        {total !== null && total > 0 && ` ${total.toLocaleString()} lines so far.`}
      </p>

      {total === null && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">The history has not started.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            Run npm run db:push once, and from then on every save signs
            its name here.
          </p>
        </div>
      )}

      {total === 0 && (
        <div className="panel mt-10 max-w-md">
          <p className="font-serif text-[20px]">Nothing written yet.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-dusk">
            The first save, step, or key will open the record by itself.
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="panel mt-10 max-w-2xl">
          <div className="divide-y divide-transparent">
            {rows.map((r, i) => (
              <div key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
                <p className="min-w-0 text-[14px] leading-relaxed text-ink">
                  {r.who} {r.action}
                  {r.subject && <span className="text-dusk"> · {r.subject}</span>}
                  {r.detail && <span className="text-mist"> · {r.detail}</span>}
                </p>
                <p className="ml-auto shrink-0 text-[11px] uppercase tracking-[0.14em] text-mist">
                  {fmtWhen(r.at)}
                </p>
              </div>
            ))}
          </div>
          <Pager
            page={page}
            pages={pages}
            makeHref={(p) =>
              p === 1 ? "/admin/settings/history" : `/admin/settings/history?page=${p}`
            }
          />
        </div>
      )}
    </main>
  );
}
