import { askForStructured, aiConfigured, AiError } from "./client";
import type { DraftLine } from "./types";

/* The engine, and the whole of the AI's job: turn a customer's words
   into a list of what they want, each line tied to a piece the house
   sells or flagged as unknown. It is told the catalogue and told, in
   the plainest terms, never to invent a piece, a price, or a count it
   cannot see. Price is not even in the shape it returns, so the model
   has nothing to price with. */

export type CatalogPiece = { slug: string; name: string; unit: string; range: string };

type RawLine = {
  pieceSlug?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  confidence?: number;
  unknown?: boolean;
  sourceQuote?: string;
};

function clamp01(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export async function extractOrderLines(
  text: string,
  catalog: CatalogPiece[]
): Promise<DraftLine[]> {
  if (!aiConfigured()) throw new AiError("not-configured");
  const slugs = catalog.map((p) => p.slug);
  if (slugs.length === 0 || !text.trim()) return [];

  /* The enum is the hard fence: the model can only ever name a slug
     the house sells, or the empty string for no match. There is no
     price field to fill. */
  const schema = {
    type: "object",
    properties: {
      lines: {
        type: "array",
        items: {
          type: "object",
          properties: {
            pieceSlug: {
              type: "string",
              enum: [...slugs, ""],
              description: "A catalogue slug, or an empty string when nothing in the catalogue matches.",
            },
            description: { type: "string", description: "What the customer asked for, in your words." },
            quantity: { type: "number", description: "How many units. Use 1 if unstated." },
            unit: { type: "string", description: "The unit of sale, from the catalogue where a piece matched." },
            confidence: { type: "number", description: "0 to 1. How sure you are of this line." },
            unknown: { type: "boolean", description: "True when no catalogue piece matched." },
            sourceQuote: { type: "string", description: "The exact customer words this line came from." },
          },
          required: ["pieceSlug", "description", "quantity", "unit", "confidence", "unknown"],
        },
      },
    },
    required: ["lines"],
  };

  const catalogText = catalog
    .map((p) => `${p.slug} = ${p.name} (${p.range}, sold in ${p.unit})`)
    .join("\n");

  const system =
    "You read a customer's WhatsApp words and list what they want to buy, using only a fixed catalogue. " +
    "Rules you must not break: use only pieceSlug values from the catalogue; if a wanted item is not in the " +
    "catalogue, set pieceSlug to an empty string, unknown to true, and a low confidence; never invent a piece, " +
    "a price, or a quantity you cannot see; if a quantity is not stated, use 1 and lower the confidence. " +
    "Ignore greetings, questions, and chat that is not an order. Put the exact words you read each line from in sourceQuote. " +
    "Calibrate confidence and unknown carefully, and do not confuse a loose match for a sure one. " +
    "Reserve confidence 0.85 or higher, with unknown false, only when the customer's words clearly name the " +
    "catalogue piece: the same product with the same colour, size, and finish, allowing for spelling or word order. " +
    "When the match is only approximate, a substitute, or a guess, give confidence between 0.5 and 0.7 and set " +
    "unknown to true: this covers a different colour, a nearby or similar product, or a size you inferred rather " +
    "than read. When nothing in the catalogue really matches, give confidence 0.4 or lower and set unknown to true. " +
    "For example, if the customer says 'pool cement' and the catalogue has 'White cement', that is a substitute, not " +
    "the same piece, so confidence 0.5 to 0.7 and unknown true. If the customer says 'white marble mosaic' and the " +
    "closest piece is 'Hexagon marble mosaic', the shape was never named, so that is a guess: confidence 0.5 to 0.7 " +
    "and unknown true. Only an unmistakable naming of the catalogue piece earns 0.85 or higher.";

  const user = `Catalogue:\n${catalogText}\n\nCustomer's words:\n${text}`;

  const out = await askForStructured<{ lines?: RawLine[] }>({
    system,
    user,
    toolName: "record_order_lines",
    toolDescription: "Record the line items the customer wants, grounded in the catalogue.",
    schema,
    maxTokens: 1024,
  });

  return (out.lines ?? []).map((l) => {
    const slug = l.pieceSlug && l.pieceSlug.trim() ? l.pieceSlug.trim() : null;
    const qty =
      typeof l.quantity === "number" && Number.isFinite(l.quantity) && l.quantity > 0
        ? Math.round(l.quantity)
        : 1;
    const confidence = clamp01(l.confidence);
    /* Deterministic backstop: a matched piece the model is not sure of
       still gets flagged, so a loose or substituted match wears "check
       this one" even if the model left unknown false. Anything under
       0.75 on a real slug is not sure enough to pass unseen. */
    const unsure = slug !== null && confidence < 0.75;
    return {
      pieceSlug: slug,
      description: (l.description ?? "").trim(),
      quantity: qty,
      unit: (l.unit ?? "").trim(),
      confidence,
      unknown: Boolean(l.unknown) || !slug || unsure,
      sourceQuote: l.sourceQuote?.trim() || undefined,
    };
  });
}
