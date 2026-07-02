/* AU Mosaic · business facts. One source of truth, straight from the
   owner's Business Discovery answers. */

export const SITE = {
  name: "AU Mosaic and Pool Materials",
  shortName: "AU Mosaic",
  tagline: "Everything mosaic.",
  description:
    "Nigeria's home of mosaic tiles and pool materials. Largest stock on ground, direct factory prices, pools built from scratch.",
  location: "Agric Market, Lagos",
  hours: "Mon to Sat, 8:30am to 5pm",
  yearsInBusiness: "10+",
  factory: "Foshan, China",
  poolBrand: "Astral",
  url: "https://aumosaic.ng", // update when the domain is settled
  instagram: "https://instagram.com", // TODO: real handle
  // WhatsApp number in international format, digits only. Set the real one in .env.local:
  // NEXT_PUBLIC_WHATSAPP=234XXXXXXXXXX
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "2340000000000",
  phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY || "",
};

export const NAV = [
  { href: "/mosaic-tiles", label: "Mosaic tiles" },
  { href: "/pool-materials", label: "Pool materials" },
  { href: "/pools", label: "Pool construction" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
