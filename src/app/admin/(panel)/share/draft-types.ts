import type { OrderDraft } from "@/lib/ai/types";

/* Shapes shared between the read-a-chat action and its screen. They
   live apart from draft-actions.ts because a "use server" file may
   only export async functions. */

export type DraftState = { ok: boolean; message: string; draft?: OrderDraft } | null;

export type DraftLineInput = {
  pieceSlug: string | null;
  description: string;
  quantity: number;
  /* Naira as the owner typed it; the action turns it into kobo. */
  givenPrice: string;
};

export type CreatePayload = {
  customerId?: string;
  newCustomer?: { name: string; phone: string; area: string };
  lines: DraftLineInput[];
};
