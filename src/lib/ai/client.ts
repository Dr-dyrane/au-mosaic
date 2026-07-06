/* The house's single line to Claude. It reads CLAUDE_API_KEY from the
   environment the same way the book reads DATABASE_URL: never from a
   page, never logged, never returned. The model is asked to fill one
   tool whose shape we fix, so the reply is a structured object, not
   prose we have to guess at. Haiku is the small, fast, cheap model;
   reading an order off a chat does not need more. */

const ENDPOINT = "https://api.anthropic.com/v1/messages";
/* Pinned snapshot for a stable read. "claude-haiku-4-5" is the moving
   alias if this ever needs to float. */
const MODEL = "claude-haiku-4-5-20251001";
const VERSION = "2023-06-01";

export class AiError extends Error {}

/* True only when the owner has set the key. Every caller checks this
   first and falls back to plain typing when it is false, so the book
   still works with no key and no signal. */
export function aiConfigured(): boolean {
  return Boolean(process.env.CLAUDE_API_KEY);
}

export type StructuredArgs = {
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
  timeoutMs?: number;
};

/* Ask the model to fill one tool and hand back its input object. The
   forced tool_choice means the reply is always that object, never a
   sentence, so there is nothing to parse and little to go wrong. One
   quiet retry covers a dropped connection; a refusal is not retried. */
export async function askForStructured<T>(args: StructuredArgs): Promise<T> {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) throw new AiError("not-configured");

  const body = {
    model: MODEL,
    max_tokens: args.maxTokens ?? 1024,
    system: args.system,
    tools: [
      {
        name: args.toolName,
        description: args.toolDescription,
        input_schema: args.schema,
      },
    ],
    tool_choice: { type: "tool", name: args.toolName },
    messages: [{ role: "user", content: args.user }],
  };

  const run = async (): Promise<T> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), args.timeoutMs ?? 20000);
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
      if (!res.ok) throw new AiError(`http-${res.status}`);
      const data = (await res.json()) as {
        stop_reason?: string;
        content?: Array<{ type: string; input?: unknown }>;
      };
      if (data.stop_reason === "refusal") throw new AiError("refusal");
      const block = data.content?.find((b) => b.type === "tool_use");
      if (!block || block.input == null) throw new AiError("no-structured-reply");
      return block.input as T;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await run();
  } catch (err) {
    if (err instanceof AiError && err.message === "refusal") throw err;
    return await run();
  }
}
