/* The house's line to a segmentation model. fal hosts the family: we
   send one customer photo and one tap point, and it hands back the
   exact shape of whatever sits under the tap: the wall, the floor, or
   the chair that should stay in front. The tap is in the pixels of the
   image we send, top left origin.

   Two providers share this seam. SAM 3 (default) runs over fal's queue
   because its cold start was measured at 70 to 97 seconds, far past
   any sync patience: submit fast, poll politely. SAM 2 stays as the
   sync escape hatch behind VISUALIZER_SAM_PROVIDER=sam2. Either way
   the reply is the segment cut from the photo, so its alpha channel is
   the mask the stage will clip to; when a provider ever hands back an
   opaque black and white mask instead, the result says maskKind
   "luma" and the client normalises it once.

   FAL_KEY is read from the environment like every other secret, never
   logged, and the call runs server side only so the key never reaches
   the browser. */

const SAM2_ENDPOINT = "https://fal.run/fal-ai/sam2/image";
const SAM3_SUBMIT = "https://queue.fal.run/fal-ai/sam-3/image";
/* The queue drops the /image subpath for status and response; the
   submit reply's own status_url confirms it, and the subpath variant
   answers 405. */
const SAM3_REQUESTS = "https://queue.fal.run/fal-ai/sam-3/requests";

export type SamArgs = {
  image: string; // base64 without a prefix, or a full data URI
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  x: number; // pixel coordinate in the sent image
  y: number;
  label?: 0 | 1; // 1 for the thing under the tap, 0 for background
  points?: SamPoint[]; // labelled multi-point prompt; falls back to x, y
  prompt?: string; // SAM 3 text prompt, pass-through for Phase 4; sam2 ignores it
  negativePrompt?: string; // held for Phase 4; SAM 3's image endpoint has no field for it yet
};

export type SamPoint = {
  x: number;
  y: number;
  label?: 0 | 1;
};

export type SamMaskKind = "alpha" | "luma";

export type SamResult = {
  mask: string; // data URI of the segment; alpha carries the shape when maskKind is "alpha"
  width: number;
  height: number;
  maskKind: SamMaskKind;
};

export class VisualizerSamError extends Error {}

export function visualizerSamConfigured(): boolean {
  return Boolean(process.env.FAL_KEY);
}

export type SamProvider = "sam2" | "sam3";

export function samProvider(): SamProvider {
  return process.env.VISUALIZER_SAM_PROVIDER === "sam2" ? "sam2" : "sam3";
}

function requireKey(): string {
  const key = process.env.FAL_KEY;
  if (!key) throw new VisualizerSamError("not-configured");
  return key;
}

function toDataUri(args: SamArgs): string {
  return args.image.startsWith("data:")
    ? args.image
    : `data:${args.mediaType};base64,${args.image}`;
}

export function samPromptPoints(args: SamArgs): Array<{ x: number; y: number; label: 0 | 1 }> {
  const source = args.points?.length ? args.points.slice(0, 12) : [args];
  return source.map((point) => ({
    x: Math.max(0, Math.round(point.x)),
    y: Math.max(0, Math.round(point.y)),
    label: point.label === 0 ? 0 : 1,
  }));
}

