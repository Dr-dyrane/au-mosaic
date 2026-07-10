const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.CLAUDE_VISUALIZER_MODEL || "claude-haiku-4-5-20251001";
const VERSION = "2023-06-01";

const SURFACES = ["pool", "wall", "backsplash", "shower", "floor"] as const;
const PREP_MODES = ["primer", "blur", "none"] as const;

export type VisualizerSurface = (typeof SURFACES)[number];
export type VisualizerPrepMode = (typeof PREP_MODES)[number];
export type VisualizerPoint = { x: number; y: number };

export type VisualizerScanSurface = {
  kind: VisualizerSurface;
  name: string;
  tap: VisualizerPoint;
  occluders: string[];
  confidence: number;
};

export type VisualizerScan = {
  scene: string;
  surfaces: VisualizerScanSurface[];
  prepMode: VisualizerPrepMode;
  note: string;
  confidence: number;
};

type VisualizerScanArgs = {
  image: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
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

/* An honest zero is a real answer; only a non-number earns the
   fallback. */
function normalizeConfidence(value: unknown): number {
  const confidence = Number(value);
  return clamp(Number.isFinite(confidence) ? confidence : 0.45, 0, 1);
}

function normalizeSurface(value: unknown): VisualizerScanSurface | null {
  if (!isRecord(value) || !isSurface(value.kind)) return null;
  const tap = normalizePoint(value.tap);
  if (!tap) return null;
  const name = String(value.name || "").trim().slice(0, 32) || `the ${value.kind}`;
  const occluders = (Array.isArray(value.occluders) ? value.occluders : [])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 4);
  return { kind: value.kind, name, tap, occluders, confidence: normalizeConfidence(value.confidence) };
}

export function normalizeScan(input: unknown): VisualizerScan {
  if (!isRecord(input)) throw new VisualizerAiError("bad-scan");

  /* One layer per kind on the desk, so one surface per kind in the
     scan; the most confident sighting wins its chip. */
  const byKind = new Map<VisualizerSurface, VisualizerScanSurface>();
  for (const raw of Array.isArray(input.surfaces) ? input.surfaces : []) {
    const surface = normalizeSurface(raw);
    if (!surface) continue;
    const seen = byKind.get(surface.kind);
    if (!seen || surface.confidence > seen.confidence) byKind.set(surface.kind, surface);
  }
  const surfaces = [...byKind.values()].slice(0, 5);
  if (surfaces.length === 0) throw new VisualizerAiError("no-surfaces");

  return {
    scene: String(input.scene || "").trim().slice(0, 64) || "A customer space.",
    surfaces,
    prepMode: isPrepMode(input.prepMode) ? input.prepMode : "primer",
    note: String(input.note || "").trim().slice(0, 96) || "The scan is ready.",
    confidence: normalizeConfidence(input.confidence),
  };
}

export async function scanVisualizerScene(args: VisualizerScanArgs): Promise<VisualizerScan> {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) throw new VisualizerAiError("not-configured");

  const body = {
    model: MODEL,
    max_tokens: 900,
    temperature: 0,
    system:
      "You help AU Mosaic fit tile previews onto customer spaces. Return only the requested tool. Do not identify people. Do not infer private facts. Prefer conservative geometry the user can adjust.",
    tools: [
      {
        name: "set_scene_scan",
        description: "Return the scene reading for one customer photo.",
        input_schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            scene: { type: "string", maxLength: 64 },
            surfaces: {
              type: "array",
              minItems: 1,
              maxItems: 5,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  kind: { type: "string", enum: SURFACES },
                  name: { type: "string", maxLength: 32 },
                  tap: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      x: { type: "number", minimum: 0, maximum: 1 },
                      y: { type: "number", minimum: 0, maximum: 1 },
                    },
                    required: ["x", "y"],
                  },
                  occluders: {
                    type: "array",
                    maxItems: 4,
                    items: { type: "string", maxLength: 40 },
                  },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                },
                required: ["kind", "name", "tap", "occluders", "confidence"],
              },
            },
            prepMode: { type: "string", enum: PREP_MODES },
            note: { type: "string", maxLength: 96 },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["scene", "surfaces", "prepMode", "note", "confidence"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "set_scene_scan" },
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
              args.width && args.height ? `Image size sent: ${args.width} by ${args.height}.` : "",
              "Name the scene in one terse sentence.",
              "List up to five distinct tileable surfaces, at most one per kind.",
              "For each, give a tap point that sits on the surface well away from ladders, rails, furniture, or people.",
              "List visible obstacles per surface.",
              "Be conservative with confidence and use low values when unsure.",
              "The note is one plain sentence for the customer.",
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
    if (!block?.input) throw new VisualizerAiError("no-scan");
    return normalizeScan(block.input);
  } finally {
    clearTimeout(timer);
  }
}
