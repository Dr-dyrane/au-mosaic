/* Shared helpers for the back office. Money is integer kobo in the
   database, naira in the hand; these two functions are the only
   crossing point. waChat opens a customer's own WhatsApp, unlike
   wa.ts which always opens the house line. */

export function naira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/* "250,000" or "₦250000" or "250000.50" in the form, kobo out. */
export function parseNaira(input: string): number {
  const clean = input.replace(/[₦,\s]/g, "");
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

/* A tick in the hand where the platform allows. Client-side only;
   silently nothing elsewhere. */
export function buzz(ms = 4) {
  try {
    if (typeof navigator !== "undefined") navigator.vibrate?.(ms);
  } catch {}
}

/* Nigerian numbers arrive as 0803..., 803..., or 234803...; WhatsApp
   wants 234803... */
export function waChat(phone: string, text?: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  if (!digits.startsWith("234")) digits = `234${digits}`;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}
