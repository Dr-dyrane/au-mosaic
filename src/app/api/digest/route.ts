import { eq, sql } from "drizzle-orm";
import { getDb, rowsOf, schema } from "@/db";
import { naira } from "@/lib/backoffice";
import { sendPush } from "@/lib/push";

/* The morning digest: Vercel Cron knocks at eight, Lagos time, and
   the glance walks to the phone in one sentence. Only the cron may
   knock, so the door checks the secret first. Per the attention
   root, this and true crossings are the only taps the app will
   ever send. */

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

    const owedRows = await db.execute(sql`
      select
        coalesce((select sum(i.given_price_kobo * i.quantity)
          from order_items i join orders o on o.id = i.order_id
          where o.status not in ('enquiry','settled')), 0)
        -
        coalesce((select sum(p.amount_kobo)
          from payments p join orders o2 on o2.id = p.order_id
          where o2.status not in ('enquiry','settled')), 0) as owed,
        (select count(*) from enquiries where status = 'new')::int as fresh`);
    const totals = rowsOf<{ owed: number; fresh: number }>(owedRows)[0];
    const owed = Math.max(0, Number(totals?.owed ?? 0));
    const fresh = Number(totals?.fresh ?? 0);

    const parts: string[] = [];
    if (low.length === 1) parts.push(`${low[0].name} runs low.`);
    if (low.length > 1) parts.push(`${low.length} pieces run low.`);
    if (owed > 0) parts.push(`${naira(owed)} owed.`);
    if (fresh === 1) parts.push("1 fresh enquiry.");
    if (fresh > 1) parts.push(`${fresh} fresh enquiries.`);

    const body =
      parts.length > 0
        ? parts.join(" ")
        : "Nothing runs low, nobody owes, no fresh enquiries. The house is calm.";

    await sendPush({ title: "The morning glance", body, url: "/admin" });
    return Response.json({ sent: true });
  } catch {
    /* A quiet morning beats a loud error; the glance itself still
       tells the truth when he opens it. */
    return Response.json({ sent: false });
  }
}
