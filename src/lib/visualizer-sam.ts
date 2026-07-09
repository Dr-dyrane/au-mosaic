/* The house's line to a segmentation model. fal hosts SAM 2; we send
   one customer photo and one tap point, and it hands back the exact
   shape of whatever sits under the tap: the wall, the floor, or the
   chair that should stay in front. The tap is in the pixels of the
   image we send, top left origin. The reply is the segment cut from
   the photo, so its alpha channel is the mask the stage will clip to.

   FAL_KEY is read from the environment like every other secret, never
   logged, and the call runs server side only so the key never reaches
   the browser. */

const ENDPOINT = "https://fal.run/fal-ai/sam2/image";

export type SamArgs = {
  image: string; // base64 without a prefix, or a full data URI
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  x: number; // pixel coordinate in the sent image
  y: number;
  label?: 0 | 1; // 1 for the thing under the tap, 0 for background
};

export type SamResult = {
  mask: string; // data URI of the segment, alpha carries the shape
  width: number;
  height: number;
};

export class VisualizerSamError extends Error {}

export function visualizerSamConfigured(): boolean {
  return Boolean(process.env.FAL_KEY);
}

export async function segmentSurface(args: SamArgs): Promise<SamResult> {
  const key = process.env.FAL_KEY;
  if (!key) throw new VisualizerSamError("not-configured");

  const dataUri = args.image.startsWith("data:")
    ? args.image
    : `data:${args.mediaType};base64,${args.image}`;

  const body = {
    image_url: dataUri,
    prompts: [
      {
        x: Math.max(0, Math.round(args.x)),
        y: Math.max(0, Math.round(args.y)),
        label: args.label === 0 ? 0 : 1,
      },
    ],
    apply_mask: true,
    sync_mode: true,
    output_format: "png",
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
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
    };
  } finally {
    clearTimeout(timer);
  }
}
