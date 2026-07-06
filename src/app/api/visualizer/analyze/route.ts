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
