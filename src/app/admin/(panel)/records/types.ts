/* Shared types for the records lane: archive, restore, and permanent
   delete across the ledger. A normal module, not "use server", so the
   union and the result shape can be imported by client components and
   server actions alike.

   The owner relaxed the old "nothing is ever lost" rule. Archive is
   the safe default: a row keeps its place in the book but drops out of
   the working lists. Restore brings it back. Permanent delete removes
   it for good, and only when the caller confirms. */

export type ArchivableEntity =
  | "customer"
  | "order"
  | "enquiry"
  | "salesMotion"
  | "delivery"
  | "media";

/* Every records action answers in the same small shape the rest of the
   admin uses: a flag and a plain sentence for the desk to show. */
export type RecordsResult = { ok: boolean; message: string };
