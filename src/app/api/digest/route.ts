import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { sendPush } from "@/lib/push";
import { computeAttention } from "@/lib/attention";

/* The morning digest: Vercel Cron knocks at eight, Lagos time, and the
   glance walks to the phone in one sentence. Only the cron may knock, so
   the door checks the secret first. Per the attention root, this and
   true crossings are the only taps the app will ever send, so the
   sentence carries what needs his eye: what runs low, and the due and
   overdue drawn from the book. */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response(null, { status: 401 });
  }

  try {
    const db = getDb();

    const low = await db
      .select({ name: schema.pieces.name })
      .from(schema.stockLevels)
      .innerJoin(schema.pieces, eq(schema.pieces.slug, schema.stockLevels.pieceSlug))
      .where(sql`${schema.stockLevels.reorderAt} > 0 and ${schema.stockLevels.quantitySheets} <= ${schema.stockLevels.reorderAt}`);

    const attention = await computeAttention();

    const parts: string[] = [];
    if (low.length === 1) parts.push(`${low[0].name} runs low.`);
    if (low.length > 1) parts.push(`${low.length} pieces run low.`);
    for (const a of attention) parts.push(`${a.text}.`);

    const body =
      parts.length > 0
        ? parts.join(" ")
        : "Nothing runs low, nothing overdue. The house is calm.";

    await sendPush({ title: "The morning glance", body, url: "/admin" });
    return Response.json({ sent: true });
  } catch {
    /* A quiet morning beats a loud error; the glance itself still tells
       the truth when he opens it. */
    return Response.json({ sent: false });
  }
}