async function falFetch(url: string, key: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      headers: {
        Authorization: `Key ${key}`,
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/* The old sync path, unchanged: SAM 2 in one breath, kept as the
   escape hatch for the day the queue misbehaves. */
export async function segmentSurface(args: SamArgs): Promise<SamResult> {
  const key = requireKey();

  const body = {
    image_url: toDataUri(args),
    prompts: samPromptPoints(args),
    apply_mask: true,
    sync_mode: true,
    output_format: "png",
  };

  const res = await falFetch(
    SAM2_ENDPOINT,
    key,
    { method: "POST", body: JSON.stringify(body) },
    30000,
  );
  if (!res.ok) throw new VisualizerSamError(`http-${res.status}`);
  const data = (await res.json()) as {
    image?: { url?: string; width?: number; height?: number };
  };
  const url = data.image?.url;
  if (!url || typeof url !== "string") throw new VisualizerSamError("no-mask");
  return {
    mask: url,
    width: typeof data.image?.width === "number" ? data.image.width : 0,
    height: typeof data.image?.height === "number" ? data.image.height : 0,
    maskKind: "alpha",
  };
}

/* SAM 3 over the queue, first half: hand the job in and walk away with
   a ticket. The queue answers in well under a second even when the
   model itself needs a cold minute, so the timeout here is short. */
export async function segmentSubmit(args: SamArgs): Promise<{ requestId: string }> {
  const key = requireKey();

  const body = {
    image_url: toDataUri(args),
    /* SAM 3 defaults its text prompt to "wheel"; an empty string keeps
       the tap point in charge unless Phase 4 sends real words. */
    prompt: typeof args.prompt === "string" ? args.prompt : "",
    point_prompts: samPromptPoints(args),
    apply_mask: true,
    output_format: "png",
  };

  const res = await falFetch(
    SAM3_SUBMIT,
    key,
    { method: "POST", body: JSON.stringify(body) },
    10000,
  );
  if (!res.ok) throw new VisualizerSamError(`http-${res.status}`);
  const data = (await res.json()) as { request_id?: unknown };
  if (typeof data.request_id !== "string" || !data.request_id) {
    throw new VisualizerSamError("no-ticket");
  }
  return { requestId: data.request_id };
}

type Sam3Image = {
  url?: string;
  content_type?: string | null;
  width?: number | null;
  height?: number | null;
};

/* Second half: ask the queue how the ticket is doing, and when it is
   done, bring the mask home as bytes. The client never touches
   fal.media directly, so its CORS mood cannot break the stage. */
export async function segmentPoll(
  requestId: string,
): Promise<{ pending: true } | SamResult> {
  const key = requireKey();

  const statusRes = await falFetch(
    `${SAM3_REQUESTS}/${requestId}/status`,
    key,
    { method: "GET" },
    10000,
  );
  if (!statusRes.ok) throw new VisualizerSamError(`status-${statusRes.status}`);
  const status = (await statusRes.json()) as { status?: unknown };
  if (status.status !== "COMPLETED") return { pending: true };

  const res = await falFetch(
    `${SAM3_REQUESTS}/${requestId}`,
    key,
    { method: "GET" },
    10000,
  );
  if (!res.ok) throw new VisualizerSamError(`http-${res.status}`);
  const data = (await res.json()) as { image?: Sam3Image | null; masks?: Sam3Image[] };
  const pick = data.image ?? data.masks?.[0];
  const url = pick?.url;
  if (!url || typeof url !== "string") throw new VisualizerSamError("no-mask");

  let base64: string;
  let contentType: string;
  if (url.startsWith("data:")) {
    const comma = url.indexOf(",");
    contentType = url.slice(5, url.indexOf(";")) || "image/png";
    base64 = comma >= 0 ? url.slice(comma + 1) : "";
  } else {
    const bin = await falFetch(url, key, { method: "GET" }, 10000);
    if (!bin.ok) throw new VisualizerSamError(`mask-${bin.status}`);
    base64 = Buffer.from(await bin.arrayBuffer()).toString("base64");
    contentType =
      typeof pick?.content_type === "string" && pick.content_type
        ? pick.content_type
        : "image/png";
  }
  if (!base64) throw new VisualizerSamError("no-mask");

  const bytes = Buffer.from(base64, "base64");
  const size = readImageSize(base64, contentType);
  return {
    mask: `data:${contentType};base64,${base64}`,
    width: typeof pick?.width === "number" ? pick.width : size?.width ?? 0,
    height: typeof pick?.height === "number" ? pick.height : size?.height ?? 0,
    maskKind: pngHasAlpha(bytes) ? "alpha" : "luma",
  };
}

/* PNG colour types 4 and 6 carry an alpha channel; anything else, or a
   non-PNG, is treated as luma and normalised on the client. */
function pngHasAlpha(bytes: Buffer): boolean {
  if (!isPng(bytes) || bytes.length < 26) return false;
  const colorType = bytes[25];
  return colorType === 4 || colorType === 6;
}

function isPng(b: Buffer): boolean {
  return (
    b.length >= 24 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  );
}

/* Reads the pixel size straight from the file header, no decoder
   needed: PNG keeps it in IHDR, JPEG in the first SOF frame after a
   proper walk over the segments. Used by the segment route to refuse a
   tap that points outside the photo before any money moves. */
export function readImageSize(
  base64: string,
  mediaType: string,
): { width: number; height: number } | null {
  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    return null;
  }

  if (mediaType === "image/png" && isPng(bytes)) {
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (mediaType === "image/jpeg" && bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let pos = 2;
    while (pos + 3 < bytes.length) {
      if (bytes[pos] !== 0xff) return null;
      /* Fill bytes: a marker may be padded with extra FFs. */
      while (pos + 1 < bytes.length && bytes[pos + 1] === 0xff) pos += 1;
      const marker = bytes[pos + 1];
      /* SOF0 through SOF15 hold the frame size, but C4 (DHT), C8 (JPG
         extension) and CC (DAC) share the range and must be skipped. */
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        if (pos + 9 >= bytes.length) return null;
        const height = bytes.readUInt16BE(pos + 5);
        const width = bytes.readUInt16BE(pos + 7);
        return width > 0 && height > 0 ? { width, height } : null;
      }
      /* Scan data or the end: nothing measurable past here. */
      if (marker === 0xda || marker === 0xd9) return null;
      /* Standalone markers carry no length word. */
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        pos += 2;
        continue;
      }
      if (pos + 3 >= bytes.length) return null;
      const length = bytes.readUInt16BE(pos + 2);
      if (length < 2) return null;
      pos += 2 + length;
    }
    return null;
  }

  return null;
}
