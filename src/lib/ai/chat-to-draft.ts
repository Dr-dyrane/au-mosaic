import { customerWords } from "@/lib/whatsapp/parse-export";
import { extractChatText } from "@/lib/whatsapp/read-upload";
import { extractOrderLines, type CatalogPiece } from "./extract-order";
import type { OrderDraft } from "./types";

/* The bridge from an exported chat to a draft the owner can confirm.
   It keeps intake and engine apart on purpose: get the text, pick the
   customer's side, then hand the plain words to the engine. The paste
   path skips the parser and hands its text straight through, so every
   door reaches the same engine. A Cloud API webhook, if it ever lands,
   would be one more door onto the very same call. */

export async function chatToDraft(opts: {
  raw: string;
  ownerName?: string;
  catalog: CatalogPiece[];
}): Promise<OrderDraft> {
  const { customerName, text } = customerWords(opts.raw, opts.ownerName);
  const lines = text ? await extractOrderLines(text, opts.catalog) : [];
  return { customerName, lines, source: text };
}

export async function textToDraft(text: string, catalog: CatalogPiece[]): Promise<OrderDraft> {
  const lines = text.trim() ? await extractOrderLines(text, catalog) : [];
  return { customerName: null, lines, source: text };
}

/* The upload door: a WhatsApp export as the phone saved it, a .zip
   with _chat.txt inside, or a bare .txt. Pull the text out, then read
   it like any other chat. Media in the zip is left untouched. */
export async function uploadToDraft(opts: {
  bytes: Uint8Array;
  ownerName?: string;
  catalog: CatalogPiece[];
}): Promise<OrderDraft> {
  const raw = extractChatText(opts.bytes);
  return chatToDraft({ raw, ownerName: opts.ownerName, catalog: opts.catalog });
}
