/* What the engine hands the review screen. A draft, never a decision:
   the owner reads it, fixes anything wrong with one tap, and only
   then does it become an order. No price rides in from the model;
   listPriceKobo, when present, was seeded from the ledger. */

export type DraftLine = {
  /* A catalogue slug the house actually sells, or null when the words
     matched nothing we stock. */
  pieceSlug: string | null;
  /* The catalogue name for that slug, shown to the owner instead of a
     slug. Set when a piece matched. */
  pieceName?: string;
  /* What the customer seemed to ask for, in the model's words, kept
     even when a slug matched, so the owner can sanity-check. */
  description: string;
  quantity: number;
  unit: string;
  /* 0 to 1. Low means look closer. */
  confidence: number;
  /* True when no catalogue piece matched; the owner decides. */
  unknown: boolean;
  /* The exact customer words this line was read from, for the owner's
     eye. */
  sourceQuote?: string;
  /* The last price the owner gave for this piece, from the order book.
     A suggestion to confirm, never a set price, never from the model. */
  listPriceKobo?: number;
};

export type OrderDraft = {
  /* The other party's name as WhatsApp showed it. Never a number: the
     export does not carry one. */
  customerName: string | null;
  lines: DraftLine[];
  /* The text the draft was read from, so the screen can show its
     working. */
  source: string;
};
