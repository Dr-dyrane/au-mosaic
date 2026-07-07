import { getDb, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { hasSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";

/* The sync door for a delivery marked done offline. It honors the same
   one-step rule the desk keeps: a delivery only lands from out, never
   from pending, and where it stands is read from the database, not the
   phone's last-known copy. The move is idempotent by that state: a
   second arrival on an already landed delivery changes nothing and
   still answers ok, so a repeat is safe without an id ledger. */

export const dynamic = "force-dynamic";

type Body = { clientOpId?: unknown; deliveryId?: unknown };

export async function POST(req: Request) {
  if (!(await hasSession())) return new Response(null, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, reason: "bad-body" }, { status: 400 });
  }

  const deliveryId = typeof body.deliveryId === "string" ? body.deliveryId.trim() : "";
  if (!deliveryId) return Response.json({ ok: false, reason: "missing" }, { status: 400 });

  const db = getDb();

  let current: { status: string } | undefined;
  try {
    const rows = await db
      .select({ status: schema.deliveries.status })
      .from(schema.deliveries)
      .where(eq(schema.deliveries.id, deliveryId));
    current = rows[0];
  } catch {
    return Response.json({ ok: false, reason: "retry" }, { status: 503 });
  }

  if (!current) return Response.json({ ok: false, reason: "delivery-missing" }, { status: 200 });
  if (current.status === "delivered") return Response.json({ ok: true, applied: false }, { status: 200 });
  if (current.status !== "out") {
    /* Not on the road when the sync arrives, so the offline mark no
       longer fits. A settled no, for a look, not a retry. */
    return Response.json({ ok: false, reason: "not-out" }, { status: 200 });
  }

  try {
    await db
      .update(schema.deliveries)
      .set({ status: "delivered", deliveredAt: sql`now()` })
      .where(eq(schema.deliveries.id, deliveryId));
  } catch {
    return Response.json({ ok: false, reason: "retry" }, { status: 503 });
  }

  await logAction("marked a delivery landed", `delivery ${deliveryId.slice(0, 8)}`, "queued offline");
  return Response.json({ ok: true, applied: true }, { status: 200 });
}
