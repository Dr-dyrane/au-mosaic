/* Shapes for the ledger feed, kept out of the "use server" module so it
   exports only its actions. Money is integer kobo. */

export type OwingOrder = { id: string; status: string; createdAt: string; balance: number };
export type Debtor = { id: string; name: string; phone: string; total: number; orders: OwingOrder[] };

export const DEBTORS_PAGE = 12;
