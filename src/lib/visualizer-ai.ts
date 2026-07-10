const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.CLAUDE_VISUALIZER_MODEL || "claude-haiku-4-5-20251001";
const VERSION = "2023-06-01";

const SURFACES = ["pool", "wall", "backsplash", "shower", "floor"] as const;

export type VisualizerSurface = (typeof SURFACES)[number];
export type VisualizerPoint = { x: number; y: number };

/* The house's line to a vision model, now single-purpose: given one
   customer photo and the surface the visitor picked, it marks the
   corners so the studio can snap its stones onto the real surface
   instead of a default guess. A pool asks for the rim alone (its top
   opening); the studio derives the floor from it geometrically, so the
   box can never collapse. Asking the model for the floor in the same
   call made it compress the rim to reserve room, which squashed the box;
   rim-only reads the full opening. Any other surface is one plane: four
   corners. The corners are approximate (a VLM is not a surveyor). */
export type ShellCorners = { shape: "shell"; rim: VisualizerPoint[] };
export type PlaneCorners = { shape: "surface"; quad: VisualizerPoint[] };
export type SurfaceCorners = ShellCorners | PlaneCorners;

type CornerArgs = {
  image: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  surface: VisualizerSurface;
  width?: number;
  height?: number;
};

type ToolBlock = { type: string; input?: unknown };

export class VisualizerAiError extends Error {}

export function visualizerAiConfigured(): boolean {
  return Boolean(process.env.CLAUDE_API_KEY);
}

export function isVisualizerSurface(value: unknown): value is VisualizerSurface {
  return typeof value === "string" && (SURFACES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizePoint(value: unknown): VisualizerPoint | null {
  if (!isRecord(value)) return null;
  const x = Number(value.x);
  const y = Number(value.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: clamp(x, 0.02, 0.98), y: clamp(y, 0.02, 0.98) };
}

/* A quad arrives as {tl,tr,br,bl}; the app orders its corners tl, tr,
   br, bl everywhere, so that is the array it becomes. Any missing or
   unreadable corner voids the whole quad: a three-corner surface is not
   something to snap to. */
function normalizeQuad(value: unknown): VisualizerPoint[] | null {
  if (!isRecord(value)) return null;
  const order = ["tl", "tr", "br", "bl"] as const;
  const out: VisualizerPoint[] = [];
  for (const key of order) {
    const p = normalizePoint(value[key]);
    if (!p) return null;
    out.push(p);
  }
  return out;
}

/* The guard: trust nothing the model says until every corner reads.
   Throws rather than hand back a half quad, so the caller falls back to
   the geometry it already has. */
export function normalizeCorners(input: unknown, wantShell: boolean): SurfaceCorners {
  if (!isRecord(input)) throw new VisualizerAiError("bad-corners");
  if (wantShell) {
    const rim = normalizeQuad(input.rim);
    if (!rim) throw new VisualizerAiError("no-shell-corners");
    return { shape: "shell", rim };
  }
  const quad = normalizeQuad(input.quad);
  if (!quad) throw new VisualizerAiError("no-corners");
  return { shape: "surface", quad };
}

function pointSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: { x: { type: "number", minimum: 0, maximum: 1 }, y: { type: "number", minimum: 0, maximum: 1 } },
    required: ["x", "y"],
  };
}

function quadSchema(description: string) {
  return {
    type: "object",
    additionalProperties: false,
    description,
    properties: { tl: pointSchema(), tr: pointSchema(), br: pointSchema(), bl: pointSchema() },
    required: ["tl", "tr", "br", "bl"],
  };
}

const SURFACE_WORDS: Record<VisualizerSurface, string> = {
  pool: "empty swimming pool basin",
  wall: "feature wall",
  backsplash: "kitchen backsplash",
  shower: "shower wall",
  floor: "floor",
};

export async function findSurfaceCorners(args: CornerArgs): Promise<SurfaceCorners> {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) throw new VisualizerAiError("not-configured");

  const wantShell = args.surface === "pool";
  const word = SURFACE_WORDS[args.surface];

  const inputSchema = wantShell
    ? {
        type: "object",
        additionalProperties: false,
        properties: {
          rim: quadSchema("The four corners of the pool's TOP opening (the rectangular hole in the deck)."),
        },
        required: ["rim"],
      }
    : {
        type: "object",
        additionalProperties: false,
        properties: { quad: quadSchema(`The four corners of the ${word}.`) },
        required: ["quad"],
      };

  const instruction = wantShell
    ? "Mark the four corners of the pool's TOP opening: the rectangular rim where the pool's interior walls meet the surrounding deck. tl far-left, tr far-right, br near-right, bl near-left. The near edge (br, bl) is the near coping, the line where the pool's near wall meets the flat foreground deck. Stop exactly at that pool edge; do NOT extend down onto the flat paving in the foreground. The quad must enclose the pool basin only, not the deck around it. Follow the perspective. Corners may be approximate."
    : `Mark the four corners of the ${word} as it appears in the photo: tl far-left, tr far-right, br near-right, bl near-left. Follow the perspective; corners may be approximate.`;

  const body = {
    model: MODEL,
    max_tokens: 700,
    temperature: 0,
    system:
      "You mark surface geometry on customer photos for a tiling preview. Return only the requested tool. Coordinates are image-normalized: x and y each 0 at top-left to 1 at bottom-right. Do not identify people; do not infer private facts.",
    tools: [{ name: "mark_corners", description: "Mark the corner points of the chosen surface.", input_schema: inputSchema }],
    tool_choice: { type: "tool", name: "mark_corners" },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: args.mediaType, data: args.image } },
          {
            type: "text",
            text: [
              args.width && args.height ? `Image size sent: ${args.width} by ${args.height}.` : "",
              `The customer wants to tile the ${word} in this photo.`,
              instruction,
            ]
              .filter(Boolean)
              .join(" "),
          },
        ],
      },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": VERSION, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new VisualizerAiError(`http-${res.status}`);
    const data = (await res.json()) as { content?: ToolBlock[] };
    const block = data.content?.find((item) => item.type === "tool_use");
    if (!block?.input) throw new VisualizerAiError("no-corners");
    return normalizeCorners(block.input, wantShell);
  } finally {
    clearTimeout(timer);
  }
}
