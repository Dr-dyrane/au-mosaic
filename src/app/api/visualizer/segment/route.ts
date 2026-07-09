import {
  segmentSurface,
  visualizerSamConfigured,
} from "@/lib/visualizer-sam";

export const dynamic = "force-dynamic";

const MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_CHARS = 1_400_000;

/* Same meter the analyze route uses, kept local: recent segment calls
   per caller and for the whole shop, pruned to a rolling minute. It
   lives only as long as this serverless instance, so it resets per box
   and does not sum across the fleet. A hard daily spend cap would need
   outside persistence, noted as a follow-up. Segmentation is paid, so
   the shutter matters. */
const RATE_WINDOW_MS = 60_000;
const PER_CALLER_MAX = 10;
const GLOBAL_MAX = 80;
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

  while (globalHits.length && globalHits[0] < cutoff) globalHits.shift();

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

/* The desk answer when the paid eye is off, over budget, or refuses:
   the same calm line every time, so the stage falls back to the hand
   with nothing leaked about why. */
const FALLBACK = { ok: true as const, available: false as const, message: "Place it by hand." };

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, message: "Place it by hand." }, { status: 400 });
  }

  const image = typeof body.image === "string" ? body.image : "";
  const mediaType =
    typeof body.mediaType === "string" && MEDIA_TYPES.has(body.mediaType)
      ? (body.mediaType as "image/jpeg" | "image/png" | "image/webp")
      : "image/jpeg";
  const x = typeof body.x === "number" && Number.isFinite(body.x) ? body.x : NaN;
  const y = typeof body.y === "number" && Number.isFinite(body.y) ? body.y : NaN;
  const label = body.label === 0 ? 0 : 1;

  if (!image || image.length > MAX_IMAGE_CHARS || !/^[a-zA-Z0-9+/=]+$/.test(image)) {
    return Response.json({ ok: false, message: "Place it by hand." }, { status: 413 });
  }
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) {
    return Response.json({ ok: false, message: "Place it by hand." }, { status: 400 });
  }

  if (!visualizerSamConfigured()) {
    return Response.json(FALLBACK);
  }

  if (!rateAllows(callerKey(req))) {
    return Response.json(FALLBACK);
  }

  try {
    const result = await segmentSurface({ image, mediaType, x, y, label });
    return Response.json({ ok: true, available: true, mask: result.mask, width: result.width, height: result.height });
  } catch {
    return Response.json({ ok: false, message: "Place it by hand." }, { status: 502 });
  }
}
