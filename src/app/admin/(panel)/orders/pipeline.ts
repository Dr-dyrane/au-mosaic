/* The pipeline, named once. Five steps a sale walks in this house.
   Pages, forms, and actions all read from here so the steps never
   drift apart. Kept beside actions.ts because a "use server" file
   may only export async functions. */

export const PIPELINE = ["enquiry", "quoted", "deposit", "delivered", "settled"] as const;

export type OrderStatus = (typeof PIPELINE)[number];

/* Open means not settled. Same order as the walk itself. */
export const OPEN_STEPS = ["enquiry", "quoted", "deposit", "delivered"] as const;

export const STATUS_LABEL: Record<OrderStatus, string> = {
  enquiry: "Enquiry",
  quoted: "Quoted",
  deposit: "Deposit paid",
  delivered: "Delivered",
  settled: "Settled",
};

export function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
