import {
  readImageSize,
  samProvider,
  segmentPoll,
  segmentSubmit,
  segmentSurface,
  visualizerSamConfigured,
} from "@/lib/visualizer-sam";
import { callerKey, makeRateLimiter, spendAllows } from "@/lib/visualizer-limits";

export const dynamic = "force-dynamic";

const MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_CHARS = 1_400_000;

/* Two meters from the shared drawer: a strict one on paid submits and
   a generous one on free status polls, so a patient client waiting out
   a cold model is never mistaken for a flood. Both live only as long
   as this serverless instance; the durable daily cap is spendAllows. */
const paidAllows = makeRateLimiter({ windowMs: 60_000, perCallerMax: 10, globalMax: 80 });
const pollAllows = makeRateLimiter({ windowMs: 60_000, perCallerMax: 60, globalMax: 600 });

/* fal ticket ids are UUIDs; anything outside this shape never reaches
   the queue. */
const REQUEST_ID = /^[A-Za-z0-9_-]{8,80}$/;

/* The desk answer when the paid eye is off, over budget, or refuses:
   the same calm line every time, so the stage falls back to the hand
   with nothing leaked about why. */
const FALLBACK = { ok: true as const, available: false as const, message: "Place it by hand." };

type PromptPoint = { x: number; y: number; label: 0 | 1 };

function parsePromptPoints(value: unknown): PromptPoint[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) return null;
  const points: PromptPoint[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const point = entry as Record<string, unknown>;
    const x = typeof point.x === "number" && Number.isFinite(point.x) ? point.x : NaN;
    const y = typeof point.y === "number" && Number.isFinite(point.y) ? point.y : NaN;
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) return null;
    points.push({ x, y, label: point.label === 0 ? 0 : 1 });
  }
  return points;
}

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
  const label: 0 | 1 = body.label === 0 ? 0 : 1;
  const points: PromptPoint[] | null = body.points === undefined
    ? Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0
      ? [{ x, y, label }]
      : null
    : parsePromptPoints(body.points);

  if (!image || image.length > MAX_IMAGE_CHARS || !/^[a-zA-Z0-9+/=]+$/.test(image)) {
    return Response.json({ ok: false, message: "Place it by hand." }, { status: 413 });
  }
  if (!points) {
    return Response.json({ ok: false, message: "Place it by hand." }, { status: 400 });
  }

  /* A tap outside the photo is a client bug, not a model question. */
  const size = readImageSize(image, mediaType);
  if (size && points.some((point) => point.x >= size.width || point.y >= size.height)) {
    return Response.json({ ok: false, message: "Place it by hand." }, { status: 400 });
  }

  const first = points[0];

  if (!visualizerSamConfigured()) {
    return Response.json(FALLBACK);
  }

  if (!paidAllows(callerKey(req))) {
    return Response.json(FALLBACK);
  }

  /* The durable daily cap, checked on submits only: this is the moment
     money is about to move. */
  if (!(await spendAllows("segment"))) {
    return Response.json(FALLBACK);
  }

  if (samProvider() === "sam2") {
    try {
      const result = await segmentSurface({
        image,
        mediaType,
        x: first.x,
        y: first.y,
        label: first.label,
        points,
      });
      return Response.json({
        ok: true,
        available: true,
        mask: result.mask,
        width: result.width,
        height: result.height,
        maskKind: result.maskKind,
      });
    } catch {
      return Response.json({ ok: false, message: "Place it by hand." }, { status: 502 });
    }
  }

  /* SAM 3 over the queue: submit, then wait just long enough to catch
     a warm model in this same breath. A cold one gets a ticket back
     and the client polls GET below while the model wakes. */
  try {
    const { requestId } = await segmentSubmit({
      image,
      mediaType,
      x: first.x,
      y: first.y,
      label: first.label,
      points,
    });
    for (let i = 0; i < 2; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const poll = await segmentPoll(requestId);
      if (!("pending" in poll)) {
        return Response.json({
          ok: true,
          available: true,
          mask: poll.mask,
          width: poll.width,
          height: poll.height,
          maskKind: poll.maskKind,
        });
      }
    }
    return Response.json({ ok: true, available: true, pending: true, id: requestId });
  } catch {
    return Response.json({ ok: false, message: "Place it by hand." }, { status: 502 });
  }
}

/* The free half of the queue dance: the client brings its ticket back
   until the mask is ready. No spend is counted here, ever. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!REQUEST_ID.test(id)) {
    return Response.json({ ok: false, message: "Place it by hand." }, { status: 400 });
  }

  if (!visualizerSamConfigured()) {
    return Response.json(FALLBACK);
  }

  if (!pollAllows(callerKey(req))) {
    return Response.json(FALLBACK);
  }

  try {
    const poll = await segmentPoll(id);
    if ("pending" in poll) {
      return Response.json({ ok: true, pending: true });
    }
    return Response.json({
      ok: true,
      available: true,
      mask: poll.mask,
      width: poll.width,
      height: poll.height,
      maskKind: poll.maskKind,
    });
  } catch {
    return Response.json({ ok: false, message: "Place it by hand." }, { status: 502 });
  }
}
