import { count, eq, gt, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

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
    const body = (await req.json()) as { source?: string; path?: string };
    const source = String(body.source ?? "unknown").slice(0, 40);
    const path = String(body.path ?? "").slice(0, 120);

    const [recent] = await getDb()
      .select({ n: count() })
      .from(schema.enquiries)
      .where(gt(schema.enquiries.createdAt, sql`now() - interval '10 minutes'`));
    if ((recent?.n ?? 0) >= 30) return new Response(null, { status: 204 });

    let pieceSlug: string | null = null;
    const m = path.match(/^\/piece\/([a-z0-9-]{1,80})$/);
    if (m) {
      const db = getDb();
      const [piece] = await db
        .select({ slug: schema.pieces.slug })
        .from(schema.pieces)
        .where(eq(schema.pieces.slug, m[1]));
      pieceSlug = piece?.slug ?? null;
    }

    await getDb()
      .insert(schema.enquiries)
      .values({ source, pieceSlug, message: path ? `Tapped on ${path}` : "" });
  } catch {
    /* The book missed one; the customer still reached WhatsApp. */
  }
  return new Response(null, { status: 204 });
}
