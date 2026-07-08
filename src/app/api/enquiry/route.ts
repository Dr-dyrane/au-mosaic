import { count, eq, gt, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { buildTapMessage, cleanInternalPath, stripTapReturnParams } from "@/lib/tap-return";

/* The funnel's memory. A WhatsApp tap on the site lands here as a
   beacon and becomes an enquiry in the book: source, page, and the
   piece if the page was a piece. No name, no number, no message; the
   conversation itself lives in WhatsApp, this only remembers that it
   began. Always answers 204: the funnel must never feel the back
   office. A flood is shed the same way: past thirty fresh rows in
   ten minutes the book stops writing and keeps answering 204, so a
   script cannot fill the desk. No addresses are kept to count by;
   the cap is global on purpose. */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { source?: string; path?: string; returnPath?: string; sid?: string };
    const source = String(body.source ?? "unknown").slice(0, 40);
    const path = cleanInternalPath(body.path, 120);
    const returnPath = cleanInternalPath(body.returnPath, 260);
    /* The visitor's own anonymous id, kept only if it reads like one. */
    const sidRaw = String(body.sid ?? "");
    const sessionId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sidRaw)
      ? sidRaw.toLowerCase()
      : null;

    const [recent] = await getDb()
      .select({ n: count() })
      .from(schema.enquiries)
      .where(gt(schema.enquiries.createdAt, sql`now() - interval '10 minutes'`));
    if ((recent?.n ?? 0) >= 30) return new Response(null, { status: 204 });

    let pieceSlug: string | null = null;
    const piecePath = path ? stripTapReturnParams(path).split(/[?#]/)[0] : "";
    const m = piecePath.match(/^\/piece\/([a-z0-9-]{1,80})$/);
    if (m) {
      const db = getDb();
      const [piece] = await db
        .select({ slug: schema.pieces.slug })
        .from(schema.pieces)
        .where(eq(schema.pieces.slug, m[1]));
      pieceSlug = piece?.slug ?? null;
    }

    /* The lead itself. Write it; if the book jams, retry once. If the
       second pass fails too, leave one line in the log and still answer
       204: a real lead must not vanish without a trace. */
    const row = { source, pieceSlug, sessionId, message: buildTapMessage(source, path, returnPath) };
    try {
      await getDb().insert(schema.enquiries).values(row);
    } catch {
      try {
        await getDb().insert(schema.enquiries).values(row);
      } catch (err) {
        console.error("enquiry insert failed after retry", err);
      }
    }
  } catch {
    /* The book missed one; the customer still reached WhatsApp. */
  }
  return new Response(null, { status: 204 });
}
