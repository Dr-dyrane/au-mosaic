import {
  analyzeVisualizerImage,
  visualizerAiConfigured,
  type VisualizerSurface,
} from "@/lib/visualizer-ai";

export const dynamic = "force-dynamic";

const SURFACES = new Set(["pool", "wall", "backsplash", "shower", "floor"]);
const MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_CHARS = 1_400_000;

function cleanSurface(value: unknown): VisualizerSurface {
  return typeof value === "string" && SURFACES.has(value) ? (value as VisualizerSurface) : "pool";
}

/* A meter on the paid eye. Recent analysis stamps, per caller and for
   the whole shop, pruned to the last minute each pass. It lives only as
   long as this serverless instance, so it resets per box and does not
   sum across the fleet. Not a global daily budget: a hard daily spend
   cap would need outside persistence, noted as a follow-up. */
const RATE_WINDOW_MS = 60_000;
const PER_CALLER_MAX = 6;
const GLOBAL_MAX = 60;
const callerHits = new Map<string, number[]>();
const globalHits: number[] = [];

function callerKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const first = fwd ? fwd.split(",")[0].trim() : "";
  if (first) return first;
  const real = req.headers.get("x-real-ip");
  return real ? real.trim() : "unknown";
}

function rateAllows(key: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;

  /* Prune the shop window, oldest first. */
  while (globalHits.length && globalHits[0] < cutoff) globalHits.shift();

  /* If many addresses have passed through, sweep the idle ones so the
     map cannot grow without bound under a flood of fresh callers. */
  if (callerHits.size > 2000) {
    for (const [k, arr] of callerHits) {
      if (arr.length === 0 || arr[arr.length - 1] < cutoff) callerHits.delete(k);
    }
  }

  const prior = callerHits.get(key) ?? [];
  const mine: number[] = [];
  for (const t of prior) {
    if (t >= cutoff) mine.push(t);
  }

  /* Two gates: this caller, then everyone. An empty record is dropped,
     never stored, so an idle caller leaves no trace. */
  if (mine.length >= PER_CALLER_MAX || globalHits.length >= GLOBAL_MAX) {
    if (mine.length) callerHits.set(key, mine);
    else callerHits.delete(key);
    return false;
  }

  mine.push(now);
  globalHits.push(now);
  callerHits.set(key, mine);
  return true;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, message: "Manual fit is ready." }, { status: 400 });
  }

  const image = typeof body.image === "string" ? body.image : "";
  const mediaType = typeof body.mediaType === "string" && MEDIA_TYPES.has(body.mediaType)
    ? (body.mediaType as "image/jpeg" | "image/png" | "image/webp")
    : "image/jpeg";

  if (!image || image.length > MAX_IMAGE_CHARS || !/^[a-zA-Z0-9+/=]+$/.test(image)) {
    return Response.json({ ok: false, message: "Manual fit is ready." }, { status: 413 });
  }

  if (!visualizerAiConfigured()) {
    return Response.json({
      ok: true,
      available: false,
      message: "Manual fit is ready.",
    });
  }

  /* Meter the paid eye before we spend on it. Junk was turned away
     above and an unconfigured AI already short-circuited, so only real
     calls reach here. Past six a caller or sixty the shop in a rolling
     minute, the shutter drops and we answer exactly as AI-down does: no
     limit shown, manual fit instead. */
  if (!rateAllows(callerKey(req))) {
    return Response.json({
      ok: true,
      available: false,
      message: "Manual fit is ready.",
    });
  }

  try {
    const plan = await analyzeVisualizerImage({
      image,
      mediaType,
      surface: cleanSurface(body.surface),
      piece: typeof body.piece === "string" ? body.piece.slice(0, 80) : undefined,
      width: typeof body.width === "number" ? body.width : undefined,
      height: typeof body.height === "number" ? body.height : undefined,
    });
    return Response.json({ ok: true, available: true, plan });
  } catch {
    return Response.json(
      { ok: false, message: "Manual fit is ready." },
      { status: 502 }
    );
  }
}
