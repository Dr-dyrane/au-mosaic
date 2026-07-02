import { SITE } from "./site";

/* WhatsApp deep link with a prefilled message. This is how AU Mosaic
   actually sells, so every price question on the site leads here. */
export function wa(message: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const waGeneral = () =>
  wa("Hello AU Mosaic, I'd like to make an enquiry.");

export const waProduct = (product: string) =>
  wa(`Hello AU Mosaic, please send me photos and a price for: ${product}.`);

export const waQuote = () =>
  wa("Hello AU Mosaic, I'd like a quote. Here's what I need: ");

export const waPool = () =>
  wa("Hello AU Mosaic, I'm interested in pool construction. Can we talk?");
