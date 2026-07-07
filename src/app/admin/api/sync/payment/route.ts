import { getDb, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { hasSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/audit";
import { naira } from "@/lib/backoffice";

/* The sync door for a payment that was queued offline. It applies the
   payment against the server's real ledger, never the phone's last
   known copy, so a queued deposit is a delta the balance absorbs
   whatever it has become. The client id makes a repeat safe: a second
   arrival with the same id inserts nothing and still answers ok.
   Money is integer kobo, and nothing here sets a price; it records
   what the owner already agreed. */

export const dynamic = "force-dynamic";

const METHODS = ["transfer", "cash", "POS"] as const;

type Body = {
  clientOpId?: unknown;
  orderId?: unknown;
  amountKobo?: unknown;
  method?: unknown;
  note?: unknown;
};

export async function POST(req: Request) {
  if (!(await hasSession())) return new Response(null, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, reason: "bad-body" }, { status: 400 });
  }

  const clientOpId = typeof body.clientOpId === "string" ? body.clientOpId.trim() : "";
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const amountKobo =
    typeof body.amountKobo === "number" && Number.isFinite(body.amountKobo) ? Math.round(body.amountKobo) : 0;
  const method = typeof body.method === "string" ? body.method : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!clientOpId || !orderId) return Response.json({ ok: false, reason: "missing" }, { status: 400 });
  if (amountKobo <= 0) return Response.json({ ok: false, reason: "amount" }, { status: 400 });
  if (!(METHODS as readonly string[]).includes(method)) {
    return Response.json({ ok: false, reason: "method" }, { status: 400 });
  }

  const db = getDb();

  /* Idempotent by the client id: a repeat inserts nothing and returns
     no row. A first arrival returns the new row. */
  let inserted: { id: string }[];
  try {
    inserted = await db
      .insert(schema.payments)
      .values({ orderId, amountKobo, method, note, clientOpId })
      .onConflictDoNothing({ target: schema.payments.clientOpId })
      .returning({ id: schema.payments.id });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "23503") {
      /* Foreign key violation: the order is gone. A settled no, not a
         hiccup, so the client stops retrying and asks for a look. */
      return Response.json({ ok: false, reason: "order-missing" }, { status: 200 });
    }
    /* Anything else is treated as a passing fault; the client keeps
       the entry and tries again later. */
    return Response.json({ ok: false, reason: "retry" }, { status: 503 });
  }

  if (inserted.length === 0) {
    /* Already applied on an earlier send. Idempotent success. */
    return Response.json({ ok: true, applied: false }, { status: 200 });
  }

  await db.update(schema.orders).set({ updatedAt: sql`now()` }).where(eq(schema.orders.id, orderId));
  await logAction(
    "recorded a payment",
    `order ${orderId.slice(0, 8)}`,
    `${naira(amountKobo)} by ${method}, queued offline`
  );

  return Response.json({ ok: true, applied: true }, { status: 200 });
}
