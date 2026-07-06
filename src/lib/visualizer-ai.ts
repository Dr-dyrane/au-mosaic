const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.CLAUDE_VISUALIZER_MODEL || "claude-haiku-4-5-20251001";
const VERSION = "2023-06-01";

const SURFACES = ["pool", "wall", "backsplash", "shower", "floor"] as const;
const PREP_MODES = ["primer", "blur", "none"] as const;

export type VisualizerSurface = (typeof SURFACES)[number];
export type VisualizerPrepMode = (typeof PREP_MODES)[number];
export type VisualizerPoint = { x: number; y: number };
export type VisualizerAiPlan = {
  surface: VisualizerSurface;
  prepMode: VisualizerPrepMode;
  quad: [VisualizerPoint, VisualizerPoint, VisualizerPoint, VisualizerPoint];
  confidence: number;
  note: string;
};

type VisualizerAiArgs = {
  image: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  surface: VisualizerSurface;
  piece?: string;
  width?: number;
  height?: number;
};

type ToolBlock = { type: string; input?: unknown };

export class VisualizerAiError extends Error {}

export function visualizerAiConfigured(): boolean {
  return Boolean(process.env.CLAUDE_API_KEY);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isSurface(value: unknown): value is VisualizerSurface {
  return typeof value === "string" && (SURFACES as readonly string[]).includes(value);
}

function isPrepMode(value: unknown): value is VisualizerPrepMode {
  return typeof value === "string" && (PREP_MODES as readonly string[]).includes(value);
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

function quadArea(quad: VisualizerPoint[]) {
  let sum = 0;
  for (let i = 0; i < quad.length; i += 1) {
    const next = quad[(i + 1) % quad.length];
    sum += quad[i].x * next.y - next.x * quad[i].y;
  }
  return Math.abs(sum) / 2;
}

function normalizePlan(input: unknown): VisualizerAiPlan {
  if (!isRecord(input)) throw new VisualizerAiError("bad-plan");
  const surface = isSurface(input.surface) ? input.surface : "pool";
  const prepMode = isPrepMode(input.prepMode) ? input.prepMode : "primer";
  const rawQuad = Array.isArray(input.quad) ? input.quad : [];
  const quad = rawQuad.map(normalizePoint).filter(Boolean) as VisualizerPoint[];
  if (quad.length !== 4 || quadArea(quad) < 0.012) throw new VisualizerAiError("bad-quad");
  const note = String(input.note || "AI suggested a surface.").slice(0, 96);
  return {
    surface,
    prepMode,
    quad: [quad[0], quad[1], quad[2], quad[3]],
    confidence: clamp(Number(input.confidence) || 0.45, 0, 1),
    note,
  };
}

export async function analyzeVisualizerImage(args: VisualizerAiArgs): Promise<VisualizerAiPlan> {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) throw new VisualizerAiError("not-configured");

  const body = {
    model: MODEL,
    max_tokens: 700,
    temperature: 0,
    system:
      "You help AU Mosaic fit tile previews onto customer spaces. Return only the requested tool. Do not identify people. Do not infer private facts. Prefer conservative geometry the user can adjust.",
    tools: [
      {
        name: "set_visualizer_fit",
        description: "Return the best visualizer surface fit for one customer photo.",
        input_schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            surface: { type: "string", enum: SURFACES },
            prepMode: { type: "string", enum: PREP_MODES },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            note: { type: "string", maxLength: 96 },
            quad: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  x: { type: "number", minimum: 0, maximum: 1 },
                  y: { type: "number", minimum: 0, maximum: 1 },
                },
                required: ["x", "y"],
              },
            },
          },
          required: ["surface", "prepMode", "confidence", "note", "quad"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "set_visualizer_fit" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: args.mediaType,
              data: args.image,
            },
          },
          {
            type: "text",
            text: [
              `Current surface mode: ${args.surface}.`,
              args.piece ? `Current tile: ${args.piece}.` : "",
              args.width && args.height ? `Image size sent: ${args.width} by ${args.height}.` : "",
              "Find the surface that should receive mosaic tile.",
              "Return normalized points in this order: top left, top right, bottom right, bottom left.",
              "Use primer when old tile, grout, mosaic, or busy floor texture would fight the preview.",
              "Use blur when the old surface should stay luminous but softer.",
              "Use none only for clean empty concrete, plaster, or an unfinished bare surface.",
              "If unsure, return a broad conservative quad with confidence below 0.55.",
            ].filter(Boolean).join(" "),
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
      headers: {
        "x-api-key": key,
        "anthropic-version": VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new VisualizerAiError(`http-${res.status}`);
    const data = (await res.json()) as { content?: ToolBlock[] };
    const block = data.content?.find((item) => item.type === "tool_use");
    if (!block?.input) throw new VisualizerAiError("no-plan");
    return normalizePlan(block.input);
  } finally {
    clearTimeout(timer);
  }
}
