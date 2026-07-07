import { hasSession } from "@/lib/admin-auth";
import { computeInsights, resolveWindow, type InsightsData } from "@/lib/insights";
import { aiConfigured, askForStructured } from "@/lib/ai/client";
import { naira } from "@/lib/backoffice";

/* The read behind the numbers. It computes the very same insights the
   page draws, then asks the model for a short plain-language reading and
   two or three moves, grounded strictly in those figures. The model only
   interprets numbers it is handed; it invents nothing, sets no price, and
   acts on nothing. Without a key the room still stands; this simply says
   so and the page falls back to the figures alone. */

export const dynamic = "force-dynamic";

type Read = { headline: string; detail: string; moves: string[] };

function facts(d: InsightsData): string {
  const lines: string[] = [];
  lines.push(`Window: the last ${d.window.months} months.`);
  if (d.months.length > 0) {
    lines.push(
      "Billed by month: " + d.months.map((m) => `${m.label} ${naira(m.billed)}`).join("; ") + "."
    );
  } else {
    lines.push("No billing in the window yet.");
  }
  if (d.delta !== null && d.lastFullLabel) {
    lines.push(`Last full month ${d.lastFullLabel} was ${Math.abs(d.delta)}% ${d.delta >= 0 ? "up on" : "below"} the month before.`);
  }
  if (d.pace > 0) lines.push(`At the recent pace, this month projects to ${naira(d.pace)}.`);
  if (d.pieces.length > 0) {
    lines.push("Top pieces by revenue: " + d.pieces.map((p) => `${p.name} ${naira(p.revenue)}`).join("; ") + ".");
  }
  if (d.billedAll > 0) {
    const pct = Math.round((d.leakTotal / d.billedAll) * 100);
    lines.push(`Discount given below list, all time: ${naira(d.leakTotal)}, which is ${pct}% of ${naira(d.billedAll)} billed.`);
  }
  if (d.owedTotal > 0) {
    lines.push(
      `Owed now: ${naira(d.owedTotal)}. Aging: ` +
        d.buckets.map((b) => `${b.bucket} ${naira(b.owed)} (${b.n})`).join("; ") +
        `. Debt older than two months present: ${d.oldestDebt ? "yes" : "no"}.`
    );
  } else {
    lines.push("Nobody owes the house right now.");
  }
  if (d.taps.length > 0) {
    lines.push("Enquiry sources: " + d.taps.map((t) => `${t.source} ${t.n}`).join("; ") + ".");
  }
  if (d.convRate !== null) lines.push(`${d.convRate}% of enquiries became customers.`);
  if (d.settleRate !== null) lines.push(`${d.settleRate}% of billed orders are settled.`);
  lines.push(
    d.lowStock.length > 0
      ? `Low stock: ${d.lowStock.length} pieces at or below reorder (${d.lowStock.map((s) => s.name).join(", ")}).`
      : "No piece is below its reorder level."
  );
  return lines.join("\n");
}

const SYSTEM =
  "You are the analyst for a Lagos mosaic-tile and pool business back office. You are given the shop's own numbers. " +
  "Write a very short read for the owner, who reads little. Rules you must not break: use only the numbers given; " +
  "never invent or estimate a figure that is not there; if something is zero or unknown, say so plainly. Money is " +
  "Nigerian naira. Keep it terse and concrete. The headline names the single most important thing in one line. The " +
  "detail is two or three sentences that explain what the numbers are doing. The moves are two or three short " +
  "imperatives, each tied to a number the owner can act on, for example chase the oldest debt, watch the discount on " +
  "the top seller, or reorder a named low piece. Do not use em dashes anywhere. Do not recommend anything the numbers " +
  "do not support. You are advising, not acting; never claim to have done anything.";

const SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string", description: "One line, the single most important thing." },
    detail: { type: "string", description: "Two or three sentences interpreting the numbers." },
    moves: {
      type: "array",
      description: "Two or three short imperative moves, each tied to a number.",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
    },
  },
  required: ["headline", "detail", "moves"],
} as const;

export async function GET(req: Request) {
  if (!(await hasSession())) return new Response(null, { status: 401 });

  const url = new URL(req.url);
  const win = resolveWindow(url.searchParams.get("months") ?? undefined);
  const data = await computeInsights(win.months);

  if (!aiConfigured()) return Response.json({ ok: false, reason: "not-configured" }, { status: 200 });

  try {
    const read = await askForStructured<Read>({
      system: SYSTEM,
      user: facts(data),
      toolName: "write_the_read",
      toolDescription: "Record a short read of the shop's numbers and two or three recommended moves.",
      schema: SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 600,
    });
    const moves = Array.isArray(read.moves) ? read.moves.filter((m) => typeof m === "string" && m.trim()).slice(0, 3) : [];
    return Response.json(
      { ok: true, read: { headline: read.headline ?? "", detail: read.detail ?? "", moves } },
      { status: 200 }
    );
  } catch {
    return Response.json({ ok: false, reason: "ai-failed" }, { status: 200 });
  }
}
