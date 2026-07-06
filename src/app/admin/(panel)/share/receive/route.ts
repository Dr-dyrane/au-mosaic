import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { hasSession } from "@/lib/admin-auth";
import { extractChatText } from "@/lib/whatsapp/read-upload";

/* The Android share target lands here. Whatever arrived, the chat text
   or the exported file, is stashed as an enquiry so nothing is lost,
   then the bridge opens with it in hand. POST, because a whole chat
   does not fit in a link. Node runtime, for the zip reader. */

export const runtime = "nodejs";

export async function POST(req: Request) {
  const bridge = new URL("/admin/share", req.url);
  if (!(await hasSession())) return NextResponse.redirect(new URL("/admin", req.url), 303);

  let raw = "";
  try {
    const form = await req.formData();
    const file = form.get("chat");
    if (file && typeof file !== "string" && file.size > 0) {
      raw = extractChatText(new Uint8Array(await file.arrayBuffer()));
    } else {
      raw = [form.get("title"), form.get("text"), form.get("url")]
        .map((v) => (typeof v === "string" ? v : ""))
        .filter(Boolean)
        .join("\n")
        .trim();
    }
  } catch {
    return NextResponse.redirect(bridge, 303);
  }

  if (!raw.trim()) return NextResponse.redirect(bridge, 303);

  try {
    const [row] = await getDb()
      .insert(schema.enquiries)
      .values({ source: "share", message: raw })
      .returning({ id: schema.enquiries.id });
    return NextResponse.redirect(new URL(`/admin/share?from=${row.id}`, req.url), 303);
  } catch {
    return NextResponse.redirect(bridge, 303);
  }
}
