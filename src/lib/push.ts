import webpush from "web-push";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { SITE } from "./site";

/* The push spine, per the attention root: one morning digest plus
   true threshold crossings, never a nag. Every call fails silent
   and open: no keys, no table, or no subscribers means quietly
   nothing, and the work that asked for the push never feels it. A
   dead endpoint goes inactive on the way through. */

export type Push = { title: string; body: string; url?: string };

function configured() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(SITE.url, pub, priv);
  return true;
}

export async function sendPush(message: Push): Promise<void> {
  try {
    if (!configured()) return;
    const db = getDb();
    const subs = await db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.active, true));
    if (subs.length === 0) return;

    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      url: message.url ?? "/admin",
    });

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
        } catch (e) {
          /* 404 and 410 mean the phone let the subscription go. */
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            try {
              await db
                .update(schema.pushSubscriptions)
                .set({ active: false })
                .where(eq(schema.pushSubscriptions.endpoint, s.endpoint));
            } catch {}
          }
        }
      })
    );
  } catch {}
}
